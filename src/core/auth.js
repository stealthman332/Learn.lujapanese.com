/* ==========================================================================
   AUTH & CLOUD SYNC — Firebase Auth (Google OAuth) + Cloud Firestore
   Enables cross-device study session syncing (SRS, streaks, bookmarks)
   while preserving complete offline functionality via local IndexedDB.
   ========================================================================== */

export const firebaseConfig = {
  apiKey: "AIzaSyCAhR2pzkaWpcVapci7PDXLwWOcixnboDg",
  authDomain: "masu-jlc.firebaseapp.com",
  projectId: "masu-jlc",
  storageBucket: "masu-jlc.firebasestorage.app",
  messagingSenderId: "733726093506",
  appId: "1:733726093506:web:c84a19c4c1578b12b58b5b"
};

const CDN_APP = "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
const CDN_AUTH = "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
const CDN_FIRESTORE = "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

let fbPromise = null;
let fb = null;
let currentUser = null;
let syncStatus = "idle"; // "idle" | "syncing" | "synced" | "offline" | "error"
let lastSyncTime = null;

const authListeners = new Set();
const syncListeners = new Set();

/** Dynamically import Firebase SDK on demand (keeps app bundle lean) */
export async function getFirebase() {
  if (fb) return fb;
  if (fbPromise) return fbPromise;

  fbPromise = (async () => {
    try {
      const [appMod, authMod, firestoreMod] = await Promise.all([
        import(CDN_APP),
        import(CDN_AUTH),
        import(CDN_FIRESTORE)
      ]);
      const app = appMod.initializeApp(firebaseConfig);
      const auth = authMod.getAuth(app);
      const db = firestoreMod.getFirestore(app);
      fb = { appMod, authMod, firestoreMod, app, auth, db };
      return fb;
    } catch (err) {
      console.warn("[Auth] Firebase SDK unavailable (offline or blocked):", err);
      syncStatus = "offline";
      notifySync();
      return null;
    }
  })();

  return fbPromise;
}

/** Subscribe to auth state updates */
export function onAuth(cb) {
  authListeners.add(cb);
  return () => authListeners.delete(cb);
}

function notifyAuth() {
  for (const fn of authListeners) {
    try { fn(currentUser); } catch (e) { console.error(e); }
  }
}

/** Subscribe to cloud sync state updates */
export function onSync(cb) {
  syncListeners.add(cb);
  return () => syncListeners.delete(cb);
}

function notifySync() {
  for (const fn of syncListeners) {
    try { fn({ status: syncStatus, lastSync: lastSyncTime }); } catch (e) { console.error(e); }
  }
}

export function getSyncInfo() {
  return { status: syncStatus, lastSync: lastSyncTime, user: currentUser };
}

export function getCurrentUser() {
  return currentUser;
}

/** Sign in with Google popup (falls back to redirect if popup fails) */
export async function signInWithGoogle() {
  const f = await getFirebase();
  if (!f) throw new Error("Could not load login service. Please check your internet connection.");
  const provider = new f.authMod.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  try {
    const res = await f.authMod.signInWithPopup(f.auth, provider);
    return res.user;
  } catch (err) {
    if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request") {
      // Fall back to redirect
      return f.authMod.signInWithRedirect(f.auth, provider);
    }
    throw err;
  }
}

/** Sign out */
export async function signOut() {
  const f = await getFirebase();
  if (f) {
    await f.authMod.signOut(f.auth);
  }
  currentUser = null;
  syncStatus = "idle";
  lastSyncTime = null;
  notifyAuth();
  notifySync();
}

/** Losslessly merge remote cloud data with local store state */
export function mergeData(local, remote) {
  if (!remote || typeof remote !== "object") return local;
  if (!local || typeof local !== "object") return remote;

  const merged = { ...local };

  // 1. Settings
  merged.settings = { ...(remote.settings || {}), ...(local.settings || {}) };

  // 2. Completed sections (union of completed keys)
  merged.done = { ...(remote.done || {}), ...(local.done || {}) };

  // 3. Books progress
  merged.books = { ...(remote.books || {}) };
  if (local.books) {
    for (const [k, v] of Object.entries(local.books)) {
      if (!merged.books[k]) {
        merged.books[k] = v;
      } else {
        merged.books[k] = {
          ...merged.books[k],
          page: Math.max(merged.books[k].page || 0, v.page || 0),
          reads: Math.max(merged.books[k].reads || 0, v.reads || 0),
          done: merged.books[k].done || v.done
        };
      }
    }
  }

  // 4. SRS cards (keep the card with higher rep/seen progress)
  merged.srs = { ...(remote.srs || {}) };
  if (local.srs) {
    for (const [id, lCard] of Object.entries(local.srs)) {
      const rCard = merged.srs[id];
      if (!rCard) {
        merged.srs[id] = lCard;
      } else {
        const lScore = (lCard.rep || 0) + (lCard.seen || 0);
        const rScore = (rCard.rep || 0) + (rCard.seen || 0);
        merged.srs[id] = lScore >= rScore ? lCard : rCard;
      }
    }
  }

  // 5. Daily study stats & streak
  merged.stats = {
    ...remote.stats,
    streak: Math.max(local.stats?.streak || 0, remote.stats?.streak || 0),
    best: Math.max(local.stats?.best || 0, remote.stats?.best || 0),
    reviews: Math.max(local.stats?.reviews || 0, remote.stats?.reviews || 0),
    minutes: Math.max(local.stats?.minutes || 0, remote.stats?.minutes || 0),
    written: Math.max(local.stats?.written || 0, remote.stats?.written || 0),
    days: { ...(remote.stats?.days || {}) }
  };
  if (local.stats?.days) {
    for (const [d, lDay] of Object.entries(local.stats.days)) {
      const rDay = merged.stats.days[d];
      if (!rDay) {
        merged.stats.days[d] = lDay;
      } else {
        merged.stats.days[d] = {
          rev: Math.max(lDay.rev || 0, rDay.rev || 0),
          write: Math.max(lDay.write || 0, rDay.write || 0),
          read: Math.max(lDay.read || 0, rDay.read || 0),
          min: Math.max(lDay.min || 0, rDay.min || 0)
        };
      }
    }
  }

  // 6. Notes & pinned items
  merged.notes = { ...(remote.notes || {}), ...(local.notes || {}) };
  merged.pinned = [...new Set([...(remote.pinned || []), ...(local.pinned || [])])];

  return merged;
}

/** Pull remote data from Firestore and merge into the local Store */
export async function pullAndMerge(Store) {
  if (!currentUser) return null;
  const f = await getFirebase();
  if (!f) return null;

  syncStatus = "syncing";
  notifySync();

  try {
    const userDocRef = f.firestoreMod.doc(f.db, "users", currentUser.uid);
    const snap = await f.firestoreMod.getDoc(userDocRef);

    if (snap.exists()) {
      const remote = snap.data();
      if (remote && remote.data) {
        const merged = mergeData(Store.d, remote.data);
        // Replace Store in-memory data
        for (const k of Object.keys(Store.d)) delete Store.d[k];
        Object.assign(Store.d, merged);
        Store.save();
        lastSyncTime = remote.updatedAt || Date.now();
      }
    } else {
      // First time user on cloud: upload initial state
      await pushToCloud(Store.d);
    }
    syncStatus = "synced";
    notifySync();
    return true;
  } catch (err) {
    console.error("[Auth] Cloud pull failed:", err);
    syncStatus = "error";
    notifySync();
    return false;
  }
}

/** Push state to Firestore */
export async function pushToCloud(data) {
  if (!currentUser) return;
  const f = await getFirebase();
  if (!f) return;

  syncStatus = "syncing";
  notifySync();

  try {
    const userDocRef = f.firestoreMod.doc(f.db, "users", currentUser.uid);
    const now = Date.now();
    await f.firestoreMod.setDoc(userDocRef, {
      data: JSON.parse(JSON.stringify(data)),
      updatedAt: now,
      user: {
        email: currentUser.email,
        name: currentUser.displayName
      }
    }, { merge: true });

    syncStatus = "synced";
    lastSyncTime = now;
    notifySync();
  } catch (err) {
    console.error("[Auth] Cloud push failed:", err);
    syncStatus = "error";
    notifySync();
  }
}

/** Initialize Auth listener on app boot */
export function initAuthSync(Store, onAuthChangeCallback) {
  getFirebase().then((f) => {
    if (!f) return;
    f.authMod.onAuthStateChanged(f.auth, async (user) => {
      if (user) {
        currentUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0] || "Student",
          photoURL: user.photoURL
        };
        await pullAndMerge(Store);
      } else {
        currentUser = null;
        syncStatus = "idle";
      }
      notifyAuth();
      notifySync();
      if (onAuthChangeCallback) onAuthChangeCallback(currentUser);
    });
  });
}
