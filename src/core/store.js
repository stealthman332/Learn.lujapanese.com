/* ==========================================================================
   CORE — storage: IndexedDB with a silent in-memory fallback
   Same API surface as the original localStorage version.
   ========================================================================== */

/* ---- default state factory ----------------------------------------------- */
const blank = () => ({
  settings: {
    theme: "paper", script: "hira", furigana: "on", romaji: "on",
    fontSize: "m", speech: "on", rate: 0.85, voice: "",
    showEnglish: "on", newPerDay: 12, srsCap: 60, vertical: "off",
    strokeGuide: "on", tracingModel: "on", sfx: "on",
    knownLevel: 0, level: -1, readerSize: "m", strokeNums: "on", animSpeed: 1
  },
  srs: {},          /* id -> {ef, iv, rep, due, lapses, seen, right, wrong} */
  done: {},         /* sectionKey -> ts */
  stats: { days: {}, streak: 0, best: 0, last: "", reviews: 0, minutes: 0, written: 0 },
  books: {},        /* bookId -> {page, lessons:{n:1}, note} */
  notes: {},
  pinned: [],
  version: 1
});

const merge = (t, s) => { for (const k in s) if (!(k in t)) t[k] = s[k]; return t; };

/* ---- IndexedDB helpers --------------------------------------------------- */
const DB_NAME = "masu-jlc";
const STORE_NAME = "state";
const STATE_KEY = "appState";

function openDB() {
  return new Promise((resolve, reject) => {
    try {
      if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB not available"));
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("IDB open error"));
      req.onblocked = () => resolve(null);
    } catch (err) {
      reject(err);
    }
  });
}

function idbGet(database) {
  return new Promise((resolve, reject) => {
    try {
      const tx = database.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

function idbPut(database, value) {
  return new Promise((resolve, reject) => {
    try {
      const tx = database.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

/* ---- Store singleton ----------------------------------------------------- */
let data = blank();
let db = null;
let usable = true;
let pending = null;

let _readyResolve;
const _readyPromise = new Promise(r => { _readyResolve = r; });

/* Kick off IDB load immediately with timeout guard */
(async () => {
  const timeout = new Promise(resolve => setTimeout(resolve, 300));
  try {
    const loadPromise = (async () => {
      db = await openDB();
      if (db) {
        const saved = await idbGet(db);
        if (saved && typeof saved === "object") {
          data = saved;
        }
      }
      merge(data, blank());
      merge(data.settings, blank().settings);
      merge(data.stats, blank().stats);
    })();
    await Promise.race([loadPromise, timeout]);
  } catch (e) {
    /* IDB unavailable — fall back to in-memory */
    usable = false;
    data = blank();
  }
  _readyResolve();
})();

function save() {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    if (!usable || !db) return;
    try {
      idbPut(db, JSON.parse(JSON.stringify(data))).catch(() => {
        usable = false;
      });
    } catch (e) {
      usable = false;
    }
  }, 180);
}

export const Store = {
  get d() { return data; },
  get settings() { return data.settings; },
  save,
  set(path, v) {
    const p = path.split("."); let o = data;
    while (p.length > 1) o = o[p.shift()] ??= {};
    o[p[0]] = v; save();
  },
  reset() {
    data = blank(); save();
    if (usable && db) {
      try { idbPut(db, JSON.parse(JSON.stringify(data))).catch(() => {}); } catch (e) {}
    }
  },
  export() { return JSON.stringify(data, null, 2); },
  import(json) {
    const o = JSON.parse(json);
    if (!o || typeof o !== "object") throw new Error("Not a MASU backup file.");
    data = merge(o, blank()); merge(data.settings, blank().settings); save(); return true;
  },
  get persistent() { return usable; },
  /** Promise that resolves when IDB data is loaded (or fallback is set up). */
  get ready() { return _readyPromise; }
};

export const SET = () => Store.settings;

/* ---- day / streak -------------------------------------------------------- */
function fallbackYmd(d = new Date()) {
  const p = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}

export const today = () => (typeof window !== "undefined" && window.__ymd) ? window.__ymd() : fallbackYmd();

export function touchDay(kind, n = 1) {
  const st = Store.d.stats, d = today();
  st.days[d] = st.days[d] || { rev: 0, write: 0, read: 0, min: 0 };
  st.days[d][kind] = (st.days[d][kind] || 0) + n;
  if (st.last !== d) {
    const y = new Date(Date.now() - 864e5).toLocaleDateString("en-CA");
    st.streak = st.last === y ? st.streak + 1 : 1;
    st.best = Math.max(st.best || 0, st.streak);
    st.last = d;
  }
  Store.save();
}
