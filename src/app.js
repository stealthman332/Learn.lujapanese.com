/* ==========================================================================
   MASU · JLC Edition — Application Controller & Views
   ========================================================================== */

import { initCompat } from "./core/compat.js";
import { Store, SET, today, touchDay } from "./core/store.js";
import { SRS } from "./core/srs.js";
import { el, $, $$, esc, toast, modal, bar, stat, jp, speakBtn } from "./core/dom.js";
import { shuffle, pick, sample, clamp, pct } from "./core/utils.js";
import { Speech } from "./core/speech.js";
import { SFX } from "./core/audio.js";
import { R2H, H2R, K2R, toHiragana, isKanjiCh, toKata, toHira, romajiToKana, kanaToRomaji } from "./core/kana-convert.js";
import { RUBY_RE, furi, plain, readingOf, knownKanji, furiHidden } from "./core/furigana.js";
import { conj, CONJ_FORMS, ADJ_FORMS } from "./engine/conjugation.js";
import { LEX, initLexicon, units, segment, tappable, chunks } from "./engine/lexicon.js";
import { deinflect, posOk } from "./engine/deinflect.js";
import { importApkg, ankiField, hasJp } from "./engine/anki.js";
import { unzip } from "./engine/unzip.js";
import { sqliteTables } from "./engine/sqlite.js";
import { DATA } from "./data/loader.js";
import { KANA, LOOKALIKES, kanaList, ALL_KANA, kanaId } from "./data/kana.js";
import { KANJI_RAW, KANJI, kanjiId, KANJI_BY } from "./data/kanji-index.js";
import { DECKS, VOCAB_RAW, VOCAB, VOCAB_BY_DECK, DECK_BY } from "./data/vocab.js";
import { CHAPTERS } from "./data/chapters.js";
import { SITUATIONS } from "./data/situations.js";
import { GRAMMAR } from "./data/grammar.js";
import { READERS } from "./data/readers.js";
import { COUNTERS, COLOURS, NUMBERS, TIME_DATA } from "./data/reference.js";

/* ==========================================================================
   APP — routing, navigation, page furniture, home
   ========================================================================== */

/* ---- id space ------------------------------------------------------------ */
const KANA_IDS  = ALL_KANA.map(kanaId);
const KANJI_IDS = KANJI.map(kanjiId);
const VOCAB_IDS = VOCAB.map(v => v.id);
const ALL_IDS   = [...KANA_IDS, ...KANJI_IDS, ...VOCAB_IDS];

const KANA_BY_CH = Object.fromEntries(ALL_KANA.map(k => [k.ch, k]));
const VOCAB_BY_ID = Object.fromEntries(VOCAB.map(v => [v.id, v]));

/* one id → the thing it stands for (always carrying its id) */
function itemById(id) { const r = itemById_(id); return r ? (r.id ? r : { id, ...r }) : null; }
function itemById_(id) {
  if (id.startsWith("kana:"))  { const k = KANA_BY_CH[id.slice(5)];  return k && { type: "kana", o: k }; }
  if (id.startsWith("kanji:") && KANJI_BY[id.slice(6)]) return { type: "kanji", o: KANJI_BY[id.slice(6)] };
  if (id.startsWith("v:"))     { const v = VOCAB_BY_ID[id];          return v && { type: "vocab", o: v }; }
  return typeof CARDS !== "undefined" ? CARDS.resolve(id) : null;
}

/* ---- section completion -------------------------------------------------- */
const isDone = key => !!Store.d.done[key];
function mark(key, on = true) {
  if (on) Store.d.done[key] = Date.now(); else delete Store.d.done[key];
  Store.save();
}

/* ---- page furniture ------------------------------------------------------ */
function page(eyebrow, title, jpTitle, lede) {
  const head = el("header", {},
    eyebrow && el("div", { class: "eyebrow" }, eyebrow),
    el("h1", { class: "ptitle" }, jpTitle && el("span", { class: "jp", text: jpTitle }), title),
    lede && el("p", { class: "lede", html: lede })
  );
  return head;
}
function sec(title, count, ...kids) {
  return el("section", { class: "sec" },
    title && el("h2", {}, title, count != null && el("span", { class: "cnt", text: String(count) })),
    ...kids);
}
function empty(mark_, msg, action) {
  return el("div", { class: "empty" }, el("span", { class: "mk", text: mark_ }), el("p", { text: msg }), action);
}
function backLink(href, label) {
  return el("a", { class: "btn ghost sm", href }, "← " + label);
}
const jlptTag = n => el("span", { class: "tag n" + n, text: "N" + n });

/* progress ring-less bar with a label */
function labelled(label, done, total, cls = "") {
  return el("div", {},
    el("div", { class: "row small muted", style: { justifyContent: "space-between", marginBottom: "5px" } },
      el("span", { text: label }), el("span", { class: "mono", text: `${done}/${total}` })),
    bar(pct(done, total), cls));
}

/* ---- navigation ---------------------------------------------------------- */
const NAV = [
  { ji: "家", en: "Home",     href: "#/",         match: /^#?\/?$/ },
  { ji: "章", en: "Chapters", href: "#/chapters", match: /^#\/chapter/ },
  { ji: "字", en: "Kana",     href: "#/kana",     match: /^#\/(kana|kanji|write)/ },
  { ji: "語", en: "Words",    href: "#/decks",    match: /^#\/(decks|deck)/ },
  { ji: "話", en: "Phrases",  href: "#/phrases",  match: /^#\/(phrases|phrase|grammar)/ },
  { ji: "本", en: "Read",     href: "#/read",     match: /^#\/read/ },
  { ji: "遊", en: "Games",    href: "#/games",    match: /^#\/game/ },
  { ji: "札", en: "Cards",    href: "#/review",   match: /^#\/(review|queue)/ },
  { ji: "表", en: "Ref",      href: "#/reference", match: /^#\/(reference|counters|colors|numbers|grammar)/ },
  { ji: "棚", en: "Shelf",    href: "#/shelf",    match: /^#\/shelf/ },
  { ji: "設", en: "Setup",    href: "#/settings", match: /^#\/(settings|stats)/ }
];
/* original buildNav replaced by JLC edition buildNav below */
function syncNav() {
  const h = location.hash || "#/";
  for (const a of $$(".railbtn[data-m]")) {
    const n = NAV.find(x => x.en === a.dataset.m);
    if (n && n.match.test(h)) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

/* ---- theme --------------------------------------------------------------- */
function applyTheme() {
  const known = ["paper", "night", "sakura", "regal", "hacker"];
  const t = known.includes(SET().theme) ? SET().theme : "paper";
  document.documentElement.dataset.theme = t;
  const ji = $("#themeji");
  if (ji) ji.textContent = { paper: "墨", night: "月", sakura: "桜", regal: "錦", hacker: "端" }[t];
  if (typeof paintPetals === "function") paintPetals();
  document.documentElement.style.setProperty("--fs", { s: "15px", m: "16.5px", l: "18.5px" }[SET().fontSize] || "16.5px");
}

/* ---- router -------------------------------------------------------------- */
const ROUTES = [
  [/^\/?$/,                 () => viewHome()],
  [/^\/chapters$/,          () => viewChapters()],
  [/^\/chapter\/(\d+)$/,    m => viewChapter(+m[1])],
  [/^\/kana$/,              () => viewKanaHub()],
  [/^\/kana\/(hira|kata)$/, m => viewKanaHub(m[1])],
  [/^\/kanji$/,             () => viewKanji()],
  [/^\/write$/,             () => viewWrite()],
  [/^\/decks$/,             () => viewDecks()],
  [/^\/deck\/([\w-]+)$/,    m => viewDeck(m[1])],
  [/^\/review$/,            () => viewFlash()],
  [/^\/review\/([\w:-]+)$/, m => viewFlash(decodeURIComponent(m[1]))],
  [/^\/queue$/,             () => viewReviewStart()],
  [/^\/games$/,             () => viewGames()],
  [/^\/game\/([\w-]+)$/,    m => viewGame(m[1])],
  [/^\/read$/,              () => viewLibrary()],
  [/^\/read\/([\w-]+)$/,    m => viewReader(m[1])],
  [/^\/phrases$/,           () => viewSituations()],
  [/^\/phrase\/([\w-]+)$/,  m => viewSituation(m[1])],
  [/^\/grammar$/,           () => viewGrammar()],
  [/^\/shelf$/,             () => viewShelf()],
  [/^\/stats$/,             () => viewStats()],
  [/^\/settings$/,          () => viewSettings()],
  [/^\/reference$/,         () => viewReference()],
  [/^\/counters$/,          () => viewCounters()],
  [/^\/colors$/,            () => viewColors()],
  [/^\/numbers$/,           () => viewNumbers()],
  [/^\/starred$/,           () => viewStarred()]
];

let CLEANUP = [];
function onLeave(fn) { CLEANUP.push(fn); }
let QUERY = {};

async function ensureDataForPath(path) {
  if (path.startsWith("/dict")) await DATA.ensure("dict");
  else if (path.startsWith("/kanji") || path.startsWith("/write") || path.startsWith("/print")) await DATA.ensure("kanji", "strokes");
  else if (path.startsWith("/read") || path.startsWith("/story") || path.startsWith("/classic")) await DATA.ensure("stories", "classics");
  else if (path.startsWith("/faith") || path.startsWith("/culture")) await DATA.ensure("faith", "culture");
  else if (path.startsWith("/club") || path.startsWith("/exam") || path.startsWith("/present") || path.startsWith("/jlc")) await DATA.ensure("club", "jlc");
  else if (path.startsWith("/anki")) await DATA.ensure("jlc_anki");
  else if (path.startsWith("/grammar")) await DATA.ensure("grammar_ext");
  else if (path === "/" || path === "") await DATA.ensure("club");
}

async function render() {
  CLEANUP.forEach(f => { try { f(); } catch (e) {} }); CLEANUP = [];
  Speech.stop();
  const raw = (location.hash || "#/").replace(/^#/, "") || "/";
  const qi = raw.indexOf("?");
  const path = qi < 0 ? raw : raw.slice(0, qi);
  await ensureDataForPath(path);
  QUERY = {};
  if (qi >= 0) for (const kv of raw.slice(qi + 1).split("&")) {
    if (!kv) continue;
    const [k, ...rest] = kv.split("=");
    QUERY[decodeURIComponent(k)] = decodeURIComponent(rest.join("=") || "");
  }
  const view = $("#view");
  view.innerHTML = "";
  let hit = false;
  for (const [re, fn] of ROUTES) {
    const m = re.exec(path);
    if (m) { try { fn(m); } catch (e) { console.error(e); view.append(errorCard(e)); } hit = true; break; }
  }
  if (!hit) {
    view.append(page("404", "Nothing here", "迷子", "That address doesn't exist. Try the chapter map."),
      el("a", { class: "btn pri", href: "#/chapters" }, "Chapter map"));
  }
  syncNav();
  view.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "instant" });
}
function errorCard(e) {
  return el("div", { class: "card" },
    el("h3", { text: "Something broke on this screen." }),
    el("p", { class: "small muted", text: String(e && e.message || e) }),
    el("a", { class: "btn sm", href: "#/" }, "Back to home"));
}
const go = h => { if (location.hash === h) render(); else location.hash = h; };


/* ==========================================================================
   HOME
   ========================================================================== */
function nextUp() {
  for (const ch of CHAPTERS) {
    for (let i = 0; i < ch.sections.length; i++) {
      if (!isDone(`ch${ch.n}:${i}`)) return { ch, i, s: ch.sections[i] };
    }
  }
  return null;
}

/* viewHome() lives in 71-home.js now. */
function tile(ji, title, sub, href) {
  return el("a", { class: "card", href, style: { textDecoration: "none", color: "inherit", display: "flex", gap: "13px", alignItems: "flex-start" } },
    el("span", { style: { fontFamily: "var(--hand)", fontSize: "27px", lineHeight: "1", color: "var(--ai)" }, text: ji }),
    el("span", {}, el("b", { style: { display: "block", fontWeight: "500" }, text: title }),
      el("span", { class: "small muted", text: sub })));
}

/* the ink wall: a square per item, filling with sumi as it sticks */
function inkWall() {
  /* squares you've actually studied first (strongest first), then the rest of the curriculum */
  const mine = Object.keys(Store.d.srs).sort((a, b) => SRS.strength(b) - SRS.strength(a)).slice(0, 216);
  const seen = new Set(mine);
  const stride = Math.max(1, Math.floor(ALL_IDS.length / 216));
  const ids = mine.concat(ALL_IDS.filter((id, i) => i % stride === 0 && !seen.has(id))).slice(0, 216);
  const wall = el("div", { class: "inkwall", "aria-hidden": "true" });
  for (const id of ids) {
    const f = SRS.strength(id);
    const due = !SRS.isNew(id) && SRS.due(id) ? "1" : null;
    wall.append(el("div", { class: "ink", "data-due": due, title: id.replace(/^[a-z]+:/, "").split("|")[0] },
      el("i", { style: { "--f": f.toFixed(3) } })));
  }
  return el("div", {}, wall,
    el("div", { class: "row tiny muted", style: { marginTop: "9px", justifyContent: "space-between" } },
      el("span", { text: "every square is one word, kanji, or kana" }),
      el("span", { class: "mono", text: dueCount() + " due" })));
}

/* ==========================================================================
   CHAPTERS
   Everything is open from day one. The order is advice, not a gate.
   ========================================================================== */
const chKey = (n, i) => `ch${n}:${i}`;
const chDone = ch => ch.sections.filter((_, i) => isDone(chKey(ch.n, i))).length;

/* viewChapters() lives in 63-chapters.js now (club, zero and beyond tracks). */
const SEC_JI = { kana: "字", kanji: "漢", vocab: "語", grammar: "文", sit: "話", read: "本", write: "筆", game: "遊" };
const SEC_EN = { kana: "Kana", kanji: "Kanji", vocab: "Words", grammar: "Grammar", sit: "Phrases", read: "Reading", write: "Writing", game: "Drill" };

function viewChapter(n) {
  const ch = CHAPTERS.find(c => c.n === n);
  const v = $("#view");
  if (!ch) return v.append(empty("？", "No chapter " + n + ".", el("a", { class: "btn", href: "#/chapters" }, "Chapter map")));

  v.append(el("div", { class: "row", style: { marginBottom: "16px" } },
    backLink("#/chapters?t=zero", "All chapters"),
    n > 1 && el("a", { class: "btn ghost sm", href: "#/chapter/" + (n - 1) }, "← " + (n - 1)),
    n < CHAPTERS.length && el("a", { class: "btn ghost sm", href: "#/chapter/" + (n + 1) }, (n + 1) + " →")));

  v.append(page("第" + n + "章", ch.en, ch.jp, ch.goal));

  const d = chDone(ch), t = ch.sections.length;
  v.append(el("div", { class: "card" }, labelled("This chapter", d, t, d === t ? "m" : "")));

  const list = el("div", { class: "lst", style: { marginTop: "20px" } });
  ch.sections.forEach((s, i) => {
    const key = chKey(n, i);
    const row = el("div", { class: "li", style: { cursor: "default" } },
      el("span", { class: "lead", style: { color: "var(--ai)" }, text: SEC_JI[s.t] || "・" }),
      el("span", { class: "body" },
        el("b", { text: s.label }),
        el("span", { text: SEC_EN[s.t] + secDetail(s) })),
      el("span", { class: "row", style: { gap: "7px", flexWrap: "nowrap" } },
        el("a", { class: "btn sm pri", href: secHref(s, ch, i) }, "Open"),
        toggleSeal(key)));
    list.append(row);
  });
  v.append(list);

  v.append(sec("When you're done here", null, el("div", { class: "row" },
    el("a", { class: "btn", href: "#/review" }, "Review what this chapter added"),
    n < CHAPTERS.length && el("a", { class: "btn ghost", href: "#/chapter/" + (n + 1) }, "Chapter " + (n + 1) + " →"))));
}

function toggleSeal(key) {
  const b = el("button", { class: "seal" + (isDone(key) ? " done" : ""), title: "Mark finished", text: "済" });
  b.onclick = () => {
    const on = !isDone(key);
    mark(key, on);
    b.className = "seal" + (on ? " done stamped" : "");
    if (on) { Sfx.ok(); toast("Marked finished."); } else Sfx.tick();
  };
  return b;
}

function secDetail(s) {
  if (s.t === "vocab") { const d = DECK_BY[s.deck]; return d ? ` · ${VOCAB_BY_DECK(s.deck).length} words` : ""; }
  if (s.t === "grammar") return ` · ${s.ids.length} patterns`;
  if (s.t === "read") { const r = READER_BY[s.id]; return r ? ` · ${r.pages.length} pages, level ${r.level}` : ""; }
  if (s.t === "write") return s.chars ? ` · ${s.chars.length} characters` : "";
  if (s.t === "kana") return s.rows ? ` · ${s.rows.length} rows` : " · extras";
  if (s.t === "kanji") return s.chars ? ` · ${s.chars.length} kanji` : " · full sweep";
  if (s.t === "sit") { const p = SITUATIONS.find(x => x.id === s.id); return p ? ` · ${p.lines.length} lines` : ""; }
  return "";
}

function secHref(s, ch, i) {
  switch (s.t) {
    case "kana":    return "#/kana/" + (s.script || "hira");
    case "kanji":   return "#/kanji";
    case "vocab":   return "#/deck/" + s.deck;
    case "grammar": return "#/grammar";
    case "sit":     return "#/phrase/" + s.id;
    case "read":    return "#/read/" + s.id;
    case "write":   return "#/write?ch=" + ch.n + "&i=" + i;
    case "game":    return "#/game/" + s.g;
  }
  return "#/chapters";
}

/* chapters that mention a deck / reader / situation, for cross-links */
function chaptersWith(pred) {
  const out = [];
  for (const ch of CHAPTERS) if (ch.sections.some(pred)) out.push(ch);
  return out;
}
function crumbFor(pred) {
  const cs = chaptersWith(pred);
  if (!cs.length) return null;
  return el("div", { class: "row tiny muted", style: { marginBottom: "14px" } },
    "Appears in:", cs.map(c => el("a", { class: "chip", href: "#/chapter/" + c.n, text: "第" + c.n + "章 " + c.en })));
}

/* ==========================================================================
   KANA & KANJI browsing
   ========================================================================== */
function viewKanaHub(script) {
  const v = $("#view");
  script = script || SET().script || "hira";
  const K = KANA[script];

  v.append(page("もじ", "The two alphabets", "字",
    "Hiragana first, katakana second, and don't let anyone tell you to learn them 'later'. Everything downstream is faster once these are automatic. Tap any square for the mnemonic, stroke count, and a writing pad."));

  v.append(el("a", { class: "card tilebtn", href: "#/kanamaster", style: { marginBottom: "16px", borderLeft: "5px solid var(--shu)" } },
    el("b", { style: { fontFamily: "'Alex Brush', var(--hand), cursive", fontSize: "30px", fontWeight: 400 }, text: "Kana Master" }),
    el("span", { class: "small muted", text: "The row-by-row flashcard drill — plus typing, listening and stroke-order writing." })));
  v.append(el("div", { class: "row", style: { marginBottom: "20px" } },
    el("a", { class: "chip" + (script === "hira" ? " on" : ""), href: "#/kana/hira" }, "ひらがな Hiragana"),
    el("a", { class: "chip" + (script === "kata" ? " on" : ""), href: "#/kana/kata" }, "カタカナ Katakana"),
    el("a", { class: "chip", href: "#/kanji" }, "漢字 Kanji"),
    el("a", { class: "chip", href: "#/write?set=" + (script === "kata" ? "kata" : "hira") + "&mode=strokes" }, "筆 Stroke order"),
    el("a", { class: "chip", href: "#/print?c=" + encodeURIComponent(kanaList(script, ["base"]).map(k => k.ch).join("")) }, "🖨 Practice sheets")));

  const base = kanaList(script, ["base"]), daku = kanaList(script, ["daku"]), yoon = kanaList(script, ["yoon"]);
  const all = [...base, ...daku, ...yoon].map(kanaId);
  const c = SRS.counts(all);

  v.append(el("div", { class: "card" },
    el("div", { class: "spread" },
      el("div", {}, el("h3", { style: { fontSize: "18px" }, text: K.label + " · " + K.en }),
        el("p", { class: "small muted", style: { maxWidth: "46ch" }, text: K.note })),
      el("div", { class: "row" },
        el("a", { class: "btn pri sm", href: "#/review/kana:" + script }, "Drill this set"),
        el("a", { class: "btn ghost sm", href: "#/game/rain" }, "Kana rain"))),
    el("div", { style: { marginTop: "14px" } }, labelled("Squares inked", c.known + c.due, c.total, "m"))));

  /* main gojūon grid, row by row */
  const grid = el("div", { class: "chart", style: { marginTop: "22px" } });
  for (const [, row] of K.rows) {
    for (const cell of row) {
      if (!cell) { grid.append(el("div", { class: "cell blank" })); continue; }
      grid.append(kanaCell({ ch: cell[0], rom: cell[1], strokes: cell[2], mn: cell[3], script, set: "base" }));
    }
  }
  v.append(sec("Gojūon 五十音", base.length, grid));

  const dg = el("div", { class: "chart wide" });
  daku.forEach(k => dg.append(kanaCell(k)));
  v.append(sec("Dakuten & handakuten 濁音", daku.length,
    el("p", { class: "small muted", style: { marginTop: "-6px", marginBottom: "12px" } },
      "Two ticks voice a sound (か→が). A small circle turns は into ぱ. No new shapes to learn — just marks."), dg));

  const yg = el("div", { class: "chart wide" });
  yoon.forEach(k => yg.append(kanaCell(k)));
  v.append(sec("Yōon 拗音", yoon.length,
    el("p", { class: "small muted", style: { marginTop: "-6px", marginBottom: "12px" } },
      "A small ゃゅょ glued to an -i kana squashes two syllables into one. きや is ki-ya; きゃ is one beat, kya. The size difference is the whole meaning."), yg));

  v.append(sec("The pairs that cost people points", LOOKALIKES.length, lookalikeCards()));
}

function kanaCell(k) {
  const id = kanaId(k), f = SRS.strength(id);
  const c = el("button", { class: "masu cell", title: k.rom, onclick: () => kanaSheet(k) },
    el("i", { class: "lv", style: { "--f": f.toFixed(2) } }),
    el("span", { class: "ch", text: k.ch }),
    SET().romaji !== "off" && el("span", { class: "rm", text: k.rom }));
  return c;
}

function kanaSheet(k) {
  const id = kanaId(k), card = SRS.peek(id);
  const body = el("div", {},
    el("div", { class: "row", style: { gap: "18px", alignItems: "flex-start" } },
      STROKES.has(k.ch) ? el("div", { style: { flex: "0 0 auto" } }, strokePlayer(k.ch, { size: 150 })) :
      el("div", { class: "masu", style: { width: "128px", height: "128px", display: "grid", placeItems: "center", flex: "0 0 auto" } },
        el("span", { style: { fontFamily: "var(--hand)", fontSize: "76px", lineHeight: "1" }, text: k.ch })),
      el("div", { style: { flex: "1 1 200px" } },
        el("dl", { class: "kv" },
          el("dt", { text: "Romaji" }), el("dd", { class: "mono", style: { fontSize: "17px" }, text: k.rom }),
          el("dt", { text: "Strokes" }), el("dd", { class: "mono", text: k.strokes ? String(k.strokes) : "—" }),
          el("dt", { text: "Other script" }), el("dd", { style: { fontFamily: "var(--hand)", fontSize: "20px" }, text: k.script === "hira" ? toKata(k.ch) : toHira(k.ch) }),
          card ? el("dt", { text: "Seen" }) : null,
          card ? el("dd", { class: "mono small", text: `${card.seen}× · ${card.right} right · interval ${card.iv}d` }) : null))),
    k.mn && el("div", { class: "card", style: { marginTop: "16px", background: "var(--kincha-wash, var(--paper-2))" } },
      el("div", { class: "eyebrow" }, "Mnemonic"), el("p", { text: k.mn }),
      el("p", { class: "tiny muted", style: { marginTop: "8px" }, text: "If this one doesn't stick, invent your own — a bad mnemonic you made beats a good one you were handed." })),
    el("div", { class: "row", style: { marginTop: "16px" } },
      speakBtn(k.ch, "Hear it"),
      el("button", { class: "btn sm pri", onclick: () => { close(); go("#/write?c=" + encodeURIComponent(k.ch)); } }, "Write it"),
      starBtn(id),
      el("button", { class: "btn sm ghost", onclick: () => { SRS.grade(id, 2); toast("Marked as known."); close(); } }, "I know this")));
  const close = modal(k.ch + "  ·  " + k.rom, body, { sub: KANA[k.script].en + (k.set !== "base" ? " · " + k.set : "") });
}

function lookalikeCards() {
  const g = el("div", { class: "grid g2" });
  for (const [a, b, note] of LOOKALIKES) {
    g.append(el("div", { class: "card" },
      el("div", { class: "row", style: { gap: "10px", marginBottom: "9px" } },
        el("span", { style: { fontFamily: "var(--hand)", fontSize: "38px", lineHeight: "1" }, text: a }),
        el("span", { class: "muted", text: "／" }),
        el("span", { style: { fontFamily: "var(--hand)", fontSize: "38px", lineHeight: "1" }, text: b }),
        el("span", { class: "mono tiny muted", text: (KANA_BY_CH[a]?.rom || "") + " / " + (KANA_BY_CH[b]?.rom || "") })),
      el("p", { class: "small", text: note })));
  }
  g.append(el("a", { class: "card", href: "#/game/lookalike", style: { display: "grid", placeItems: "center", textDecoration: "none", color: "var(--ai)", minHeight: "120px" } },
    el("div", { class: "center" }, el("div", { style: { fontFamily: "var(--hand)", fontSize: "34px" }, text: "遊" }),
      el("b", { text: "Drill these pairs" }))));
  return g;
}


/* The kanji browser and kanji pages now live in 60-kanji.js (all 2,136 jōyō kanji). */

/* ==========================================================================
   WRITING PAD  —  draw a character, get scored against the model glyph
   How the score works: the target character is rendered to an offscreen
   canvas, both it and your ink are reduced to occupancy grids, and the two
   are compared in both directions. Coverage asks "did you cover the model?"
   Precision asks "did you stay on it?" You need both — a solid black square
   scores 100% coverage and almost no precision.
   ========================================================================== */
const GRID = 56;          /* comparison resolution */
const DILATE = 3;         /* tolerance, in grid cells */

function strokesFor(ch) {
  const kv = STROKES.get(ch); if (kv) return kv.length;
  if (KANA_BY_CH[ch]) return KANA_BY_CH[ch].strokes || 0;
  if (KANJI_BY[ch]) return KANJI_BY[ch].strokes || 0;
  return 0;
}
function labelFor(ch) {
  if (KANA_BY_CH[ch]) return KANA_BY_CH[ch].rom;
  if (KANJI_BY[ch]) return KANJI_BY[ch].mean;
  const k = KJ.get(ch); if (k) return k.mean;
  return "";
}
function idFor(ch) {
  if (KANA_BY_CH[ch]) return kanaId(KANA_BY_CH[ch]);
  if (KANJI_BY[ch] || KJ.get(ch)) return "kanji:" + ch;
  return null;
}

/* -------------------------------------------------------------------------- */
function writePad(queue, pos, { onNext, onPrev }) {
  const ch = queue[pos];
  const expect = strokesFor(ch);
  const wrap = el("div", { class: "padwrap" });

  const model = el("div", { class: "model" + (SET().tracingModel === "on" ? "" : " off") });
  if (STROKES.has(ch)) { model.classList.add("kvg"); model.append(strokeSVG(ch, { grid: false, size: "100%" })); } else model.textContent = ch;
  const guides = el("div", { class: "guides" },
    el("span", { class: "v" }), el("span", { class: "h" }),
    el("span", { class: "d1" }), el("span", { class: "d2" }));
  if (SET().strokeGuide !== "on") guides.style.display = "none";
  const cv = el("canvas");
  const ov = el("canvas");
  const pad = el("div", { class: "pad" }, guides, model, cv, ov);

  /* --- canvas setup ------------------------------------------------------ */
  const SIZE = 512;
  cv.width = cv.height = ov.width = ov.height = SIZE;
  const ctx = cv.getContext("2d", { willReadFrequently: true });
  const octx = ov.getContext("2d");
  ctx.lineCap = ctx.lineJoin = "round";

  let strokes = [], cur = null, drawing = false, scored = false;

  const toLocal = e => {
    const r = pad.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * SIZE, (e.clientY - r.top) / r.height * SIZE];
  };
  const redraw = () => {
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--sumi").trim() || "#14181A";
    ctx.lineWidth = 15;
    for (const s of strokes) {
      if (s.length < 2) {
        if (s.length === 1) { ctx.beginPath(); ctx.arc(s[0][0], s[0][1], 7, 0, 7); ctx.fillStyle = ctx.strokeStyle; ctx.fill(); }
        continue;
      }
      ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]);
      for (let i = 1; i < s.length - 1; i++) {
        const mx = (s[i][0] + s[i + 1][0]) / 2, my = (s[i][1] + s[i + 1][1]) / 2;
        ctx.quadraticCurveTo(s[i][0], s[i][1], mx, my);
      }
      ctx.lineTo(s.at(-1)[0], s.at(-1)[1]);
      ctx.stroke();
    }
    countEl.textContent = `${strokes.length}${expect ? " / " + expect : ""}`;
    countEl.style.color = expect && strokes.length === expect ? "var(--matcha)" : "";
  };

  const start_ = e => {
    if (scored) resetInk();
    if (e.pointerId != null && pad.setPointerCapture) { try { pad.setPointerCapture(e.pointerId); } catch (_) {} }
    drawing = true; cur = [toLocal(e)]; strokes.push(cur); redraw();
  };
  const move_ = e => { if (!drawing) return; cur.push(toLocal(e)); redraw(); };
  const end = () => { if (drawing) { drawing = false; cur = null; Sfx.tick(); } };
  if (window.__hasPointer) {
    pad.addEventListener("pointerdown", start_);
    pad.addEventListener("pointermove", move_);
    pad.addEventListener("pointerup", end);
    pad.addEventListener("pointercancel", end);
    pad.addEventListener("pointerleave", end);
  } else {
    /* Safari 12 and below, and a few Android browsers */
    const t = fn => e => { e.preventDefault(); fn(e.touches && e.touches[0] ? e.touches[0] : e); };
    pad.addEventListener("mousedown", start_);
    pad.addEventListener("mousemove", move_);
    pad.addEventListener("mouseup", end);
    pad.addEventListener("mouseleave", end);
    pad.addEventListener("touchstart", t(start_), { passive: false });
    pad.addEventListener("touchmove", t(move_), { passive: false });
    pad.addEventListener("touchend", end);
    pad.addEventListener("touchcancel", end);
  }

  function resetInk() { strokes = []; scored = false; octx.clearRect(0, 0, SIZE, SIZE); card.innerHTML = ""; card.append(blankCard()); redraw(); }

  /* --- scorecard --------------------------------------------------------- */
  const countEl = el("b", { class: "mono", text: "0" });
  const card = el("div", { class: "scorecard" });
  function blankCard() {
    return el("div", {},
      el("div", { class: "eyebrow" }, "Now writing"),
      el("div", { class: "row", style: { gap: "12px", alignItems: "baseline" } },
        el("span", { style: { fontFamily: "var(--hand)", fontSize: "40px", lineHeight: "1" }, text: ch }),
        el("span", { class: "small muted", text: labelFor(ch) })),
      el("dl", { class: "kv", style: { marginTop: "14px" } },
        el("dt", { text: "Strokes" }), el("dd", {}, countEl),
        el("dt", { text: "Position" }), el("dd", { class: "mono", text: `${pos + 1} of ${queue.length}` })),
      el("p", { class: "small muted", style: { marginTop: "14px" }, text: SET().tracingModel === "on"
        ? "The faint character behind the grid is there to trace. Turn it off in settings when you want to test yourself properly."
        : "No model shown — draw it from memory, then score to see how close you were." }),
      el("p", { class: "tiny muted", style: { marginTop: "8px" }, text: "Draw, then hit Score." }));
  }
  card.append(blankCard());

  /* --- the comparison ---------------------------------------------------- */
  async function score() {
    if (!strokes.length) { toast("Draw something first."); return; }
    try { await document.fonts.load('600 300px "Klee One"'); await document.fonts.ready; } catch (e) {}

    const modelGrid = glyphGrid(ch, SIZE);
    const userGrid = canvasGrid(ctx, SIZE);
    if (!modelGrid.count) { toast("Couldn't render the model glyph in this browser."); return; }

    const dU = dilate(userGrid.g, DILATE), dM = dilate(modelGrid.g, DILATE);
    let cov = 0, prec = 0;
    for (let i = 0; i < GRID * GRID; i++) {
      if (modelGrid.g[i] && dU[i]) cov++;
      if (userGrid.g[i] && dM[i]) prec++;
    }
    const coverage = modelGrid.count ? cov / modelGrid.count : 0;
    const precision = userGrid.count ? prec / userGrid.count : 0;

    /* placement: centroid distance + relative size */
    const cd = Math.hypot(userGrid.cx - modelGrid.cx, userGrid.cy - modelGrid.cy) / GRID;
    const sizeRatio = userGrid.count / Math.max(1, modelGrid.count);
    const sizeOff = Math.abs(Math.log(clamp(sizeRatio, .2, 5)));
    const placement = clamp(1 - cd * 3.2 - sizeOff * .55, 0, 1);

    const strokeScore = !expect ? 1 : clamp(1 - Math.abs(strokes.length - expect) / Math.max(3, expect), 0, 1);
    const total = Math.round(100 * (coverage * .42 + precision * .34 + placement * .14 + strokeScore * .10));

    /* red-pen overlay */
    octx.clearRect(0, 0, SIZE, SIZE);
    drawGlyph(octx, ch, SIZE, "rgba(196,64,44,.32)");
    scored = true;
    model.classList.add("off");

    Store.d.stats.written = (Store.d.stats.written || 0) + 1;
    touchDay("write");

    card.innerHTML = "";
    card.append(scoreCard(total, { coverage, precision, placement, strokeScore }));
    total >= 70 ? Sfx.ok() : Sfx.no();
  }

  function scoreCard(total, m) {
    const verdict =
      total >= 92 ? ["Indistinguishable.", "That would pass on a form."] :
      total >= 80 ? ["Clearly right.", "Legible and well placed. Ship it."] :
      total >= 68 ? ["Recognisable.", "The shape is there; tighten the proportions."] :
      total >= 50 ? ["Halfway.", "Compare against the red overlay — usually it's balance, not shape."] :
                    ["Not yet.", "Look at the red model, trace it twice, then try from memory."];
    const grade = total >= 88 ? 3 : total >= 72 ? 2 : total >= 55 ? 1 : 0;
    const id = idFor(ch);
    return el("div", {},
      el("div", { class: "eyebrow" }, "Compared against the model"),
      el("div", { class: "gauge" }, el("b", { class: total >= 70 ? "" : "", text: String(total) }), el("small", { text: "/ 100" })),
      el("p", { style: { margin: "6px 0 14px" } }, el("b", { text: verdict[0] }), " ", el("span", { class: "small muted", text: verdict[1] })),
      metric("Coverage", m.coverage, "how much of the model you actually drew"),
      metric("Precision", m.precision, "how much of your ink landed on it"),
      metric("Balance", m.placement, "centre of mass and overall size"),
      expect ? metric("Strokes", m.strokeScore, `${strokes.length} drawn, ${expect} expected`) : null,
      el("div", { class: "row", style: { marginTop: "14px" } },
        el("button", { class: "btn sm", onclick: () => { resetInk(); } }, "Try again"),
        id && el("button", { class: "btn sm ghost", onclick: () => { SRS.grade(id, grade); toast("Logged to review."); } }, "Log to review"),
        el("button", { class: "btn sm pri", onclick: onNext }, "Next →")));
  }
  function metric(name, v, note) {
    return el("div", {},
      el("div", { class: "metric" }, el("span", { text: name }), bar(v * 100, v > .78 ? "m" : v > .5 ? "" : "s"),
        el("span", { text: Math.round(v * 100) + "%" })),
      el("div", { class: "tiny muted", style: { margin: "-2px 0 8px 98px" }, text: note }));
  }

  /* --- controls ---------------------------------------------------------- */
  const controls = el("div", { class: "row", style: { marginTop: "14px" } },
    el("button", { class: "btn sm ghost", onclick: () => { strokes.pop(); scored = false; octx.clearRect(0, 0, SIZE, SIZE); redraw(); } }, "↩ Undo"),
    el("button", { class: "btn sm ghost", onclick: resetInk }, "Clear"),
    el("button", { class: "btn sm pri", onclick: score }, "Score it"),
    speakBtn(ch, "Hear it"),
    el("button", { class: "btn sm ghost", onclick: onPrev }, "←"),
    el("button", { class: "btn sm ghost", onclick: onNext }, "→"));

  redraw();
  wrap.append(el("div", {}, pad, controls), card);

  const key = e => {
    if (e.target.matches && e.target.matches("input,textarea")) return;
    if (e.key === "ArrowRight") onNext();
    if (e.key === "ArrowLeft") onPrev();
    if (e.key === "Enter") score();
    if (e.key === "Backspace") { e.preventDefault(); strokes.pop(); redraw(); }
  };
  document.addEventListener("keydown", key);
  onLeave(() => document.removeEventListener("keydown", key));
  return wrap;
}

/* ---- glyph rasterising & grid comparison --------------------------------- */
function drawGlyph(ctx, ch, size, color) {
  const pad = size * 0.10;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  let fs = size * 0.8;
  ctx.font = `${fs}px "Klee One", "Zen Kaku Gothic New", serif`;
  let m = ctx.measureText(ch);
  const w = (m.actualBoundingBoxLeft + m.actualBoundingBoxRight) || fs;
  const h = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) || fs;
  const target = size - pad * 2;
  const scale = Math.min(target / w, target / h);
  fs = fs * scale;
  ctx.font = `${fs}px "Klee One", "Zen Kaku Gothic New", serif`;
  m = ctx.measureText(ch);
  const cx = size / 2 + (m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2;
  const cy = size / 2 + (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
  ctx.fillText(ch, cx, cy);
  ctx.restore();
}
function glyphGrid(ch, size) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d", { willReadFrequently: true });
  drawGlyph(x, ch, size, "#000");
  return canvasGrid(x, size);
}
/* reduce a canvas's alpha channel to a GRID×GRID occupancy map */
function canvasGrid(ctx, size) {
  const d = ctx.getImageData(0, 0, size, size).data;
  const g = new Uint8Array(GRID * GRID);
  const cell = size / GRID;
  let count = 0, sx = 0, sy = 0;
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      let hit = 0;
      const x0 = Math.floor(gx * cell), x1 = Math.floor((gx + 1) * cell);
      const y0 = Math.floor(gy * cell), y1 = Math.floor((gy + 1) * cell);
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          if (d[(y * size + x) * 4 + 3] > 64) { hit++; if (hit > 2) break; }
        }
        if (hit > 2) break;
      }
      if (hit > 2) { g[gy * GRID + gx] = 1; count++; sx += gx; sy += gy; }
    }
  }
  return { g, count, cx: count ? sx / count : GRID / 2, cy: count ? sy / count : GRID / 2 };
}
/* separable max-filter — cheap binary dilation */
function dilate(src, r) {
  const a = new Uint8Array(GRID * GRID), b = new Uint8Array(GRID * GRID);
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    let v = 0;
    for (let k = -r; k <= r && !v; k++) { const xx = x + k; if (xx >= 0 && xx < GRID && src[y * GRID + xx]) v = 1; }
    a[y * GRID + x] = v;
  }
  for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
    let v = 0;
    for (let k = -r; k <= r && !v; k++) { const yy = y + k; if (yy >= 0 && yy < GRID && a[yy * GRID + x]) v = 1; }
    b[y * GRID + x] = v;
  }
  return b;
}

/* ==========================================================================
   VOCABULARY DECKS
   ========================================================================== */
function viewDecks() {
  const v = $("#view");
  v.append(page("たんご", "Word decks", "語",
    `${VOCAB.length} words, sorted by the situation you'll need them in rather than by frequency rank. Frequency lists are efficient and joyless; you remember words you can picture yourself using. The food deck has a picture on every card.`));

  v.append(el("div", { class: "row", style: { marginBottom: "20px" } },
    el("a", { class: "btn pri sm", href: "#/review/vocab" }, "Review all vocabulary"),
    el("a", { class: "btn ghost sm", href: "#/game/match" }, "Matching game"),
    el("a", { class: "btn ghost sm", href: "#/game/listen" }, "Listening drill")));

  const g = el("div", { class: "grid g3" });
  for (const d of DECKS) {
    const words = VOCAB_BY_DECK(d.id);
    if (!words.length) continue;
    const c = SRS.counts(words.map(w => w.id));
    g.append(el("a", { class: "card", href: "#/deck/" + d.id, style: { textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: "9px" } },
      el("div", { class: "row", style: { gap: "9px" } },
        el("span", { style: { fontSize: "22px" }, text: d.ic }),
        el("span", {}, el("b", { style: { display: "block", fontWeight: "500" }, text: d.en }),
          el("span", { class: "small muted", style: { fontFamily: "var(--hand)" }, text: d.jp }))),
      el("p", { class: "small muted", style: { flex: "1" }, text: d.blurb }),
      bar(pct(c.known + c.due, c.total), c.known === c.total ? "m" : ""),
      el("div", { class: "row tiny muted mono", style: { justifyContent: "space-between" } },
        el("span", { text: words.length + " words" }),
        el("span", { text: c.due ? c.due + " due" : c.fresh ? c.fresh + " new" : "✓" }))));
  }
  v.append(g);
}

function viewDeck(id) {
  const d = DECK_BY[id], v = $("#view");
  if (!d) return v.append(empty("？", "No deck called " + id + ".", el("a", { class: "btn", href: "#/decks" }, "All decks")));
  const words = VOCAB_BY_DECK(id);
  const c = SRS.counts(words.map(w => w.id));

  v.append(el("div", { class: "row", style: { marginBottom: "14px" } }, backLink("#/decks", "All decks")));
  v.append(page(d.ic + "  " + d.jp, d.en, null, d.blurb));
  const cr = crumbFor(s => s.t === "vocab" && s.deck === id); if (cr) v.append(cr);

  v.append(el("div", { class: "card" },
    el("div", { class: "spread" },
      el("div", { class: "row", style: { gap: "26px" } },
        stat(words.length, "words"), stat(c.known, "solid"), stat(c.due, "due"), stat(c.fresh, "untouched")),
      el("div", { class: "row" },
        el("a", { class: "btn pri sm", href: "#/review/deck:" + id }, "Study this deck"),
        el("a", { class: "btn ghost sm", href: "#/game/match?deck=" + id }, "Match"),
        el("a", { class: "btn ghost sm", href: "#/game/type?deck=" + id }, "Type"))),
    el("div", { style: { marginTop: "14px" } }, bar(pct(c.known, c.total), "m"))));

  const search = el("input", {
    class: "type-in", placeholder: "filter this deck",
    style: { fontFamily: "var(--jp)", fontSize: "16px", textAlign: "left", maxWidth: "280px", padding: "9px 12px", margin: "22px 0 14px" },
    oninput: e => draw(e.target.value.trim().toLowerCase())
  });
  v.append(search);
  const list = el("div", { class: "lst" });
  v.append(list);

  function draw(q = "") {
    list.innerHTML = "";
    const rows = words.filter(w => !q || w.kana.includes(q) || w.en.toLowerCase().includes(q) || plain(w.form).includes(q) || kanaToRomaji(w.kana).includes(q));
    if (!rows.length) { list.append(empty("無", "Nothing matches.")); return; }
    for (const w of rows) list.append(vocabRow(w));
  }
  draw();
}

function vocabRow(w) {
  const f = SRS.strength(w.id);
  return el("button", { class: "li", onclick: () => vocabSheet(w) },
    el("span", { class: "lead", style: { minWidth: "2.2em", textAlign: "center", fontSize: w.ic ? "24px" : "20px" }, text: w.ic || "・" }),
    el("span", { class: "body" },
      el("b", { html: furi(w.form), style: { fontFamily: "var(--hand)", fontSize: "18px", fontWeight: "400" } }),
      el("span", { text: w.en })),
    el("span", { class: "trail" },
      el("span", { style: { display: "block" } }, jlptTag(w.jlpt)),
      el("span", { class: "tiny muted", style: { display: "block", marginTop: "4px" }, text: f ? Math.round(f * 100) + "%" : "new" })));
}

function vocabSheet(w) {
  const body = el("div", {},
    el("div", { class: "center", style: { padding: "6px 0 16px" } },
      w.ic && el("div", { style: { fontSize: "58px", lineHeight: "1.1" }, text: w.ic }),
      el("div", { style: { fontFamily: "var(--hand)", fontSize: "34px", marginTop: "6px" }, html: furi(w.form, "on") }),
      el("div", { class: "mono small", style: { color: "var(--ai-2)", marginTop: "4px" }, text: kanaToRomaji(w.kana) }),
      el("div", { style: { fontSize: "18px", color: "var(--sumi-2)", marginTop: "8px" }, text: w.en })),
    w.ex ? el("div", { class: "card" },
      el("div", { class: "eyebrow" }, "In a sentence"),
      el("p", { style: { fontFamily: "var(--hand)", fontSize: "19px", lineHeight: "1.9" }, html: furi(w.ex.jp, "on") }),
      el("p", { class: "small muted", style: { marginTop: "6px" }, text: w.ex.en }),
      el("div", { style: { marginTop: "8px" } }, speakBtn(w.ex.jp, "Hear the sentence"))) : null,
    el("div", { class: "row", style: { marginTop: "16px" } },
      speakBtn(w.kana, "Hear it"),
      el("a", { class: "btn sm ghost", href: "#/deck/" + w.deck, onclick: () => close() }, DECK_BY[w.deck]?.en || "Deck"),
      starBtn(w.id),
      el("button", { class: "btn sm pri", onclick: () => { SRS.grade(w.id, 2); toast("Logged."); close(); } }, "I know this")),
    kanjiChips(w.form));
  const close = modal(plain(w.form), body, { sub: w.en + " · N" + w.jlpt });
}

/* any kanji in this word that we have an entry for */
function kanjiChips(form) {
  const chars = [...new Set(plain(form).split("").filter(c => KANJI_BY[c]))];
  if (!chars.length) return null;
  return el("div", { style: { marginTop: "18px" } },
    el("div", { class: "eyebrow" }, "Kanji in this word"),
    el("div", { class: "row" }, chars.map(c => el("button", {
      class: "chip", onclick: () => kanjiSheet(KANJI_BY[c])
    }, el("span", { style: { fontFamily: "var(--hand)", fontSize: "17px" }, text: c }), KANJI_BY[c].mean))));
}

/* ==========================================================================
   REVIEW  —  spaced repetition over kana, kanji and vocabulary
   ========================================================================== */
function idsForScope(scope) {
  if (!scope || scope === "all") return ALL_IDS;
  if (scope === "vocab") return VOCAB_IDS;
  if (scope === "kana") return KANA_IDS;
  if (scope === "kanji") return KANJI_IDS;
  if (scope.startsWith("kana:")) {
    const s = scope.slice(5);
    return kanaList(s, ["base", "daku", "yoon"]).map(kanaId);
  }
  if (scope.startsWith("kanji:")) {
    const n = +scope.slice(6);
    return KANJI.filter(k => k.jlpt === n).map(kanjiId);
  }
  if (scope.startsWith("deck:")) return VOCAB_BY_DECK(scope.slice(5)).map(v => v.id);
  if (scope.startsWith("chapter:")) {
    const ch = CHAPTERS.find(c => c.n === +scope.slice(8));
    if (!ch) return ALL_IDS;
    const ids = [];
    for (const s of ch.sections) {
      if (s.t === "vocab") ids.push(...VOCAB_BY_DECK(s.deck).map(v => v.id));
      if (s.t === "kanji" && s.chars) ids.push(...s.chars.filter(c => KANJI_BY[c]).map(c => kanjiId(KANJI_BY[c])));
      if (s.t === "kanji" && s.jlpt) ids.push(...KANJI.filter(k => k.jlpt === s.jlpt).map(kanjiId));
      if (s.t === "kana" && s.script) {
        const parts = s.extra || ["base"];
        const list = kanaList(s.script, parts);
        ids.push(...(s.rows ? list.filter((_, i) => true) : list).map(kanaId));
      }
      if (s.t === "write" && s.chars) ids.push(...s.chars.map(c => idFor(c)).filter(Boolean));
    }
    return [...new Set(ids)];
  }
  return ALL_IDS;
}
const SCOPE_LABEL = s => {
  if (!s || s === "all") return "Everything";
  if (s === "vocab") return "All vocabulary";
  if (s === "kana") return "All kana";
  if (s === "kanji") return "All kanji";
  if (s.startsWith("kana:")) return KANA[s.slice(5)] ? KANA[s.slice(5)].label : "Kana";
  if (s.startsWith("kanji:")) return "Kanji N" + s.slice(6);
  if (s.startsWith("deck:")) return DECK_BY[s.slice(5)]?.en || "Deck";
  if (s.startsWith("chapter:")) return "Chapter " + s.slice(8);
  return "Review";
};

function viewReviewStart(scope = "all") {
  const v = $("#view");
  const ids = idsForScope(scope);
  const c = SRS.counts(ids);
  const s = SET();
  const q = SRS.queue(ids, { cap: +s.srsCap || 60, newCap: +s.newPerDay || 12 });

  v.append(page("ふくしゅう", "Review", "復",
    "Spaced repetition, SM-2, running entirely in your browser. Grade honestly — the algorithm is only as good as the input, and lying to it just means you see the card at the wrong time."));

  v.append(el("div", { class: "row", style: { marginBottom: "18px" } },
    ["all", "kana", "kanji", "vocab"].map(x =>
      el("a", { class: "chip" + (scope === x ? " on" : ""), href: "#/review/" + x, text: SCOPE_LABEL(x) }))));

  v.append(el("div", { class: "card" },
    el("div", { class: "eyebrow" }, SCOPE_LABEL(scope)),
    el("div", { class: "row", style: { gap: "26px", margin: "8px 0 16px" } },
      stat(c.due, "due now"), stat(c.fresh, "never seen"), stat(c.known, "solid"), stat(c.total, "in scope")),
    q.length
      ? el("div", { class: "row" },
          el("button", { class: "btn pri lg", onclick: () => runReview(q, scope) }, `Start · ${q.length} card${q.length === 1 ? "" : "s"}`),
          el("button", { class: "btn ghost", onclick: () => runReview(shuffle(ids).slice(0, 30), scope) }, "Free practice (no grading effect)"))
      : el("div", {},
          el("p", { html: "<b>Nothing is due.</b> That's the system working — come back later, or pull some new cards in." }),
          el("div", { class: "row", style: { marginTop: "12px" } },
            el("button", { class: "btn pri", onclick: () => runReview(shuffle(ids.filter(SRS.isNew)).slice(0, 20), scope) }, "Learn 20 new"),
            el("button", { class: "btn ghost", onclick: () => runReview(shuffle(ids).slice(0, 30), scope) }, "Free practice")))));

  const weak = ids.map(id => ({ id, c: Store.d.srs[id] })).filter(x => x.c && x.c.lapses >= 2)
    .sort((a, b) => b.c.lapses - a.c.lapses).slice(0, 12);
  if (weak.length) {
    v.append(sec("Leeches — the ones that keep escaping", weak.length,
      el("p", { class: "small muted", style: { marginTop: "-6px", marginBottom: "12px" } },
        "Forgotten two or more times. When a card lapses this often the card is usually the problem, not you: it's ambiguous, or it's a word you have no picture for. Write it by hand a few times, or find a sentence you'd actually say."),
      el("div", { class: "row" }, weak.map(({ id, c }) => {
        const it = itemById(id); if (!it) return null;
        const face = it.type === "vocab" ? plain(it.o.form) : it.o.ch;
        return el("button", { class: "chip", onclick: () => openItem(it) },
          el("span", { style: { fontFamily: "var(--hand)", fontSize: "16px" }, text: face }),
          el("span", { class: "mono tiny", text: "×" + c.lapses }));
      }).filter(Boolean))));
  }
}
function openItem(it) {
  if (it.type === "vocab") vocabSheet(it.o);
  else if (it.type === "kanji") kanjiSheet(it.o);
  else kanaSheet(it.o);
}

/* -------------------------------------------------------------------------- */
function runReview(queue, scope) {
  const v = $("#view");
  v.innerHTML = "";
  queue = queue.filter(id => itemById(id));
  if (!queue.length) { v.append(empty("空", "Nothing to review here.", el("a", { class: "btn", href: "#/decks" }, "Pick a deck"))); return; }

  let i = 0, right = 0, wrong = 0, revealed = false;
  const again = [];
  const hud = el("div", { class: "hud" });
  const cardHost = el("div", { class: "card" });
  const graded = el("div", {});
  v.append(hud, cardHost, graded);

  function done() {
    v.innerHTML = "";
    const total = right + wrong;
    v.append(page("おつかれさま", "Session finished", "済", null));
    v.append(el("div", { class: "card center" },
      el("div", { class: "gauge", style: { justifyContent: "center" } }, el("b", { text: pct(right, total) + "%" }), el("small", { text: `${right} / ${total}` })),
      el("p", { class: "small muted", style: { marginTop: "8px" }, text: total ? "Everything you missed is scheduled to come back soon." : "" }),
      el("div", { class: "row", style: { justifyContent: "center", marginTop: "18px" } },
        el("a", { class: "btn pri", href: "#/review/" + (scope || "all") }, "Another round"),
        el("a", { class: "btn ghost", href: "#/" }, "Home"))));
    if (total) { touchDay("rev", total); Store.d.stats.reviews = (Store.d.stats.reviews || 0) + total; Store.save(); }
  }

  function step() {
    if (i >= queue.length) {
      if (again.length) { queue = queue.concat(again.splice(0)); }
      if (i >= queue.length) return done();
    }
    revealed = false;
    const id = queue[i], it = itemById(id);
    if (!it) { i++; return step(); }

    hud.innerHTML = "";
    hud.append(
      stat(queue.length - i, "left"),
      stat(right, "right"),
      stat(wrong, "missed"),
      el("div", { style: { flex: "1", minWidth: "120px" } }, bar(pct(i, queue.length))),
      el("a", { class: "btn ghost sm", href: "#/review", onclick: () => { } }, "End"));

    cardHost.innerHTML = ""; graded.innerHTML = "";
    const front = faceFront(it), back = faceBack(it);
    const face = el("div", { class: "face" }, front);
    cardHost.append(face);

    const revealBtn = el("button", { class: "btn pri lg", style: { width: "100%", marginTop: "6px" }, onclick: reveal }, "Show answer");
    graded.append(revealBtn);

    function reveal() {
      if (revealed) return;
      revealed = true;
      face.innerHTML = ""; face.append(back);
      if (SET().speech === "on") Speech.say(it.type === "vocab" ? it.o.kana : it.o.ch);
      graded.innerHTML = "";
      graded.append(el("div", { class: "gradebar" },
        gradeBtn("Again", "< 5 min", 0, "shu"),
        gradeBtn("Hard", nextIv(id, 1), 1, "ghost"),
        gradeBtn("Good", nextIv(id, 2), 2, "pri"),
        gradeBtn("Easy", nextIv(id, 3), 3, "ghost")));
    }
    function gradeBtn(label, sub, q, cls) {
      return el("button", { class: "btn " + cls, onclick: () => grade(q) },
        el("span", { text: label }), el("small", { text: sub }));
    }
    function grade(q) {
      SRS.grade(id, q);
      if (q === 0) { wrong++; again.push(id); Sfx.no(); } else { right++; Sfx.ok(); }
      i++; step();
    }

    const key = e => {
      if (e.target.matches && e.target.matches("input,textarea")) return;
      if (!revealed && (e.key === " " || e.key === "Enter")) { e.preventDefault(); reveal(); }
      else if (revealed && "1234".includes(e.key)) grade(+e.key - 1);
      else if (e.key === "s") Speech.say(it.type === "vocab" ? it.o.kana : it.o.ch, { force: true });
    };
    document.addEventListener("keydown", key);
    onLeave(() => document.removeEventListener("keydown", key));
    cardHost._key && document.removeEventListener("keydown", cardHost._key);
    cardHost._key = key;
  }
  step();
}

/* what an interval would become — shown on the grade buttons */
function nextIv(id, q) {
  const c = Store.d.srs[id];
  if (!c || !c.rep) return q === 1 ? "1 d" : q === 3 ? "3 d" : "1 d";
  if (c.rep === 1) return (q === 1 ? 3 : q === 3 ? 8 : 6) + " d";
  const iv = Math.min(365, Math.round(c.iv * c.ef * (q === 1 ? 0.6 : q === 3 ? 1.35 : 1)));
  return iv >= 30 ? (iv / 30).toFixed(1).replace(/\.0$/, "") + " mo" : iv + " d";
}

/* ---- card faces ---------------------------------------------------------- */
function faceFront(it) {
  if (it.type === "kana") return el("div", {}, el("div", { class: "big", text: it.o.ch }));
  if (it.type === "kanji") return el("div", {},
    el("div", { class: "big", text: it.o.ch }),
    el("div", { class: "tiny muted mono", style: { marginTop: "10px" }, text: it.o.strokes + " strokes" }));
  const w = it.o;
  /* vocab: half the time show Japanese, half show English — both directions matter */
  const jpFirst = (w.idx + Math.floor(Date.now() / 864e5)) % 2 === 0;
  if (jpFirst) return el("div", {},
    w.ic && el("div", { style: { fontSize: "44px" }, text: w.ic }),
    el("div", { class: "mid", html: furi(w.form, "off") }));
  return el("div", {}, el("div", { class: "en", style: { fontSize: "26px" }, text: w.en }),
    el("div", { class: "tiny muted", style: { marginTop: "8px" }, text: "say it in Japanese" }));
}
function faceBack(it) {
  if (it.type === "kana") return el("div", {},
    el("div", { class: "big", text: it.o.ch }),
    el("div", { class: "rd", style: { fontSize: "22px" }, text: it.o.rom }),
    it.o.mn && el("div", { class: "small muted", style: { maxWidth: "38ch", marginTop: "6px" }, text: it.o.mn }));
  if (it.type === "kanji") return el("div", {},
    el("div", { class: "big", text: it.o.ch }),
    el("div", { class: "en", text: it.o.mean }),
    el("div", { class: "rd" }, `音 ${it.o.on || "—"}　訓 ${it.o.kun || "—"}`),
    it.o.words[0] && el("div", { class: "small muted", style: { marginTop: "8px" }, html: `${it.o.words[0].w}（${it.o.words[0].r}）— ${esc(it.o.words[0].g)}` }));
  const w = it.o;
  return el("div", {},
    w.ic && el("div", { style: { fontSize: "40px" }, text: w.ic }),
    el("div", { class: "mid", html: furi(w.form, "on") }),
    el("div", { class: "rd", text: kanaToRomaji(w.kana) }),
    el("div", { class: "en", text: w.en }),
    w.ex && el("div", { class: "small muted", style: { marginTop: "10px", maxWidth: "40ch" }, html: furi(w.ex.jp, "on") + "<br><span style='opacity:.75'>" + esc(w.ex.en) + "</span>" }));
}

/* ==========================================================================
   MINI-GAMES
   ========================================================================== */
const GAMES = [
  { id:"match",     ji:"合", name:"Matching pairs",    blurb:"Eight words, eight meanings, one grid. The fastest way to warm up a deck." },
  { id:"rain",      ji:"雨", name:"Kana rain",         blurb:"Characters fall. Type the romaji before they land. Ruthless, and it works." },
  { id:"speed",     ji:"速", name:"Speed reading",     blurb:"Sixty seconds, multiple choice, as many as you can. Recognition, not recall." },
  { id:"type",      ji:"打", name:"Type it in kana",   blurb:"English in, kana out — with a real romaji IME so you learn to type Japanese too." },
  { id:"lookalike", ji:"双", name:"Look-alike trainer", blurb:"シ or ツ? ソ or ン? The fourteen pairs that cost everyone points." },
  { id:"build",     ji:"組", name:"Sentence builder",  blurb:"Chunks in the wrong order. Put them back. Word order by feel, not by rule." },
  { id:"particle",  ji:"助", name:"Particle gauntlet", blurb:"One blank, four particles. The single most common source of small mistakes." },
  { id:"conj",      ji:"活", name:"Conjugation gym",   blurb:"Every form from ます to causative, on sixty verbs and thirty adjectives." },
  { id:"listen",    ji:"耳", name:"Listening drill",   blurb:"Hear it, pick it. Your ears are always the last part to catch up." }
];

function viewGames() {
  const v = $("#view");
  v.append(page("ゲーム", "Mini-games", "遊",
    "Drills disguised as games. Each one attacks a different failure mode — recognition, recall, production, speed, and hearing. Nothing here affects your review schedule unless you tell it to, so play freely."));
  const g = el("div", { class: "grid g3" });
  for (const x of GAMES) {
    g.append(el("a", { class: "card", href: "#/game/" + x.id, style: { textDecoration: "none", color: "inherit", display: "flex", gap: "13px" } },
      el("span", { style: { fontFamily: "var(--hand)", fontSize: "30px", lineHeight: "1", color: "var(--ai)" }, text: x.ji }),
      el("span", {}, el("b", { style: { display: "block", fontWeight: "500", marginBottom: "3px" }, text: x.name }),
        el("span", { class: "small muted", text: x.blurb }))));
  }
  v.append(g);
}

function viewGame(id) {
  const v = $("#view"), g = GAMES.find(x => x.id === id);
  if (!g) return v.append(empty("？", "No game called " + id + ".", el("a", { class: "btn", href: "#/games" }, "All games")));
  v.append(el("div", { class: "row", style: { marginBottom: "12px" } }, backLink("#/games", "All games")));
  v.append(page(g.ji, g.name, null, g.blurb));
  const host = el("div", {});
  v.append(host);
  const GFN = { match: gMatch, rain: gRain, speed: gSpeed, type: gType, lookalike: gLook,
     build: gBuild, particle: gParticle, conj: gConj, listen: gListen,
     counter: gCounter, memory: gMemory, shiritori: gShiritori, oddone: gOddOne,
     dialogue: gDialogue, numbers: gNumbers, group: gGroup };
  GFN[id](host);
}

/* ---- shared bits --------------------------------------------------------- */
function hud(...kids) { return el("div", { class: "hud" }, ...kids); }
function endCard(title, lines, retry) {
  return el("div", { class: "card center" },
    el("div", { style: { fontFamily: "var(--hand)", fontSize: "34px", color: "var(--shu)" }, text: "了" }),
    el("h3", { style: { fontSize: "22px", margin: "6px 0 10px" }, text: title }),
    ...lines.map(l => el("p", { class: "small muted", text: l })),
    el("div", { class: "row", style: { justifyContent: "center", marginTop: "16px" } },
      el("button", { class: "btn pri", onclick: retry }, "Again"),
      el("a", { class: "btn ghost", href: "#/games" }, "Other games")));
}
function deckPicker(onPick, current) {
  const row = el("div", { class: "row", style: { marginBottom: "16px" } });
  row.append(el("span", { class: "tiny muted", text: "Source:" }));
  const opts = [["kana", "Kana"], ["all", "All topic words"], ...CARDS.jlcLevels().map(l => ["jlc" + l.n, "JLC Anki · Level " + l.n]),
    ["jlpt5", "JLPT N5 words"], ["jlpt4", "JLPT N4 words"], ["jlpt3", "JLPT N3 words"], ...(myWords().length >= 8 ? [["mine", "My words"]] : []), ...DECKS.map(d => [d.id, d.en])];
  const sel = el("select", { class: "chip", style: { padding: "6px 10px" }, onchange: e => onPick(e.target.value) });
  for (const [val, lab] of opts) sel.append(el("option", { value: val, selected: val === current || null, text: lab }));
  row.append(sel);
  return row;
}
function poolFor(src) {
  if (src === "kana") return kanaList("hira", ["base"]).concat(kanaList("kata", ["base"]))
    .map(k => ({ jp: k.ch, en: k.rom, say: k.ch, id: kanaId(k) }));
  const fromCards = items => items.filter(x => x.type === "card" && !x.o.kanji).map(x => ({ jp: plain(x.o.jp), en: x.o.en, say: x.o.kana || plain(x.o.jp), id: x.id, kana: x.o.kana || plain(x.o.jp) }));
  if (/^jlc\d$/.test(src)) return fromCards(CARDS.jlcItems([+src.slice(3)]));
  if (/^jlpt\d$/.test(src)) return fromCards(CARDS.jlptItems(+src.slice(4), 0, 400));
  if (src === "mine") return fromCards(CARDS.mineItems());
  const words = src === "all" ? VOCAB : VOCAB_BY_DECK(src);
  return words.map(w => ({ jp: plain(w.form), en: w.en, say: w.kana, ic: w.ic, id: w.id, kana: w.kana }));
}


/* ==========================================================================
   1 · MATCHING PAIRS
   ========================================================================== */
function gMatch(host) {
  let src = QUERY.deck || "greet", n = 8, sel = null, matched = 0, tries = 0, t0 = 0;
  const board = el("div", { class: "board" });
  const info = el("div", { class: "hud" });
  host.append(deckPicker(v => { src = v; start(); }, src), info, board);

  function start() {
    const pool = poolFor(src);
    if (pool.length < 4) { board.innerHTML = ""; board.append(empty("空", "Not enough words in that deck.")); return; }
    const picks = sample(pool, Math.min(n, pool.length));
    matched = 0; tries = 0; sel = null; t0 = Date.now();
    const tiles = shuffle([
      ...picks.map(p => ({ k: p.id, side: "jp", text: p.jp, ic: p.ic })),
      ...picks.map(p => ({ k: p.id, side: "en", text: p.en }))
    ]);
    info.innerHTML = ""; info.append(stat(0, "pairs"), stat(0, "tries"),
      el("span", { class: "small muted", text: "Tap a Japanese tile, then its meaning." }));
    board.innerHTML = "";
    for (const t of tiles) {
      const tile = el("button", { class: "tile" + (t.side === "en" ? " en" : ""), "data-k": t.k },
        t.ic ? el("span", {}, el("span", { style: { fontSize: "24px", display: "block" }, text: t.ic }), el("span", { text: t.text })) : t.text);
      tile.onclick = () => hit(tile, t);
      board.append(tile);
    }
  }
  function hit(tile, t) {
    if (tile.classList.contains("ok")) return;
    if (!sel) { sel = { tile, t }; tile.classList.add("sel"); Sfx.tick(); return; }
    if (sel.tile === tile) { tile.classList.remove("sel"); sel = null; return; }
    tries++;
    if (sel.t.k === t.k && sel.t.side !== t.side) {
      sel.tile.classList.remove("sel"); sel.tile.classList.add("ok"); tile.classList.add("ok");
      matched++; Sfx.ok();
      info.innerHTML = ""; info.append(stat(matched, "pairs"), stat(tries, "tries"));
      if (matched * 2 === board.children.length) {
        const secs = Math.round((Date.now() - t0) / 1000);
        setTimeout(() => { board.innerHTML = ""; info.innerHTML = "";
          board.append(endCard("All matched.", [`${secs} seconds · ${tries} attempts for ${matched} pairs.`,
            tries === matched ? "Perfect run — no wrong guesses at all." : ""], start)); }, 420);
      }
    } else {
      tile.classList.add("bad"); sel.tile.classList.add("bad"); Sfx.no();
      const a = sel.tile;
      setTimeout(() => { a.classList.remove("bad", "sel"); tile.classList.remove("bad"); }, 400);
      info.innerHTML = ""; info.append(stat(matched, "pairs"), stat(tries, "tries"));
    }
    sel = null;
  }
  start();
}


/* ==========================================================================
   2 · KANA RAIN
   ========================================================================== */
function gRain(host) {
  let lives = 3, score = 0, combo = 0, best = 0, live = [], timer = null, speed = 7000, spawnMs = 1900, running = false;
  const field = el("div", { style: { position: "relative", height: "340px", overflow: "hidden", background: "var(--paper-2)", border: "1px solid var(--grid)", borderRadius: "var(--radius-lg)" } });
  const info = hud();
  const input = el("input", { class: "type-in", placeholder: "type the romaji…", autocomplete: "off", autocapitalize: "off", spellcheck: "false", style: { marginTop: "14px" } });
  const hint = el("div", { class: "imehint" });
  host.append(info, field, input, hint);

  const pool = kanaList("hira", ["base", "daku"]).concat(kanaList("kata", ["base", "daku"]));

  function sync() {
    info.innerHTML = "";
    info.append(stat(score, "cleared"), stat("♥".repeat(Math.max(0, lives)) || "—", "lives"),
      combo > 1 ? el("div", { class: "stat" }, el("b", { class: "combo", text: "×" + combo }), el("span", { text: "combo" })) : null);
  }
  function spawn() {
    if (!running) return;
    const k = pick(pool);
    const node = el("div", {
      style: { position: "absolute", top: "-56px", left: (6 + Math.random() * 78) + "%",
               fontFamily: "var(--hand)", fontSize: "38px", color: "var(--sumi)",
               transition: `transform ${speed}ms linear`, willChange: "transform" },
      text: k.ch
    });
    field.append(node);
    const item = { k, node, dead: false };
    live.push(item);
    requestAnimationFrame(() => { node.style.transform = "translateY(400px)"; });
    item.to = setTimeout(() => {
      if (item.dead) return;
      item.dead = true; node.remove(); live = live.filter(x => x !== item);
      lives--; combo = 0; Sfx.no(); sync();
      if (lives <= 0) stop();
    }, speed);
    speed = Math.max(3200, speed - 65);
    spawnMs = Math.max(750, spawnMs - 32);
    timer = setTimeout(spawn, spawnMs);
  }
  function tryClear() {
    const typed = input.value.trim().toLowerCase();
    if (!typed) return;
    const hitIdx = live.findIndex(x => x.k.rom === typed);
    if (hitIdx >= 0) {
      const it = live[hitIdx];
      it.dead = true; clearTimeout(it.to);
      it.node.style.transition = "opacity 220ms, transform 220ms";
      it.node.style.opacity = "0";
      it.node.style.color = "var(--matcha)";
      setTimeout(() => it.node.remove(), 240);
      live.splice(hitIdx, 1);
      score++; combo++; best = Math.max(best, combo); Sfx.ok(); input.value = ""; hint.textContent = "";
      sync();
    } else if (typed.length >= 3) {
      input.classList.add("bad"); setTimeout(() => input.classList.remove("bad"), 300);
      input.value = ""; combo = 0; sync();
    }
  }
  input.addEventListener("input", () => { hint.textContent = romajiToKana(input.value) || ""; tryClear(); });
  function stop() {
    running = false; clearTimeout(timer);
    live.forEach(x => { clearTimeout(x.to); x.node.remove(); }); live = [];
    field.innerHTML = "";
    field.append(el("div", { style: { position: "absolute", inset: "0", display: "grid", placeItems: "center", padding: "16px" } },
      endCard("Rain stopped.", [`${score} characters cleared. Best combo ×${best}.`,
        score >= 40 ? "That's genuinely fast." : score >= 20 ? "Solid. Push for forty." : "Warm up on the chart first, then come back."], start)));
    input.disabled = true;
  }
  function start() {
    clearTimeout(timer); live.forEach(x => clearTimeout(x.to));
    field.innerHTML = ""; live = []; lives = 3; score = 0; combo = 0; best = 0;
    speed = 7000; spawnMs = 1900; running = true;
    input.disabled = false; input.value = ""; hint.textContent = ""; sync();
    input.focus();
    timer = setTimeout(spawn, 500);
  }
  onLeave(() => { running = false; clearTimeout(timer); live.forEach(x => clearTimeout(x.to)); });
  start();
}


/* ==========================================================================
   3 · SPEED READING  (60s multiple choice)
   ========================================================================== */
function gSpeed(host) {
  let src = "kana", score = 0, missed = 0, left = 60, tick = null, pool = [];
  const info = hud();
  const q = el("div", { class: "face card" });
  const answers = el("div", { class: "answers" });
  host.append(deckPicker(v => { src = v; start(); }, src), info, q, answers);

  function sync() {
    info.innerHTML = "";
    info.append(stat(score, "right"), stat(missed, "wrong"), stat(left + "s", "left"),
      el("div", { style: { flex: 1, minWidth: "100px" } }, bar(left / 60 * 100, left < 12 ? "s" : "")));
  }
  function ask() {
    const it = pick(pool);
    const wrongs = sample(pool.filter(x => x.en !== it.en), 3);
    const opts = shuffle([it, ...wrongs]);
    q.innerHTML = ""; answers.innerHTML = "";
    q.append(el("div", { class: it.jp.length > 4 ? "mid" : "big", text: it.jp }));
    opts.forEach((o, n) => {
      const b = el("button", { class: "ans" }, el("span", { class: "idx", text: String(n + 1) }), el("span", { text: o.en }));
      b.onclick = () => {
        if (o === it) { b.classList.add("ok"); score++; Sfx.ok(); setTimeout(ask, 130); }
        else { b.classList.add("bad"); missed++; Sfx.no(); [...answers.children][opts.indexOf(it)].classList.add("ok"); setTimeout(ask, 620); }
        sync();
      };
      answers.append(b);
    });
  }
  function start() {
    pool = poolFor(src);
    if (pool.length < 5) { q.innerHTML = ""; q.append(el("p", { text: "Not enough items in that set." })); return; }
    score = 0; missed = 0; left = 60; sync(); ask();
    clearInterval(tick);
    tick = setInterval(() => {
      left--; sync();
      if (left <= 0) {
        clearInterval(tick); q.innerHTML = ""; answers.innerHTML = "";
        q.className = "";
        q.append(endCard("Time.", [`${score} right, ${missed} wrong — ${pct(score, score + missed)}% accuracy.`,
          score >= 45 ? "That's reading, not decoding." : score >= 25 ? "Good pace." : "Slow is fine. Accuracy first, speed second."], () => { q.className = "face card"; start(); }));
      }
    }, 1000);
    onLeave(() => clearInterval(tick));
  }
  start();
}


/* ==========================================================================
   4 · TYPE IT IN KANA
   ========================================================================== */
function gType(host) {
  let src = QUERY.deck || "food", pool = [], cur = null, score = 0, miss = 0, streak = 0;
  const info = hud();
  const q = el("div", { class: "face card" });
  const input = el("input", { class: "type-in", placeholder: "romaji → kana", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
  const hint = el("div", { class: "imehint" });
  const row = el("div", { class: "row", style: { marginTop: "12px", justifyContent: "center" } },
    el("button", { class: "btn sm ghost", onclick: () => reveal() }, "Show me"),
    el("button", { class: "btn sm pri", onclick: () => check() }, "Check"));
  host.append(deckPicker(v => { src = v; start(); }, src), info, q, input, hint, row);

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "missed"), streak > 1 ? el("div", { class: "stat" }, el("b", { class: "combo", text: "×" + streak }), el("span", { text: "streak" })) : null); }
  function ask() {
    cur = pick(pool);
    q.innerHTML = "";
    q.append(cur.ic ? el("div", { style: { fontSize: "56px" }, text: cur.ic }) : null,
      el("div", { class: "en", style: { fontSize: "24px" }, text: cur.en }),
      el("div", { class: "tiny muted", style: { marginTop: "6px" }, text: "type it in Japanese" }));
    input.value = ""; input.className = "type-in"; hint.textContent = ""; input.focus();
  }
  function check() {
    const got = hint.textContent || input.value;
    const want = cur.kana || cur.jp;
    if (got === want || toHira(got) === toHira(want)) {
      input.classList.add("ok"); score++; streak++; Sfx.ok(); sync();
      setTimeout(ask, 480);
    } else {
      input.classList.add("bad"); miss++; streak = 0; Sfx.no(); sync();
      setTimeout(() => input.classList.remove("bad"), 400);
    }
  }
  function reveal() {
    hint.textContent = cur.kana || cur.jp;
    input.value = kanaToRomaji(cur.kana || cur.jp);
    miss++; streak = 0; sync();
    setTimeout(ask, 1500);
  }
  input.addEventListener("input", () => { hint.textContent = romajiToKana(input.value, /[ァ-ヶ]/.test(cur?.kana || "")); });
  input.addEventListener("keydown", e => { if (e.key === "Enter") check(); });
  function start() {
    pool = poolFor(src).filter(x => x.kana);
    if (!pool.length) pool = poolFor("all").filter(x => x.kana);
    score = 0; miss = 0; streak = 0; sync(); ask();
  }
  start();
}


/* ==========================================================================
   5 · LOOK-ALIKE TRAINER
   ========================================================================== */
function gLook(host) {
  let score = 0, miss = 0, n = 0, cur = null;
  const info = hud();
  const q = el("div", { class: "face card" });
  const answers = el("div", { class: "answers" });
  const note = el("div", { class: "card", style: { marginTop: "14px", display: "none" } });
  host.append(info, q, answers, note);

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(n, "seen")); }
  function ask() {
    const [a, b, why] = pick(LOOKALIKES);
    const target = Math.random() < .5 ? a : b;
    cur = { target, a, b, why };
    q.innerHTML = ""; answers.innerHTML = ""; note.style.display = "none";
    q.append(el("div", { class: "big", text: target }),
      el("div", { class: "tiny muted", style: { marginTop: "8px" }, text: "which one is this?" }));
    for (const ch of shuffle([a, b])) {
      const rom = KANA_BY_CH[ch]?.rom || "?";
      const btn = el("button", { class: "ans jp" }, el("span", { class: "idx", text: rom }), el("span", { text: ch === target ? "" : "" }), rom);
      btn.onclick = () => {
        n++;
        if (ch === target) { btn.classList.add("ok"); score++; Sfx.ok(); }
        else { btn.classList.add("bad"); miss++; Sfx.no(); }
        note.style.display = "block"; note.innerHTML = "";
        note.append(el("div", { class: "eyebrow" }, `${a} vs ${b}`), el("p", { class: "small", text: why }),
          el("div", { class: "row", style: { marginTop: "10px" } }, el("button", { class: "btn sm pri", onclick: ask }, "Next →")));
        sync();
      };
      answers.append(btn);
    }
  }
  ask();
}


/* ==========================================================================
   6 · SENTENCE BUILDER
   ========================================================================== */
function sentencePool() {
  const out = [];
  for (const g of GRAMMAR) for (const [jp, en] of (g.ex || [])) out.push({ jp, en, tag: g.jp });
  for (const v of VOCAB) if (v.ex) out.push({ jp: v.ex.jp, en: v.ex.en, tag: DECK_BY[v.deck]?.en });
  for (const b of READERS) if (b.level >= 1) for (const p of b.pages) if (plain(p.s).length > 8) out.push({ jp: p.s, en: p.en, tag: b.title });
  /* keep only sentences that chunk cleanly — a lone kanji chunk means the
     segmenter split a compound it didn't know, and a puzzle that teaches a
     wrong word boundary is worse than no puzzle */
  return out.filter(s => {
    const c = chunks(s.jp);
    return c.length >= 3 && c.length <= 8 && !c.some(x => /^[\u4e00-\u9fff]{1,2}$/.test(x) && x.length === 1);
  });
}
function gBuild(host) {
  const pool = sentencePool();
  let score = 0, miss = 0, cur = null, placed = [];
  const info = hud();
  const q = el("div", { class: "card" });
  const slot = el("div", { class: "row", style: { minHeight: "58px", padding: "12px", background: "var(--paper-2)", border: "1px dashed var(--grid)", borderRadius: "var(--radius)", marginTop: "12px" } });
  const bank = el("div", { class: "row", style: { marginTop: "14px" } });
  const ctl = el("div", { class: "row", style: { marginTop: "14px" } });
  host.append(info, q, slot, bank, ctl);

  function sync() { info.innerHTML = ""; info.append(stat(score, "built"), stat(miss, "peeked")); }
  function ask() {
    cur = pick(pool);
    placed = [];
    const cs = chunks(cur.jp);
    q.innerHTML = "";
    q.append(el("div", { class: "eyebrow" }, cur.tag || "Sentence"),
      el("p", { style: { fontSize: "18px" }, text: cur.en }),
      el("p", { class: "tiny muted", style: { marginTop: "6px" }, text: "tap the pieces in order" }));
    slot.innerHTML = ""; bank.innerHTML = ""; ctl.innerHTML = "";
    for (const c of shuffle(cs)) {
      const b = el("button", { class: "chip", style: { fontFamily: "var(--hand)", fontSize: "18px", padding: "9px 13px" }, text: c });
      b.onclick = () => { if (b.disabled) return; b.disabled = true; b.style.opacity = ".35"; placed.push({ text: c, src: b }); paint(); };
      bank.append(b);
    }
    ctl.append(
      el("button", { class: "btn sm ghost", onclick: undo }, "↩ Undo"),
      el("button", { class: "btn sm pri", onclick: check }, "Check"),
      el("button", { class: "btn sm ghost", onclick: () => { miss++; sync(); showAnswer(); } }, "Show answer"));
    paint();
  }
  function paint() {
    slot.innerHTML = "";
    if (!placed.length) slot.append(el("span", { class: "tiny muted", text: "your sentence appears here" }));
    for (const p of placed) slot.append(el("span", { style: { fontFamily: "var(--hand)", fontSize: "21px" }, text: p.text }));
  }
  function undo() { const p = placed.pop(); if (p) { p.src.disabled = false; p.src.style.opacity = ""; } paint(); }
  function check() {
    const got = placed.map(p => p.text).join("");
    const want = plain(cur.jp);
    if (got === want) { score++; Sfx.ok(); sync(); showAnswer(true); }
    else { Sfx.no(); slot.classList.add("wobble"); setTimeout(() => slot.classList.remove("wobble"), 500); }
  }
  function showAnswer(win) {
    slot.innerHTML = "";
    slot.append(el("div", {},
      el("div", { style: { fontFamily: "var(--hand)", fontSize: "22px", lineHeight: "1.9" }, html: furi(cur.jp, "on") }),
      el("div", { class: "small muted", style: { marginTop: "4px" }, text: cur.en })));
    ctl.innerHTML = "";
    ctl.append(speakBtn(cur.jp), el("button", { class: "btn sm pri", onclick: ask }, win ? "Next →" : "Try another →"));
  }
  sync(); ask();
}


/* ==========================================================================
   7 · PARTICLE GAUNTLET
   ========================================================================== */
const PARTICLE_SET = ["は", "が", "を", "に", "で", "へ", "と", "も", "の", "から", "まで"];
function particlePool() {
  const src = [];
  for (const g of GRAMMAR) for (const [jp, en] of (g.ex || [])) src.push({ jp, en });
  for (const v of VOCAB) if (v.ex) src.push({ jp: v.ex.jp, en: v.ex.en });
  for (const b of READERS) if (b.level >= 2) for (const p of b.pages) src.push({ jp: p.s, en: p.en });

  const out = [];
  for (const s of src) {
    const us = units(s.jp);
    for (let i = 1; i < us.length; i++) {
      const u = us[i], prev = us[i - 1];
      if (u.rd) continue;                                   /* inside a kanji run */
      if (!PARTICLE_SET.includes(u.ch)) continue;
      /* only blank a particle that clearly follows a noun: kanji or katakana before it */
      if (!/[\u4e00-\u9fff\u30a0-\u30ff]/.test(prev.ch)) continue;
      if (i + 1 < us.length && /[ゃゅょぁぃぅぇぉっ]/.test(us[i + 1].ch)) continue;
      out.push({ jp: s.jp, en: s.en, at: i, ans: u.ch });
      break;                                                 /* one blank per sentence */
    }
  }
  return out;
}
function gParticle(host) {
  const pool = particlePool();
  let score = 0, miss = 0, cur = null;
  const info = hud();
  const q = el("div", { class: "card" });
  const answers = el("div", { class: "answers" });
  const why = el("div", { class: "card", style: { marginTop: "14px", display: "none" } });
  host.append(info, q, answers, why);

  if (!pool.length) { host.append(empty("空", "No particle questions could be built.")); return; }

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(pct(score, score + miss) + "%", "accuracy")); }
  function ask() {
    cur = pick(pool);
    const us = units(cur.jp);
    q.innerHTML = ""; why.style.display = "none";
    const line = el("p", { class: "jptext", style: { textAlign: "left", fontSize: "22px" } });
    us.forEach((u, i) => {
      if (i === cur.at) line.append(el("span", { style: { display: "inline-block", minWidth: "1.6em", borderBottom: "2px solid var(--shu)", textAlign: "center", color: "var(--shu)" }, text: "？" }));
      else line.append(el("span", { html: u.html }));
    });
    q.append(line, el("p", { class: "small muted", style: { marginTop: "8px" }, text: cur.en }));
    answers.innerHTML = "";
    const wrongs = sample(PARTICLE_SET.filter(p => p !== cur.ans), 3);
    shuffle([cur.ans, ...wrongs]).forEach(p => {
      const b = el("button", { class: "ans jp", style: { justifyContent: "center" }, text: p });
      b.onclick = () => {
        if (p === cur.ans) { b.classList.add("ok"); score++; Sfx.ok(); }
        else { b.classList.add("bad"); miss++; Sfx.no(); [...answers.children].find(x => x.textContent.trim() === cur.ans)?.classList.add("ok"); }
        sync();
        why.style.display = "block"; why.innerHTML = "";
        why.append(el("div", { class: "eyebrow" }, "The full sentence"),
          el("p", { style: { fontFamily: "var(--hand)", fontSize: "20px", lineHeight: "1.9" }, html: furi(cur.jp, "on") }),
          el("p", { class: "small muted", text: cur.en }),
          PARTICLE_NOTE[cur.ans] && el("p", { class: "small", style: { marginTop: "10px" }, html: `<b>${cur.ans}</b> — ${PARTICLE_NOTE[cur.ans]}` }),
          el("div", { class: "row", style: { marginTop: "12px" } }, speakBtn(cur.jp), el("button", { class: "btn sm pri", onclick: ask }, "Next →")));
      };
      answers.append(b);
    });
  }
  sync(); ask();
}
const PARTICLE_NOTE = {
  は: "topic marker. Sets the stage: 'as for ~'. Written は, pronounced 'wa'.",
  が: "subject marker. Points at the specific thing, and carries new information.",
  を: "direct object. Also marks the space a motion passes through.",
  に: "a point — destination, time, or where something exists.",
  で: "the setting of an action, or the means it's done by.",
  へ: "direction. Pronounced 'e'. Softer than に.",
  と: "with, or an exhaustive 'and'. Also quotes what was said or thought.",
  も: "also / too. It replaces は and が rather than stacking with them.",
  の: "links two nouns; the second is the head. Also 'the one'.",
  から: "from — in time, place, or reason.",
  まで: "until, as far as."
};


/* ==========================================================================
   8 · CONJUGATION GYM
   ========================================================================== */
function gConj(host) {
  let mode = "verbs", score = 0, miss = 0, cur = null;
  const info = hud();
  const modeRow = el("div", { class: "row", style: { marginBottom: "14px" } });
  const q = el("div", { class: "card" });
  const answers = el("div", { class: "answers" });
  const why = el("div", { class: "card", style: { marginTop: "14px", display: "none" } });
  host.append(modeRow, info, q, answers, why);
  for (const [m, lab] of [["verbs", "動詞 Verbs"], ["adjs", "形容詞 Adjectives"]]) {
    modeRow.append(el("button", { class: "chip" + (mode === m ? " on" : ""), text: lab, onclick: e => { mode = m; [...modeRow.children].forEach(c => c.classList.remove("on")); e.target.classList.add("on"); ask(); } }));
  }
  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(pct(score, score + miss) + "%", "accuracy")); }

  function ask() {
    why.style.display = "none";
    if (mode === "verbs") {
      const [kana, disp, en, grp] = pick(VERBS);
      const f = pick(FORMS);
      const answer = conj(kana, grp, f.id);
      /* distractors: apply the same form under the wrong group — exactly the mistake you'd make */
      const wrongGroups = [1, 2, 3].filter(g => g !== grp);
      const cands = new Set();
      for (const g of wrongGroups) { const c = conj(kana, g, f.id); if (c && c !== answer) cands.add(c); }
      for (const other of sample(FORMS.filter(x => x.id !== f.id), 3)) {
        const c = conj(kana, grp, other.id); if (c && c !== answer) cands.add(c);
      }
      cur = { answer, opts: shuffle([answer, ...sample([...cands], 3)]), disp, en, f,
              note: `${en} · ${grp === 1 ? "godan (u-verb)" : grp === 2 ? "ichidan (ru-verb)" : "irregular"}`,
              rule: GROUP_RULE(grp, f.id) };
    } else {
      const [kana, disp, en, type] = pick(ADJS);
      const f = pick(ADJ_FORMS);
      const answer = conjAdj(kana, type, f.id);
      const other = type === "i" ? "na" : "i";
      const cands = new Set([conjAdj(kana, other, f.id)]);
      for (const o of sample(ADJ_FORMS.filter(x => x.id !== f.id), 3)) cands.add(conjAdj(kana, type, o.id));
      cands.delete(answer);
      cur = { answer, opts: shuffle([answer, ...sample([...cands], 3)]), disp, en, f,
              note: `${en} · ${type === "i" ? "い-adjective" : "な-adjective"}`,
              rule: type === "i" ? "い-adjectives conjugate like little verbs: drop the い and add the ending. いい is the one irregular — it becomes よ-." : "な-adjectives don't conjugate at all; the copula does the work (じゃない, だった, で, に)." };
    }
    q.innerHTML = "";
    q.append(el("div", { class: "eyebrow" }, "Make the " + cur.f.name),
      el("div", { class: "row", style: { gap: "14px", alignItems: "baseline" } },
        el("span", { style: { fontFamily: "var(--hand)", fontSize: "34px" }, html: furi(cur.disp, "on") }),
        el("span", { class: "small muted", text: cur.note })),
      el("div", { class: "mono tiny muted", style: { marginTop: "6px" }, text: cur.f.ex }));
    answers.innerHTML = "";
    cur.opts.forEach(o => {
      const b = el("button", { class: "ans jp", text: o });
      b.onclick = () => {
        if (o === cur.answer) { b.classList.add("ok"); score++; Sfx.ok(); }
        else { b.classList.add("bad"); miss++; Sfx.no(); [...answers.children].find(x => x.textContent.trim() === cur.answer)?.classList.add("ok"); }
        sync();
        why.style.display = "block"; why.innerHTML = "";
        why.append(el("div", { class: "eyebrow" }, "Why"),
          el("p", { style: { fontFamily: "var(--hand)", fontSize: "22px" }, text: cur.answer }),
          el("p", { class: "small", style: { marginTop: "8px" }, text: cur.rule }),
          el("div", { class: "row", style: { marginTop: "12px" } }, speakBtn(cur.answer), el("button", { class: "btn sm pri", onclick: ask }, "Next →")));
      };
      answers.append(b);
    });
  }
  function GROUP_RULE(g, f) {
    if (g === 3) return "する and 来る are the only two irregular verbs in the language. Memorise their table once and you're done forever.";
    if (g === 2) return "Ichidan verbs are the easy ones: chop off る and bolt the ending on. Watch out — 帰る, 入る and 走る look ichidan but are godan.";
    const map = { te: "For godan て-form: う・つ・る→って, ぬ・ぶ・む→んで, く→いて, ぐ→いで, す→して. 行く is the exception: 行って.",
                  ta: "Same shape as the て-form, with た/だ instead of て/で.",
                  nai: "Shift the final kana to the あ row and add ない. Verbs ending in う go to わ, not あ.",
                  pot: "Shift to the え row and add る. Once it's potential, the object often takes が instead of を." };
    return map[f] || "Godan verbs shift their final kana around the あいうえお row of the same consonant. Which row you land on is the whole rule.";
  }
  sync(); ask();
}


/* ==========================================================================
   9 · LISTENING DRILL
   ========================================================================== */
function gListen(host) {
  let src = "all", pool = [], cur = null, score = 0, miss = 0;
  const info = hud();
  const q = el("div", { class: "face card" });
  const answers = el("div", { class: "answers" });
  host.append(deckPicker(v => { src = v; start(); }, src), info, q, answers);

  if (!("speechSynthesis" in window)) {
    host.innerHTML = "";
    host.append(el("div", { class: "card" },
      el("p", { html: "<b>This browser has no speech synthesis</b>, so there's nothing to listen to." }),
      el("p", { class: "small muted", text: "Safari and Chrome on desktop and mobile all support it. If you're in a locked-down browser, try the speed reading drill instead." }),
      el("a", { class: "btn sm", href: "#/game/speed" }, "Speed reading")));
    return;
  }
  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(pct(score, score + miss) + "%", "accuracy")); }
  function ask() {
    cur = pick(pool);
    q.innerHTML = "";
    q.append(el("button", { class: "btn lg pri", onclick: () => Speech.say(cur.say, { force: true }) }, "🔊  Play again"),
      el("div", { class: "tiny muted", style: { marginTop: "10px" }, text: "which word did you hear?" }));
    Speech.say(cur.say, { force: true });
    answers.innerHTML = "";
    const opts = shuffle([cur, ...sample(pool.filter(x => x.jp !== cur.jp), 3)]);
    opts.forEach(o => {
      const b = el("button", { class: "ans jp" }, el("span", {}, el("span", { style: { display: "block" }, text: o.jp }),
        el("span", { class: "small muted", style: { fontFamily: "var(--jp)" }, text: o.en })));
      b.onclick = () => {
        if (o === cur) { b.classList.add("ok"); score++; Sfx.ok(); setTimeout(ask, 500); }
        else { b.classList.add("bad"); miss++; Sfx.no(); [...answers.children][opts.indexOf(cur)].classList.add("ok"); setTimeout(ask, 1400); }
        sync();
      };
      answers.append(b);
    });
  }
  function start() {
    pool = poolFor(src).filter(x => x.say);
    if (pool.length < 5) pool = poolFor("all");
    score = 0; miss = 0; sync(); ask();
  }
  Speech.init();
  start();
}

/* ==========================================================================
   READER  —  tiny books, in the tadoku spirit
   ========================================================================== */
const bookState = id => (Store.d.books[id] ||= { page: 0, reads: 0, done: false });

/* viewLibrary() and the reader live in 64-library.js now. */
function wordSheet(w) {
  const vocabHit = VOCAB.find(v => plain(v.form) === w.s || v.kana === w.s);
  const body = el("div", {},
    el("div", { class: "center", style: { padding: "4px 0 14px" } },
      el("div", { style: { fontFamily: "var(--hand)", fontSize: "34px" }, text: w.s }),
      w.r !== w.s && el("div", { class: "mono small", style: { color: "var(--ai-2)" }, text: w.r }),
      el("div", { style: { fontSize: "17px", color: "var(--sumi-2)", marginTop: "6px" }, text: w.en || "—" })),
    el("div", { class: "row", style: { justifyContent: "center" } },
      speakBtn(w.r || w.s, "Hear it"),
      vocabHit && el("button", { class: "btn sm ghost", onclick: () => { close(); vocabSheet(vocabHit); } }, "Full entry"),
      vocabHit && el("button", { class: "btn sm pri", onclick: () => { SRS.grade(vocabHit.id, 0); toast("Added to the review queue."); close(); } }, "Study this")),
    el("p", { class: "tiny muted center", style: { marginTop: "14px" }, text: "Tadoku rule two says don't look words up. Tapping one word to unstick a sentence is fine; tapping every word means the book is too hard." }));
  const close = modal(w.s, body);
}

/* ==========================================================================
   SITUATIONS  —  every line at three levels of politeness
   ========================================================================== */
function viewSituations() {
  const v = $("#view");
  v.append(page("ばめん", "Say it three ways", "話",
    "Sixteen situations, and every line written out casual, polite, and keigo. The Japanese you need isn't a list of words — it's knowing which version of the same sentence fits the room you're standing in."));

  v.append(el("div", { class: "card" },
    el("div", { class: "eyebrow" }, "The ladder"),
    el("div", { class: "small", html: REGISTER_NOTE.replace(/\n\n/g, "<br><br>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") })));

  v.append(el("div", { class: "row", style: { margin: "20px 0 0" } },
    el("a", { class: "btn ghost sm", href: "#/grammar" }, "文 Grammar reference"),
    el("a", { class: "btn ghost sm", href: "#/deck/talk" }, "あいづち — the listening noises")));

  const g = el("div", { class: "grid g3", style: { marginTop: "16px" } });
  for (const s of SITUATIONS) {
    g.append(el("a", { class: "card", href: "#/phrase/" + s.id, style: { textDecoration: "none", color: "inherit", display: "flex", gap: "12px" } },
      el("span", { style: { fontSize: "24px" }, text: s.ic }),
      el("span", {}, el("b", { style: { display: "block", fontWeight: "500" }, text: s.en }),
        el("span", { class: "small muted", style: { fontFamily: "var(--hand)" }, text: s.jp }),
        el("span", { class: "tiny muted mono", style: { display: "block", marginTop: "5px" }, text: s.lines.length + " lines" }))));
  }
  v.append(g);
}

function viewSituation(id) {
  const s = SITUATIONS.find(x => x.id === id), v = $("#view");
  if (!s) return v.append(empty("？", "No situation by that name.", el("a", { class: "btn", href: "#/phrases" }, "All situations")));

  v.append(el("div", { class: "row", style: { marginBottom: "12px" } }, backLink("#/phrases", "All situations")));
  v.append(page(s.ic + "  " + s.jp, s.en, null, s.when));
  const cr = crumbFor(x => x.t === "sit" && x.id === id); if (cr) v.append(cr);

  let level = "all";
  const levelRow = el("div", { class: "row", style: { marginBottom: "18px" } },
    el("span", { class: "tiny muted", text: "Show:" }),
    [["all", "All three"], ["casual", "Casual"], ["polite", "Polite"], ["keigo", "Keigo"]].map(([k, lab]) =>
      el("button", { class: "chip" + (level === k ? " on" : ""), text: lab, onclick: e => { level = k; [...e.target.parentNode.querySelectorAll(".chip")].forEach(c => c.classList.remove("on")); e.target.classList.add("on"); paint(); } })));
  v.append(levelRow);

  const host = el("div", {});
  v.append(host);

  function paint() {
    host.innerHTML = "";
    for (const line of s.lines) {
      const card = el("div", { class: "card", style: { marginBottom: "12px" } });
      card.append(el("div", { class: "spread", style: { marginBottom: "8px" } },
        el("b", { style: { fontWeight: "500", fontSize: "15px" }, text: line.en }),
        speakBtn(line.polite !== "—" ? line.polite : line.keigo, "Hear the polite version")));
      const ladder = el("div", { class: "ladder" });
      for (const lv of ["casual", "polite", "keigo"]) {
        if (level !== "all" && level !== lv) continue;
        const say = line[lv];
        if (!say) continue;
        ladder.append(el("div", { class: "rung " + lv },
          el("span", { class: "lvl", text: lv }),
          el("span", {},
            say === "—"
              ? el("span", { class: "small muted", text: "— you wouldn't say this at this level" })
              : el("span", { class: "say" }, tappable(say, wordSheet)),
            say !== "—" && el("button", { class: "btn ghost sm", style: { marginLeft: "8px", verticalAlign: "middle" }, onclick: () => Speech.say(say, { force: true }) }, "🔊"))));
      }
      card.append(ladder);
      if (line.note) card.append(el("p", { class: "small", style: { marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed var(--grid)", color: "var(--sumi-2)" } },
        el("b", { style: { color: "var(--shu)" }, text: "note  " }), line.note));
      host.append(card);
    }
  }
  paint();

  const idx = SITUATIONS.findIndex(x => x.id === id);
  v.append(el("div", { class: "row", style: { marginTop: "24px" } },
    idx > 0 && el("a", { class: "btn ghost sm", href: "#/phrase/" + SITUATIONS[idx - 1].id }, "← " + SITUATIONS[idx - 1].en),
    idx < SITUATIONS.length - 1 && el("a", { class: "btn ghost sm", href: "#/phrase/" + SITUATIONS[idx + 1].id }, SITUATIONS[idx + 1].en + " →")));
}


/* The grammar reference now lives in 65-grammar.js (N5 → N1 and literary). */

/* ==========================================================================
   BOOKSHELF
   Trackers for paper (or PDF) books you already own, plus a viewer that opens
   a file straight off your disk. Nothing is uploaded and nothing is copied
   into this app — the file never leaves your machine.
   ========================================================================== */
const shelfState = id => (Store.d.books[id] ||= { page: 0, lessons: {}, note: "" });

function viewShelf() {
  const v = $("#view");
  v.append(page("ほんだな", "Your bookshelf", "棚",
    "Textbooks are still the backbone, and this app is a companion to yours rather than a replacement for them. Track where you are, keep notes, and open your own PDF right here so you're not bouncing between apps."));

  v.append(el("div", { class: "card", style: { borderColor: "var(--ai)" } },
    el("div", { class: "eyebrow" }, "How the viewer works"),
    el("p", { class: "small", html: "The PDF you open stays <b>entirely on your device</b> — this page has no server to send it to. That also means the app can't remember the file between visits: browsers don't let a web page hold onto a file path. Your <i>page number</i> and notes are saved; the file itself you'll pick again each session." })));

  const g = el("div", { class: "shelfgrid", style: { marginTop: "22px" } });
  for (const b of SHELF) {
    const st = shelfState(b.id);
    const lessonsDone = Object.keys(st.lessons || {}).length;
    g.append(el("button", { class: "spine", style: { "--band": b.band }, onclick: () => shelfSheet(b) },
      el("h4", { text: b.title }),
      el("div", { class: "meta", text: `${b.pages} pages · ${b.units} ${b.unitWord.toLowerCase()}${b.units > 1 ? "s" : ""}` }),
      bar(pct(st.page, b.pages), st.page >= b.pages ? "m" : ""),
      el("div", { class: "row tiny muted mono", style: { justifyContent: "space-between" } },
        el("span", { text: st.page ? `p. ${st.page}` : "not started" }),
        el("span", { text: lessonsDone ? `${lessonsDone}/${b.units} done` : "" }))));
  }
  v.append(g);

  v.append(sec("Open a PDF from this device", null, pdfViewer()));

  v.append(sec("A note on the books themselves", null, el("div", { class: "card" },
    el("p", { class: "small", html: "None of the text from your textbooks is reproduced anywhere in this app — the vocabulary, kanji, grammar notes and stories here are all written fresh, which is what makes this repo safe to publish publicly. The trackers above are just bookmarks." }),
    el("p", { class: "small muted", style: { marginTop: "8px" }, html: "If you push this to GitHub, add a <code>.gitignore</code> line for <code>*.pdf</code> so a stray copy of a book never ends up in the repo. There's one in the README." }))));
}

function shelfSheet(b) {
  const st = shelfState(b.id);
  const pageIn = el("input", {
    type: "number", min: "0", max: String(b.pages), value: String(st.page || 0),
    class: "type-in", style: { fontFamily: "var(--mono)", fontSize: "17px", maxWidth: "110px", padding: "8px" },
    oninput: e => { st.page = clamp(+e.target.value || 0, 0, b.pages); Store.save(); sync(); }
  });
  const slider = el("input", {
    type: "range", min: "0", max: String(b.pages), value: String(st.page || 0), style: { width: "100%" },
    oninput: e => { st.page = +e.target.value; pageIn.value = st.page; Store.save(); sync(); }
  });
  const barHost = el("div", {});
  const pctLbl = el("span", { class: "mono small muted" });
  function sync() {
    barHost.innerHTML = ""; barHost.append(bar(pct(st.page, b.pages), st.page >= b.pages ? "m" : ""));
    pctLbl.textContent = pct(st.page, b.pages) + "% · " + (b.pages - st.page) + " pages left";
    slider.value = String(st.page);
  }

  const lessons = el("div", { class: "row" });
  for (let n = 1; n <= b.units; n++) {
    const on = !!st.lessons[n];
    const btn = el("button", { class: "seal" + (on ? " done" : ""), text: String(n), title: b.unitWord + " " + n });
    btn.onclick = () => {
      if (st.lessons[n]) delete st.lessons[n]; else st.lessons[n] = 1;
      btn.className = "seal" + (st.lessons[n] ? " done stamped" : "");
      Store.save();
    };
    lessons.append(btn);
  }

  const note = el("textarea", {
    class: "type-in", rows: "3", placeholder: "notes — where you stopped, what didn't click…",
    style: { fontFamily: "var(--jp)", fontSize: "14px", textAlign: "left", lineHeight: "1.6", resize: "vertical" },
    oninput: e => { st.note = e.target.value; Store.save(); }
  });
  note.value = st.note || "";

  const body = el("div", {},
    el("p", { class: "small muted", text: b.note }),
    el("div", { style: { marginTop: "18px" } },
      el("div", { class: "eyebrow" }, "Page"),
      el("div", { class: "row", style: { marginBottom: "10px" } }, pageIn, el("span", { class: "small muted", text: "of " + b.pages }), pctLbl),
      slider, barHost),
    el("div", { style: { marginTop: "20px" } },
      el("div", { class: "eyebrow" }, b.unitWord + "s finished"),
      lessons),
    el("div", { style: { marginTop: "20px" } },
      el("div", { class: "eyebrow" }, "Notes"),
      note),
    el("div", { class: "row", style: { marginTop: "18px" } },
      el("button", { class: "btn sm ghost", onclick: () => { st.page = 0; st.lessons = {}; Store.save(); sync(); toast("Tracker reset."); } }, "Reset tracker")));
  sync();
  modal(b.title, body, { sub: `${b.pages} pages` });
}

/* ---- local PDF viewer ---------------------------------------------------- */
function pdfViewer() {
  const stage = el("div", { id: "pdfstage", style: { display: "none" } });
  const input = el("input", { type: "file", accept: "application/pdf,.pdf", style: { display: "none" } });
  const label = el("div", {},
    el("div", { style: { fontFamily: "var(--hand)", fontSize: "30px", marginBottom: "6px" }, text: "本" }),
    el("b", { text: "Drop a PDF here, or choose a file" }),
    el("p", { class: "small muted", style: { marginTop: "6px" }, text: "Your textbook, a tadoku reader, anything. It opens in your browser's own PDF viewer and never leaves this device." }));
  const zone = el("div", { class: "dropzone", tabindex: "0", role: "button" }, label);
  const bar_ = el("div", { class: "row", style: { marginTop: "12px", display: "none" } });
  let url = null;

  function open(file) {
    if (!file) return;
    if (!/pdf$/i.test(file.name) && file.type !== "application/pdf") { toast("That isn't a PDF."); return; }
    if (url) URL.revokeObjectURL(url);
    url = URL.createObjectURL(file);
    stage.style.display = "block"; stage.innerHTML = "";
    const frame = el("iframe", { src: url, title: file.name, style: { width: "100%", height: "70vh", border: "0", background: "#fff", borderRadius: "var(--radius)" } });
    stage.append(frame);
    zone.classList.remove("hot");
    label.innerHTML = "";
    label.append(el("b", { text: file.name }), el("p", { class: "small muted", text: Math.round(file.size / 1024 / 1024 * 10) / 10 + " MB — open below" }));
    bar_.style.display = "flex"; bar_.innerHTML = "";
    bar_.append(
      el("a", { class: "btn sm", href: url, target: "_blank", rel: "noopener" }, "Open in a new tab ↗"),
      el("button", { class: "btn sm ghost", onclick: () => input.click() }, "Choose another"),
      el("button", { class: "btn sm ghost", onclick: close }, "Close"));
    onLeave(close);
  }
  function close() {
    if (url) { URL.revokeObjectURL(url); url = null; }
    stage.style.display = "none"; stage.innerHTML = "";
    bar_.style.display = "none";
  }
  input.onchange = e => open(e.target.files[0]);
  zone.onclick = () => input.click();
  zone.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); } };
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("hot"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("hot"));
  zone.addEventListener("drop", e => { e.preventDefault(); zone.classList.remove("hot"); open(e.dataTransfer.files[0]); });

  return el("div", {}, zone, input, bar_, stage);
}

/* ==========================================================================
   SETTINGS
   ========================================================================== */
function optRow(title, sub, control) {
  return el("div", { class: "opt" },
    el("div", { class: "lbl" }, el("b", { text: title }), sub && el("span", { text: sub })),
    control);
}
function segControl(key, opts, after) {
  const s = el("div", { class: "seg" });
  for (const [val, lab] of opts) {
    s.append(el("button", {
      class: String(SET()[key]) === String(val) ? "on" : "", text: lab,
      onclick: e => {
        Store.set("settings." + key, val);
        [...s.children].forEach(b => b.classList.remove("on"));
        e.target.classList.add("on");
        after && after(val);
      }
    }));
  }
  return s;
}
function switchControl(key, after) {
  const b = el("button", { class: "sw" + (SET()[key] === "on" ? " on" : ""), role: "switch", "aria-checked": SET()[key] === "on" }, el("i", {}));
  b.onclick = () => {
    const on = SET()[key] !== "on";
    Store.set("settings." + key, on ? "on" : "off");
    b.classList.toggle("on", on); b.setAttribute("aria-checked", String(on));
    after && after(on);
  };
  return b;
}

const GOOGLE_ICON = `<svg width="18" height="18" viewBox="0 0 18 18" style="vertical-align:middle;margin-right:8px"><path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62z"/><path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.28-1.71V4.96H.96A8.996 8.996 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33z"/><path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3 2.33c.71-2.13 2.7-3.71 5.04-3.71z"/></svg>`;

function accountCard(onDone) {
  const card = el("div", { class: "card", style: { padding: "16px" } });
  const u = Store.user;
  const syncInfo = Store.auth.getSyncInfo();

  if (!u) {
    card.append(
      el("div", {},
        el("h3", { style: { margin: "0 0 6px 0", fontSize: "16px" } }, "Cloud Sync & Backup"),
        el("p", { class: "small muted", style: { margin: "0 0 14px 0", lineHeight: "1.5" } },
          "Sign in with Google to sync your study streaks, SRS flashcards, and reading progress across all your devices. Offline study continues to work with or without an account."),
        el("button", {
          class: "btn sm",
          style: { display: "inline-flex", alignItems: "center" },
          onclick: async (e) => {
            const btn = e.currentTarget;
            btn.disabled = true;
            try {
              toast("Connecting to Google...");
              await Store.auth.signInWithGoogle();
              toast("Signed in!");
              if (onDone) onDone();
              if ((location.hash || "") === "#/settings") render();
              updateNavAccount();
            } catch (err) {
              console.error("Sign in error:", err);
              toast(err.message || "Sign in failed");
              btn.disabled = false;
            }
          }
        },
          el("span", { html: GOOGLE_ICON }),
          el("span", { text: "Sign in with Google" })
        )
      )
    );
  } else {
    const avatar = u.photoURL
      ? el("img", { src: u.photoURL, alt: u.displayName, style: { width: "42px", height: "42px", borderRadius: "50%", border: "1px solid var(--grid)", flexShrink: "0" } })
      : el("div", { class: "stamp", style: { width: "42px", height: "42px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: "0" } }, u.displayName?.[0] || "人");

    const syncBadge = el("span", { class: "tag", style: { marginLeft: "8px", fontSize: "11px" } });
    if (syncInfo.status === "syncing") {
      syncBadge.textContent = "Syncing...";
      syncBadge.style.color = "var(--ai)";
    } else if (syncInfo.status === "synced") {
      const timeStr = syncInfo.lastSync ? new Date(syncInfo.lastSync).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "just now";
      syncBadge.textContent = `✓ Synced (${timeStr})`;
      syncBadge.style.color = "var(--matcha)";
    } else if (syncInfo.status === "error") {
      syncBadge.textContent = "Sync issue";
      syncBadge.style.color = "var(--shu)";
    } else {
      syncBadge.textContent = "Ready to sync";
    }

    card.append(
      el("div", { class: "row", style: { alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" } },
        el("div", { class: "row", style: { alignItems: "center", gap: "12px" } },
          avatar,
          el("div", {},
            el("div", { style: { fontWeight: "600", fontSize: "15px" } }, u.displayName, syncBadge),
            el("div", { class: "small muted mono" }, u.email)
          )
        ),
        el("div", { class: "row", style: { gap: "8px" } },
          el("button", {
            class: "btn sm",
            onclick: async (e) => {
              const btn = e.target;
              btn.disabled = true;
              btn.textContent = "Syncing...";
              const ok = await Store.syncCloud();
              btn.disabled = false;
              btn.textContent = "Sync now";
              toast(ok ? "Cloud sync complete!" : "Sync failed — check connection");
              if ((location.hash || "") === "#/settings") render();
              updateNavAccount();
            }
          }, "Sync now"),
          el("button", {
            class: "btn sm ghost",
            onclick: async () => {
              await Store.auth.signOut();
              toast("Signed out");
              if (onDone) onDone();
              if ((location.hash || "") === "#/settings") render();
              updateNavAccount();
            }
          }, "Sign out")
        )
      )
    );
  }
  return card;
}

function openAccountModal() {
  const close = modal("Account & Cloud Sync", accountCard(() => close()));
}

function updateNavAccount() {
  const u = Store.user;
  const syncInfo = Store.auth.getSyncInfo();
  const ji = $("#accountji");
  const en = $("#accounten");
  const btn = $("#accountbtn");
  if (!btn) return;
  if (u) {
    if (ji) {
      if (u.photoURL) {
        ji.innerHTML = `<img src="${esc(u.photoURL)}" style="width:20px;height:20px;border-radius:50%;vertical-align:middle;">`;
      } else {
        ji.textContent = "人";
      }
    }
    if (en) en.textContent = syncInfo.status === "syncing" ? "Syncing" : "Account";
    btn.title = `Signed in as ${u.displayName} (${u.email})`;
  } else {
    if (ji) ji.textContent = "人";
    if (en) en.textContent = "Sign in";
    btn.title = "Sign in to sync your progress";
  }
}

function viewSettings() {
  const v = $("#view");
  v.append(page("せってい", "Settings", "設",
    "Customize your display, audio, and study preferences. Sign in with Google to sync your flashcard intervals and progress across devices."));

  v.append(el("div", { class: "row", style: { marginBottom: "18px" } },
    el("a", { class: "chip on", href: "#/settings" }, "Settings"),
    el("a", { class: "chip", href: "#/stats" }, "Progress")));

  v.append(sec("Account & Cloud Sync", null, accountCard()));

  v.append(sec("Display", null, el("div", { class: "card" },
    optRow("Theme", "Five of them, carried over from Kana Master.",
      el("button", { class: "btn sm", onclick: themeMenu }, "Choose theme")),
    optRow("Text size", null, segControl("fontSize", [["s", "S"], ["m", "M"], ["l", "L"]], applyTheme)),
    optRow("Furigana", "Reading hints over kanji. Smart shows them only over kanji you haven't learned yet.",
      segControl("furigana", [["on", "On"], ["smart", "Smart"], ["off", "Off"]])),
    optRow("Kanji I already know", "Smart furigana hides readings over these (plus any kanji your reviews say is solid).",
      segControl("knownLevel", [[0, "None"], [5, "N5"], [4, "N4+"], [3, "N3+"], [2, "N2+"], [1, "All JLPT"]])),
    optRow("My level", "Tailors the home page. Take the placement check if you're not sure.",
      el("div", { class: "row" }, segControl("level", LEVEL_SHORT.map((l, i) => [i, l])), el("a", { class: "btn sm ghost", href: "#/placement" }, "Check"))),
    optRow("Romaji on kana charts", "Training wheels. Take them off early — they slow reading down.",
      segControl("romaji", [["on", "Show"], ["off", "Hide"]])),
    optRow("English in readers", "Off means you guess first, then check.",
      segControl("showEnglish", [["on", "Show"], ["off", "Hide"]])),
    optRow("Vertical text by default", "縦書き — how most printed Japanese actually runs.",
      switchControl("vertical")))));

  v.append(sec("Writing pad", null, el("div", { class: "card" },
    optRow("Guide lines", "The cross-hairs and diagonals of genkō-yōshi paper.", switchControl("strokeGuide")),
    optRow("Tracing model", "The faint character behind the grid. Turn it off to test yourself properly.", switchControl("tracingModel")),
    optRow("Stroke numbers", "Numbers on the stroke-order animation.", switchControl("strokeNums")),
    optRow("Animation speed", null, segControl("animSpeed", [[0.6, "Slow"], [1, "Normal"], [1.7, "Fast"]])))));

  v.append(sec("Sound", null, el("div", { class: "card" },
    optRow("Speech", "Uses your device's Japanese voice.", switchControl("speech")),
    optRow("Voice", "Whichever Japanese voices your system offers.", voicePicker()),
    optRow("Speaking rate", "0.85 is a good default — slightly under natural speed.", ratePicker()),
    optRow("Sound effects", "Small clicks and dings. No audio files, just tones.", switchControl("sfx")))));

  v.append(sec("Review", null, el("div", { class: "card" },
    optRow("New cards per session", "Twelve is sustainable. Thirty is a great week and a terrible month.",
      numPicker("newPerDay", [6, 12, 20, 30])),
    optRow("Maximum reviews per session", "A cap so a backlog never becomes unfaceable.",
      numPicker("srsCap", [30, 60, 100, 200])))));

  v.append(sec("Your data", null, el("div", { class: "card" },
    el("p", { class: "small muted", html: Store.persistent
      ? "Progress is saved in this browser's local storage. It survives closing the tab — it does not survive clearing site data, and it doesn't follow you to another device."
      : "<b style='color:var(--shu)'>Storage is currently blocked</b>, so nothing is being saved. Private browsing or a strict content blocker is usually the cause." }),
    el("div", { class: "row", style: { marginTop: "14px" } },
      el("button", { class: "btn sm", onclick: doExport }, "Export backup"),
      el("button", { class: "btn sm ghost", onclick: doImport }, "Import backup"),
      el("button", { class: "btn sm ghost", style: { color: "var(--shu)", borderColor: "var(--shu)" }, onclick: doReset }, "Erase everything")))));

  v.append(sec("About", null, el("div", { class: "card" },
    el("p", { html: "<b>MASU · JLC Edition</b> — <span style='font-family:var(--hand)'>ます</span> is the square on Japanese manuscript paper and the ending that makes a verb polite. One file, no backend, no tracking, no accounts." }),
    el("div", { class: "row", style: { marginTop: "12px" } },
      el("a", { class: "btn sm", href: "#/about" }, "About & credits"),
      el("button", { class: "btn sm ghost", onclick: () => modal("Keyboard shortcuts", shortcutList()) }, "Keyboard shortcuts")))));
}

function shortcutList() {
  const rows = [["/  or  \u2318K", "Search anything (Enter with no match opens the dictionary)"], ["?", "This list"], ["Space / Enter", "Flip a flashcard"], ["1 – 4", "Grade it: again, hard, good, easy"],
    ["← →", "Turn pages in a book (reversed in vertical text), change characters on the writing pad"],
    ["Enter", "Score your freehand writing"], ["Backspace", "Undo a stroke"], ["s", "Say the current card out loud"],
    ["Kana Master", "Space flips · 1 missed · 2 got it"], ["Projector mode", "→ / Space reveal then next · ← back · R reveal · Esc exit"]];
  return el("dl", { class: "kv" }, rows.map(([k, d]) => [el("dt", { text: k }), el("dd", { text: d })]).flat());
}
function voicePicker() {
  const sel = el("select", { class: "chip", style: { padding: "7px 10px", maxWidth: "190px" }, onchange: e => Store.set("settings.voice", e.target.value) });
  const fill = () => {
    sel.innerHTML = "";
    sel.append(el("option", { value: "", text: Speech.voices.length ? "System default" : "none found" }));
    for (const v of Speech.voices) sel.append(el("option", { value: v.name, selected: SET().voice === v.name || null, text: v.name }));
  };
  Speech.init(); fill();
  setTimeout(fill, 600);
  return sel;
}
function ratePicker() {
  const out = el("span", { class: "mono small", text: String(SET().rate) });
  const r = el("input", { type: "range", min: "0.5", max: "1.3", step: "0.05", value: String(SET().rate), style: { width: "130px" },
    oninput: e => { Store.set("settings.rate", +e.target.value); out.textContent = e.target.value; } });
  return el("div", { class: "row" }, r, out,
    el("button", { class: "btn sm ghost", onclick: () => Speech.say("日本語の練習をしましょう。", { force: true }) }, "Test"));
}
function numPicker(key, opts) {
  return el("div", { class: "seg" }, opts.map(n =>
    el("button", { class: String(SET()[key]) === String(n) ? "on" : "", text: String(n), onclick: e => {
      Store.set("settings." + key, n);
      [...e.target.parentNode.children].forEach(b => b.classList.remove("on"));
      e.target.classList.add("on");
    } })));
}

function doExport() {
  const blob = new Blob([Store.export()], { type: "application/json" });
  const a = el("a", { href: URL.createObjectURL(blob), download: `masu-backup-${today()}.json` });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast("Backup downloaded.");
}
function doImport() {
  const inp = el("input", { type: "file", accept: "application/json,.json" });
  inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const fr = new FileReader();
    fr.onload = () => {
      try { Store.import(fr.result); toast("Backup restored."); applyTheme(); render(); }
      catch (err) { toast("That file isn't a MASU backup."); }
    };
    fr.readAsText(f);
  };
  inp.click();
}
function doReset() {
  const body = el("div", {},
    el("p", { html: "This erases <b>everything</b>: every review interval, every finished section, every book tracker and note. It cannot be undone." }),
    el("div", { class: "row", style: { marginTop: "16px" } },
      el("button", { class: "btn sm shu", onclick: () => { Store.reset(); applyTheme(); close(); go("#/"); render(); toast("Everything erased."); } }, "Yes, erase it all"),
      el("button", { class: "btn sm ghost", onclick: () => close() }, "Keep my progress")));
  const close = modal("Erase everything?", body, { sub: "Export a backup first if you're not sure." });
}


/* ==========================================================================
   PROGRESS
   ========================================================================== */
function viewStats() {
  const v = $("#view");
  const st = Store.d.stats;
  const c = SRS.counts(ALL_IDS);

  v.append(page("きろく", "Progress", "計",
    "Numbers are only useful if you know which ones lie. Streaks measure showing up, not learning. The one to watch is the middle bar below: cards you've held for three weeks or more."));

  v.append(el("div", { class: "row", style: { marginBottom: "18px" } },
    el("a", { class: "chip", href: "#/settings" }, "Settings"),
    el("a", { class: "chip on", href: "#/stats" }, "Progress")));

  v.append(el("div", { class: "card" },
    el("div", { class: "row", style: { gap: "30px" } },
      stat(st.streak || 0, "day streak"), stat(st.best || 0, "best streak"),
      stat(st.reviews || 0, "reviews all time"), stat(st.written || 0, "characters written"),
      stat(Object.values(Store.d.books).reduce((a, b) => a + (b.reads || 0), 0), "books finished"))));

  /* last fourteen days */
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = window.__ymd(new Date(Date.now() - i * 864e5));
    days.push({ d, v: (st.days[d] || {}).rev || 0 });
  }
  const max = Math.max(10, ...days.map(x => x.v));
  v.append(sec("Last two weeks", null, el("div", { class: "card" },
    el("div", { class: "row", style: { alignItems: "flex-end", gap: "6px", height: "130px" } },
      days.map(x => el("div", { style: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", height: "100%" }, title: `${x.d}: ${x.v} reviews` },
        el("div", { class: "tiny mono muted", text: x.v || "" }),
        el("div", { style: { width: "100%", height: (x.v / max * 88 + 2) + "px", background: x.v ? "var(--ai)" : "var(--grid)", borderRadius: "2px 2px 0 0" } }),
        el("div", { class: "tiny muted", style: { marginTop: "5px", fontSize: "9px" }, text: x.d.slice(8) })))))));

  v.append(sec("The whole collection", null, el("div", { class: "card" },
    labelled("Kana", SRS.counts(KANA_IDS).known, KANA_IDS.length, "m"),
    el("div", { style: { height: "12px" } }),
    labelled("Kanji", SRS.counts(KANJI_IDS).known, KANJI_IDS.length, "m"),
    el("div", { style: { height: "12px" } }),
    labelled("Vocabulary", SRS.counts(VOCAB_IDS).known, VOCAB_IDS.length, "m"),
    el("p", { class: "tiny muted", style: { marginTop: "12px" }, text: "“Known” here means the interval has passed three weeks — long enough that it's in real memory rather than short-term recall." }))));

  const deckRows = DECKS.map(d => {
    const ids = VOCAB_BY_DECK(d.id).map(w => w.id);
    const cc = SRS.counts(ids);
    return { d, cc, score: pct(cc.known, cc.total) };
  }).filter(x => x.cc.total).sort((a, b) => a.score - b.score);
  v.append(sec("Decks, weakest first", deckRows.length, el("div", { class: "card" },
    deckRows.map(({ d, cc, score }) => el("div", { style: { marginBottom: "12px" } },
      el("div", { class: "row small", style: { justifyContent: "space-between", marginBottom: "4px" } },
        el("a", { href: "#/deck/" + d.id, style: { color: "inherit" } }, `${d.ic} ${d.en}`),
        el("span", { class: "mono muted", text: `${cc.known}/${cc.total}` })),
      bar(score, score > 60 ? "m" : score > 25 ? "" : "s"))))));

  const chDoneN = CHAPTERS.reduce((a, c) => a + chDone(c), 0);
  const chTotal = CHAPTERS.reduce((a, c) => a + c.sections.length, 0);
  v.append(sec("Chapters", null, el("div", { class: "card" },
    labelled("Sections marked finished", chDoneN, chTotal),
    el("div", { class: "row", style: { marginTop: "14px", gap: "4px" } },
      CHAPTERS.map(ch => el("a", { class: "seal" + (chDone(ch) === ch.sections.length ? " done" : ""), href: "#/chapter/" + ch.n, title: ch.en, text: String(ch.n) }))))));
}


/* ==========================================================================
   BOOT
   ========================================================================== */
async function boot() {
  console.log("BOOT STARTING...");
  try {
    initCompat();
    initLexicon(VOCAB, KANJI, READERS);
    console.log("waiting for Store.ready...");
    await Store.ready;
    console.log("Store.ready resolved, loading club data...");
    await DATA.ensure("club");
    console.log("club data loaded");
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(e => console.warn("SW registration:", e));
  }
  /* first visit on a phone or laptop in dark mode: start on the night theme */
  try {
    if (!Store.d.seen) {
      if (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches && SET().theme === "paper") Store.set("settings.theme", "night");
      Store.d.seen = Date.now(); Store.save();
    }
  } catch (e) {}
  applyTheme();
  buildNav();
  Speech.init();
  $("#themebtn").onclick = themeMenu;
  const acctBtn = $("#accountbtn");
  if (acctBtn) acctBtn.onclick = openAccountModal;
  Store.auth.init(() => {
    updateNavAccount();
    if ((location.hash || "").startsWith("#/settings")) {
      const v = $("#view");
      if (v) render();
    }
  });
  Store.auth.onSync(() => {
    updateNavAccount();
  });
  document.addEventListener("keydown", e => {
    if (e.target.matches && e.target.matches("input,textarea,select")) return;
    if (e.key === "/" || ((e.metaKey || e.ctrlKey) && e.key === "k")) { e.preventDefault(); openSearch(); }
    if (e.key === "?") { e.preventDefault(); modal("Keyboard shortcuts", shortcutList()); }
  });
  window.addEventListener("hashchange", render);
  if (!location.hash) location.hash = "#/";
  render();
  /* keep the ink wall honest if the tab is left open across midnight */
  setInterval(() => { if ((location.hash || "#/") === "#/") render(); }, 6e5);
  } catch (err) { console.error("FATAL BOOT ERROR:", err); }
}
/* boot called at end of file */

/* ==========================================================================
   FLASHCARDS
   The old review screen threw a queue at you and gave you no say in it.
   This one makes you pick first: which script, which rows, which individual
   characters. Selection is remembered between sessions.
   ========================================================================== */
const FLASH_DEFAULT = {
  kind: "kana", scripts: ["hira"], sets: ["base"],
  chars: [], kanji: [], kanjiLv: [5], decks: [],
  dir: "jp2en", mode: "srs", order: "srs", limit: 40, auto: "off"
};
const FSEL = () => {
  const f = (Store.d.flash ||= JSON.parse(JSON.stringify(FLASH_DEFAULT)));
  for (const k in FLASH_DEFAULT) if (!(k in f)) f[k] = JSON.parse(JSON.stringify(FLASH_DEFAULT[k]));
  return f;
};
const fsave = () => Store.save();
const inArr = (a, v) => a.indexOf(v) >= 0;
const toggleIn = (a, v) => { const i = a.indexOf(v); if (i < 0) a.push(v); else a.splice(i, 1); };

/* ---- themes -------------------------------------------------------------- */
const THEMES = [
  { id: "paper",  ji: "紙", name: "Washi",  note: "Paper and sumi ink. The default." },
  { id: "night",  ji: "夜", name: "Night",  note: "For studying at 2 a.m." },
  { id: "sakura", ji: "桜", name: "Sakura", note: "Pink, with petals falling." },
  { id: "regal",  ji: "錦", name: "Regal",  note: "Gold on lacquer red." },
  { id: "hacker", ji: "端", name: "Hacker", note: "Phosphor green on black." }
];
function themeMenu() {
  const body = el("div", { class: "grid g2" });
  for (const t of THEMES) {
    const on = SET().theme === t.id;
    body.append(el("button", { class: "card", style: { textAlign: "left", borderColor: on ? "var(--ai)" : "" },
      onclick: () => { Store.set("settings.theme", t.id); applyTheme(); close(); toast(t.name + " theme."); } },
      el("div", { class: "row", style: { gap: "10px" } },
        el("span", { style: { fontFamily: "var(--hand)", fontSize: "24px", color: "var(--ai)" }, text: t.ji }),
        el("span", {}, el("b", { style: { display: "block", fontWeight: "500" }, text: t.name }),
          el("span", { class: "small muted", text: t.note })),
        on && el("span", { class: "tag", text: "on" }))));
  }
  const close = modal("Theme", body, { sub: "Carried over from Kana Master." });
}
function paintPetals() {
  let host = $("#petals");
  if (!host) { host = el("div", { id: "petals", "aria-hidden": "true" }); document.body.append(host); }
  if (SET().theme !== "sakura") { host.innerHTML = ""; return; }
  if (host.children.length) return;
  for (let i = 0; i < 26; i++) {
    host.append(el("span", { class: "petal", style: {
      left: (Math.random() * 100).toFixed(1) + "%",
      animationDuration: (7 + Math.random() * 9).toFixed(1) + "s",
      animationDelay: (-Math.random() * 14).toFixed(1) + "s"
    } }));
  }
}

/* selectedItems() lives in 68-cards.js now */

/* ==========================================================================
   PICKER
   ========================================================================== */
/* viewFlash() and applyScope() live in 68-cards.js now */
function pickSeg(f, key, opts) {
  const s = el("div", { class: "seg" });
  for (const [val, lab] of opts) {
    s.append(el("button", { class: String(f[key]) === String(val) ? "on" : "", text: lab,
      onclick: e => { f[key] = val; fsave(); [...s.children].forEach(b => b.classList.remove("on")); e.currentTarget.classList.add("on"); } }));
  }
  return s;
}

/* ---- kana picker --------------------------------------------------------- */
function kanaPicker(host, f) {
  const scriptRow = el("div", { class: "row", style: { marginBottom: "12px" } },
    el("span", { class: "tiny muted", text: "Script:" }));
  for (const [id, lab] of [["hira", "ひらがな"], ["kata", "カタカナ"]]) {
    scriptRow.append(el("button", { class: "chip" + (inArr(f.scripts, id) ? " on" : ""), text: lab,
      onclick: e => { toggleIn(f.scripts, id); if (!f.scripts.length) f.scripts.push(id); fsave(); render(); } }));
  }
  const setRow = el("div", { class: "row", style: { marginBottom: "18px" } },
    el("span", { class: "tiny muted", text: "Set:" }));
  for (const [id, lab] of [["base", "基本 Gojūon"], ["daku", "濁点 Dakuten"], ["yoon", "拗音 Yōon"]]) {
    setRow.append(el("button", { class: "chip" + (inArr(f.sets, id) ? " on" : ""), text: lab,
      onclick: () => { toggleIn(f.sets, id); if (!f.sets.length) f.sets.push("base"); fsave(); render(); } }));
  }
  host.append(scriptRow, setRow, presetRow(f, "chars", () => {
    const all = []; for (const s of f.scripts) all.push(...kanaList(s, f.sets));
    return all.map(k => ({ key: k.ch, id: kanaId(k) }));
  }));

  for (const script of f.scripts) {
    const K = KANA[script];
    if (inArr(f.sets, "base")) {
      const grid = el("div", { class: "pickgrid" });
      for (const [rowName, row] of K.rows) {
        grid.append(el("button", { class: "rowbtn", text: rowName === "n" ? "ん" : rowName, title: "Toggle this whole row",
          onclick: () => {
            const chars = row.filter(Boolean).map(c => c[0]);
            const allOn = chars.every(c => inArr(f.chars, c));
            for (const c of chars) { const i = f.chars.indexOf(c); if (allOn) { if (i >= 0) f.chars.splice(i, 1); } else if (i < 0) f.chars.push(c); }
            fsave(); render();
          } }));
        for (const cell of row) {
          if (!cell) { grid.append(el("div", { class: "pk blank" })); continue; }
          grid.append(pkCell({ ch: cell[0], rom: cell[1] }, f));
        }
      }
      host.append(sec(`${K.label} — gojūon`, null, grid));
    }
    for (const part of ["daku", "yoon"]) {
      if (!inArr(f.sets, part)) continue;
      const list = kanaList(script, [part]);
      const grid = el("div", { class: "pickgrid wide" });
      for (const k of list) grid.append(pkCell(k, f));
      host.append(sec(`${K.label} — ${part === "daku" ? "dakuten & handakuten" : "yōon"}`, list.length, grid));
    }
  }
}
function pkCell(k, f) {
  const id = kanaId({ ch: k.ch });
  const on = !f.chars.length || inArr(f.chars, k.ch);
  const due = !SRS.isNew(id) && SRS.due(id);
  const b = el("button", { class: "pk" + (inArr(f.chars, k.ch) ? " on" : ""), title: k.rom },
    due && el("span", { class: "dot" }),
    el("span", { text: k.ch }),
    el("span", { class: "rm", text: k.rom }));
  b.onclick = () => { toggleIn(f.chars, k.ch); fsave(); b.classList.toggle("on", inArr(f.chars, k.ch)); };
  return b;
}

/* ---- word picker --------------------------------------------------------- */
function wordPicker(host, f) {
  host.append(el("p", { class: "small muted", style: { marginBottom: "12px" },
    text: "Pick decks. Leaving them all off means everything." }));
  const g = el("div", { class: "row", style: { marginBottom: "18px" } });
  for (const d of DECKS) {
    const n = VOCAB_BY_DECK(d.id).length; if (!n) continue;
    g.append(el("button", { class: "chip" + (inArr(f.decks, d.id) ? " on" : ""),
      onclick: e => { toggleIn(f.decks, d.id); fsave(); e.currentTarget.classList.toggle("on", inArr(f.decks, d.id)); } },
      d.ic + " " + d.en, el("span", { class: "mono tiny", text: String(n) })));
  }
  host.append(g,
    el("div", { class: "row" },
      el("button", { class: "btn sm ghost", onclick: () => { f.decks = DECKS.map(d => d.id); fsave(); render(); } }, "All decks"),
      el("button", { class: "btn sm ghost", onclick: () => { f.decks = []; fsave(); render(); } }, "Clear")));
}

/* ---- shared presets ------------------------------------------------------ */
function presetRow(f, key, pool) {
  const set = (fn, label) => el("button", { class: "btn sm ghost", text: label, onclick: () => {
    const items = pool();
    f[key] = fn(items).map(x => x.key);
    fsave(); render();
  } });
  return el("div", { class: "row", style: { marginBottom: "18px" } },
    el("span", { class: "tiny muted", text: "Select:" }),
    el("button", { class: "btn sm ghost", onclick: () => { f[key] = []; fsave(); render(); } }, "Everything"),
    set(i => i.filter(x => !SRS.isNew(x.id) && SRS.due(x.id)), "Due now"),
    set(i => i.filter(x => SRS.isNew(x.id)), "Never seen"),
    set(i => i.filter(x => (Store.d.srs[x.id]?.lapses || 0) > 0), "My misses"),
    set(i => i.slice(0, 15), "First 15"),
    el("button", { class: "btn sm ghost", onclick: () => {
      const all = pool().map(x => x.key);
      f[key] = f[key].length ? all.filter(k => !inArr(f[key], k)) : [];
      fsave(); render();
    } }, "Invert"));
}


/* ==========================================================================
   SESSION
   ========================================================================== */
function runFlash(items, why) {
  const f = FSEL();
  const v = $("#view");
  v.innerHTML = "";

  let queue = items.slice();
  if (f.order === "random") queue = shuffle(queue);
  else if (f.order === "srs") {
    queue.sort((a, b) => {
      const ca = Store.d.srs[a.id], cb = Store.d.srs[b.id];
      return (ca ? ca.due : 0) - (cb ? cb.due : 0);
    });
  }
  if (f.limit) queue = queue.slice(0, f.limit);

  let i = 0, right = 0, wrong = 0, flipped = false;
  const missed = [], again = [];

  const top = el("div", { class: "row", style: { marginBottom: "14px" } },
    el("button", { class: "btn ghost sm", onclick: () => go("#/review") }, "← Change selection"),
    el("span", { class: "small muted", text: f.mode === "srs" ? "Grading on" : "Browsing — nothing is scheduled" }),
    el("span", { style: { flex: 1 } }),
    el("button", { class: "chip", onclick: themeMenu }, "Theme"));
  const info = el("div", { class: "hud" });
  const stage = el("div", {});
  const controls = el("div", { style: { maxWidth: "560px", margin: "16px auto 0" } });
  v.append(top, info, stage, controls);

  function sync() {
    info.innerHTML = "";
    info.append(stat(queue.length - i, "left"), stat(right, "right"), stat(wrong, "missed"),
      el("div", { style: { flex: 1, minWidth: "110px" } }, bar(pct(i, queue.length))));
  }

  function step() {
    if (i >= queue.length) {
      if (again.length) { queue = queue.concat(again.splice(0)); }
      if (i >= queue.length) return finish();
    }
    flipped = false;
    const it = queue[i];
    sync();

    const jpFirst = f.dir === "jp2en" || (f.dir === "mix" && Math.random() < .5);
    const card = el("div", { class: "flip" },
      el("div", { class: "inner" },
        el("div", { class: "f" }, faceOf(it, jpFirst, false), el("span", { class: "corner", text: cornerOf(it) }),
          el("span", { class: "taphint", text: "tap to flip" })),
        el("div", { class: "b" }, faceOf(it, jpFirst, true), el("span", { class: "corner", text: cornerOf(it) }))));
    stage.innerHTML = ""; stage.append(card);
    card.querySelector(".inner").onclick = flip;

    controls.innerHTML = "";
    controls.append(el("div", { class: "row", style: { justifyContent: "center" } },
      el("button", { class: "btn pri lg", onclick: flip, style: { flex: 1 } }, "Flip"),
      speakBtn(sayOf(it), "Hear it"),
      el("button", { class: "btn ghost", onclick: () => openItem(it) }, "Detail")));

    if (f.auto === "on" && jpFirst) Speech.say(sayOf(it));

    function flip() {
      if (flipped) return;
      flipped = true;
      card.classList.add("on");
      Sfx.tick();
      if (f.auto === "on" && !jpFirst) Speech.say(sayOf(it));
      controls.innerHTML = "";
      if (f.mode === "srs") {
        controls.append(el("div", { class: "gradebar" },
          gbtn("Again", "< 5 min", 0, "shu"), gbtn("Hard", nextIv(it.id, 1), 1, "ghost"),
          gbtn("Good", nextIv(it.id, 2), 2, "pri"), gbtn("Easy", nextIv(it.id, 3), 3, "ghost")));
      } else {
        controls.append(el("div", { class: "row", style: { justifyContent: "center" } },
          el("button", { class: "btn shu", style: { flex: 1 }, onclick: () => mark_(false) }, "✗ Missed it"),
          el("button", { class: "btn pri", style: { flex: 1 }, onclick: () => mark_(true) }, "✓ Got it")));
      }
    }
    function gbtn(label, sub, q, cls) {
      return el("button", { class: "btn " + cls, onclick: () => { SRS.grade(it.id, q); mark_(q > 0); } },
        el("span", { text: label }), el("small", { text: sub }));
    }
    function mark_(ok) {
      if (ok) { right++; Sfx.ok(); } else { wrong++; Sfx.no(); missed.push(it); again.push(it); }
      i++; step();
    }

    const key = e => {
      if (e.target.matches && e.target.matches("input,textarea,select")) return;
      if (!flipped && (e.key === " " || e.key === "Enter")) { e.preventDefault(); flip(); return; }
      if (flipped && f.mode === "srs" && "1234".includes(e.key)) { SRS.grade(it.id, +e.key - 1); mark_(+e.key > 1); }
      if (flipped && f.mode === "flip") { if (e.key === "1" || e.key === "ArrowLeft") mark_(false); if (e.key === "2" || e.key === "ArrowRight") mark_(true); }
      if (e.key === "s") Speech.say(sayOf(it), { force: true });
    };
    document.removeEventListener("keydown", stage._k || (() => {}));
    document.addEventListener("keydown", key);
    stage._k = key;
    onLeave(() => document.removeEventListener("keydown", key));
  }

  function finish() {
    document.removeEventListener("keydown", stage._k || (() => {}));
    const total = right + wrong;
    v.innerHTML = "";
    v.append(page("おつかれさま", "Session finished", "済", null));
    v.append(el("div", { class: "card center" },
      el("div", { class: "gauge", style: { justifyContent: "center" } },
        el("b", { text: pct(right, total) + "%" }), el("small", { text: `${right} / ${total}` })),
      el("p", { class: "small muted", style: { marginTop: "8px" },
        text: f.mode === "srs" ? "Anything you missed is already scheduled to come back." : "Browse mode — your schedule wasn't touched." }),
      el("div", { class: "row", style: { justifyContent: "center", marginTop: "18px" } },
        missed.length && el("button", { class: "btn pri", onclick: () => runFlash([...new Map(missed.map(m => [m.id, m])).values()], "redo") }, `Redo the ${new Set(missed.map(m => m.id)).size} you missed`),
        el("button", { class: "btn", onclick: () => runFlash(items, why) }, "Same set again"),
        el("a", { class: "btn ghost", href: "#/review" }, "Change selection"))));

    if (missed.length) {
      const uniq = [...new Map(missed.map(m => [m.id, m])).values()];
      v.append(sec("What tripped you up", uniq.length, el("div", { class: "row" },
        uniq.map(it => el("button", { class: "chip", onclick: () => openItem(it) },
          el("span", { style: { fontFamily: "var(--hand)", fontSize: "17px" }, text: faceText(it) }),
          el("span", { class: "small", text: shortOf(it) }))))));
    }
    if (total && f.mode === "srs") { touchDay("rev", total); Store.d.stats.reviews = (Store.d.stats.reviews || 0) + total; Store.save(); }
  }
  step();
}

/* ---- card faces ---------------------------------------------------------- */
let faceText = it => it.type === "vocab" ? plain(it.o.form) : it.o.ch;
let sayOf = it => it.type === "vocab" ? it.o.kana : it.o.ch;
let shortOf = it => it.type === "kana" ? it.o.rom : it.type === "kanji" ? it.o.mean : it.o.en;
let cornerOf = it => it.type === "kana" ? KANA[it.o.script].en : it.type === "kanji" ? "N" + it.o.jlpt : (DECK_BY[it.o.deck]?.en || "");

function faceOf(it, jpFirst, isBack) {
  const showJp = jpFirst !== isBack;   /* front shows JP if jpFirst; back shows the other side */
  if (it.type === "kana") {
    const k = it.o;
    return showJp
      ? el("div", {}, el("div", { class: "big", text: k.ch }))
      : el("div", {}, el("div", { class: "rom", text: k.rom }),
          isBack && el("div", { class: "big", style: { fontSize: "clamp(44px,13vw,86px)" }, text: k.ch }),
          k.mn && isBack && el("div", { class: "mn", text: k.mn }),
          !isBack && el("div", { class: "sub", text: "write the kana" }));
  }
  if (it.type === "kanji") {
    const k = it.o;
    return showJp
      ? el("div", {}, el("div", { class: "big", text: k.ch }), el("div", { class: "sub", text: k.strokes + " strokes" }))
      : el("div", {},
          el("div", { class: "en", style: { fontSize: "22px" }, text: k.mean }),
          isBack && el("div", { class: "mid", text: k.ch }),
          isBack && el("div", { class: "rom", style: { fontSize: "17px" } }, `音 ${k.on || "—"}　訓 ${k.kun || "—"}`),
          isBack && k.words[0] && el("div", { class: "mn", html: `${esc(k.words[0].w)}（${esc(k.words[0].r)}）— ${esc(k.words[0].g)}` }),
          !isBack && el("div", { class: "sub", text: "which kanji?" }));
  }
  const w = it.o;
  return showJp
    ? el("div", {}, w.ic && el("div", { style: { fontSize: "48px" }, text: w.ic }),
        el("div", { class: "mid", html: furi(w.form, isBack ? "on" : "off") }),
        isBack && el("div", { class: "rom", style: { fontSize: "18px" }, text: kanaToRomaji(w.kana) }))
    : el("div", {}, el("div", { class: "en", style: { fontSize: "22px" }, text: w.en }),
        isBack && el("div", { class: "mid", html: furi(w.form, "on") }),
        isBack && w.ex && el("div", { class: "mn", html: furi(w.ex.jp, "on") }),
        !isBack && el("div", { class: "sub", text: "say it in Japanese" }));
}

/* ==========================================================================
   MINI-GAMES, PART B
   ========================================================================== */
const GAMES_B = [
  { id:"counter",  ji:"助", name:"Counter drill",     blurb:"Three apples or three pens? Japanese wants a different word for each. The wall everyone hits." },
  { id:"memory",   ji:"神", name:"Memory (神経衰弱)", blurb:"The card game every Japanese kid grows up on. Flip two, find the pair." },
  { id:"shiritori",ji:"尻", name:"Shiritori",         blurb:"Word chain. Your word must start with the last kana of mine. End on ん and you lose." },
  { id:"oddone",   ji:"仲", name:"Odd one out",       blurb:"Three belong together, one doesn't. Trains meaning, not just translation." },
  { id:"dialogue", ji:"会", name:"Read the room",     blurb:"Same sentence, three registers. Pick the one that fits who you're talking to." },
  { id:"numbers",  ji:"数", name:"Numbers & time",    blurb:"よじ or よんじ? はっぴゃく or はちひゃく? The readings that never quite stick." },
  { id:"group",    ji:"組", name:"Verb sorter",       blurb:"Godan, ichidan, or irregular. Get this reflex fast and conjugation stops being work." }
];

GAMES.push(...GAMES_B);


/* ==========================================================================
   COUNTER DRILL
   ========================================================================== */
const COUNTED = [
  ["🍎","りんご","tsu"],["🍊","みかん","tsu"],["🧊","こおり","tsu"],["🍰","ケーキ","tsu"],
  ["👤","がくせい","nin"],["👥","ともだち","nin"],["👨‍👩‍👧","かぞく","nin"],["🧑‍🏫","せんせい","nin"],
  ["📄","かみ","mai"],["🎫","きっぷ","mai"],["👕","シャツ","mai"],["🍕","ピザ","mai"],["💳","カード","mai"],
  ["🖊️","ペン","hon"],["🌂","かさ","hon"],["🍌","バナナ","hon"],["🌳","き","hon"],["🍺","ビール","hon"],
  ["🐈","ねこ","hiki"],["🐕","いぬ","hiki"],["🐟","さかな","hiki"],["🐛","むし","hiki"],
  ["📚","ほん","satsu"],["📓","ノート","satsu"],["📖","じしょ","satsu"],
  ["🚗","くるま","dai"],["💻","パソコン","dai"],["🚲","じてんしゃ","dai"],["📺","テレビ","dai"],
  ["☕","コーヒー","hai"],["🍵","おちゃ","hai"],["🍚","ごはん","hai"],
  ["🥚","たまご","ko"],["🧴","せっけん","ko"],["🔋","でんち","ko"],
  ["👟","くつ","soku"],["🧦","くつした","soku"],
  ["🏠","いえ","ken"],["🏪","コンビニ","ken"],
  ["✉️","てがみ","tsuu"],["📧","メール","tsuu"]
];
function gCounter(host) {
  let score = 0, miss = 0, cur = null;
  const info = hud();
  const q = el("div", { class: "face card" });
  const answers = el("div", { class: "answers" });
  const why = el("div", { class: "card", style: { marginTop: "14px", display: "none" } });
  host.append(el("div", { class: "row", style: { marginBottom: "14px" } },
    el("a", { class: "btn sm ghost", href: "#/counters" }, "📖 Counter reference")), info, q, answers, why);

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(pct(score, score + miss) + "%", "accuracy")); }
  function ask() {
    why.style.display = "none";
    const [ic, noun, cid] = pick(COUNTED);
    const n = 1 + Math.floor(Math.random() * 10);
    const counter = COUNTERS.find(c => c.id === cid);
    const answer = counter.r[n - 1];
    const wrongs = sample(COUNTERS.filter(c => c.id !== cid), 3).map(c => c.r[n - 1]);
    cur = { answer, counter, noun, n };
    q.innerHTML = "";
    q.append(el("div", { style: { fontSize: "54px" }, text: ic.repeat(Math.min(n, 5)) }),
      el("div", { class: "mid", style: { fontFamily: "var(--hand)" }, text: noun }),
      el("div", { class: "en", text: `how do you count ${n} of these?` }));
    answers.innerHTML = "";
    shuffle([answer, ...wrongs]).forEach(o => {
      const b = el("button", { class: "ans jp", text: o });
      b.onclick = () => {
        if (o === answer) { b.classList.add("ok"); score++; Sfx.ok(); }
        else { b.classList.add("bad"); miss++; Sfx.no(); [...answers.children].find(x => x.textContent.trim() === answer)?.classList.add("ok"); }
        sync();
        why.style.display = "block"; why.innerHTML = "";
        why.append(el("div", { class: "eyebrow" }, plain(counter.c) + " — " + counter.what),
          el("p", { style: { fontFamily: "var(--hand)", fontSize: "21px" }, text: answer }),
          el("p", { class: "small", style: { marginTop: "8px" }, text: counter.note }),
          counter.irregular !== "none" && el("p", { class: "small mono", style: { marginTop: "6px", color: "var(--shu)" }, text: "irregular: " + counter.irregular }),
          el("div", { class: "row", style: { marginTop: "12px" } }, speakBtn(answer + noun), el("button", { class: "btn sm pri", onclick: ask }, "Next →")));
      };
      answers.append(b);
    });
  }
  sync(); ask();
}


/* ==========================================================================
   MEMORY  —  神経衰弱
   ========================================================================== */
function gMemory(host) {
  let src = "greet", pairs = 6, flipped = [], locked = false, found = 0, tries = 0, t0 = 0;
  const info = hud();
  const board = el("div", { class: "board" });
  host.append(deckPicker(v => { src = v; start(); }, src), info, board);

  function sync() { info.innerHTML = ""; info.append(stat(found, "pairs"), stat(tries, "flips"), el("span", { class: "small muted", text: "Match the Japanese to its meaning." })); }
  function start() {
    const pool = poolFor(src);
    if (pool.length < pairs) { board.innerHTML = ""; board.append(empty("空", "Not enough words in that deck.")); return; }
    const picks = sample(pool, pairs);
    found = 0; tries = 0; flipped = []; locked = false; t0 = Date.now();
    const cards = shuffle([...picks.map(p => ({ k: p.id, t: p.jp, ic: p.ic })), ...picks.map(p => ({ k: p.id, t: p.en, en: true }))]);
    board.innerHTML = "";
    for (const c of cards) {
      const face = el("span", { style: { opacity: "0", transition: "opacity 160ms" } },
        c.ic && !c.en ? el("span", { style: { fontSize: "22px", display: "block" }, text: c.ic }) : null, c.t);
      const tile = el("button", { class: "tile" + (c.en ? " en" : ""), style: { color: "var(--sumi-3)" } },
        el("span", { class: "back", style: { position: "absolute", fontFamily: "var(--hand)", fontSize: "26px", opacity: ".5" }, text: "裏" }), face);
      tile.style.position = "relative";
      tile.onclick = () => hit(tile, face, c);
      board.append(tile);
    }
    sync();
  }
  function hit(tile, face, c) {
    if (locked || tile.classList.contains("ok") || flipped.some(f => f.tile === tile)) return;
    tile.querySelector(".back").style.opacity = "0";
    face.style.opacity = "1"; tile.style.color = "";
    flipped.push({ tile, face, c }); Sfx.tick();
    if (flipped.length < 2) return;
    tries++; locked = true; sync();
    const [a, b] = flipped;
    if (a.c.k === b.c.k && a.c.en !== b.c.en) {
      a.tile.classList.add("ok"); b.tile.classList.add("ok");
      found++; Sfx.ok(); flipped = []; locked = false; sync();
      if (found === pairs) {
        const secs = Math.round((Date.now() - t0) / 1000);
        setTimeout(() => { board.innerHTML = ""; info.innerHTML = "";
          board.append(endCard("すべて そろいました。", [`${secs} seconds, ${tries} flips for ${pairs} pairs.`,
            tries <= pairs + 2 ? "That's very close to a perfect memory run." : ""], start)); }, 500);
      }
    } else {
      a.tile.classList.add("bad"); b.tile.classList.add("bad"); Sfx.no();
      setTimeout(() => {
        for (const f of [a, b]) {
          f.tile.classList.remove("bad"); f.face.style.opacity = "0";
          f.tile.querySelector(".back").style.opacity = ".5"; f.tile.style.color = "var(--sumi-3)";
        }
        flipped = []; locked = false;
      }, 850);
    }
  }
  start();
}


/* ==========================================================================
   SHIRITORI  —  しりとり
   ========================================================================== */
const SMALL_MAP = { "ゃ":"や","ゅ":"ゆ","ょ":"よ","ぁ":"あ","ぃ":"い","ぅ":"う","ぇ":"え","ぉ":"お","っ":"つ" };
function lastKanaOf(word) {
  let w = toHira(word).replace(/[ー・\s]+$/, "");
  let c = w.slice(-1);
  if (SMALL_MAP[c]) c = SMALL_MAP[c];
  return c;
}
function shiritoriPool() {
  const seen = new Set(), out = [];
  for (const v of VOCAB) {
    const k = toHira(v.kana).replace(/[^ぁ-ん]/g, "");
    if (k.length < 2 || seen.has(k)) continue;
    seen.add(k);
    out.push({ k, en: v.en, form: v.form });
  }
  return out;
}
function gShiritori(host) {
  const pool = shiritoriPool();
  const byFirst = {};
  for (const w of pool) { if (w.k.endsWith("ん")) continue; (byFirst[w.k[0]] ||= []).push(w); }
  let chain = [], used = new Set(), turn = 0, over = false;

  const info = hud();
  const chainBox = el("div", { class: "card", style: { minHeight: "120px" } });
  const need = el("div", { class: "center", style: { margin: "16px 0 8px" } });
  const input = el("input", { class: "type-in", placeholder: "romaji → kana", autocomplete: "off", autocapitalize: "off", spellcheck: "false" });
  const hint = el("div", { class: "imehint" });
  const ctl = el("div", { class: "row", style: { justifyContent: "center", marginTop: "12px" } });
  host.append(el("div", { class: "card", style: { marginBottom: "16px" } },
    el("p", { class: "small", html: "<b>Rules.</b> Your word has to start with the last kana of mine. No repeats. Any word ending in <b>ん</b> loses on the spot — which is why nobody ever plays it deliberately, and why it's the first thing every Japanese child learns about the letter." })),
    info, chainBox, need, input, hint, ctl);

  function sync() { info.innerHTML = ""; info.append(stat(chain.length, "words in the chain"), stat(turn, "your turns")); }
  function paintChain() {
    chainBox.innerHTML = "";
    if (!chain.length) { chainBox.append(el("p", { class: "small muted", text: "I'll start." })); return; }
    const row = el("div", { class: "row", style: { gap: "6px", alignItems: "center" } });
    chain.slice(-14).forEach((w, i) => {
      if (i) row.append(el("span", { class: "muted", text: "→" }));
      row.append(el("span", { class: "chip" + (w.mine ? "" : " on"), title: w.en },
        el("span", { style: { fontFamily: "var(--hand)", fontSize: "16px" }, text: w.k })));
    });
    chainBox.append(row);
    const last = chain.at(-1);
    chainBox.append(el("p", { class: "small muted", style: { marginTop: "10px" }, text: `${last.k} — ${last.en}` }));
  }
  function needKana() {
    const c = lastKanaOf(chain.at(-1).k);
    need.innerHTML = "";
    need.append(el("span", { class: "small muted", text: "your word must start with " }),
      el("b", { style: { fontFamily: "var(--hand)", fontSize: "30px", color: "var(--shu)" }, text: c }));
    return c;
  }
  function botMove(startK) {
    const cands = (byFirst[startK] || []).filter(w => !used.has(w.k));
    if (!cands.length) return null;
    return pick(cands);
  }
  function play(w, mine) {
    chain.push({ ...w, mine }); used.add(w.k);
    paintChain();
  }
  function submit() {
    if (over) return;
    const want = lastKanaOf(chain.at(-1).k);
    const guess = toHira(hint.textContent || input.value).replace(/[^ぁ-ん]/g, "");
    if (!guess) return;
    if (guess[0] !== want) { flash(`It has to start with ${want}.`); return; }
    if (used.has(guess)) { flash("Already used that one."); return; }
    if (guess.endsWith("ん")) { play({ k: guess, en: "…ends in ん" }, true); return lose("Your word ended in ん."); }
    const found = pool.find(w => w.k === guess);
    if (!found) { flash("I don't know that word — try another."); return; }
    play(found, true); turn++; sync();
    input.value = ""; hint.textContent = "";
    const nxt = botMove(lastKanaOf(found.k));
    if (!nxt) return win();
    setTimeout(() => { play(nxt, false); needKana(); Speech.say(nxt.k); }, 450);
  }
  function flash(msg) { input.classList.add("bad"); toast(msg); Sfx.no(); setTimeout(() => input.classList.remove("bad"), 400); }
  function lose(why) {
    over = true; input.disabled = true; Sfx.no();
    ctl.innerHTML = ""; need.innerHTML = "";
    ctl.append(endCard("まけ! " + why, [`The chain reached ${chain.length} words.`], start));
  }
  function win() {
    over = true; input.disabled = true; Sfx.ok();
    ctl.innerHTML = ""; need.innerHTML = "";
    ctl.append(endCard("かち! I ran out of words.", [`You got the chain to ${chain.length} words over ${turn} turns.`], start));
  }
  input.addEventListener("input", () => { hint.textContent = romajiToKana(input.value); });
  input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });

  function start() {
    chain = []; used = new Set(); turn = 0; over = false;
    input.disabled = false; input.value = ""; hint.textContent = "";
    ctl.innerHTML = "";
    ctl.append(el("button", { class: "btn pri", onclick: submit }, "Play it"),
      el("button", { class: "btn ghost", onclick: () => { const c = lastKanaOf(chain.at(-1).k); const s = botMove(c); toast(s ? "Try something like " + s.k : "I can't think of one either."); } }, "Hint"),
      el("button", { class: "btn ghost", onclick: start }, "Restart"));
    play(pick(pool.filter(w => !w.k.endsWith("ん") && w.k.length >= 3)), false);
    needKana(); sync(); input.focus();
  }
  start();
}


/* ==========================================================================
   ODD ONE OUT
   ========================================================================== */
function gOddOne(host) {
  let score = 0, miss = 0;
  const info = hud();
  const q = el("div", { class: "card center", style: { padding: "18px" } });
  const answers = el("div", { class: "answers" });
  const why = el("div", { class: "card", style: { marginTop: "14px", display: "none" } });
  host.append(info, q, answers, why);
  const usable = DECKS.filter(d => VOCAB_BY_DECK(d.id).length >= 6);

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(pct(score, score + miss) + "%", "accuracy")); }
  function ask() {
    why.style.display = "none";
    const [home, away] = sample(usable, 2);
    const three = sample(VOCAB_BY_DECK(home.id), 3);
    const odd = pick(VOCAB_BY_DECK(away.id));
    const opts = shuffle([...three, odd]);
    q.innerHTML = "";
    q.append(el("div", { class: "eyebrow" }, "Which one doesn't belong?"),
      el("p", { class: "small muted", text: "Three of these are the same kind of thing." }));
    answers.innerHTML = "";
    opts.forEach(o => {
      const b = el("button", { class: "ans jp" },
        el("span", {}, o.ic && el("span", { style: { marginRight: "8px" }, text: o.ic }),
          el("span", { style: { fontFamily: "var(--hand)" }, text: plain(o.form) }),
          el("span", { class: "small muted", style: { fontFamily: "var(--jp)", marginLeft: "10px" }, text: o.en })));
      b.onclick = () => {
        if (o === odd) { b.classList.add("ok"); score++; Sfx.ok(); }
        else { b.classList.add("bad"); miss++; Sfx.no(); [...answers.children][opts.indexOf(odd)].classList.add("ok"); }
        sync();
        why.style.display = "block"; why.innerHTML = "";
        why.append(el("div", { class: "eyebrow" }, "The odd one"),
          el("p", { html: `<b>${esc(plain(odd.form))}</b> — ${esc(odd.en)} — belongs to <b>${esc(away.en)}</b>.` }),
          el("p", { class: "small muted", style: { marginTop: "6px" }, text: `The other three are all ${home.en.toLowerCase()}.` }),
          el("div", { class: "row", style: { marginTop: "12px" } }, el("button", { class: "btn sm pri", onclick: ask }, "Next →")));
      };
      answers.append(b);
    });
  }
  sync(); ask();
}


/* ==========================================================================
   READ THE ROOM  —  register choice
   ========================================================================== */
const ROOMS = [
  { k:"casual", who:"your roommate", ic:"🧑‍🤝‍🧑", note:"Close friend, same age. Plain form is right; polite form here would sound stiff and put distance between you." },
  { k:"polite", who:"a classmate you've just met", ic:"🎓", note:"Default setting for strangers, classmates, shop staff. Nobody is ever offended by です／ます." },
  { k:"keigo",  who:"a client at your internship", ic:"💼", note:"Customers, clients, and anyone senior in a business setting. Humble forms for what you do, honorific forms for what they do." }
];
function gDialogue(host) {
  let score = 0, miss = 0;
  const info = hud();
  const q = el("div", { class: "card" });
  const answers = el("div", { class: "answers" });
  const why = el("div", { class: "card", style: { marginTop: "14px", display: "none" } });
  host.append(info, q, answers, why);
  const lines = [];
  for (const s of SITUATIONS) for (const l of s.lines)
    if (l.casual && l.polite && l.keigo && l.casual !== "—" && l.polite !== "—" && l.keigo !== "—"
        && new Set([l.casual, l.polite, l.keigo]).size === 3) lines.push({ ...l, sit: s });
  if (!lines.length) { host.append(empty("空", "No three-register lines available.")); return; }

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(pct(score, score + miss) + "%", "accuracy")); }
  function ask() {
    why.style.display = "none";
    const line = pick(lines), room = pick(ROOMS);
    q.innerHTML = "";
    q.append(el("div", { class: "eyebrow" }, line.sit.ic + "  " + line.sit.en),
      el("div", { class: "row", style: { gap: "12px", alignItems: "center", margin: "8px 0" } },
        el("span", { style: { fontSize: "30px" }, text: room.ic }),
        el("div", {}, el("b", { style: { display: "block" }, text: "You're talking to " + room.who + "." }),
          el("span", { class: "small muted", text: "You want to say: " + line.en }))));
    answers.innerHTML = "";
    const opts = shuffle([["casual", line.casual], ["polite", line.polite], ["keigo", line.keigo]]);
    opts.forEach(([k, say]) => {
      const b = el("button", { class: "ans jp" }, el("span", { html: furi(say, "on") }));
      b.onclick = () => {
        if (k === room.k) { b.classList.add("ok"); score++; Sfx.ok(); }
        else { b.classList.add("bad"); miss++; Sfx.no(); [...answers.children][opts.findIndex(o => o[0] === room.k)].classList.add("ok"); }
        sync();
        why.style.display = "block"; why.innerHTML = "";
        why.append(el("div", { class: "eyebrow" }, "Why " + room.k),
          el("p", { class: "small", text: room.note }),
          el("div", { class: "ladder", style: { marginTop: "12px" } },
            ["casual", "polite", "keigo"].map(lv => el("div", { class: "rung " + lv },
              el("span", { class: "lvl", text: lv }),
              el("span", { class: "say", html: furi(line[lv], "on") })))),
          line.note && el("p", { class: "small", style: { marginTop: "10px" } }, el("b", { style: { color: "var(--shu)" }, text: "note  " }), line.note),
          el("div", { class: "row", style: { marginTop: "12px" } }, speakBtn(line[room.k]), el("button", { class: "btn sm pri", onclick: ask }, "Next →")));
      };
      answers.append(b);
    });
  }
  sync(); ask();
}


/* ==========================================================================
   NUMBERS & TIME
   ========================================================================== */
function gNumbers(host) {
  let score = 0, miss = 0, mode = "num";
  const modeRow = el("div", { class: "row", style: { marginBottom: "14px" } });
  const info = hud();
  const q = el("div", { class: "face card" });
  const answers = el("div", { class: "answers" });
  host.append(modeRow, info, q, answers);
  for (const [m, lab] of [["num", "数 Numbers"], ["time", "時 Time"], ["date", "日 Dates"]]) {
    modeRow.append(el("button", { class: "chip" + (mode === m ? " on" : ""), text: lab,
      onclick: e => { mode = m; [...modeRow.children].forEach(c => c.classList.remove("on")); e.currentTarget.classList.add("on"); ask(); } }));
  }
  const ji = COUNTERS.find(c => c.id === "ji"), fun = COUNTERS.find(c => c.id === "fun"), nichi = COUNTERS.find(c => c.id === "nichi");

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), stat(pct(score, score + miss) + "%", "accuracy")); }
  function ask() {
    let prompt, answer, wrongs;
    if (mode === "num") {
      const [n, r] = pick(NUMBERS);
      prompt = Number(n).toLocaleString("en-US"); answer = r;
      wrongs = sample(NUMBERS.filter(x => x[1] !== r), 3).map(x => x[1]);
    } else if (mode === "time") {
      const h = 1 + Math.floor(Math.random() * 10), m = pick([0, 1, 3, 4, 6, 8, 10]);
      prompt = `${h}:${String(m * 5 % 60).padStart(2, "0")}`;
      answer = ji.r[h - 1] + (m ? fun.r[m - 1].replace(/^.*?(?=[いにさよごろなはきじ])/, "") : "");
      answer = ji.r[h - 1] + (m ? " " + fun.r[m - 1] : "");
      prompt = m ? `${h}時${m}分` : `${h}時`;
      wrongs = sample([1,2,3,4,5,6,7,8,9,10].filter(x => x !== h), 3).map(x => ji.r[x - 1] + (m ? " " + fun.r[m - 1] : ""));
    } else {
      const d = 1 + Math.floor(Math.random() * 10);
      prompt = d + "日"; answer = nichi.r[d - 1];
      wrongs = sample([1,2,3,4,5,6,7,8,9,10].filter(x => x !== d), 3).map(x => nichi.r[x - 1]);
    }
    q.innerHTML = "";
    q.append(el("div", { class: "big", style: { fontFamily: "var(--mono)", fontSize: "clamp(40px,11vw,72px)" }, text: prompt }),
      el("div", { class: "sub", text: mode === "num" ? "read this number" : mode === "time" ? "read this time" : "read this date" }));
    answers.innerHTML = "";
    const opts = shuffle([answer, ...wrongs]);
    opts.forEach(o => {
      const b = el("button", { class: "ans jp", text: o });
      b.onclick = () => {
        if (o === answer) { b.classList.add("ok"); score++; Sfx.ok(); setTimeout(ask, 380); }
        else { b.classList.add("bad"); miss++; Sfx.no(); [...answers.children][opts.indexOf(answer)].classList.add("ok"); setTimeout(ask, 1500); }
        sync();
      };
      answers.append(b);
    });
  }
  sync(); ask();
}


/* ==========================================================================
   VERB SORTER
   ========================================================================== */
function gGroup(host) {
  let score = 0, miss = 0, cur = null, streak = 0;
  const info = hud();
  const q = el("div", { class: "face card" });
  const answers = el("div", { class: "answers" });
  const why = el("div", { class: "card", style: { marginTop: "14px", display: "none" } });
  host.append(el("div", { class: "card", style: { marginBottom: "16px" } },
    el("p", { class: "small", html: "<b>The test.</b> If it ends in something other than る, it's godan. If it ends in る, look at the vowel before it: いる or える usually means ichidan, anything else means godan. Then memorise the handful of liars — 帰{かえ}る, 入{はい}る, 走{はし}る, 知{し}る, 切{き}る all <i>look</i> ichidan and aren't." })),
    info, q, answers, why);

  function sync() { info.innerHTML = ""; info.append(stat(score, "right"), stat(miss, "wrong"), streak > 2 ? el("div", { class: "stat" }, el("b", { class: "combo", text: "×" + streak }), el("span", { text: "streak" })) : null); }
  function ask() {
    why.style.display = "none";
    const [kana, disp, en, grp] = pick(VERBS);
    cur = { kana, disp, en, grp };
    q.innerHTML = "";
    q.append(el("div", { class: "mid", html: furi(disp, "on") }),
      el("div", { class: "en", text: en }));
    answers.innerHTML = "";
    const labels = { 1: "五段 Godan (u-verb)", 2: "一段 Ichidan (ru-verb)", 3: "不規則 Irregular" };
    [1, 2, 3].forEach(g => {
      const b = el("button", { class: "ans", text: labels[g] });
      b.onclick = () => {
        if (g === grp) { b.classList.add("ok"); score++; streak++; Sfx.ok(); }
        else { b.classList.add("bad"); miss++; streak = 0; Sfx.no(); [...answers.children][grp - 1].classList.add("ok"); }
        sync();
        why.style.display = "block"; why.innerHTML = "";
        const tricky = ["かえる", "はいる", "はしる", "しる", "きる"].includes(kana);
        why.append(el("div", { class: "eyebrow" }, labels[grp]),
          el("p", { class: "mono small" }, `${kana} → ます形 ${conj(kana, grp, "masu")}　て形 ${conj(kana, grp, "te")}　ない形 ${conj(kana, grp, "nai")}`),
          tricky && el("p", { class: "small", style: { marginTop: "8px", color: "var(--shu)" }, html: "<b>Watch this one.</b> It ends in いる or える but is godan anyway. There are only about a dozen of these and they're all common, so learn them as a set." }),
          el("div", { class: "row", style: { marginTop: "12px" } }, speakBtn(kana), el("button", { class: "btn sm pri", onclick: ask }, "Next →")));
      };
      answers.append(b);
    });
  }
  sync(); ask();
}

/* ==========================================================================
   REFERENCE PAGES & QUALITY-OF-LIFE
   ========================================================================== */
function viewReference() {
  const v = $("#view");
  v.append(page("さんこう", "Reference", "表",
    "The three things that make people quit: counters, the colour/adjective split, and Japanese grouping large numbers by ten thousand instead of a thousand. All three are patterns, not lists."));
  v.append(el("div", { class: "grid g3" },
    tile("助", "Counters", `${COUNTERS.length} counters, every reading 1–10`, "#/counters"),
    tile("色", "Colours", "Swatches, and which ones are adjectives", "#/colors"),
    tile("数", "Numbers", "Through 億, with the sound changes", "#/numbers"),
    tile("文", "Grammar", `${GRAMMAR_ALL().length} patterns, N5 → N1 + literary`, "#/grammar"),
    tile("話", "Phrase packs", "Casual · polite · keigo", "#/phrases"),
    tile("字", "Kanji table", `${KJ.size.toLocaleString()} kanji with stroke order`, "#/kanji"),
    tile("辞", "Dictionary", "23,000+ words, conjugations too", "#/dict"),
    tile("和", "Culture notes", "Bowing, shoes, gifts, trains", "#/culture"),
    tile("🖨", "Practice sheets", "Printable genkō-yōshi", "#/print")));
}

/* ---- counters ------------------------------------------------------------ */
function viewCounters() {
  const v = $("#view");
  v.append(el("div", { class: "row", style: { marginBottom: "12px" } }, backLink("#/reference", "Reference")));
  v.append(page("じょすうし", "Counters", "助",
    "Japanese won't let you say \"three\" without saying what kind of three. Here are the eighteen you'll actually meet, with every reading from one to ten and the irregular ones flagged in red."));

  v.append(el("div", { class: "card" },
    el("div", { class: "eyebrow" }, "Why they're irregular"),
    el("div", { class: "small", html: COUNTER_RULE.replace(/\n\n/g, "<br><br>").replace(/\*\*(.+?)\*\*/g, "<b>$1</b>") })));

  v.append(el("div", { class: "row", style: { margin: "20px 0" } },
    el("a", { class: "btn pri sm", href: "#/game/counter" }, "Drill counters"),
    el("a", { class: "btn ghost sm", href: "#/deck/count" }, "Counter vocabulary"),
    el("a", { class: "btn ghost sm", href: "#/game/numbers" }, "Numbers & time drill")));

  for (const c of COUNTERS) {
    const card = el("div", { class: "card", style: { marginBottom: "14px" } });
    card.append(el("div", { class: "spread", style: { alignItems: "flex-start" } },
      el("div", { class: "row", style: { gap: "12px", alignItems: "center" } },
        el("span", { style: { fontSize: "24px" }, text: c.ic }),
        el("div", {},
          el("div", { style: { fontFamily: "var(--hand)", fontSize: "24px" }, html: furi(c.c, "on") }),
          el("div", { class: "small muted", text: c.what }))),
      el("div", { class: "row", style: { gap: "8px" } },
        el("span", { class: "mono tiny muted", html: furi(c.q, "off") }, ),
        speakBtn(plain(c.r[2])))));
    const grid = el("div", { class: "pickgrid wide", style: { marginTop: "12px" } });
    c.r.forEach((r, i) => {
      const odd = c.irregular !== "none" && irregularAt(c, i);
      grid.append(el("div", { class: "masu", style: { padding: "8px 4px", textAlign: "center", borderColor: odd ? "var(--shu)" : "" } },
        el("div", { class: "mono tiny muted", text: String(i + 1) }),
        el("div", { style: { fontFamily: "var(--hand)", fontSize: "15px", color: odd ? "var(--shu)" : "" }, text: r })));
    });
    card.append(grid);
    card.append(el("p", { class: "small", style: { marginTop: "12px", color: "var(--sumi-2)" }, text: c.note }));
    if (c.irregular !== "none")
      card.append(el("p", { class: "mono tiny", style: { marginTop: "6px", color: "var(--shu)" }, text: "irregular: " + c.irregular }));
    v.append(card);
  }
}
/* a reading is "irregular" if it doesn't start with the plain number reading */
function irregularAt(c, i) {
  const plainN = ["いち","に","さん","よん","ご","ろく","なな","はち","きゅう","じゅう"][i];
  return !c.r[i].startsWith(plainN.slice(0, 2)) || /っ|ぱ|ぴ|ぷ|ぺ|ぽ|ば|び|ぶ|べ|ぼ|が|ぎ|ぐ|げ|ご/.test(c.r[i].slice(1, 4));
}

/* ---- colours ------------------------------------------------------------- */
function viewColors() {
  const v = $("#view");
  v.append(el("div", { class: "row", style: { marginBottom: "12px" } }, backLink("#/reference", "Reference")));
  v.append(page("いろ", "Colours", "色",
    "Sixteen colours with swatches — and the rule that trips everyone up, which is that most Japanese colours are nouns, not adjectives."));

  v.append(el("div", { class: "card" },
    el("div", { class: "eyebrow" }, "The の rule"),
    el("div", { class: "small", html: COLOR_NOTE.replace(/\n\n/g, "<br><br>").replace(/「(.+?)」/g, "<b>「$1」</b>") })));

  const g = el("div", { class: "grid g4", style: { marginTop: "20px" } });
  for (const c of COLORS) {
    const isAdj = !c.adj.startsWith("—");
    g.append(el("button", { class: "card", style: { padding: "0", overflow: "hidden", textAlign: "left" },
      onclick: () => Speech.say(c.kana, { force: true }) },
      el("div", { style: { height: "74px", background: c.hex, borderBottom: "1px solid var(--grid)" } }),
      el("div", { style: { padding: "11px 13px" } },
        el("div", { style: { fontFamily: "var(--hand)", fontSize: "19px" }, html: furi(c.jp, "on") }),
        el("div", { class: "small muted", text: c.en }),
        el("div", { class: "mono tiny", style: { marginTop: "6px", color: isAdj ? "var(--matcha)" : "var(--sumi-3)" },
          text: isAdj ? "adjective · " + c.adj : "noun · needs の" }))));
  }
  v.append(g);

  v.append(sec("See it in use", null, el("div", { class: "card" },
    el("div", { class: "lst" },
      [["赤{あか}いりんご", "a red apple", "adjective — attaches directly"],
       ["緑{みどり}のかばん", "a green bag", "noun — needs の"],
       ["この車{くるま}は白{しろ}いです。", "This car is white.", "adjective as predicate"],
       ["この車{くるま}はピンクです。", "This car is pink.", "noun as predicate — no い"],
       ["信{しん}号{ごう}が青{あお}になりました。", "The light turned green.", "青 covers green here"]].map(([jp, en, note]) =>
        el("div", { class: "li", style: { cursor: "default" } },
          el("span", { class: "body" },
            el("b", { style: { fontFamily: "var(--hand)", fontSize: "18px", fontWeight: "400" }, html: furi(jp, "on") }),
            el("span", { text: en + " — " + note })),
          speakBtn(jp)))))));
  v.append(el("div", { class: "row", style: { marginTop: "18px" } },
    el("a", { class: "btn pri sm", href: "#/deck/color" }, "Colour deck"),
    el("a", { class: "btn ghost sm", href: "#/read/r-iro" }, "Read: あかい あおい")));
}

/* ---- numbers ------------------------------------------------------------- */
function viewNumbers() {
  const v = $("#view");
  v.append(el("div", { class: "row", style: { marginBottom: "12px" } }, backLink("#/reference", "Reference")));
  v.append(page("すうじ", "Numbers", "数",
    "Counting to ten is the easy part. The hard part is that Japanese groups by ten thousand, so a million is 百万 — a hundred ten-thousands."));

  v.append(el("div", { class: "card" },
    el("div", { class: "eyebrow" }, "The grouping problem"),
    el("div", { class: "small", html: NUMBER_NOTE.replace(/\n\n/g, "<br><br>") })));

  const grid = el("div", { class: "pickgrid wide", style: { marginTop: "20px" } });
  for (const [n, r] of NUMBERS) {
    grid.append(el("button", { class: "masu", style: { padding: "10px 6px", textAlign: "center" },
      onclick: () => Speech.say(r.split(" / ")[0], { force: true }) },
      el("div", { class: "mono", style: { fontSize: "13px", color: "var(--ai-2)" }, text: Number(n).toLocaleString("en-US") }),
      el("div", { style: { fontFamily: "var(--hand)", fontSize: "15px", marginTop: "3px" }, text: r })));
  }
  v.append(sec("Readings", NUMBERS.length, grid));

  v.append(sec("The three you'll use every day", null, el("div", { class: "grid g3" },
    [["ji", "Telling the time"], ["fun", "Minutes"], ["nichi", "Days of the month"]].map(([id, lab]) => {
      const c = COUNTERS.find(x => x.id === id);
      return el("a", { class: "card", href: "#/counters", style: { textDecoration: "none", color: "inherit" } },
        el("div", { class: "eyebrow" }, lab),
        el("div", { style: { fontFamily: "var(--hand)", fontSize: "15px", lineHeight: "2" }, text: c.r.join("・") }),
        el("div", { class: "mono tiny", style: { marginTop: "8px", color: "var(--shu)" }, text: c.irregular }));
    }))));
  v.append(el("div", { class: "row", style: { marginTop: "18px" } },
    el("a", { class: "btn pri sm", href: "#/game/numbers" }, "Drill numbers & time"),
    el("a", { class: "btn ghost sm", href: "#/deck/num" }, "Number vocabulary"),
    el("a", { class: "btn ghost sm", href: "#/read/r-kazu" }, "Read: かず")));
}


/* ==========================================================================
   STARRED ITEMS
   ========================================================================== */
const isStar = id => !!(Store.d.fav || {})[id];
function toggleStar(id) {
  Store.d.fav ||= {};
  if (Store.d.fav[id]) delete Store.d.fav[id]; else Store.d.fav[id] = Date.now();
  Store.save();
  return isStar(id);
}
function starBtn(id) {
  const b = el("button", { class: "btn sm ghost", title: "Star this" }, isStar(id) ? "★ Starred" : "☆ Star");
  b.onclick = () => { const on = toggleStar(id); b.textContent = on ? "★ Starred" : "☆ Star"; Sfx.tick(); toast(on ? "Starred." : "Unstarred."); };
  return b;
}
function viewStarred() {
  const v = $("#view");
  const ids = Object.keys(Store.d.fav || {});
  const items = ids.map(itemById).filter(Boolean);
  v.append(page("おきにいり", "Starred", "★",
    "Anything you star anywhere in the app lands here. It's the pile of things you personally keep getting wrong, which is usually a better study list than any deck."));
  if (!items.length) {
    v.append(empty("☆", "Nothing starred yet. Tap ☆ Star on any kana, kanji, or word.",
      el("a", { class: "btn", href: "#/decks" }, "Browse decks")));
    return;
  }
  v.append(el("div", { class: "row", style: { marginBottom: "18px" } },
    el("button", { class: "btn pri", onclick: () => runFlash(items, "starred") }, `Study all ${items.length}`),
    el("button", { class: "btn ghost sm", onclick: () => {
      modal("Clear all stars?", el("div", {},
        el("p", { text: "This removes every star. Your review schedule isn't affected." }),
        el("div", { class: "row", style: { marginTop: "14px" } },
          el("button", { class: "btn sm shu", onclick: () => { Store.d.fav = {}; Store.save(); $("#modalhost").innerHTML = ""; render(); } }, "Clear them"),
          el("button", { class: "btn sm ghost", onclick: () => $("#modalhost").innerHTML = "" }, "Keep them"))));
    } }, "Clear all")));
  const g = el("div", { class: "chart wide" });
  for (const it of items) {
    g.append(el("button", { class: "masu cell", title: shortOf(it), onclick: () => openItem(it) },
      el("i", { class: "lv", style: { "--f": SRS.strength(it.id).toFixed(2) } }),
      el("span", { class: "ch", style: { fontSize: ["vocab", "card", "grammar"].includes(it.type) ? "15px" : "" }, text: faceText(it).slice(0, 8) }),
      el("span", { class: "rm", text: shortOf(it).slice(0, 12) })));
  }
  v.append(g);
}


/* ==========================================================================
   GLOBAL SEARCH
   ========================================================================== */
let SEARCH_INDEX = null;
/* buildIndex() lives in 73-nav.js now (everything in the JLC edition). */
function openSearch() {
  const ix = buildIndex();
  const input = el("input", { class: "type-in", placeholder: "search anything — kana, kanji, meaning, romaji…",
    autocomplete: "off", spellcheck: "false",
    style: { fontFamily: "var(--jp)", fontSize: "17px", textAlign: "left", padding: "11px 14px" } });
  const hint = el("div", { class: "imehint", style: { minHeight: "20px" } });
  const results = el("div", { class: "lst", style: { marginTop: "12px", maxHeight: "52vh", overflowY: "auto" } });
  const body = el("div", {}, input, hint,
    el("p", { class: "tiny muted", style: { marginTop: "6px" }, text: "Type romaji and it converts as you go, so you can search Japanese without a Japanese keyboard." }),
    results);
  const close = modal("Search", body);
  let sel = 0, hits = [];

  function draw() {
    const raw = input.value.trim().toLowerCase();
    const kana = romajiToKana(input.value.trim());
    hint.textContent = kana && kana !== input.value.trim() ? kana : "";
    results.innerHTML = "";
    if (!raw) { results.append(el("p", { class: "small muted", style: { padding: "12px" }, text: "Start typing." })); hits = []; return; }
    hits = ix.filter(x => {
      const k = x.key.toLowerCase();
      return k.includes(raw) || (kana && (k.includes(kana) || k.includes(toKata(kana))));
    }).slice(0, 40);
    if (!hits.length) { results.append(el("p", { class: "small muted", style: { padding: "12px" }, text: "Nothing matches that." })); return; }
    hits.forEach((h, n) => {
      const row = el("button", { class: "li", style: n === sel ? { background: "var(--ai-wash)" } : {} },
        el("span", { class: "lead", style: { fontFamily: "var(--hand)", fontSize: "19px", minWidth: "2em", textAlign: "center" }, text: h.label.slice(0, 6) }),
        el("span", { class: "body" }, el("b", { text: h.label }), el("span", { text: h.sub })),
        el("span", { class: "trail" }, el("span", { class: "tag", text: h.t })));
      row.onclick = () => { close(); h.go(); };
      results.append(row);
    });
  }
  input.addEventListener("input", () => { sel = 0; draw(); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, hits.length - 1); draw(); results.children[sel]?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); results.children[sel]?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter" && hits[sel]) { close(); hits[sel].go(); }
  });
  draw();
  setTimeout(() => input.focus(), 60);
}


/* ==========================================================================
   WORD OF THE DAY
   ========================================================================== */
function wordOfTheDayMasu() {
  const seed = Math.floor(Date.now() / 864e5);
  const w = VOCAB[seed * 7919 % VOCAB.length];
  return el("div", { class: "card", style: { borderLeft: "3px solid var(--kincha)" } },
    el("div", { class: "spread" },
      el("div", { class: "eyebrow" }, "今日の言葉 · word of the day"),
      speakBtn(w.kana)),
    el("div", { class: "row", style: { gap: "14px", alignItems: "baseline", marginTop: "8px" } },
      w.ic && el("span", { style: { fontSize: "30px" }, text: w.ic }),
      el("span", { style: { fontFamily: "var(--hand)", fontSize: "27px" }, html: furi(w.form, "on") }),
      el("span", { class: "small muted", text: w.en })),
    w.ex && el("p", { class: "small", style: { marginTop: "10px", color: "var(--sumi-2)" }, html: furi(w.ex.jp, "on") + " <span style='opacity:.7'>— " + esc(w.ex.en) + "</span>" }),
    el("div", { class: "row", style: { marginTop: "12px" } },
      el("button", { class: "btn sm ghost", onclick: () => vocabSheet(w) }, "Full entry"),
      el("a", { class: "btn sm ghost", href: "#/deck/" + w.deck }, DECK_BY[w.deck]?.en || "Deck")));
}

/* past N5, the word of the day comes from the JLPT list one step above you */
function wordOfTheDay() {
  const lv = +SET().level;
  const jl = { 2: 5, 3: 4, 4: 3, 5: 2, 6: 1, 7: 1 }[lv];
  if (!jl) return wordOfTheDayMasu();
  const ids = DICT.level(jl);
  if (!ids.length) return wordOfTheDayMasu();
  const seed = Math.floor(Date.now() / 864e5);
  const e = DICT.entry(ids[(seed * 7919) % ids.length]);
  return el("div", { class: "card", style: { borderLeft: "3px solid var(--kincha)" } },
    el("div", { class: "spread" }, el("div", { class: "eyebrow" }, "今日の言葉 · word of the day · N" + jl), speakBtn(e.r || e.w)),
    el("div", { class: "row", style: { gap: "14px", alignItems: "baseline", marginTop: "8px" } },
      el("span", { style: { fontFamily: "var(--hand)", fontSize: "27px" }, html: furi(hasKanjiStr(e.w) && e.r !== e.w ? `｜${e.w}{${e.r}}` : e.w, "on") }),
      el("span", { class: "small muted", text: (e.s || e.m).split("; ").slice(0, 3).join("; ") })),
    el("div", { class: "row", style: { marginTop: "12px" } },
      el("button", { class: "btn sm ghost", onclick: () => lookupSheet({ surface: e.w, hits: [{ e, why: [] }] }) }, "Full entry"),
      el("a", { class: "btn sm ghost", href: "#/review/jlpt:" + jl }, "JLPT N" + jl + " cards")));
}

/* ==========================================================================
   DATA BLOCKS — the big datasets live in <script type="application/json">
   and <script type="text/plain"> tags so they cost nothing until a screen
   actually asks for them. Parsed once, then cached.
   ========================================================================== */
/* DATA is imported from ./data/loader.js */

/* ---- club info ------------------------------------------------------------ */
const CLUB = () => DATA.get("club") || { name: "Japanese Language Club", events: [] };
function parseYMD(s) { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); }
function daysUntil(s) {
  const t = parseYMD(s), n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((t - n) / 864e5);
}
function fmtDate(s, opts = { weekday: "short", month: "short", day: "numeric" }) {
  try { return parseYMD(s).toLocaleDateString("en-US", opts); } catch (e) { return s; }
}
function upcomingEvents(n = 99) {
  return (CLUB().events || []).filter(e => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, n);
}
function untilLabel(d) {
  return d === 0 ? "today" : d === 1 ? "tomorrow" : d < 0 ? `${-d} days ago` : `in ${d} days`;
}

/* ---- full jōyō kanji (2,136) merged with the hand-written N5/N4 entries ---- */
const KJ = (() => {
  let map = null, list = null;
  function build() {
    const rows = DATA.get("kanji") || [];
    map = new Map(); list = [];
    for (const [ch, mean, on, kun, strokes, grade, jlpt, freq] of rows) {
      const cur = KANJI_BY[ch];
      const o = {
        ch, mean: cur ? cur.mean : mean, meanAll: mean, on: cur ? cur.on : on, kun: cur ? cur.kun : kun,
        strokes: strokes || (cur && cur.strokes) || 0, grade: grade || 0,
        jlpt: (cur && cur.jlpt) || jlpt || 0, freq: freq || 0,
        words: cur ? cur.words : null, curated: !!cur
      };
      map.set(ch, o); list.push(o);
    }
    /* anything hand-written that isn't jōyō (rare) still belongs in the list */
    for (const k of KANJI) if (!map.has(k.ch)) { const o = { ...k, meanAll: k.mean, grade: 0, freq: 0, curated: true }; map.set(k.ch, o); list.push(o); }
  }
  return {
    get(ch) { if (!map) build(); return map.get(ch); },
    all() { if (!map) build(); return list; },
    get size() { if (!map) build(); return list.length; }
  };
})();
/* used by smart furigana: 5 = N5 … 1 = N1, 0 = not on any JLPT list */
function kanjiLevel(ch) {
  const k = KANJI_BY[ch];
  if (k) return k.jlpt;
  const f = KJ.get(ch);
  return f ? f.jlpt || 0 : 0;
}
const GRADE_LABEL = g => g >= 1 && g <= 6 ? "Grade " + g : g === 8 ? "Secondary school" : g === 9 || g === 10 ? "Jinmeiyō (names)" : "—";

/* ---- misc helpers used by the new screens --------------------------------- */
const debounce = (fn, ms = 160) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
function segButtons(opts, cur, on, cls = "seg") {
  const s = el("div", { class: cls });
  for (const [val, lab] of opts) s.append(el("button", { class: String(cur) === String(val) ? "on" : "", text: lab,
    onclick: e => { [...s.children].forEach(b => b.classList.remove("on")); e.currentTarget.classList.add("on"); on(val); } }));
  return s;
}
function chipToggle(label, on, fn) {
  const b = el("button", { class: "chip" + (on ? " on" : ""), "aria-pressed": on ? "true" : "false", text: label });
  b.onclick = () => { on = !on; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); fn(on); };
  return b;
}
function mdLite(s) {
  return esc(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/\*([^*]+)\*/g, "<i>$1</i>");
}
function download(name, text, type = "text/plain") {
  const blob = new Blob([text], { type: type + ";charset=utf-8" });
  const a = el("a", { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
/* "N3" style tag for any level 0..5 (0 = beyond the test) */
const lvTag = n => n ? jlptTag(n) : el("span", { class: "tag lit", text: "文語" });

/* fzstd 0.1.1 — Zstandard decompression in pure JS, used to open modern Anki .apkg files.
   Copyright (c) 2020 Arjun Barrett. MIT License: https://github.com/101arrowz/fzstd/blob/master/LICENSE */
!function(f){(typeof self!='undefined'?self:window).fzstd=f()}(function(){var _e={};"use strict";var r=ArrayBuffer,t=Uint8Array,e=Uint16Array,n=Int16Array,a=Uint32Array,s=Int32Array,i=function(r,e,n){if(t.prototype.slice)return t.prototype.slice.call(r,e,n);(null==e||e<0)&&(e=0),(null==n||n>r.length)&&(n=r.length);var a=new t(n-e);return a.set(r.subarray(e,n)),a},o=function(r,e,n,a){if(t.prototype.fill)return t.prototype.fill.call(r,e,n,a);for((null==n||n<0)&&(n=0),(null==a||a>r.length)&&(a=r.length);n<a;++n)r[n]=e;return r},u=function(r,e,n,a){if(t.prototype.copyWithin)return t.prototype.copyWithin.call(r,e,n,a);for((null==n||n<0)&&(n=0),(null==a||a>r.length)&&(a=r.length);n<a;)r[e++]=r[n++]};_e.ZstdErrorCode={InvalidData:0,WindowSizeTooLarge:1,InvalidBlockType:2,FSEAccuracyTooHigh:3,DistanceTooFarBack:4,UnexpectedEOF:5};var h=["invalid zstd data","window size too large (>2046MB)","invalid block type","FSE accuracy too high","match distance too far back","unexpected EOF"],f=function(r,t,e){var n=Error(t||h[r]);if(n.code=r,Error.captureStackTrace&&Error.captureStackTrace(n,f),!e)throw n;return n},l=function(r,t,e){for(var n=0,a=0;n<e;++n)a|=r[t++]<<(n<<3);return a},v=function(r,t){return(r[t]|r[t+1]<<8|r[t+2]<<16|r[t+3]<<24)>>>0},c=function(r,e){var n=r[0]|r[1]<<8|r[2]<<16;if(3126568==n&&253==r[3]){var a=r[4],i=a>>5&1,o=a>>2&1,u=3&a,h=a>>6;8&a&&f(0);var c=6-i,b=3==u?4:u,y=l(r,c,b),p=h?1<<h:i,w=l(r,c+=b,p)+(1==h&&256),g=w;if(!i){var d=1<<10+(r[5]>>3);g=d+(d>>3)*(7&r[5])}g>2145386496&&f(1);var m=new t((1==e?w||g:e?0:g)+12);return m[0]=1,m[4]=4,m[8]=8,{b:c+p,y:0,l:0,d:y,w:e&&1!=e?e:m.subarray(12),e:g,o:new s(m.buffer,0,3),u:w,c:o,m:Math.min(131072,g)}}if(25481893==(n>>4|r[3]<<20))return v(r,4)+8;f(0)},b=function(r){for(var t=0;1<<t<=r;++t);return t-1},y=function(a,s,i){var o=4+(s<<3),u=5+(15&a[s]);u>i&&f(3);for(var h=1<<u,l=h,v=-1,c=-1,y=-1,p=h,w=new r(512+(h<<2)),g=new n(w,0,256),d=new e(w,0,256),m=new e(w,512,h),z=512+(h<<1),E=new t(w,z,h),k=new t(w,z+h);v<255&&l>0;){var A=b(l+1),T=o>>3,x=(1<<A+1)-1,F=(a[T]|a[T+1]<<8|a[T+2]<<16)>>(7&o)&x,S=(1<<A)-1,B=x-l-1,I=F&S;if(I<B?(o+=A,F=I):(o+=A+1,F>S&&(F-=B)),g[++v]=--F,-1==F?(l+=F,E[--p]=v):l-=F,!F)do{var U=o>>3;c=(a[U]|a[U+1]<<8)>>(7&o)&3,o+=2,v+=c}while(3==c)}(v>255||l)&&f(0);for(var D=0,M=(h>>1)+(h>>3)+3,W=h-1,O=0;O<=v;++O){var j=g[O];if(j<1)d[O]=-j;else for(y=0;y<j;++y){E[D]=O;do{D=D+M&W}while(D>=p)}}for(D&&f(0),y=0;y<h;++y){var C=d[E[y]]++,H=k[y]=u-b(C);m[y]=(C<<H)-h}return[o+7>>3,{b:u,s:E,n:k,t:m}]},p=function(r,n){var a=0,s=-1,i=new t(292),u=r[n],h=i.subarray(0,256),l=i.subarray(256,268),v=new e(i.buffer,268);if(u<128){var c=y(r,n+1,6),p=c[1],w=c[0]<<3,g=r[n+=u];g||f(0);for(var d=0,m=0,z=p.b,E=z,k=(++n<<3)-8+b(g);!((k-=z)<w);){var A=k>>3;if(h[++s]=p.s[d+=(r[A]|r[A+1]<<8)>>(7&k)&(1<<z)-1],(k-=E)<w)break;h[++s]=p.s[m+=(r[A=k>>3]|r[A+1]<<8)>>(7&k)&(1<<E)-1],z=p.n[d],d=p.t[d],E=p.n[m],m=p.t[m]}++s>255&&f(0)}else{for(s=u-127;a<s;a+=2){var T=r[++n];h[a]=T>>4,h[a+1]=15&T}++n}var x=0;for(a=0;a<s;++a)(I=h[a])>11&&f(0),x+=I&&1<<I-1;var F=b(x)+1,S=1<<F,B=S-x;for(B&B-1&&f(0),h[s++]=b(B)+1,a=0;a<s;++a){var I;++l[h[a]=(I=h[a])&&F+1-I]}var U=new t(S<<1),D=U.subarray(0,S),M=U.subarray(S);for(v[F]=0,a=F;a>0;--a){var W=v[a];o(M,a,W,v[a-1]=W+l[a]*(1<<F-a))}for(v[0]!=S&&f(0),a=0;a<s;++a){var O=h[a];if(O){var j=v[O];o(D,a,j,v[O]=j+(1<<F-O))}}return[n,{n:M,b:F,s:D}]},w=y(new t([81,16,99,140,49,198,24,99,12,33,196,24,99,102,102,134,70,146,4]),0,6)[1],g=y(new t([33,20,196,24,99,140,33,132,16,66,8,33,132,16,66,8,33,68,68,68,68,68,68,68,68,36,9]),0,6)[1],d=y(new t([32,132,16,66,102,70,68,68,68,68,36,73,2]),0,5)[1],m=function(r,t){for(var e=r.length,n=new s(e),a=0;a<e;++a)n[a]=t,t+=1<<r[a];return n},z=new t(new s([0,0,0,0,16843009,50528770,134678020,202050057,269422093]).buffer,0,36),E=m(z,0),k=new t(new s([0,0,0,0,0,0,0,0,16843009,50528770,117769220,185207048,252579084,16]).buffer,0,53),A=m(k,3),T=function(r,t,e){var n=r.length,a=t.length,s=r[n-1],i=(1<<e.b)-1,o=-e.b;s||f(0);for(var u=0,h=e.b,l=(n<<3)-8+b(s)-h,v=-1;l>o&&v<a;){var c=l>>3;t[++v]=e.s[u=(u<<h|(r[c]|r[c+1]<<8|r[c+2]<<16)>>(7&l))&i],l-=h=e.n[u]}l==o&&v+1==a||f(0)},x=function(r,t,e){var n=6,a=t.length+3>>2,s=a<<1,i=a+s;T(r.subarray(n,n+=r[0]|r[1]<<8),t.subarray(0,a),e),T(r.subarray(n,n+=r[2]|r[3]<<8),t.subarray(a,s),e),T(r.subarray(n,n+=r[4]|r[5]<<8),t.subarray(s,i),e),T(r.subarray(n),t.subarray(i),e)},F=function(r,n,a){var s,u=n.b,h=r[u],l=h>>1&3;n.l=1&h;var v=h>>3|r[u+1]<<5|r[u+2]<<13,c=(u+=3)+v;if(1==l){if(u>=r.length)return;return n.b=u+1,a?(o(a,r[u],n.y,n.y+=v),a):o(new t(v),r[u])}if(!(c>r.length)){if(0==l)return n.b=c,a?(a.set(r.subarray(u,c),n.y),n.y+=v,a):i(r,u,c);if(2==l){var m=r[u],F=3&m,S=m>>2&3,B=m>>4,I=0,U=0;F<2?1&S?B|=r[++u]<<4|(2&S&&r[++u]<<12):B=m>>3:(U=S,S<2?(B|=(63&r[++u])<<4,I=r[u]>>6|r[++u]<<2):2==S?(B|=r[++u]<<4|(3&r[++u])<<12,I=r[u]>>2|r[++u]<<6):(B|=r[++u]<<4|(63&r[++u])<<12,I=r[u]>>6|r[++u]<<2|r[++u]<<10)),++u;var D=a?a.subarray(n.y,n.y+n.m):new t(n.m),M=D.length-B;if(0==F)D.set(r.subarray(u,u+=B),M);else if(1==F)o(D,r[u++],M);else{var W=n.h;if(2==F){var O=p(r,u);I+=u-(u=O[0]),n.h=W=O[1]}else W||f(0);(U?x:T)(r.subarray(u,u+=I),D.subarray(M),W)}var j=r[u++];if(j){255==j?j=32512+(r[u++]|r[u++]<<8):j>127&&(j=j-128<<8|r[u++]);var C=r[u++];3&C&&f(0);for(var H=[g,d,w],L=2;L>-1;--L){var Z=C>>2+(L<<1)&3;if(1==Z){var q=new t([0,0,r[u++]]);H[L]={s:q.subarray(2,3),n:q.subarray(0,1),t:new e(q.buffer,0,1),b:0}}else 2==Z?(u=(s=y(r,u,9-(1&L)))[0],H[L]=s[1]):3==Z&&(n.t||f(0),H[L]=n.t[L])}var G=n.t=H,J=G[0],K=G[1],N=G[2],P=r[c-1];P||f(0);var Q=(c<<3)-8+b(P)-N.b,R=Q>>3,V=0,X=(r[R]|r[R+1]<<8)>>(7&Q)&(1<<N.b)-1,Y=(r[R=(Q-=K.b)>>3]|r[R+1]<<8)>>(7&Q)&(1<<K.b)-1,$=(r[R=(Q-=J.b)>>3]|r[R+1]<<8)>>(7&Q)&(1<<J.b)-1;for(++j;--j;){var _=N.s[X],rr=N.n[X],tr=J.s[$],er=J.n[$],nr=K.s[Y],ar=K.n[Y],sr=1<<nr,ir=sr+((r[R=(Q-=nr)>>3]|r[R+1]<<8|r[R+2]<<16|r[R+3]<<24)>>>(7&Q)&sr-1);R=(Q-=k[tr])>>3;var or=A[tr]+((r[R]|r[R+1]<<8|r[R+2]<<16)>>(7&Q)&(1<<k[tr])-1);R=(Q-=z[_])>>3;var ur=E[_]+((r[R]|r[R+1]<<8|r[R+2]<<16)>>(7&Q)&(1<<z[_])-1);if(R=(Q-=rr)>>3,X=N.t[X]+((r[R]|r[R+1]<<8)>>(7&Q)&(1<<rr)-1),R=(Q-=er)>>3,$=J.t[$]+((r[R]|r[R+1]<<8)>>(7&Q)&(1<<er)-1),R=(Q-=ar)>>3,Y=K.t[Y]+((r[R]|r[R+1]<<8)>>(7&Q)&(1<<ar)-1),ir>3)n.o[2]=n.o[1],n.o[1]=n.o[0],n.o[0]=ir-=3;else{var hr=ir-(0!=ur);hr?(ir=3==hr?n.o[0]-1:n.o[hr],hr>1&&(n.o[2]=n.o[1]),n.o[1]=n.o[0],n.o[0]=ir):ir=n.o[0]}for(L=0;L<ur;++L)D[V+L]=D[M+L];M+=ur;var fr=(V+=ur)-ir;if(fr<0){var lr=-fr,vr=n.e+fr;for(lr>or&&(lr=or),L=0;L<lr;++L)D[V+L]=n.w[vr+L];V+=lr,or-=lr,fr=0}for(L=0;L<or;++L)D[V+L]=D[fr+L];V+=or}if(V!=M)for(;M<D.length;)D[V++]=D[M++];else V=D.length;a?n.y+=V:D=i(D,0,V)}else if(a){if(n.y+=B,M)for(L=0;L<B;++L)D[L]=D[M+L]}else M&&(D=i(D,M));return n.b=c,D}f(2)}},S=function(r,e){if(1==r.length)return r[0];for(var n=new t(e),a=0,s=0;a<r.length;++a){var i=r[a];n.set(i,s),s+=i.length}return n};function B(r,t){for(var e=[],n=+!t,a=0,s=0;r.length;){var i=c(r,n||t);if("object"==typeof i){for(n?(t=null,i.w.length==i.u&&(e.push(t=i.w),s+=i.u)):(e.push(t),i.e=0);!i.l;){var o=F(r,i,t);o||f(5),t?i.e=i.y:(e.push(o),s+=o.length,u(i.w,0,o.length),i.w.set(o,i.w.length-o.length))}a=i.b+4*i.c}else a=i;r=r.subarray(a)}return S(e,s)}_e.decompress=B;var I=function(){function r(r){this.ondata=r,this.c=[],this.l=0,this.z=0}return r.prototype.push=function(r,e){if("number"==typeof this.s){var n=Math.min(r.length,this.s);r=r.subarray(n),this.s-=n}var a=r.length+this.l;if(!this.s){if(e){if(!a)return void this.ondata(new t(0),!0);a<5&&f(5)}else if(a<18)return this.c.push(r),void(this.l=a);if(this.l&&(this.c.push(r),r=S(this.c,a),this.c=[],this.l=0),"number"==typeof(this.s=c(r)))return this.push(r,e)}if("number"!=typeof this.s){if(a<(this.z||3))return e&&f(5),this.c.push(r),void(this.l=a);if(this.l&&(this.c.push(r),r=S(this.c,a),this.c=[],this.l=0),!this.z&&a<(this.z=2&r[this.s.b]?4:3+(r[this.s.b]>>3|r[this.s.b+1]<<5|r[this.s.b+2]<<13)))return e&&f(5),this.c.push(r),void(this.l=a);for(this.z=0;;){var s=F(r,this.s);if(!s){e&&f(5);var i=r.subarray(this.s.b);return this.s.b=0,this.c.push(i),void(this.l+=i.length)}if(this.ondata(s,!1),u(this.s.w,0,s.length),this.s.w.set(s,this.s.w.length-s.length),this.s.l){var o=r.subarray(this.s.b);return this.s=4*this.s.c,void this.push(o,e)}}}else e&&f(5)},r}();_e.Decompress=I;return _e})
;

/* ==========================================================================
   DICTIONARY — 23,000+ entries (JMdict-derived, JLPT-tagged), a small
   deinflection engine so 食べられませんでした still finds 食べる, and the
   tap-to-look-up used by every reader in the app.
   ========================================================================== */
const DICT = (() => {
  let W, R, M, P, J, S, A, byKey, ready = false;
  function build() {
    if (ready) return;
    const txt = DATA.get("dict") || "";
    const lines = txt.split("\n");
    const n = lines.length;
    W = new Array(n); R = new Array(n); M = new Array(n); P = new Array(n); J = new Uint8Array(n); S = new Array(n); A = new Array(n);
    byKey = new Map();
    const add = (k, i) => { if (!k) return; const a = byKey.get(k); if (a) { if (a[a.length - 1] !== i) a.push(i); } else byKey.set(k, [i]); };
    for (let i = 0; i < n; i++) {
      const f = lines[i].split("\t");
      W[i] = f[0]; R[i] = f[1] || f[0]; M[i] = f[2] || ""; P[i] = f[3] || ""; J[i] = +(f[4] || 0); S[i] = f[5] || ""; A[i] = f[6] || "";
      add(W[i], i); add(R[i], i); if (A[i]) add(A[i], i);
    }
    ready = true;
  }
  const entry = i => ({ i, w: W[i], r: R[i], m: M[i], p: P[i], j: J[i], s: S[i], a: A[i] });
  return {
    get size() { build(); return W.length; },
    entry(i) { build(); return entry(i); },
    ids(key) { build(); return byKey.get(key) || []; },
    exact(key) { build(); return (byKey.get(key) || []).map(entry); },
    /* scan for a query: word/reading prefix + English */
    search(q, limit = 60) {
      build();
      q = q.trim(); if (!q) return [];
      const out = [], seen = new Set();
      const push = i => { if (!seen.has(i) && out.length < limit) { seen.add(i); out.push(i); } };
      const isLatin = /^[a-z0-9\s'\-.,!?()]+$/i.test(q);
      const kanaQ = isLatin && /^[a-z'\-]+$/i.test(q) ? romajiToKana(q) : "";
      const jpQ = isLatin ? kanaQ : toHira(q);
      if (jpQ) {
        (byKey.get(q) || []).forEach(push);
        (byKey.get(jpQ) || []).forEach(push);
        (byKey.get(toKata(jpQ)) || []).forEach(push);
        /* deinflected forms of what was typed */
        for (const c of deinflect(isLatin ? jpQ : q)) for (const i of (byKey.get(c.t) || [])) if (posOk(P[i], c.type, W[i])) push(i);
        const n = W.length;
        for (let i = 0; i < n && out.length < limit; i++) if (W[i].startsWith(q) || R[i].startsWith(jpQ) || (jpQ && W[i].startsWith(toKata(jpQ)))) push(i);
        if (!isLatin) for (let i = 0; i < n && out.length < limit; i++) if (W[i].includes(q)) push(i);
      }
      if (isLatin) {
        const re = new RegExp("(^|[;,(\\s])" + q.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "($|[;,)\\s])", "i");
        const re2 = new RegExp("\\b" + q.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        const n = W.length;
        const hits1 = [], hits2 = [];
        for (let i = 0; i < n; i++) {
          const m = M[i] + ";" + S[i];
          if (re.test(m)) hits1.push(i); else if (hits2.length < 200 && re2.test(m)) hits2.push(i);
        }
        /* JLPT words first, then order in the file (roughly common-first) */
        hits1.sort((a, b) => (J[b] ? 1 : 0) - (J[a] ? 1 : 0));
        hits1.forEach(push); hits2.forEach(push);
      }
      return out.map(entry);
    },
    /* all entries at one JLPT level */
    level(n) { build(); const out = []; for (let i = 0; i < W.length; i++) if (J[i] === n) out.push(i); return out; },
    withKanji(ch, limit = 30) {
      build(); const out = [];
      for (let i = 0; i < W.length && out.length < limit; i++) if (W[i].includes(ch) && W[i].length > 1) out.push(entry(i));
      return out;
    }
  };
})();

/* the longest dictionary word starting at text[pos] (after deinflection) */
function lookupAt(text, pos, maxLen = 14) {
  const rest = text.slice(pos, pos + maxLen);
  for (let n = rest.length; n >= 1; n--) {
    const cand = rest.slice(0, n);
    if (/^[\s、。！？「」『』（）・…―—.,!?]/.test(cand)) return null;
    const hits = [];
    const forms = deinflect(cand);
    const seen = new Set();
    for (const f of forms) {
      const keys = [f.t];
      if (!hasKanjiStr(f.t)) keys.push(toHira(f.t));
      for (const key of keys) for (const i of DICT.ids(key)) {
        if (seen.has(i)) continue;
        const e = DICT.entry(i);
        if (!posOk(e.p, f.type, e.w)) continue;
        /* a kana surface only matches readings for kana-only words or common ones */
        seen.add(i); hits.push({ e, why: f.why, base: f.t });
      }
      /* する-verbs: 勉強します → 勉強 (n, vs) */
      if (f.type === "vs" && f.t.endsWith("する") && f.t.length > 2) {
        for (const i of DICT.ids(f.t.slice(0, -2))) if (!seen.has(i)) { const e = DICT.entry(i); if (/\bvs/.test(e.p)) { seen.add(i); hits.push({ e, why: f.why, base: f.t }); } }
      }
    }
    if (hits.length) {
      hits.sort((a, b) => (a.why.length - b.why.length) || ((b.e.j ? 1 : 0) - (a.e.j ? 1 : 0)) || (hasKanjiStr(cand) ? (b.e.w === cand) - (a.e.w === cand) : 0) || a.e.i - b.e.i);
      return { len: n, surface: cand, hits: hits.slice(0, 6) };
    }
  }
  return null;
}
const hasKanjiStr = s => [...s].some(isKanjiCh);

/* ---- the look-up sheet ------------------------------------------------------ */
function lookupSheet(res, ctx = {}) {
  const body = el("div", {});
  for (const h of res.hits) body.append(entryCard(h.e, h.why));
  const kanji = [...new Set([...res.hits[0].e.w].filter(isKanjiCh))];
  if (kanji.length) {
    body.append(el("div", { class: "eyebrow", style: { marginTop: "16px" } }, "Kanji in this word"),
      el("div", { class: "row" }, kanji.map(ch => {
        const k = KJ.get(ch);
        return el("button", { class: "chip", onclick: () => { close(); openKanji(ch); } },
          el("span", { style: { fontFamily: "var(--hand)", fontSize: "18px" }, text: ch }),
          el("span", { class: "small", text: k ? k.mean.split(",")[0] : "" }));
      })));
  }
  const close = modal(res.surface, body, { sub: ctx.sub || (res.hits[0].why.length ? "from " + res.hits[0].e.w + " · " + res.hits[0].why.join(" · ") : "") });
  return close;
}
function entryCard(e, why = []) {
  const mine = myWordHas(e.w, e.r);
  const add = el("button", { class: "btn sm " + (mine ? "ghost" : "pri"), text: mine ? "✓ In My words" : "+ My words" });
  add.onclick = () => { if (myWordHas(e.w, e.r)) { myWordRemove(e.w, e.r); add.textContent = "+ My words"; add.className = "btn sm pri"; } else { myWordAdd(e); add.textContent = "✓ In My words"; add.className = "btn sm ghost"; toast("Added to My words — they show up in Flashcards."); } };
  return el("div", { class: "dentry" },
    el("div", { class: "spread", style: { alignItems: "flex-start" } },
      el("div", {},
        el("span", { class: "dw", text: e.w }),
        e.r !== e.w && el("span", { class: "dr", text: e.r }),
        e.a && el("span", { class: "tiny muted", text: " · also " + e.a })),
      el("div", { class: "row", style: { gap: "6px" } }, e.j ? jlptTag(e.j) : null, speakBtn(e.r || e.w, "Hear it"))),
    why.length ? el("div", { class: "tiny", style: { color: "var(--shu)", margin: "2px 0 4px" }, text: "↳ " + why.join(" · ") }) : null,
    el("div", { class: "dm", text: e.m }),
    e.s && e.s !== e.m ? el("div", { class: "small muted", text: "JLPT list: " + e.s }) : null,
    el("div", { class: "row", style: { marginTop: "8px", gap: "6px" } }, e.p && el("span", { class: "mono tiny muted", text: posLabel(e.p) }), el("span", { style: { flex: 1 } }), add));
}
const POS_EN = { n: "noun", v1: "る-verb", v5: "う-verb", vs: "する-verb", vk: "来る", vt: "transitive", vi: "intransitive", i: "い-adj", ix: "いい-adj", na: "な-adj", no: "の-adj", adv: "adverb", exp: "expression", int: "interjection", conj: "conjunction", prt: "particle", pn: "pronoun", ctr: "counter", suf: "suffix", pref: "prefix", num: "number", adjpn: "pre-noun", aux: "auxiliary", advto: "と-adverb", taru: "たる-adj" };
const posLabel = p => p.split(",").map(x => POS_EN[x] || x).filter((x, i, a) => a.indexOf(x) === i).join(" · ");

/* ---- My words — anything added from the dictionary or a reader -------------- */
const myWords = () => (Store.d.mywords ||= []);
const myWordHas = (w, r) => myWords().some(x => x.w === w && x.r === r);
function myWordAdd(e) { if (!myWordHas(e.w, e.r)) { myWords().push({ w: e.w, r: e.r, m: (e.s || e.m).split("; ").slice(0, 3).join("; "), t: Date.now() }); Store.save(); } }
function myWordRemove(w, r) { const a = myWords(); const i = a.findIndex(x => x.w === w && x.r === r); if (i >= 0) { a.splice(i, 1); Store.save(); } }

/* ---- a sentence you can tap anywhere ------------------------------------------ */
/* Renders furigana markup; tapping a character looks up the longest word there. */
function lookupText(src, opts = {}) {
  const mode = opts.furi || SET().furigana;
  const host = el("span", { class: "lk" });
  const re = new RegExp(RUBY_RE.source, "g");
  let last = 0, m, plainText = "", html = "";
  const addPlain = s => { for (const c of s) { html += `<i data-o="${plainText.length}">${esc(c)}</i>`; plainText += c; } };
  while ((m = re.exec(src))) {
    addPlain(src.slice(last, m.index));
    const b = m[1] ?? m[3], rd = m[2] ?? m[4];
    const hide = mode === "off" || (mode === "smart" && furiHidden(b));
    html += hide ? `<i data-o="${plainText.length}">${esc(b)}</i>` : `<ruby data-o="${plainText.length}">${esc(b)}<rt>${esc(rd)}</rt></ruby>`;
    plainText += b;
    last = re.lastIndex;
  }
  addPlain(src.slice(last));
  host.innerHTML = html;
  host.dataset.plain = plainText;
  host.addEventListener("click", e => {
    const t = e.target.closest("[data-o]"); if (!t || !host.contains(t)) return;
    let off = +t.dataset.o;
    /* inside a multi-kanji ruby, work out which character was tapped */
    if (t.tagName === "RUBY" && t.textContent.length > 1) {
      const rt = t.querySelector("rt"); const base = [...t.childNodes].filter(n => n !== rt).map(n => n.textContent).join("");
      if (base.length > 1 && e.clientX) {
        const r = t.getBoundingClientRect(); const vert = getComputedStyle(t).writingMode.startsWith("vertical");
        const frac = vert ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
        off += clamp(Math.floor(frac * base.length), 0, base.length - 1);
      }
    }
    const res = lookupAt(plainText, off);
    if (!res) return;
    host.querySelectorAll(".hit").forEach(x => x.classList.remove("hit"));
    host.querySelectorAll("[data-o]").forEach(x => { const o = +x.dataset.o; const len = x.tagName === "RUBY" ? [...x.childNodes].filter(n => n.nodeName !== "RT").map(n => n.textContent).join("").length : 1; if (o < off + res.len && o + len > off) x.classList.add("hit"); });
    if (opts.onLookup) opts.onLookup(res);
    lookupSheet(res, { sub: opts.sub });
  });
  return host;
}

/* ==========================================================================
   STROKE ORDER — KanjiVG stroke data for every kana and all 2,136 jōyō kanji.
   Draw it, number it, animate it, and quiz it one stroke at a time.
   KanjiVG © Ulrich Apel, CC BY-SA 3.0 — see the About page.
   ========================================================================== */
const STROKES = {
  get(ch) { const d = DATA.get("strokes"); return (d && d[ch]) || null; },
  has(ch) { const d = DATA.get("strokes"); return !!(d && d[ch]); }
};
const SVGNS = "http://www.w3.org/2000/svg";
const svgEl = (tag, attrs = {}) => { const n = document.createElementNS(SVGNS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
/* first point of a path, for placing stroke numbers */
function pathStart(d) { const m = /^M\s*([\d.\-]+)[ ,]([\d.\-]+)/.exec(d); return m ? [+m[1], +m[2]] : [0, 0]; }

/* static diagram: all strokes, optionally only the first `upto`, with numbers */
function strokeSVG(ch, o = {}) {
  const paths = STROKES.get(ch);
  const size = o.size || 109;
  const svg = svgEl("svg", { viewBox: "0 0 109 109", width: size, height: size, class: "ksvg" + (o.cls ? " " + o.cls : ""), role: "img", "aria-label": ch + " stroke order" });
  if (o.grid !== false) {
    svg.append(svgEl("line", { x1: 54.5, y1: 2, x2: 54.5, y2: 107, class: "g" }), svgEl("line", { x1: 2, y1: 54.5, x2: 107, y2: 54.5, class: "g" }));
  }
  if (!paths) {
    const t = svgEl("text", { x: 54.5, y: 84, "text-anchor": "middle", "font-size": 82, class: "fallback" }); t.textContent = ch; svg.append(t);
    return svg;
  }
  const upto = o.upto ?? paths.length;
  paths.forEach((d, i) => {
    if (i >= upto) { if (o.ghost) svg.append(svgEl("path", { d, class: "s ghost" })); return; }
    svg.append(svgEl("path", { d, class: "s" + (i === upto - 1 && o.lastRed ? " cur" : "") }));
  });
  if (o.nums) {
    paths.forEach((d, i) => {
      if (i >= upto) return;
      const [x, y] = pathStart(d);
      const t = svgEl("text", { x: clamp(x - 5, 4, 103), y: clamp(y - 2, 9, 106), class: "n" }); t.textContent = String(i + 1); svg.append(t);
    });
  }
  return svg;
}

/* animated player: play / pause / step / replay, speed from settings */
function strokePlayer(ch, o = {}) {
  const paths = STROKES.get(ch);
  const size = o.size || 220;
  const wrap = el("div", { class: "splayer" });
  if (!paths) {
    wrap.append(strokeSVG(ch, { size }), el("div", { class: "tiny muted", text: "No stroke data for this character." }));
    return wrap;
  }
  const svg = svgEl("svg", { viewBox: "0 0 109 109", width: size, height: size, class: "ksvg anim" });
  svg.append(svgEl("line", { x1: 54.5, y1: 2, x2: 54.5, y2: 107, class: "g" }), svgEl("line", { x1: 2, y1: 54.5, x2: 107, y2: 54.5, class: "g" }));
  const ghosts = paths.map(d => { const p = svgEl("path", { d, class: "s ghost" }); svg.append(p); return p; });
  const live = paths.map(d => { const p = svgEl("path", { d, class: "s" }); svg.append(p); return p; });
  const nums = paths.map((d, i) => { const [x, y] = pathStart(d); const t = svgEl("text", { x: clamp(x - 5, 4, 103), y: clamp(y - 2, 9, 106), class: "n" }); t.textContent = String(i + 1); t.style.opacity = 0; svg.append(t); return t; });
  let lens = null, k = 0, t0 = 0, raf = 0, playing = false;
  const speed = () => +(SET().animSpeed || 1);
  const counter = el("span", { class: "mono tiny muted" });
  function measure() {
    if (lens) return;
    lens = live.map(p => { let L = 60; try { L = p.getTotalLength() || 60; } catch (e) {} return L; });
    live.forEach((p, i) => { p.style.strokeDasharray = lens[i] + " " + lens[i]; p.style.strokeDashoffset = lens[i]; });
  }
  function setUpTo(n) {
    measure();
    live.forEach((p, i) => { p.style.strokeDashoffset = i < n ? 0 : lens[i]; p.classList.toggle("cur", i === n - 1); });
    nums.forEach((t, i) => t.style.opacity = SET().strokeNums !== "off" && i < n ? 1 : 0);
    k = n; counter.textContent = `${n} / ${paths.length}`;
  }
  function frame(ts) {
    if (!playing) return;
    if (!t0) t0 = ts;
    const dur = Math.max(260, lens[k] * 9) / speed();
    const f = Math.min(1, (ts - t0) / dur);
    live[k].style.strokeDashoffset = lens[k] * (1 - f);
    live.forEach((p, i) => p.classList.toggle("cur", i === k));
    if (f >= 1) {
      if (SET().strokeNums !== "off") nums[k].style.opacity = 1;
      k++; t0 = 0; counter.textContent = `${k} / ${paths.length}`;
      if (k >= paths.length) { playing = false; playBtn.textContent = "↻ Replay"; if (o.onDone) o.onDone(); return; }
      raf = setTimeout(() => requestAnimationFrame(frame), 170 / speed());
      return;
    }
    raf = requestAnimationFrame(frame);
  }
  function play() {
    measure();
    if (k >= paths.length) setUpTo(0);
    playing = true; t0 = 0; playBtn.textContent = "❚❚ Pause";
    requestAnimationFrame(frame);
  }
  function pause() { playing = false; playBtn.textContent = "▶ Play"; }
  const playBtn = el("button", { class: "btn sm pri", text: "▶ Play", onclick: () => playing ? pause() : play() });
  const controls = el("div", { class: "row", style: { justifyContent: "center", gap: "6px" } },
    el("button", { class: "btn sm ghost", title: "Back one stroke", text: "◀", onclick: () => { pause(); setUpTo(Math.max(0, k - 1)); } }),
    playBtn,
    el("button", { class: "btn sm ghost", title: "Forward one stroke", text: "▶|", onclick: () => { pause(); setUpTo(Math.min(paths.length, k + 1)); } }),
    counter);
  wrap.append(svg, controls);
  requestAnimationFrame(() => { setUpTo(0); if (o.autoplay !== false) setTimeout(play, 250); });
  onLeave(() => { playing = false; clearTimeout(raf); });
  return wrap;
}

/* the stroke sequence strip used on print sheets and kanji pages */
function strokeStrip(ch, size = 44) {
  const paths = STROKES.get(ch); if (!paths) return el("div", {});
  const row = el("div", { class: "sstrip" });
  for (let i = 1; i <= paths.length; i++) row.append(strokeSVG(ch, { size, upto: i, ghost: true, lastRed: true, grid: true }));
  return row;
}

/* ---- stroke-by-stroke quiz ---------------------------------------------------
   Each drawn stroke is resampled and compared with the expected KanjiVG stroke:
   average point distance (shape + position) and start/end direction.          */
function samplePath(d, n = 24) {
  const p = svgEl("path", { d });
  const tmp = svgEl("svg", { width: 0, height: 0, style: "position:absolute;left:-9999px" }); tmp.append(p); document.body.append(tmp);
  let L = 0, pts = [];
  try { L = p.getTotalLength(); for (let i = 0; i < n; i++) { const q = p.getPointAtLength(L * i / (n - 1)); pts.push([q.x, q.y]); } }
  catch (e) { pts = [pathStart(d)]; }
  tmp.remove();
  return pts;
}
function resample(pts, n = 24) {
  if (pts.length < 2) return Array(n).fill(pts[0] || [0, 0]);
  const segs = []; let L = 0;
  for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(l); L += l; }
  if (L === 0) return Array(n).fill(pts[0]);
  const out = []; let si = 0, acc = 0;
  for (let k = 0; k < n; k++) {
    const target = L * k / (n - 1);
    while (si < segs.length - 1 && acc + segs[si] < target) { acc += segs[si]; si++; }
    const f = segs[si] ? (target - acc) / segs[si] : 0;
    const a = pts[si], b = pts[si + 1] || pts[si];
    out.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]);
  }
  return out;
}
function strokeMatch(user, model) {
  const u = resample(user), m = model;
  let d = 0; for (let i = 0; i < u.length; i++) d += Math.hypot(u[i][0] - m[i][0], u[i][1] - m[i][1]);
  d /= u.length;
  let dr = 0; for (let i = 0; i < u.length; i++) dr += Math.hypot(u[i][0] - m[m.length - 1 - i][0], u[i][1] - m[m.length - 1 - i][1]);
  dr /= u.length;
  const mLen = Math.hypot(m[0][0] - m[m.length - 1][0], m[0][1] - m[m.length - 1][1]);
  const reversed = dr + 4 < d && mLen > 14;
  return { d, reversed };
}

function strokeQuiz(ch, o = {}) {
  const paths = STROKES.get(ch);
  const wrap = el("div", { class: "squiz" });
  if (!paths) { wrap.append(el("p", { class: "small muted", text: "No stroke data for " + ch + " — use the free pad instead." })); return wrap; }
  const models = paths.map(d => samplePath(d));
  const SIZE = 109;
  const box = el("div", { class: "pad squizpad" });
  const svg = svgEl("svg", { viewBox: "0 0 109 109", class: "ksvg quiz" });
  svg.append(svgEl("line", { x1: 54.5, y1: 2, x2: 54.5, y2: 107, class: "g" }), svgEl("line", { x1: 2, y1: 54.5, x2: 107, y2: 54.5, class: "g" }));
  const ghost = paths.map(d => { const p = svgEl("path", { d, class: "s ghost" }); svg.append(p); return p; });
  const done = paths.map(d => { const p = svgEl("path", { d, class: "s" }); p.style.display = "none"; svg.append(p); return p; });
  const hint = svgEl("path", { class: "s hint" }); svg.append(hint);
  const ink = svgEl("polyline", { class: "ink" }); svg.append(ink);
  box.append(svg);
  let k = 0, misses = 0, missHere = 0, drawing = false, pts = [];
  const showGhost = o.ghost ?? (SET().tracingModel === "on");
  ghost.forEach(p => p.style.display = showGhost ? "" : "none");
  const status = el("div", { class: "small", style: { minHeight: "3em" } });
  const counter = el("b", { class: "mono" });
  const sync = () => { counter.textContent = `${k} / ${paths.length}`; status.textContent = k < paths.length ? `Stroke ${k + 1}: draw it in the right place and direction.` : ""; };
  const toLocal = e => { const r = svg.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * SIZE, (e.clientY - r.top) / r.height * SIZE]; };
  const redrawInk = () => ink.setAttribute("points", pts.map(p => p.map(v => v.toFixed(1)).join(",")).join(" "));
  function start(e) { if (k >= paths.length) return; e.preventDefault(); drawing = true; pts = [toLocal(e)]; redrawInk(); try { box.setPointerCapture(e.pointerId); } catch (_) {} }
  function move(e) { if (!drawing) return; e.preventDefault(); pts.push(toLocal(e)); redrawInk(); }
  function end() {
    if (!drawing) return; drawing = false;
    if (pts.length < 2) { pts.push([pts[0][0] + .5, pts[0][1] + .5]); }
    const { d, reversed } = strokeMatch(pts, models[k]);
    const tol = 17 + Math.min(8, paths.length / 3);
    pts = []; redrawInk();
    if (d < tol && !reversed) {
      done[k].style.display = ""; done[k].classList.add("ok"); setTimeout(() => done[k - 1] && done[k - 1].classList.remove("ok"), 400);
      k++; missHere = 0; hint.setAttribute("d", ""); Sfx.tick(); sync();
      if (k >= paths.length) finish();
    } else {
      misses++; missHere++; Sfx.no();
      status.textContent = reversed ? "Right place, wrong direction — strokes run top→bottom and left→right." : missHere >= 2 ? "Here's the stroke — follow the red line." : "Not quite. Try that stroke again.";
      if (missHere >= 2) { hint.setAttribute("d", paths[k]); hint.classList.remove("flash"); void hint.getBoundingClientRect(); hint.classList.add("flash"); }
      box.classList.remove("shake"); void box.offsetWidth; box.classList.add("shake");
    }
  }
  box.addEventListener("pointerdown", start); box.addEventListener("pointermove", move);
  box.addEventListener("pointerup", end); box.addEventListener("pointercancel", end); box.addEventListener("pointerleave", end);
  function finish() {
    const score = Math.max(0, Math.round(100 - misses * (100 / Math.max(4, paths.length * 1.5))));
    status.innerHTML = "";
    status.append(el("b", { text: misses === 0 ? "Perfect stroke order!" : `Done — ${misses} miss${misses === 1 ? "" : "es"}.` }), " ",
      el("span", { class: "muted", text: `Score ${score}` }));
    Sfx.ok();
    Store.d.stats.written = (Store.d.stats.written || 0) + 1; touchDay("write");
    const id = idFor(ch); if (id && o.log !== false) SRS.grade(id, misses === 0 ? 2 : misses <= 2 ? 1 : 0);
    if (o.onDone) o.onDone(score, misses);
  }
  function reset() { k = 0; misses = 0; missHere = 0; done.forEach(p => { p.style.display = "none"; }); hint.setAttribute("d", ""); sync(); }
  sync();
  wrap.append(box,
    el("div", { class: "row", style: { marginTop: "10px" } },
      el("span", { class: "small muted" }, "Strokes ", counter),
      el("button", { class: "btn sm ghost", onclick: reset }, "Restart"),
      chipToggle("Show outline", showGhost, on => ghost.forEach(p => p.style.display = on ? "" : "none")),
      speakBtn(ch, "Hear it")),
    status);
  return wrap;
}

/* KanjiVG-based model for the free-draw scorer: centre-lines at pen width,
   which matches handwriting far better than a font's outline does. */
const _drawGlyphFont = typeof drawGlyph === "function" ? drawGlyph : null;
drawGlyph = function (ctx, ch, size, color) {
  const paths = STROKES.get(ch);
  if (!paths || typeof Path2D === "undefined") return _drawGlyphFont && _drawGlyphFont(ctx, ch, size, color);
  ctx.save();
  const s = size / 109;
  ctx.scale(s, s);
  ctx.strokeStyle = color; ctx.lineWidth = 6.2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const d of paths) ctx.stroke(new Path2D(d));
  ctx.restore();
};

/* ==========================================================================
   WRITE — three ways to practise a character:
     観 Watch   the stroke order animated and numbered
     書 Strokes draw it stroke by stroke; each stroke is checked
     筆 Free    draw the whole thing, then get scored against the model
   ========================================================================== */
function jlcKanjiSets() {
  const J = DATA.get("jlc"); if (!J) return [];
  return J.chapters.map(ch => {
    const chars = [];
    for (const s of ch.sections) if (s.t === "kanji") for (const [k] of s.items) for (const c of k) if (isKanjiCh(c) && !chars.includes(c)) chars.push(c);
    return { id: "jlc" + ch.n, label: "JLC " + ch.n, group: "Club chapters", chars };
  }).filter(s => s.chars.length);
}
function writeSetsAll() {
  const sets = [
    { id: "hira", label: "ひらがな", group: "Kana", chars: kanaList("hira", ["base"]).map(k => k.ch) },
    { id: "hira2", label: "ひらがな 濁・拗", group: "Kana", chars: kanaList("hira", ["daku", "yoon"]).map(k => k.ch).filter(c => c.length === 1) },
    { id: "kata", label: "カタカナ", group: "Kana", chars: kanaList("kata", ["base"]).map(k => k.ch) },
    { id: "kata2", label: "カタカナ 濁・拗", group: "Kana", chars: kanaList("kata", ["daku", "yoon"]).map(k => k.ch).filter(c => c.length === 1) }
  ];
  for (const n of [5, 4, 3, 2, 1]) sets.push({ id: "n" + n, label: "漢字 N" + n, group: "Kanji by JLPT", chars: KJ.all().filter(k => k.jlpt === n).sort((a, b) => a.strokes - b.strokes).map(k => k.ch) });
  for (const g of [1, 2, 3, 4, 5, 6, 8]) sets.push({ id: "g" + g, label: g === 8 ? "Secondary" : "Grade " + g, group: "Kanji by school grade", chars: KJ.all().filter(k => k.grade === g).sort((a, b) => a.strokes - b.strokes).map(k => k.ch) });
  sets.push(...jlcKanjiSets());
  const due = SRS.queue([...KANA_IDS, ...Object.keys(Store.d.srs).filter(i => i.startsWith("kanji:"))], { cap: 40, newCap: 0 }).map(i => i.split(":")[1]).filter(c => c && c.length === 1);
  sets.push({ id: "due", label: "Due for review", group: "Yours", chars: [...new Set(due)] });
  return sets.filter(s => s.chars.length);
}

function viewWrite() {
  const v = $("#view");
  const sets = writeSetsAll();
  let setId = QUERY.set || "hira", queue, pos = 0;
  let mode = QUERY.mode || SET().writeMode || "strokes";
  if (QUERY.c) { queue = [...QUERY.c].filter(c => STROKES.has(c) || isKanjiCh(c) || KANA_BY_CH[c]); setId = "custom"; }
  else if (QUERY.ch != null && typeof CHAPTERS !== "undefined") {
    const ch = CHAPTERS.find(c => c.n === +QUERY.ch); const s = ch && ch.sections[+QUERY.i];
    if (s && s.chars) { queue = s.chars.slice(); setId = "chapter"; }
  }
  if (!queue) { const s = sets.find(x => x.id === setId) || sets[0]; setId = s.id; queue = s.chars.slice(); }
  if (QUERY.p) pos = clamp(+QUERY.p, 0, queue.length - 1);

  v.append(page("かく", "Write it by hand", "筆",
    "Every kana and all 2,136 jōyō kanji, with real stroke order. <b>Watch</b> it animate, trace it <b>stroke by stroke</b> with each stroke checked as you go, or draw it <b>freehand</b> and get scored against the model. Finger, stylus or mouse all work."));

  const modeRow = el("div", { class: "row", style: { marginBottom: "12px" } },
    segButtons([["watch", "観 Watch"], ["strokes", "書 Stroke by stroke"], ["free", "筆 Freehand + score"]], mode, m => { mode = m; Store.set("settings.writeMode", m); mount(); }),
    el("span", { style: { flex: 1 } }),
    el("a", { class: "btn sm ghost", href: "#/print" }, "🖨 Practice sheets"));
  v.append(modeRow);

  /* sets, grouped */
  const setBox = el("details", { class: "card setbox" });
  setBox.append(el("summary", {}, el("b", { text: "Character set" }), " ", el("span", { class: "small muted", text: "— " + (sets.find(s => s.id === setId)?.label || (setId === "custom" ? "custom" : "chapter")) })));
  const groups = {};
  for (const s of sets) (groups[s.group] ||= []).push(s);
  for (const [g, list] of Object.entries(groups)) {
    setBox.append(el("div", { class: "tiny muted", style: { margin: "10px 0 6px" }, text: g }),
      el("div", { class: "row", style: { gap: "6px" } }, list.map(s => el("button", {
        class: "chip" + (setId === s.id ? " on" : ""), onclick: () => go(`#/write?set=${s.id}&mode=${mode}`)
      }, s.label, el("span", { class: "mono tiny", text: String(s.chars.length) })))));
  }
  const custom = el("input", { class: "type-in small-in", placeholder: "…or type / paste your own characters", style: { fontSize: "16px", textAlign: "left", marginTop: "12px", padding: "9px 12px" } });
  custom.addEventListener("keydown", e => { if (e.key === "Enter" && custom.value.trim()) go("#/write?c=" + encodeURIComponent([...new Set([...custom.value].filter(c => STROKES.has(c)))].join("")) + "&mode=" + mode); });
  setBox.append(custom, el("div", { class: "tiny muted", style: { marginTop: "4px" }, text: "Press Enter. Only characters with stroke data are kept." }));
  v.append(setBox);

  /* strip of characters in the set */
  const strip = el("div", { class: "charstrip" });
  v.append(strip);
  const host = el("div", { style: { marginTop: "16px" } });
  v.append(host);

  function paintStrip() {
    strip.innerHTML = "";
    queue.forEach((c, i) => strip.append(el("button", { class: "cs" + (i === pos ? " on" : ""), text: c, title: labelFor(c), onclick: () => { pos = i; mount(); } })));
    const on = strip.children[pos]; if (on && on.scrollIntoView) on.scrollIntoView({ block: "nearest", inline: "center" });
  }
  function nav() {
    return el("div", { class: "row", style: { marginTop: "14px" } },
      el("button", { class: "btn sm ghost", onclick: prev }, "← Prev"),
      el("button", { class: "btn sm ghost", onclick: () => { queue = shuffle(queue); pos = 0; mount(); } }, "🔀 Shuffle"),
      el("button", { class: "btn sm pri", onclick: next }, "Next →"));
  }
  function info(ch) {
    const k = KJ.get(ch), kn = KANA_BY_CH[ch];
    const box = el("div", { class: "card", style: { flex: "1 1 240px", minWidth: "230px" } });
    box.append(el("div", { class: "row", style: { gap: "12px", alignItems: "baseline" } },
      el("span", { style: { fontFamily: "var(--hand)", fontSize: "46px", lineHeight: "1" }, text: ch }),
      el("span", {}, el("b", { text: labelFor(ch) || "" }), el("div", { class: "mono tiny muted", text: `${strokesFor(ch)} strokes · ${pos + 1} of ${queue.length}` }))));
    if (k) box.append(el("dl", { class: "kv", style: { marginTop: "10px" } },
      el("dt", { text: "On" }), el("dd", { style: { fontFamily: "var(--hand)" }, text: k.on || "—" }),
      el("dt", { text: "Kun" }), el("dd", { style: { fontFamily: "var(--hand)" }, text: k.kun || "—" }),
      el("dt", { text: "Level" }), el("dd", {}, k.jlpt ? jlptTag(k.jlpt) : el("span", { class: "tiny muted", text: "not on JLPT lists" }), " ", el("span", { class: "tiny muted", text: GRADE_LABEL(k.grade) }))));
    if (kn && kn.mn) box.append(el("p", { class: "small", style: { marginTop: "10px" }, text: kn.mn }));
    box.append(el("div", { class: "row", style: { marginTop: "12px" } }, speakBtn(k ? (k.kun || k.on || ch).split("・")[0].replace(/[()（）.\-]/g, "") : ch, "Hear it"),
      k && el("button", { class: "btn sm ghost", onclick: () => openKanji(ch) }, "Kanji page"),
      el("button", { class: "btn sm ghost", onclick: () => printSheet([ch]) }, "🖨 Sheet")));
    if (STROKES.has(ch)) box.append(el("div", { style: { marginTop: "12px" } }, el("div", { class: "eyebrow" }, "Stroke sequence"), strokeStrip(ch, 38)));
    return box;
  }
  function mount() {
    CLEANUP.forEach(f => { try { f(); } catch (e) {} }); CLEANUP = [];
    host.innerHTML = "";
    paintStrip();
    const ch = queue[pos];
    if (!ch) { host.append(empty("無", "Nothing in this set.")); return; }
    if (mode === "free") {
      host.append(writePad(queue, pos, { onNext: next, onPrev: prev }));
    } else if (mode === "watch") {
      host.append(el("div", { class: "padwrap" }, el("div", { class: "card", style: { padding: "12px" } }, strokePlayer(ch, { size: 300 })), info(ch)), nav());
    } else {
      host.append(el("div", { class: "padwrap" }, strokeQuiz(ch, { onDone: () => setTimeout(() => { if (queue[pos] === ch) nudge(); }, 400) }), info(ch)), nav());
    }
    const key = e => {
      if (e.target.matches && e.target.matches("input,textarea")) return;
      if (mode === "free") return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    document.addEventListener("keydown", key);
    onLeave(() => document.removeEventListener("keydown", key));
  }
  function nudge() { const b = host.querySelector(".btn.pri"); if (b) { b.classList.remove("wobble"); void b.offsetWidth; b.classList.add("wobble"); } }
  function next() { pos = (pos + 1) % queue.length; mount(); }
  function prev() { pos = (pos - 1 + queue.length) % queue.length; mount(); }
  mount();

  v.append(sec("Stroke order, without the mystique", null, el("div", { class: "card" },
    el("ol", { class: "small", style: { margin: "0 0 0 18px", lineHeight: "1.9" } },
      el("li", { html: "<b>Top to bottom</b>, then <b>left to right</b>." }),
      el("li", { html: "<b>Horizontal before vertical</b> when they cross — 十 is the flat one first." }),
      el("li", { html: "<b>Outside before inside</b> — 国 draws the walls, then the contents, then closes the floor last." }),
      el("li", { html: "<b>Centre before wings</b> in symmetric shapes — 小 goes middle, left, right." }),
      el("li", { html: "<b>A stroke that cuts through everything comes last</b> — the vertical in 中, the horizontal in 母." })),
    el("p", { class: "tiny muted", style: { marginTop: "10px" }, text: "Stroke data: KanjiVG (Ulrich Apel, CC BY-SA 3.0). In stroke-by-stroke mode each stroke is checked for position, shape and direction; two misses in a row shows you the stroke in red." }))));
}

/* ==========================================================================
   KANJI — all 2,136 jōyō kanji. Hand-written notes for the N5/N4 set, KANJIDIC
   meanings and readings for the rest, stroke order for every one of them.
   ========================================================================== */
function openKanji(ch) { go("#/kanji/" + encodeURIComponent(ch)); }

function viewKanji() {
  const v = $("#view");
  const all = KJ.all();
  const st = (Store.d.kview ||= { lv: "5", grade: "all", sort: "strokes", q: "" });
  v.append(page("かんじ", "Kanji", "漢",
    `All ${all.length.toLocaleString()} jōyō kanji — the official everyday set every Japanese adult reads — with meanings, readings, JLPT level, school grade, stroke-order animation and the words that use each one. Start with N5 (${all.filter(k => k.jlpt === 5).length} kanji) and work up.`));

  const grid = el("div", { class: "chart wide kgrid" });
  const countLbl = el("span", { class: "mono tiny muted" });
  const search = el("input", { class: "type-in", placeholder: "search: meaning, reading (romaji ok), or kanji", value: st.q,
    style: { fontFamily: "var(--jp)", fontSize: "16px", textAlign: "left", maxWidth: "320px", padding: "9px 12px" } });
  search.addEventListener("input", debounce(() => { st.q = search.value.trim(); Store.save(); draw(); }, 180));
  v.append(el("div", { class: "row", style: { marginBottom: "10px" } }, search, countLbl));
  v.append(el("div", { class: "row", style: { marginBottom: "10px" } },
    el("span", { class: "tiny muted", text: "JLPT" }),
    segButtons([["all", "All"], ["5", "N5"], ["4", "N4"], ["3", "N3"], ["2", "N2"], ["1", "N1"], ["0", "Other"]], st.lv, x => { st.lv = x; Store.save(); draw(); })));
  v.append(el("div", { class: "row", style: { marginBottom: "10px" } },
    el("span", { class: "tiny muted", text: "Grade" }),
    segButtons([["all", "All"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["8", "7–9"]], st.grade, x => { st.grade = x; Store.save(); draw(); })));
  v.append(el("div", { class: "row", style: { marginBottom: "16px" } },
    el("span", { class: "tiny muted", text: "Sort" }),
    segButtons([["strokes", "Strokes"], ["freq", "Most common"], ["jlpt", "Level"], ["weak", "Weakest first"]], st.sort, x => { st.sort = x; Store.save(); draw(); }),
    el("span", { style: { flex: 1 } }),
    el("button", { class: "btn sm", onclick: () => { const ids = current().map(k => k.ch); drillKanji(ids); } }, "Drill these"),
    el("button", { class: "btn sm ghost", onclick: () => printSheet(current().slice(0, 60).map(k => k.ch)) }, "🖨 Sheets")));
  v.append(grid);

  function current() {
    const q = st.q.toLowerCase();
    const qk = /^[a-z]+$/.test(q) ? romajiToKana(q) : "";
    let list = all.filter(k => (st.lv === "all" || String(k.jlpt) === st.lv) && (st.grade === "all" || String(k.grade) === st.grade || (st.grade === "8" && k.grade >= 7 && k.grade <= 8)));
    if (q) list = list.filter(k => k.ch === q || (k.meanAll || "").toLowerCase().includes(q) || (k.mean || "").toLowerCase().includes(q) ||
      (qk && (toHira(k.on || "").includes(qk) || (k.kun || "").includes(qk))) || toHira(k.on || "").includes(toHira(q)) || (k.kun || "").includes(q));
    const by = { strokes: (a, b) => a.strokes - b.strokes || (a.freq || 9999) - (b.freq || 9999), freq: (a, b) => (a.freq || 9999) - (b.freq || 9999),
      jlpt: (a, b) => (b.jlpt || 0) - (a.jlpt || 0) || a.strokes - b.strokes, weak: (a, b) => SRS.strength("kanji:" + a.ch) - SRS.strength("kanji:" + b.ch) || a.strokes - b.strokes };
    return list.sort(by[st.sort] || by.strokes);
  }
  function draw() {
    const list = current();
    grid.innerHTML = "";
    countLbl.textContent = list.length + " kanji";
    if (!list.length) { grid.append(empty("無", "Nothing matches that.")); return; }
    const frag = document.createDocumentFragment();
    for (const k of list) {
      const f = SRS.strength("kanji:" + k.ch);
      frag.append(el("a", { class: "masu cell", href: "#/kanji/" + encodeURIComponent(k.ch), title: k.mean },
        el("i", { class: "lv", style: { "--f": f.toFixed(2) } }),
        el("span", { class: "ch", text: k.ch }),
        el("span", { class: "rm", text: k.jlpt ? "N" + k.jlpt : k.strokes + "画" })));
    }
    grid.append(frag);
  }
  draw();
}

function drillKanji(chars) {
  if (!chars.length) { toast("Nothing to drill."); return; }
  const items = chars.map(ch => ({ id: "kanji:" + ch, type: "kanji", o: kanjiObj(ch) })).filter(x => x.o);
  runFlash(items, "kanji");
}
/* a MASU-shaped kanji object for the flashcard session */
function kanjiObj(ch) {
  const k = KJ.get(ch); if (!k) return null;
  if (KANJI_BY[ch]) return KANJI_BY[ch];
  const w = DICT.withKanji(ch, 3).map(e => ({ w: e.w, r: e.r, g: (e.s || e.m).split("; ")[0] }));
  return { ch, mean: k.mean, on: k.on, kun: k.kun, strokes: k.strokes, jlpt: k.jlpt || 0, words: w };
}

function viewKanjiPage(ch) {
  const v = $("#view");
  const k = KJ.get(ch);
  if (!k) { v.append(empty("？", "That kanji isn't in the jōyō set.", el("a", { class: "btn", href: "#/kanji" }, "All kanji"))); return; }
  const id = "kanji:" + ch;
  const list = KJ.all();
  const i = list.indexOf(k);
  v.append(el("div", { class: "row", style: { marginBottom: "14px" } },
    backLink("#/kanji", "All kanji"),
    el("span", { style: { flex: 1 } }),
    el("button", { class: "btn sm ghost", onclick: () => history.length > 1 ? history.back() : go("#/kanji") }, "Back")));

  const words = (k.words && k.words.length ? k.words.map(w => ({ w: w.w, r: w.r, m: w.g, j: 0 })) : []);
  const more = DICT.withKanji(ch, 60).sort((a, b) => (b.j ? 1 : 0) - (a.j ? 1 : 0) || b.j - a.j).slice(0, 24);
  for (const e of more) if (!words.some(w => w.w === e.w)) words.push({ w: e.w, r: e.r, m: (e.s || e.m).split("; ").slice(0, 2).join("; "), j: e.j });

  const head = el("div", { class: "kpage" },
    el("div", { class: "card", style: { padding: "12px" } }, strokePlayer(ch, { size: 250 })),
    el("div", { style: { flex: "1 1 280px", minWidth: "0" } },
      el("div", { class: "eyebrow" }, k.jlpt ? "JLPT N" + k.jlpt : "Jōyō kanji", " · ", GRADE_LABEL(k.grade), k.freq ? " · #" + k.freq + " by frequency" : ""),
      el("h1", { class: "ptitle", style: { marginBottom: "4px" } }, el("span", { class: "jp", text: ch }), k.mean),
      k.meanAll && k.meanAll !== k.mean ? el("p", { class: "small muted", text: k.meanAll }) : null,
      el("dl", { class: "kv", style: { marginTop: "12px", fontSize: "15px" } },
        el("dt", { text: "On'yomi" }), el("dd", { style: { fontFamily: "var(--hand)", fontSize: "19px" }, text: k.on || "—" }),
        el("dt", { text: "Kun'yomi" }), el("dd", { style: { fontFamily: "var(--hand)", fontSize: "19px" }, text: k.kun || "—" }),
        el("dt", { text: "Strokes" }), el("dd", { class: "mono", text: String(STROKES.get(ch)?.length || k.strokes) })),
      el("div", { class: "row", style: { marginTop: "16px" } },
        el("a", { class: "btn sm pri", href: "#/write?c=" + encodeURIComponent(ch) + "&mode=strokes" }, "書 Write it"),
        el("button", { class: "btn sm", onclick: () => printSheet([ch]) }, "🖨 Practice sheet"),
        starBtn(id),
        el("button", { class: "btn sm ghost", onclick: () => { SRS.grade(id, 0); toast("Added to your review queue."); } }, "+ Review"),
        el("button", { class: "btn sm ghost", onclick: () => { SRS.grade(id, 2); toast("Marked as known."); } }, "I know this"))));
  v.append(head);

  v.append(sec("Stroke by stroke", STROKES.get(ch)?.length || null, strokeStrip(ch, 52)));

  if (words.length) {
    v.append(sec("Words that use it", words.length, el("div", { class: "lst" }, words.map(w =>
      el("div", { class: "li", style: { cursor: "pointer" }, onclick: () => { const r = DICT.exact(w.w).filter(e => e.r === w.r); if (r.length) lookupSheet({ surface: w.w, hits: r.map(e => ({ e, why: [] })) }); } },
        el("span", { class: "lead", style: { fontSize: "20px", minWidth: "3.4em" }, text: w.w }),
        el("span", { class: "body" }, el("b", { class: "mono", style: { fontWeight: "400" }, text: w.r }), el("span", { text: w.m })),
        w.j ? jlptTag(w.j) : null,
        speakBtn(w.r || w.w))))));
  }
  const prevK = list[i - 1], nextK = list[i + 1];
  v.append(el("div", { class: "row", style: { marginTop: "22px" } },
    prevK && el("a", { class: "btn ghost sm", href: "#/kanji/" + encodeURIComponent(prevK.ch) }, "← " + prevK.ch),
    nextK && el("a", { class: "btn ghost sm", href: "#/kanji/" + encodeURIComponent(nextK.ch) }, nextK.ch + " →")));
}

/* MASU's modal still gets called from older screens — send it to the new page */
function kanjiSheet(k) { openKanji(k.ch); }

/* ==========================================================================
   PRINT — genkō-yōshi practice sheets with stroke order and tracing squares.
   Everything you see in the preview is what prints; the controls hide.
   ========================================================================== */
function printSheet(chars) { go("#/print?c=" + encodeURIComponent(chars.join(""))); }

function viewPrint() {
  const v = $("#view");
  const P = (Store.d.printOpt ||= { per: 10, rows: 1, trace: 3, strip: "on", info: "on", paper: "letter" });
  let chars = QUERY.c ? [...new Set([...QUERY.c].filter(c => STROKES.has(c)))] : kanaList("hira", ["base"]).slice(0, 10).map(k => k.ch);

  v.append(el("div", { class: "noprint" },
    page("いんさつ", "Practice sheets", "印",
      "Printable genkō-yōshi squares: a stroke-order strip for each character, grey tracing squares, then empty squares to write from memory. Pick characters, adjust, then print (or save as PDF from the print dialog).")));

  const ta = el("textarea", { class: "type-in small-in", rows: 2, style: { fontSize: "20px", textAlign: "left", padding: "10px 12px" } });
  ta.value = chars.join("");
  ta.addEventListener("input", debounce(() => { chars = [...new Set([...ta.value].filter(c => STROKES.has(c)))]; paint(); }, 250));
  const quick = (label, list) => el("button", { class: "chip", onclick: () => { chars = list; ta.value = chars.join(""); paint(); } }, label);
  const hiraRows = KANA.hira.rows.map(([n, row]) => [n, row.filter(Boolean).map(c => c[0])]);
  const kataRows = KANA.kata.rows.map(([n, row]) => [n, row.filter(Boolean).map(c => c[0])]);
  const controls = el("div", { class: "card noprint" },
    el("div", { class: "tiny muted", style: { marginBottom: "6px" }, text: "Characters (type, paste, or pick below — up to 60)" }), ta,
    el("div", { class: "row", style: { marginTop: "10px", gap: "6px" } },
      el("span", { class: "tiny muted", text: "ひらがな" }), hiraRows.map(([n, r]) => quick(r[0] + "行", r)),
      quick("all", hiraRows.flatMap(x => x[1]))),
    el("div", { class: "row", style: { marginTop: "6px", gap: "6px" } },
      el("span", { class: "tiny muted", text: "カタカナ" }), kataRows.map(([n, r]) => quick(r[0] + "行", r)),
      quick("all", kataRows.flatMap(x => x[1]))),
    el("div", { class: "row", style: { marginTop: "6px", gap: "6px" } },
      el("span", { class: "tiny muted", text: "Kanji" }),
      [5, 4, 3].map(n => quick("N" + n + " first 20", KJ.all().filter(k => k.jlpt === n).sort((a, b) => (a.freq || 9e3) - (b.freq || 9e3)).slice(0, 20).map(k => k.ch))),
      jlcKanjiSets().map(s => quick(s.label, s.chars))),
    el("div", { class: "divider", style: { margin: "14px 0" } }),
    el("div", { class: "row" },
      el("span", { class: "tiny muted", text: "Squares per row" }), segButtons([[8, "8"], [10, "10"], [12, "12"]], P.per, x => { P.per = +x; Store.save(); paint(); }),
      el("span", { class: "tiny muted", text: "Rows each" }), segButtons([[1, "1"], [2, "2"], [3, "3"]], P.rows, x => { P.rows = +x; Store.save(); paint(); }),
      el("span", { class: "tiny muted", text: "Tracing squares" }), segButtons([[0, "0"], [2, "2"], [3, "3"], [5, "5"], [99, "All"]], P.trace, x => { P.trace = +x; Store.save(); paint(); })),
    el("div", { class: "row", style: { marginTop: "8px" } },
      chipToggle("Stroke-order strip", P.strip === "on", on => { P.strip = on ? "on" : "off"; Store.save(); paint(); }),
      chipToggle("Readings & meaning", P.info === "on", on => { P.info = on ? "on" : "off"; Store.save(); paint(); }),
      el("span", { style: { flex: 1 } }),
      el("button", { class: "btn pri", onclick: () => window.print() }, "🖨 Print")));
  v.append(controls);

  const sheet = el("div", { class: "printsheet" });
  v.append(sheet);
  function paint() {
    sheet.innerHTML = "";
    sheet.style.setProperty("--per", P.per);
    const list = chars.slice(0, 60);
    if (!list.length) { sheet.append(empty("紙", "Add some characters above.")); return; }
    sheet.append(el("div", { class: "ps-head" }, el("span", { text: "名前 Name: ______________________" }), el("span", { text: "日付 Date: __________" }), el("span", { class: "ps-brand", text: "MASU · JLC" })));
    for (const ch of list) {
      const k = KJ.get(ch), kn = KANA_BY_CH[ch];
      const blk = el("div", { class: "ps-block" });
      const top = el("div", { class: "ps-top" },
        el("div", { class: "ps-big" }, strokeSVG(ch, { size: 64, grid: true, nums: true })),
        P.info === "on" ? el("div", { class: "ps-info" },
          el("b", { text: k ? k.mean.split(",").slice(0, 3).join(", ") : kn ? kn.rom : "" }),
          k ? el("div", { class: "ps-rd", text: [k.on, k.kun].filter(Boolean).join("　") }) : null) : el("div", { class: "ps-info" }),
        P.strip === "on" ? strokeStrip(ch, 30) : null);
      blk.append(top);
      for (let r = 0; r < P.rows; r++) {
        const row = el("div", { class: "ps-row" });
        for (let i = 0; i < P.per; i++) {
          const sq = el("div", { class: "ps-sq" });
          if (r === 0 && i < P.trace) sq.append(strokeSVG(ch, { grid: false, cls: "trace", size: "100%" }));
          row.append(sq);
        }
        blk.append(row);
      }
      sheet.append(blk);
    }
  }
  paint();
}

/* ==========================================================================
   KANA MASTER — the original stand-alone drill, rebuilt inside the app:
   pick rows, toggle dakuten / handakuten / combinations, then flip cards,
   type romaji against the clock, or pick what you hear.
   ========================================================================== */
const KM_ROWS = [
  ["v", "Vowels", "あa いi うu えe おo"],
  ["k", "K-row", "かka きki くku けke こko", "がga ぎgi ぐgu げge ごgo", "", "きゃkya きゅkyu きょkyo", "ぎゃgya ぎゅgyu ぎょgyo"],
  ["s", "S-row", "さsa しshi すsu せse そso", "ざza じji ずzu ぜze ぞzo", "", "しゃsha しゅshu しょsho", "じゃja じゅju じょjo"],
  ["t", "T-row", "たta ちchi つtsu てte とto", "だda ぢji づzu でde どdo", "", "ちゃcha ちゅchu ちょcho", ""],
  ["n", "N-row", "なna にni ぬnu ねne のno", "", "", "にゃnya にゅnyu にょnyo", ""],
  ["h", "H-row", "はha ひhi ふfu へhe ほho", "ばba びbi ぶbu べbe ぼbo", "ぱpa ぴpi ぷpu ぺpe ぽpo", "ひゃhya ひゅhyu ひょhyo", "びゃbya びゅbyu びょbyo", "ぴゃpya ぴゅpyu ぴょpyo"],
  ["m", "M-row", "まma みmi むmu めme もmo", "", "", "みゃmya みゅmyu みょmyo", ""],
  ["y", "Y-row", "やya ゆyu よyo"],
  ["r", "R-row", "らra りri るru れre ろro", "", "", "りゃrya りゅryu りょryo", ""],
  ["w", "W-row", "わwa をwo んn"]
];
const kmParse = s => (s || "").split(" ").filter(Boolean).map(t => { const m = /^([ぁ-ん]+)([a-z]+)$/.exec(t); return { k: m[1], r: m[2] }; });
const KM = (() => {
  const sets = {};
  for (const script of ["h", "k"]) for (const [id, n, base, d, p, c, dc, pc] of KM_ROWS) {
    const conv = arr => script === "h" ? arr : arr.map(x => ({ k: toKata(x.k), r: x.r }));
    sets[script + "_" + id] = { id: script + "_" + id, n, script, cards: conv(kmParse(base)), d: conv(kmParse(d)), p: conv(kmParse(p)), c: conv(kmParse(c)), dc: conv(kmParse(dc)), pc: conv(kmParse(pc)) };
  }
  return sets;
})();
const kmState = () => {
  const s = (Store.d.km ||= { sel: ["h_v"], opts: { dakuten: false, handakuten: false, combos: false }, mode: "flip", voice: "on", stats: {} });
  s.stats ||= {}; s.opts ||= {}; return s;
};
function kmBuild() {
  const s = kmState(), o = s.opts, out = [];
  for (const id of s.sel) {
    const x = KM[id]; if (!x) continue;
    out.push(...x.cards);
    if (o.dakuten) out.push(...x.d);
    if (o.handakuten) out.push(...x.p);
    if (o.combos) out.push(...x.c);
    if (o.combos && o.dakuten) out.push(...x.dc);
    if (o.combos && o.handakuten) out.push(...x.pc);
  }
  return out;
}
function kmRecord(k, ok) { const st = kmState().stats; const r = (st[k] ||= [0, 0]); r[ok ? 0 : 1]++; Store.save(); }

function viewKanaMaster() {
  const v = $("#view");
  const s = kmState();
  v.append(el("div", { class: "km-title" }, el("h1", { text: "Kana Master" }),
    el("p", { class: "small muted", text: "Pick rows, choose your extras, and go. The original flashcard drill — now with a speed mode, a listening mode and stroke-order writing." })));

  const modes = [["flip", "札 Flashcards"], ["type", "⌨ Type romaji"], ["listen", "耳 Listen & pick"], ["write", "筆 Write"]];
  v.append(el("div", { class: "row", style: { justifyContent: "center", marginBottom: "14px" } },
    segButtons(modes, s.mode, m => { s.mode = m; Store.save(); sync(); })));

  const panel = el("div", { class: "km-panel" });
  v.append(panel);
  const mods = el("div", { class: "km-group" }, el("div", { class: "km-label", text: "Modifiers" }));
  for (const [key, lab, ex] of [["dakuten", "Dakuten", "が ざ だ ば"], ["handakuten", "Handakuten", "ぱ ぴ ぷ"], ["combos", "Combinations", "きゃ しゅ ちょ"]]) {
    const pill = el("span", { class: "km-pill" + (s.opts[key] ? " on" : "") });
    mods.append(el("button", { class: "km-row", onclick: () => { s.opts[key] = !s.opts[key]; pill.classList.toggle("on", s.opts[key]); Store.save(); sync(); } },
      el("span", {}, lab, el("span", { class: "tiny muted", text: "  " + ex })), pill));
  }
  panel.append(mods);
  for (const [script, label] of [["h", "Hiragana"], ["k", "Katakana"]]) {
    const g = el("div", { class: "km-group" });
    g.append(el("div", { class: "km-label" }, label,
      el("button", { class: "km-mini", onclick: () => { const ids = Object.keys(KM).filter(i => i.startsWith(script + "_")); const all = ids.every(i => s.sel.includes(i)); s.sel = s.sel.filter(i => !ids.includes(i)); if (!all) s.sel.push(...ids); Store.save(); render(); } }, "all / none")));
    for (const x of Object.values(KM).filter(x => x.script === script)) {
      const on = s.sel.includes(x.id);
      const acc = x.cards.map(c => s.stats[c.k]).filter(Boolean);
      const r = acc.reduce((a, b) => [a[0] + b[0], a[1] + b[1]], [0, 0]);
      const b = el("button", { class: "km-row" + (on ? " sel" : "") },
        el("span", { class: "row", style: { gap: "12px", flexWrap: "nowrap" } }, el("span", { class: "km-kana", text: x.cards[0].k }), el("span", { class: "small", text: x.n }),
          r[0] + r[1] ? el("span", { class: "tiny muted mono", text: pct(r[0], r[0] + r[1]) + "%" }) : null),
        el("span", { class: "km-check", text: "✓" }));
      b.onclick = () => { const i = s.sel.indexOf(x.id); if (i >= 0) s.sel.splice(i, 1); else s.sel.push(x.id); b.classList.toggle("sel", i < 0); Store.save(); sync(); };
      g.append(b);
    }
    panel.append(g);
  }
  const start = el("button", { class: "km-start" });
  v.append(el("div", { class: "km-bar" }, start));
  function sync() {
    const n = kmBuild().length;
    start.textContent = (SET().theme === "hacker" ? "INITIALIZE" : "BEGIN") + ` (${n})`;
    start.disabled = !n;
  }
  start.onclick = () => {
    const cards = kmBuild(); if (!cards.length) return;
    try { speechSynthesis && speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch (e) {}
    if (s.mode === "write") { go("#/write?mode=strokes&c=" + encodeURIComponent([...new Set(cards.map(c => c.k).join(""))].join(""))); return; }
    runKM(shuffle(cards), s.mode);
  };
  sync();
  v.append(el("p", { class: "tiny muted center", style: { marginTop: "14px" } }, "Charts, mnemonics and look-alike pairs live on the ", el("a", { href: "#/kana" }, "kana page"), "."));
}

function runKM(cards, mode) {
  const v = $("#view"); v.innerHTML = "";
  const s = kmState();
  let queue = cards.slice(), done = 0, missed = new Map(), t0 = Date.now(), times = [];
  const left = el("span", { class: "mono small" });
  const voiceBtn = el("button", { class: "chip" + (s.voice === "on" ? " on" : ""), text: s.voice === "on" ? "VOICE ON" : "VOICE OFF",
    onclick: () => { s.voice = s.voice === "on" ? "off" : "on"; Store.save(); voiceBtn.textContent = s.voice === "on" ? "VOICE ON" : "VOICE OFF"; voiceBtn.classList.toggle("on", s.voice === "on"); } });
  v.append(el("div", { class: "row km-top" }, el("button", { class: "btn ghost sm", onclick: () => go("#/kanamaster") }, "← EXIT"), el("span", { style: { flex: 1 } }), voiceBtn, left));
  const stage = el("div", { class: "km-stage" });
  v.append(stage);
  const say = k => { if (s.voice === "on") Speech.say(k, { force: true, rate: 0.6 }); };
  const key = e => stage._key && stage._key(e);
  document.addEventListener("keydown", key); onLeave(() => document.removeEventListener("keydown", key));

  function finish() {
    stage.innerHTML = ""; stage._key = null;
    const total = cards.length, miss = missed.size;
    stage.append(el("div", { class: "center" },
      el("h2", { class: "km-done", text: "Complete" }),
      el("p", { class: "small muted", text: `${total} cards · ${miss ? miss + " needed another pass" : "no misses"}${times.length ? " · " + (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(2) + "s average" : ""}` }),
      miss ? el("div", { class: "row", style: { justifyContent: "center", margin: "14px 0" } }, [...missed.keys()].map(k => el("span", { class: "chip", style: { fontFamily: "var(--hand)", fontSize: "18px" }, text: k }))) : null,
      el("div", { class: "row", style: { justifyContent: "center", marginTop: "16px" } },
        miss ? el("button", { class: "btn", onclick: () => runKM(shuffle(cards.filter(c => missed.has(c.k))), mode) }, "Just the misses") : null,
        el("button", { class: "km-start", style: { width: "200px" }, onclick: () => runKM(shuffle(cards), mode) }, "AGAIN"))));
    Sfx.ok(); touchDay("rev", total);
  }

  function next() {
    left.textContent = `${queue.length} Left`;
    if (!queue.length) return finish();
    const c = queue[0];
    stage.innerHTML = "";
    if (mode === "flip") flipCard(c);
    else if (mode === "type") typeCard(c);
    else listenCard(c);
  }
  function got(c, ok) {
    kmRecord(c.k, ok);
    if (ok) { queue.shift(); done++; } else { missed.set(c.k, 1); queue.push(queue.shift()); }
    next();
  }

  function flipCard(c) {
    let flipped = false;
    const card = el("div", { class: "km-card" },
      el("div", { class: "inner" },
        el("div", { class: "f" }, el("div", { class: "km-big", text: c.k })),
        el("div", { class: "b" }, el("div", { class: "km-rom", text: c.r }))));
    const btns = el("div", { class: "km-btns" },
      el("button", { class: "btn", onclick: () => got(c, false) }, "MISSED"),
      el("button", { class: "btn pri", onclick: () => got(c, true) }, "GOT IT"));
    card.onclick = () => { flipped = !flipped; card.classList.toggle("on", flipped); if (flipped) { btns.classList.add("show"); say(c.k); } };
    stage.append(card, btns);
    stage._key = e => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); card.click(); }
      else if (btns.classList.contains("show") && (e.key === "1" || e.key === "ArrowLeft")) got(c, false);
      else if (btns.classList.contains("show") && (e.key === "2" || e.key === "ArrowRight")) got(c, true);
    };
  }

  function typeCard(c) {
    const start = Date.now();
    const inp = el("input", { class: "type-in", autocomplete: "off", autocapitalize: "off", spellcheck: "false", placeholder: "romaji", style: { maxWidth: "260px", margin: "0 auto", display: "block" } });
    const fb = el("div", { class: "imehint", text: "Type the romaji — it checks as you go. Enter skips." });
    stage.append(el("div", { class: "km-card solo" }, el("div", { class: "km-big", text: c.k })), inp, fb);
    setTimeout(() => inp.focus(), 30);
    let wrong = false;
    const ALT = { n: ["nn"], wo: ["o"], ji: ["zi", "di"], shi: ["si"], chi: ["ti"], tsu: ["tu"], fu: ["hu"], zu: ["du"], ja: ["jya", "zya"], ju: ["jyu", "zyu"], jo: ["jyo", "zyo"], sha: ["sya"], shu: ["syu"], sho: ["syo"], cha: ["tya"], chu: ["tyu"], cho: ["tyo"] };
    const accepted = [c.r, ...(ALT[c.r] || [])];
    inp.addEventListener("input", () => {
      const r = inp.value.trim().toLowerCase();
      if (accepted.includes(r)) { inp.classList.remove("bad"); inp.classList.add("ok"); times.push(Date.now() - start); say(c.k); Sfx.tick(); setTimeout(() => got(c, !wrong), 180); }
      else if (r && !accepted.some(a => a.startsWith(r))) { inp.classList.add("bad"); wrong = true; fb.textContent = "It's " + c.r + " — type it to continue."; }
      else inp.classList.remove("bad");
    });
    stage._key = e => { if (e.key === "Enter") { e.preventDefault(); wrong = true; fb.textContent = "It's " + c.r + "."; setTimeout(() => got(c, false), 700); } };
  }

  function listenCard(c) {
    const pool = shuffle(cards.filter(x => x.k !== c.k)).slice(0, 3).concat([c]);
    const opts = shuffle(pool);
    const play = () => Speech.say(c.k, { force: true, rate: 0.6 });
    stage.append(el("div", { class: "km-card solo" },
      el("button", { class: "btn lg pri", onclick: play }, "🔊 Play again"),
      !("speechSynthesis" in window) ? el("p", { class: "small", style: { color: "var(--shu)" }, text: "This browser has no speech voice — use flashcards or typing instead." }) : null));
    const ans = el("div", { class: "answers", style: { maxWidth: "460px", margin: "14px auto 0" } });
    let tried = false;
    opts.forEach((o, i) => ans.append(el("button", { class: "ans jp", onclick: e => {
      if (o.k === c.k) { e.currentTarget.classList.add("ok"); Sfx.ok(); setTimeout(() => got(c, !tried), 350); }
      else { tried = true; e.currentTarget.classList.add("bad"); Sfx.no(); }
    } }, el("span", { class: "idx", text: String(i + 1) }), o.k)));
    stage.append(ans);
    setTimeout(play, 250);
    stage._key = e => { const n = +e.key; if (n >= 1 && n <= 4) ans.children[n - 1].click(); if (e.key === " ") { e.preventDefault(); play(); } };
  }
  next();
}

/* ==========================================================================
   CHAPTERS — four tracks, pick any chapter:
     ・Club (JLC 1–10): the club's own curriculum, every section of it
     ・Start at zero: the MASU path, kana → edge of N4
     ・Beyond: N3 → N1 → literature, built from the grammar, stories & classics
   ========================================================================== */
const JLC = () => (DATA.get("jlc") || { chapters: [] }).chapters;
const jlcKey = (n, i) => `jlc${n}:${i}`;
const jlcDone = ch => ch.sections.filter((_, i) => isDone(jlcKey(ch.n, i))).length;
const JLC_JI = { phrases: "話", table: "表", kosoado: "指", vocab: "語", sounds: "音", particles: "助", practice: "練", pattern: "型", numbers: "数", counters: "個", onoma: "擬", grammar: "文", kanji: "漢", conj: "活", describe: "絵", family: "家", tegroups: "て" };
const JLC_EN = { phrases: "Phrases", table: "Table", kosoado: "こそあど", vocab: "Words", sounds: "Sounds", particles: "Particles", practice: "Practice", pattern: "Pattern", numbers: "Numbers", counters: "Counters", onoma: "Sound words", grammar: "Grammar", kanji: "Kanji", conj: "Conjugation", describe: "Describe", family: "Family", tegroups: "て-form" };

/* the path past N4, assembled from what's already in the app */
const BEYOND = [
  { n: 1, jp: "中級への橋", en: "Bridge to intermediate", lv: 3, goal: "Read real paragraphs with N3 grammar: reasons, results, and the “so that / in order to” family.", grammar: [3, 0, 25], stories: [4], kanji: 3, classics: [] },
  { n: 2, jp: "気持ちを伝える", en: "Saying how you feel", lv: 3, goal: "The rest of N3: feelings you can't help, rules you keep, and the respect/humble forms you'll hear at church and at work.", grammar: [3, 25, 99], stories: [4], kanji: 3, classics: [] },
  { n: 3, jp: "書き言葉", en: "Written Japanese", lv: 2, goal: "N2 part one — the connectors of newspapers and essays: にもかかわらず, に基づいて, をめぐって.", grammar: [2, 0, 36], stories: [5], kanji: 2, classics: ["c-kumo"] },
  { n: 4, jp: "ニュアンス", en: "Nuance", lv: 2, goal: "N2 part two — the shades of meaning: わけにはいかない, ずにはいられない, ものなら.", grammar: [2, 36, 99], stories: [5], kanji: 2, classics: ["c-toshishun", "c-chumon"] },
  { n: 5, jp: "上級の文法", en: "Advanced grammar", lv: 1, goal: "N1 part one — formal, literary, and very precise.", grammar: [1, 0, 27], stories: [6], kanji: 1, classics: ["c-torokko", "c-shiro", "c-donguri"] },
  { n: 6, jp: "文学を読む", en: "Reading literature", lv: 1, goal: "N1 part two, then real novels and stories exactly as Japanese readers read them.", grammar: [1, 27, 99], stories: [6], kanji: 1, classics: ["c-mikan", "c-botchan", "c-hana", "c-kokoro"] },
  { n: 7, jp: "文語と古典", en: "Classical Japanese", lv: 0, goal: "The grammar of old texts — なり, けり, べし, たまえ — for Meiji literature, poetry, and the traditional Lord's Prayer.", grammar: [0, 0, 99], stories: [], kanji: 0, classics: ["c-yume", "c-neko", "c-takasebune", "c-sansho"] }
];
const beyondKey = (n, i) => `by${n}:${i}`;

function viewChapters() {
  const v = $("#view");
  const track = QUERY.t || Store.d.chTrack || "club";
  Store.d.chTrack = track; Store.save();
  v.append(page("しょう", "Chapters", "章",
    "Pick any chapter on any track — <b>nothing is locked</b>. The club track follows the JLC curriculum week by week; <b>Start at zero</b> goes from the first kana to the edge of N4; <b>Beyond</b> takes you from N3 to reading real literature."));
  const tabs = [["club", "会 Club · JLC 1–10"], ["zero", "〇 Start at zero"], ["beyond", "上 Beyond · N3 → fluent"]];
  v.append(el("div", { class: "row", style: { marginBottom: "18px" } },
    tabs.map(([k, lab]) => el("a", { class: "chip" + (track === k ? " on" : ""), href: "#/chapters?t=" + k }, lab))));

  if (track === "club") {
    const chs = JLC();
    const total = chs.reduce((a, c) => a + c.sections.length, 0), done = chs.reduce((a, c) => a + jlcDone(c), 0);
    v.append(el("div", { class: "card" }, labelled("Club sections finished", done, total, "m"),
      el("p", { class: "small muted", style: { marginTop: "10px" }, html: `The ten chapters of the club's handout, rewritten for the screen with audio, flashcards and practice. Each chapter links to its JLC Anki level, a short story built from its words, and a <b>practice test</b>.` })));
    const map = el("div", { class: "chmap", style: { marginTop: "18px" } });
    for (const ch of chs) {
      const d = jlcDone(ch), t = ch.sections.length;
      map.append(el("a", { class: "ch", href: "#/jlc/" + ch.n, style: { textDecoration: "none", color: "inherit" } },
        el("div", { class: "no" }, el("span", { text: "第" + ch.n + "章" }), el("span", { class: "mono", text: `${d}/${t}` })),
        el("h3", {}, ch.en, el("em", { html: furi(ch.jp) })),
        el("div", { class: "goal", text: ch.goal }),
        el("div", { class: "seals" }, ch.sections.map((s, i) => el("span", { class: "seal" + (isDone(jlcKey(ch.n, i)) ? " done" : ""), title: s.title, text: JLC_JI[s.t] || "・" }))),
        bar(pct(d, t), d === t ? "m" : "")));
    }
    v.append(map);
  } else if (track === "zero") {
    const total = CHAPTERS.reduce((a, c) => a + c.sections.length, 0), done = CHAPTERS.reduce((a, c) => a + chDone(c), 0);
    v.append(el("div", { class: "card" }, labelled("Sections finished", done, total, "m"),
      el("p", { class: "small muted", style: { marginTop: "10px" }, html: "Never seen a hiragana? Start at chapter 1 — or warm up with <a href='#/kanamaster'>Kana Master</a> first. Twenty chapters take you from あ to the edge of N4." })));
    const map = el("div", { class: "chmap", style: { marginTop: "18px" } });
    for (const ch of CHAPTERS) {
      const d = chDone(ch), t = ch.sections.length;
      map.append(el("a", { class: "ch", href: "#/chapter/" + ch.n, style: { textDecoration: "none", color: "inherit" } },
        el("div", { class: "no" }, el("span", { text: "第" + ch.n + "章" }), el("span", { class: "mono", text: `${d}/${t}` })),
        el("h3", {}, ch.en, el("em", { text: ch.jp })),
        el("div", { class: "goal", text: ch.goal }),
        el("div", { class: "seals" }, ch.sections.map((s, i) => el("span", { class: "seal" + (isDone(chKey(ch.n, i)) ? " done" : ""), title: s.label, text: SEC_JI[s.t] || "・" }))),
        bar(pct(d, t), d === t ? "m" : "")));
    }
    v.append(map);
  } else {
    v.append(el("div", { class: "card" }, el("p", { class: "small", html: "Past N4 there's no textbook order everyone agrees on, so this track is a suggestion: each chapter pairs a slice of the <a href='#/grammar'>grammar reference</a> with stories at the right level, a kanji set, and — from chapter 3 on — real Japanese literature from the <a href='#/read?shelf=classics'>classics shelf</a>." })));
    const map = el("div", { class: "chmap", style: { marginTop: "18px" } });
    for (const b of BEYOND) {
      const secs = beyondSections(b), d = secs.filter((_, i) => isDone(beyondKey(b.n, i))).length;
      map.append(el("a", { class: "ch", href: "#/beyond/" + b.n, style: { textDecoration: "none", color: "inherit" } },
        el("div", { class: "no" }, el("span", { text: "上" + b.n }), lvTag(b.lv)),
        el("h3", {}, b.en, el("em", { text: b.jp })),
        el("div", { class: "goal", text: b.goal }),
        bar(pct(d, secs.length), d === secs.length ? "m" : "")));
    }
    v.append(map);
  }
}

/* ---- one club chapter --------------------------------------------------------- */
function viewJlc(n) {
  const v = $("#view");
  const chs = JLC(), ch = chs.find(c => c.n === n);
  if (!ch) { v.append(empty("？", "No club chapter " + n + ".", el("a", { class: "btn", href: "#/chapters" }, "All chapters"))); return; }
  v.append(el("div", { class: "row noprint", style: { marginBottom: "14px" } },
    backLink("#/chapters?t=club", "Club chapters"),
    n > 1 && el("a", { class: "btn ghost sm", href: "#/jlc/" + (n - 1) }, "← " + (n - 1)),
    n < chs.length && el("a", { class: "btn ghost sm", href: "#/jlc/" + (n + 1) }, (n + 1) + " →"),
    el("span", { style: { flex: 1 } }),
    el("a", { class: "btn sm ghost", href: "#/present/" + n }, "📽 Present"),
    el("button", { class: "btn sm ghost", onclick: () => window.print() }, "🖨 Print")));
  v.append(page("JLC · 第" + n + "章" + (ch.pages ? " · handout pp. " + ch.pages : ""), ch.en, null, esc(ch.goal)));
  v.append(el("div", { class: "jp-sub", html: furi(ch.jp) }));

  const d = jlcDone(ch), t = ch.sections.length;
  const story = ch.story && (DATA.get("stories") || []).find(s => s.id === ch.story);
  const vocabItems = jlcVocabItems(ch);
  v.append(el("div", { class: "grid g3 noprint", style: { margin: "16px 0" } },
    el("div", { class: "card" }, labelled("This chapter", d, t, d === t ? "m" : "")),
    el("button", { class: "card tilebtn", onclick: () => vocabItems.length ? runFlash(vocabItems, "chapter") : toast("No vocabulary in this chapter.") },
      el("b", { text: "札 Flashcards" }), el("span", { class: "small muted", text: `${vocabItems.length} words from this chapter` })),
    ch.anki && ch.anki.length ? el("a", { class: "card tilebtn", href: "#/review/jlc:" + ch.anki.join(",") },
      el("b", { text: "Anki · JLC Level " + ch.anki.join(" & ") }), el("span", { class: "small muted", text: "the club's own decks" })) : null,
    story ? el("a", { class: "card tilebtn", href: "#/story/" + story.id },
      el("b", { html: "本 " + furi(story.title) }), el("span", { class: "small muted", text: "a short story using this chapter" })) : null,
    el("a", { class: "card tilebtn", href: "#/exam?ch=" + n },
      el("b", { text: "✎ Practice test" }), el("span", { class: "small muted", text: "auto-graded, or print it" }))));

  ch.sections.forEach((s, i) => v.append(jlcSection(ch, s, i)));
  v.append(el("div", { class: "row noprint", style: { marginTop: "26px" } },
    n < chs.length ? el("a", { class: "btn pri", href: "#/jlc/" + (n + 1) }, "Chapter " + (n + 1) + " →") : el("a", { class: "btn pri", href: "#/chapters?t=beyond" }, "Next: the Beyond track →"),
    el("a", { class: "btn ghost", href: "#/chapters?t=club" }, "All club chapters")));
}

function jlcVocabItems(ch) {
  const out = [];
  for (const s of ch.sections) if (s.t === "vocab") for (const [jp, en] of s.items) out.push({ id: "jv:" + ch.n + ":" + plain(jp), type: "card", o: { jp, kana: readingOf(jp), en, tag: "JLC " + ch.n } });
  return out;
}

function sectionShell(key, s, kids, opts = {}) {
  const done = isDone(key);
  const box = el("section", { class: "jsec" + (done ? " isdone" : ""), id: opts.anchor || null });
  box.append(el("div", { class: "jsec-h" },
    el("span", { class: "jsec-ji", text: opts.ji || "・" }),
    el("div", { style: { flex: 1, minWidth: 0 } },
      el("div", { class: "tiny muted mono", text: (opts.kind || "").toUpperCase() }),
      el("h2", {}, s.title, s.jp ? el("span", { class: "jsec-jp", html: " " + furi(s.jp) }) : null)),
    el("span", { class: "noprint" }, toggleSeal(key))));
  box.append(...[kids].flat().filter(Boolean));
  return box;
}

function jlcSection(ch, s, i) {
  const key = jlcKey(ch.n, i);
  const R = JLC_RENDER[s.t] || (x => el("pre", { class: "small", text: JSON.stringify(x, null, 1) }));
  return sectionShell(key, s, R(s, ch, i), { ji: JLC_JI[s.t], kind: JLC_EN[s.t], anchor: "s" + i });
}

/* Japanese line: tappable for look-up, with a speak button */
function jpLine(src, cls = "") {
  return el("div", { class: "jline " + cls }, el("span", { class: "jl-t" }, lookupText(src)), speakBtn(src));
}
function hideToggle(host, label = "Hide English") {
  return chipToggle(label, false, on => host.classList.toggle("hide-en", on));
}

const JLC_RENDER = {
  phrases(s) {
    const list = el("div", { class: "plist" });
    for (const [jp, en, x] of s.items) {
      list.append(el("div", { class: "prow" },
        jpLine(jp),
        el("div", { class: "en", text: en }),
        x && x.casual ? el("div", { class: "small", html: "<span class='tag'>casual</span> " + furi(x.casual) }) : null,
        x && x.note ? el("div", { class: "small muted", text: x.note }) : null));
    }
    return [el("div", { class: "row noprint", style: { margin: "4px 0 10px" } }, hideToggle(list)), list];
  },
  vocab(s, ch) {
    const g = el("div", { class: "vgrid" });
    for (const [jp, en] of s.items) g.append(el("div", { class: "vcell" }, el("div", { class: "vjp" }, lookupText(jp)), el("div", { class: "en small", text: en }), speakBtn(jp)));
    const items = s.items.map(([jp, en]) => ({ id: "jv:" + ch.n + ":" + plain(jp), type: "card", o: { jp, kana: readingOf(jp), en, tag: "JLC " + ch.n } }));
    return [el("div", { class: "row noprint", style: { margin: "4px 0 10px" } }, hideToggle(g),
      el("button", { class: "btn sm pri", onclick: () => runFlash(items, "chapter") }, `Study these ${items.length}`)), g];
  },
  table(s) {
    return [tableOf(s.cols, s.rows), s.note ? el("p", { class: "small muted", style: { marginTop: "8px" }, text: s.note }) : null];
  },
  kosoado(s) {
    const rows = [["これ", "それ", "あれ", "どれ", "this / that / that over there / which (thing)"], ["この〜", "その〜", "あの〜", "どの〜", "this ~ / that ~ / which ~ (before a noun)"],
      ["ここ", "そこ", "あそこ", "どこ", "here / there / over there / where"], ["こちら", "そちら", "あちら", "どちら", "this way / that way — also polite for people and places"], ["こんな", "そんな", "あんな", "どんな", "this kind of / that kind of / what kind of"]];
    return [tableOf(["こ near me", "そ near you", "あ far from both", "ど which?", "meaning"], rows), el("p", { class: "small muted", style: { marginTop: "8px" }, text: s.note })];
  },
  sounds(s) {
    return s.groups.map(g => el("div", { class: "card", style: { marginTop: "10px" } },
      el("h3", { style: { fontSize: "16px" }, text: g.h }), g.body ? el("p", { class: "small", text: g.body }) : null,
      g.pairs ? el("div", { class: "pairs" }, g.pairs.map(([a, ae, b, be]) => el("div", { class: "pair" },
        el("button", { class: "pbtn", onclick: () => Speech.say(a, { force: true }) }, el("b", { text: a }), el("span", { class: "tiny muted", text: ae })),
        el("span", { class: "muted", text: "↔" }),
        el("button", { class: "pbtn", onclick: () => Speech.say(b, { force: true }) }, el("b", { text: b }), el("span", { class: "tiny muted", text: be }))))) : null,
      g.words ? el("div", { class: "row" }, g.words.map(([w, en]) => el("button", { class: "chip", onclick: () => Speech.say(w, { force: true }) }, el("span", { html: furi(w) }), el("span", { class: "tiny", text: en })))) : null,
      g.rules ? el("ul", { class: "small", style: { margin: "8px 0 0 18px" } }, g.rules.map(r => el("li", { text: r }))) : null));
  },
  particles(s) {
    return s.items.map(p => el("div", { class: "card ptcl", style: { marginTop: "10px" } },
      el("div", { class: "row", style: { gap: "12px", alignItems: "baseline" } }, el("span", { class: "pbig", text: p.p }), el("b", { text: p.name })),
      el("p", { class: "small", text: p.body }),
      el("div", {}, p.ex.map(([jp, en]) => el("div", { class: "exrow" }, jpLine(jp), el("div", { class: "small muted", text: en }))))));
  },
  practice(s) {
    const list = el("div", { class: "plist practice" });
    for (const [en, jp] of s.items) {
      const ans = el("div", { class: "ans-hide" }, jpLine(jp));
      list.append(el("div", { class: "prow", onclick: e => { if (!e.target.closest("button,w,.lk")) ans.classList.toggle("show"); } },
        el("div", { class: "en", style: { fontSize: "15px", color: "var(--sumi)" }, text: en }), ans));
    }
    return [s.prompt ? el("p", { class: "small muted", text: s.prompt + " Tap a line to check." }) : null,
      el("div", { class: "row noprint", style: { margin: "4px 0 10px" } }, chipToggle("Show all answers", false, on => list.classList.toggle("reveal", on))), list];
  },
  pattern(s) { return JLC_RENDER.grammar(s); },
  grammar(s) {
    return [s.form ? el("div", { class: "formbox", text: s.form }) : null,
      s.body ? el("p", { class: "small", style: { margin: "8px 0" }, text: s.body }) : null,
      s.table ? tableOf(s.table.cols, s.table.rows) : null,
      s.ex && s.ex.length ? el("div", { class: "exbox" }, s.ex.map(([jp, en]) => el("div", { class: "exrow" }, jpLine(jp), el("div", { class: "small muted", text: en })))) : null];
  },
  numbers() {
    const N = [["一", "いち"], ["二", "に"], ["三", "さん"], ["四", "よん・し"], ["五", "ご"], ["六", "ろく"], ["七", "なな・しち"], ["八", "はち"], ["九", "きゅう・く"], ["十", "じゅう"],
      ["二十", "にじゅう"], ["百", "ひゃく"], ["三百", "さんびゃく"], ["六百", "ろっぴゃく"], ["八百", "はっぴゃく"], ["千", "せん"], ["三千", "さんぜん"], ["八千", "はっせん"], ["一万", "いちまん"], ["十万", "じゅうまん"]];
    const g = el("div", { class: "vgrid" });
    for (const [k, r] of N) g.append(el("button", { class: "vcell", onclick: () => Speech.say(r.split("・")[0], { force: true }) }, el("div", { class: "vjp", text: k }), el("div", { class: "small", text: r })));
    return [g, el("p", { class: "small muted", style: { marginTop: "8px" }, html: "Watch the sound changes at 300, 600, 800, 3000 and 8000. Big numbers group by 万 (10,000), not by thousands. Drill them in <a href='#/numbers'>Numbers & time</a>." })];
  },
  counters(s) {
    return el("div", { class: "plist" }, s.items.map(([c, use, jp, en]) => el("div", { class: "prow" },
      el("div", { class: "row", style: { gap: "10px" } }, el("b", { class: "pbig", style: { fontSize: "20px" }, text: c }), el("span", { class: "small", text: use })),
      jpLine(jp), el("div", { class: "small muted", text: en }))));
  },
  onoma(s) { return JLC_RENDER.counters(s); },
  kanji(s, ch) {
    const chars = s.items.map(x => x[0]);
    const g = el("div", { class: "kanjiline" });
    for (const [k, en] of s.items) {
      g.append(el("button", { class: "kcard", onclick: () => modalStroke(k, en) },
        el("span", { class: "kk", text: k }), el("span", { class: "tiny", text: en })));
    }
    const singles = [...new Set(chars.join(""))].filter(c => STROKES.has(c));
    return [g, el("div", { class: "row noprint", style: { marginTop: "10px" } },
      el("a", { class: "btn sm pri", href: "#/write?mode=strokes&c=" + encodeURIComponent(singles.join("")) }, "書 Write them stroke by stroke"),
      el("button", { class: "btn sm ghost", onclick: () => printSheet(singles) }, "🖨 Practice sheet"))];
  },
  conj(s) {
    const list = el("div", { class: "plist" });
    for (const w of s.items) {
      const a = analyzeVerb(w);
      const out = el("div", { class: "ans-hide" }, a ? el("div", { class: "small" },
        el("div", {}, el("span", { class: "tag", text: a.formName }), " from ", el("b", { text: a.dict })),
        el("div", { class: "conjflip" }, a.flips.map(([lab, f]) => el("span", {}, el("span", { class: "tiny muted", text: lab + " → " }), el("b", { text: f }))))) :
        el("div", { class: "small muted", text: "(couldn't analyse this one automatically)" }));
      list.append(el("div", { class: "prow", onclick: () => out.classList.toggle("show") }, el("div", { class: "row" }, el("b", { class: "pbig", style: { fontSize: "20px" }, text: w }), speakBtn(w)), out));
    }
    return [s.note ? el("p", { class: "small", text: s.note + " Tap each one to check." }) : null,
      el("div", { class: "row noprint", style: { margin: "4px 0 10px" } }, chipToggle("Show all answers", false, on => list.classList.toggle("reveal", on))), list];
  },
  describe(s) {
    return el("div", { class: "grid g3" }, s.items.map(([pic, words, jp]) => {
      const ans = el("div", { class: "ans-hide" }, jpLine(jp));
      return el("div", { class: "card", style: { textAlign: "center", cursor: "pointer" }, onclick: e => { if (!e.target.closest("button,.lk")) ans.classList.toggle("show"); } },
        el("div", { style: { fontSize: "40px" }, text: pic }), el("div", { class: "small", html: furi(words) }), ans);
    }));
  },
  family(s) {
    return [el("p", { class: "small", text: s.note }), tableOf(["My family (humble)", "Someone else's (respectful)", "English"], s.rows)];
  },
  tegroups(s) {
    return [el("p", { class: "small", text: s.note }), el("div", { class: "grid g2" }, s.groups.map(([h, list]) => el("div", { class: "card" },
      el("b", { text: h }),
      el("div", { class: "plist", style: { marginTop: "8px" } }, list.map(([d, te, en]) => el("div", { class: "row small", style: { justifyContent: "space-between" } },
        el("span", { html: furi(d) }), el("span", { class: "muted", text: "→" }), el("b", { html: furi(te) }), el("span", { class: "muted", text: en })))))))];
  }
};

function tableOf(cols, rows) {
  return el("div", { class: "tblwrap" }, el("table", { class: "tbl" },
    el("thead", {}, el("tr", {}, cols.map(c => el("th", { html: furi(c) })))),
    el("tbody", {}, rows.map(r => el("tr", {}, r.map(c => el("td", { html: furi(c) })))))));
}
function modalStroke(k, en) {
  const body = el("div", { class: "center" });
  const chars = [...k].filter(c => STROKES.has(c));
  if (chars.length === 1) body.append(strokePlayer(chars[0], { size: 220 }));
  else body.append(el("div", { class: "row", style: { justifyContent: "center" } }, chars.map(c => el("div", {}, strokePlayer(c, { size: 150 })))));
  body.append(el("div", { class: "row", style: { justifyContent: "center", marginTop: "12px" } },
    chars.map(c => el("a", { class: "btn sm ghost", href: "#/kanji/" + encodeURIComponent(c), onclick: () => close() }, c + " page")),
    el("a", { class: "btn sm pri", href: "#/write?mode=strokes&c=" + encodeURIComponent(chars.join("")), onclick: () => close() }, "Write it")));
  const close = modal(k + " · " + en, body);
}

/* ---- verb analysis for the conjugation drills --------------------------------- */
const VFORM = { dict: "plain present", masu: "polite present", masen: "polite negative", mashita: "polite past", masendeshita: "polite past negative", nai: "plain negative", ta: "plain past", nakatta: "plain past negative" };
function conjAll(kana, group) {
  const f = { dict: kana };
  for (const k of ["masu", "masen", "mashita", "nai", "ta", "nakatta"]) f[k] = conj(kana, group, k);
  f.masendeshita = f.masen + "でした";
  return f;
}
function analyzeVerb(surface) {
  surface = toHira(surface.trim());
  for (const c of deinflect(surface)) {
    let group = null;
    if (c.type === "v1") group = 2; else if (c.type === "v5") group = 1; else if (c.type === "vk" || c.type === "vs") group = 3; else if (c.type !== "*") continue;
    const base = c.t;
    let ok = false;
    if (c.type === "vs") ok = base === "する" || DICT.ids(base.slice(0, -2)).some(i => /vs/.test(DICT.entry(i).p)) || base.endsWith("する");
    else if (c.type === "vk") ok = base.endsWith("くる");
    else ok = DICT.ids(base).some(i => posOk(DICT.entry(i).p, c.type, DICT.entry(i).w));
    if (c.type === "*") {
      const hits = DICT.ids(base).map(i => DICT.entry(i)).filter(e => /\bv(1|5|k|s)/.test(e.p));
      if (!hits.length) continue;
      const p = hits[0].p; group = /v1/.test(p) ? 2 : /v5/.test(p) ? 1 : 3; ok = true;
    }
    if (!ok || !group) continue;
    const forms = conjAll(base, group);
    const which = Object.keys(forms).find(k => forms[k] === surface);
    if (!which) continue;
    const politeFlip = { dict: "masu", masu: "dict", nai: "masen", masen: "nai", ta: "mashita", mashita: "ta", nakatta: "masendeshita", masendeshita: "nakatta" };
    const tenseFlip = { dict: "ta", ta: "dict", masu: "mashita", mashita: "masu", nai: "nakatta", nakatta: "nai", masen: "masendeshita", masendeshita: "masen" };
    const polFlip = { dict: "nai", nai: "dict", masu: "masen", masen: "masu", ta: "nakatta", nakatta: "ta", mashita: "masendeshita", masendeshita: "mashita" };
    const isPolite = ["masu", "masen", "mashita", "masendeshita"].includes(which);
    return { dict: base, group, form: which, formName: VFORM[which], flips: [[isPolite ? "plain" : "polite", forms[politeFlip[which]]], [["ta", "mashita", "nakatta", "masendeshita"].includes(which) ? "present" : "past", forms[tenseFlip[which]]], [["nai", "masen", "nakatta", "masendeshita"].includes(which) ? "affirmative" : "negative", forms[polFlip[which]]]] };
  }
  return null;
}

/* ---- Beyond chapters ------------------------------------------------------------ */
function beyondSections(b) {
  const G = (DATA.get("grammar_ext") || []).filter(g => g.jlpt === b.grammar[0]);
  const gs = G.slice(b.grammar[1], b.grammar[2]);
  const secs = [];
  if (gs.length) secs.push({ t: "grammar", title: `${gs.length} grammar patterns`, ids: gs.map(g => g.id) });
  const S = (DATA.get("stories") || []).filter(s => b.stories.includes(s.level));
  for (const s of S.slice(0, 3)) secs.push({ t: "story", title: plain(s.title), id: s.id, en: s.titleEn });
  if (b.kanji) secs.push({ t: "kanji", title: `N${b.kanji} kanji`, lv: b.kanji });
  for (const c of b.classics) { const w = (DATA.get("classics") || []).find(x => x.id === c); if (w) secs.push({ t: "classic", title: w.title, id: c, en: w.en }); }
  return secs;
}
function viewBeyond(n) {
  const v = $("#view");
  const b = BEYOND.find(x => x.n === n);
  if (!b) { v.append(empty("？", "No such chapter.")); return; }
  v.append(el("div", { class: "row", style: { marginBottom: "14px" } }, backLink("#/chapters?t=beyond", "Beyond chapters"),
    n > 1 && el("a", { class: "btn ghost sm", href: "#/beyond/" + (n - 1) }, "← " + (n - 1)),
    n < BEYOND.length && el("a", { class: "btn ghost sm", href: "#/beyond/" + (n + 1) }, (n + 1) + " →")));
  v.append(page("上級 · " + n, b.en, b.jp, esc(b.goal)));
  const secs = beyondSections(b);
  const GX = DATA.get("grammar_ext") || [];
  secs.forEach((s, i) => {
    const key = beyondKey(n, i);
    let body;
    if (s.t === "grammar") {
      const list = s.ids.map(id => GX.find(g => g.id === id)).filter(Boolean);
      const box = el("div", {});
      list.slice(0, 6).forEach(g => box.append(grammarCard(g)));
      if (list.length > 6) {
        const more = el("button", { class: "btn sm ghost", text: `Show all ${list.length}` });
        more.onclick = () => { more.remove(); list.slice(6).forEach(g => box.append(grammarCard(g))); };
        box.append(more);
      }
      body = [el("p", { class: "small muted", text: "Read each pattern, say the examples out loud, then tap words you don't know." }), box];
    } else if (s.t === "story") {
      body = el("a", { class: "card tilebtn", href: "#/story/" + s.id }, el("b", { text: "本 " + s.title }), el("span", { class: "small muted", text: s.en }));
    } else if (s.t === "classic") {
      body = el("a", { class: "card tilebtn", href: "#/classic/" + s.id }, el("b", { text: "文 " + s.title }), el("span", { class: "small muted", text: s.en }));
    } else if (s.t === "kanji") {
      const ks = KJ.all().filter(k => k.jlpt === s.lv).sort((a, b2) => (a.freq || 9e3) - (b2.freq || 9e3));
      body = [el("div", { class: "kanjiline" }, ks.slice(0, 40).map(k => el("a", { class: "kcard", href: "#/kanji/" + encodeURIComponent(k.ch) }, el("span", { class: "kk", text: k.ch }), el("span", { class: "tiny", text: k.mean.split(",")[0] })))),
        el("div", { class: "row", style: { marginTop: "10px" } },
          el("button", { class: "btn sm pri", onclick: () => drillKanji(ks.map(k => k.ch)) }, `Drill all ${ks.length}`),
          el("a", { class: "btn sm ghost", href: "#/kanji" }, "Kanji browser"))];
    }
    v.append(sectionShell(key, { title: s.title }, body, { ji: { grammar: "文", story: "本", classic: "典", kanji: "漢" }[s.t], kind: s.t }));
  });
}

/* ==========================================================================
   LIBRARY & READER
   One reader for everything: MASU's tiny books, the picture books and
   stories written for this edition, and real Japanese literature.
   Tap any word to look it up · furigana all / smart / off · vertical text
   · English per sentence · read-aloud with the sentence highlighted.
   ========================================================================== */
const LEVELS = [
  { n: 0, jp: "レベル0", en: "First words", desc: "All kana. One idea per page, repetition on purpose — for the week you learn hiragana.", band: "#5E7A52" },
  { n: 1, jp: "レベル1", en: "First sentences", desc: "Short です／ます sentences with the first N5 kanji.", band: "#3E7A6E" },
  { n: 2, jp: "レベル2", en: "Short stories", desc: "A page or two of N5 Japanese: past tense, simple feelings, dialogue.", band: "#1E3A5F" },
  { n: 3, jp: "レベル3", en: "Everyday life & folk tales", desc: "N4 grammar — て-form chains, explanations, the classic folk tales.", band: "#4A4F8C" },
  { n: 4, jp: "レベル4", en: "Intermediate", desc: "N3 — longer stories with real plots, letters and inner thoughts.", band: "#A9762B" },
  { n: 5, jp: "レベル5", en: "Upper intermediate", desc: "N2 — adult topics, nuance, written style.", band: "#B4572E" },
  { n: 6, jp: "レベル6", en: "Advanced", desc: "N1 — long literary stories in natural, unsimplified Japanese.", band: "#C4402C" },
  { n: 7, jp: "文学", en: "Native literature", desc: "Real Japanese literature, 1905–1926, exactly as Japanese readers read it.", band: "#7A4B8C" }
];
const readState = id => ((Store.d.read ||= {})[id] ||= { page: 0, done: 0, last: 0 });

/* every readable thing in the app, normalised */
function allBooks() {
  const out = [];
  for (const b of READERS) out.push({ key: "tiny:" + b.id, href: "#/read/" + b.id, kind: "tiny", shelf: "tiny", id: b.id, level: b.level, title: b.title, en: b.titleEn, ic: b.ic, len: b.pages.length + " pages", chars: b.pages.reduce((a, p) => a + plain(p.s).length, 0) });
  for (const s of (DATA.get("stories") || [])) out.push({ key: "story:" + s.id, href: "#/story/" + s.id, kind: "story", shelf: s.id.startsWith("jlc-") ? "club" : s.kind === "picture" ? "picture" : "stories", id: s.id, level: s.level, title: s.title, en: s.titleEn, ic: s.ic, chars: s.chars, len: s.kind === "picture" ? s.pages.length + " pages" : s.chars.toLocaleString() + " characters", summary: s.summary });
  for (const c of (DATA.get("classics") || [])) out.push({ key: "classic:" + c.id, href: "#/classic/" + c.id, kind: "classic", shelf: "classics", id: c.id, level: 7, title: c.title, kana: c.kana || "", en: c.en, ic: "📜", chars: c.chars, len: c.chars.toLocaleString() + " characters", author: c.author, year: c.year, d: c.d, summary: c.sum });
  return out;
}
const SHELVES = [["all", "All"], ["picture", "絵本 Picture books"], ["tiny", "小本 Tiny books"], ["club", "会 Club stories"], ["stories", "話 Stories"], ["classics", "典 Classics"], ["faith", "信 Faith"]];

function viewLibrary() {
  const v = $("#view");
  const shelf = QUERY.shelf || "all";
  const lvq = QUERY.lv != null ? +QUERY.lv : null;
  const books = allBooks();
  v.append(page("よむ", "Reading room", "本",
    `${books.length} things to read, from 「ねこ。」 to Sōseki. Everything is graded by level; tap any word to look it up, switch furigana to <b>smart</b> so it only appears over kanji you haven't learned, and let the app read aloud while you follow along.`));

  v.append(el("div", { class: "row", style: { marginBottom: "10px" } }, SHELVES.map(([k, lab]) =>
    el("a", { class: "chip" + (shelf === k ? " on" : ""), href: k === "faith" ? "#/faith" : "#/read?shelf=" + k + (lvq != null ? "&lv=" + lvq : "") }, lab))));
  v.append(el("div", { class: "row", style: { marginBottom: "18px" } },
    el("span", { class: "tiny muted", text: "Level" }),
    el("a", { class: "chip" + (lvq == null ? " on" : ""), href: "#/read?shelf=" + shelf }, "Any"),
    LEVELS.map(l => el("a", { class: "chip" + (lvq === l.n ? " on" : ""), href: `#/read?shelf=${shelf}&lv=${l.n}` }, l.n === 7 ? "文学" : "Lv " + l.n))));

  const cont = books.filter(b => { const s = (Store.d.read || {})[b.key]; return s && s.last && !s.done && s.page > 0; }).sort((a, b) => Store.d.read[b.key].last - Store.d.read[a.key].last).slice(0, 3);
  if (cont.length && shelf === "all" && lvq == null) v.append(sec("Keep reading", null, el("div", { class: "grid g3" }, cont.map(bookCard))));

  if (shelf === "all" && lvq == null) v.append(el("div", { class: "card" },
    el("div", { class: "eyebrow" }, "多読 · the four rules of extensive reading"),
    el("ol", { class: "small", style: { margin: "8px 0 0 18px", lineHeight: "1.9" } },
      el("li", { html: "<b>Start ridiculously easy.</b> If a page takes effort, drop a level." }),
      el("li", { html: "<b>Don't stop for every word.</b> Guess, skip, or tap once to unstick a sentence." }),
      el("li", { html: "<b>Skip what you don't get.</b> 90% understanding at speed beats 100% at a crawl." }),
      el("li", { html: "<b>Quit a book the moment it stops being fun.</b> There are plenty more." })),
    el("p", { class: "tiny muted", style: { marginTop: "8px" }, html: "Not sure where to start? Take the <a href='#/placement'>placement check</a>. For hundreds more free graded readers, see NPO 多言語多読 at tadoku.org." })));

  for (const L of LEVELS) {
    if (lvq != null && lvq !== L.n) continue;
    const list = books.filter(b => b.level === L.n && (shelf === "all" || b.shelf === shelf));
    if (!list.length) continue;
    v.append(sec(`${L.jp} — ${L.en}`, list.length,
      el("p", { class: "small muted", style: { marginTop: "-6px", marginBottom: "12px" }, text: L.desc }),
      el("div", { class: "grid g3" }, list.map(bookCard))));
  }
}
function bookCard(b) {
  const st = (Store.d.read || {})[b.key] || (b.kind === "tiny" ? { done: bookState(b.id).done, page: bookState(b.id).page } : {});
  return el("a", { class: "spine", href: b.href, style: { "--band": LEVELS[b.level]?.band || "var(--ai)", textDecoration: "none", color: "inherit" } },
    el("div", { class: "row", style: { justifyContent: "space-between" } }, el("span", { style: { fontSize: "28px" }, text: b.ic || "📖" }),
      st.done ? el("span", { class: "tag n5", text: "read ✓" }) : st.page ? el("span", { class: "tag", text: "in progress" }) : null),
    el("h4", { html: furi(b.title, "on") }),
    el("div", { class: "small muted", text: b.en + (b.author ? ` — ${b.author}, ${b.year}` : "") }),
    b.summary && b.kind !== "tiny" ? el("div", { class: "tiny muted clamp3", text: b.summary }) : null,
    el("div", { class: "meta", text: b.len + (b.d ? " · " + ["", "gentle", "moderate", "demanding"][b.d] : "") }));
}

/* ---- the reader ---------------------------------------------------------------- */
function bookFor(kind, id) {
  if (kind === "tiny") { const b = READER_BY[id]; if (!b) return null; return { kind, key: "tiny:" + id, id, title: b.title, en: b.titleEn, level: b.level, ic: b.ic, pages: b.pages.map(p => ({ ic: p.ic, s: [{ s: p.s, en: p.en }] })), gloss: b.gloss }; }
  if (kind === "story") {
    const s = (DATA.get("stories") || []).find(x => x.id === id); if (!s) return null;
    const bk = { kind, key: "story:" + id, id, title: s.title, en: s.titleEn, level: s.level, ic: s.ic, gloss: s.gloss, quiz: s.quiz, notes: s.notes, summary: s.summary, author: s.author };
    if (s.kind === "picture") bk.pages = s.pages.map(p => ({ ic: p.ic, s: [{ s: p.s, en: p.en }] }));
    else bk.pages = paginate(s.paras.map(p => p.h ? { h: p.h, hEn: p.hEn } : { s: p.s }), 1400);
    return bk;
  }
  if (kind === "classic") {
    const c = (DATA.get("classics") || []).find(x => x.id === id); if (!c) return null;
    const paras = c.paras.map(p => p.h ? { h: p.h } : { s: p.s.map((s, i) => ({ s, en: p.en ? p.en[i] : "" })) });
    return { kind, key: "classic:" + id, id, title: c.title, en: c.en, level: 7, ic: "📜", classic: c, pages: paginate(paras, c.id === "c-kumo" ? 1100 : 2200), hasEn: !!(c.paras.find(p => p.en)) };
  }
  return null;
}
/* chunk paragraphs into pages of roughly `size` characters */
function paginate(paras, size) {
  const pages = []; let cur = [], n = 0;
  for (const p of paras) {
    const len = p.h ? 20 : p.s.reduce((a, x) => a + plain(x.s).length, 0);
    if (cur.length && (n + len > size || (p.h && n > size * 0.4))) { pages.push({ paras: cur }); cur = []; n = 0; }
    cur.push(p); n += len;
  }
  if (cur.length) pages.push({ paras: cur });
  return pages;
}

function viewBook(kind, id) {
  const v = $("#view");
  const bk = bookFor(kind, id);
  if (!bk) { v.append(empty("？", "No book by that name.", el("a", { class: "btn", href: "#/read" }, "Reading room"))); return; }
  const st = readState(bk.key);
  let i = clamp(QUERY.p != null ? +QUERY.p : st.page || 0, 0, bk.pages.length - 1);
  const R = (Store.d.readerOpt ||= { furi: bk.level >= 4 ? "smart" : "on", en: "tap", vert: SET().vertical === "on" ? "on" : "off", size: "m" });
  if (bk.kind === "classic" && !bk.hasEn && R.en === "show") R.en = "tap";
  let speaking = false;

  const bar_ = el("div", { class: "rbar noprint" });
  const pageEl = el("article", { class: "rpage" });
  const pager = el("div", { class: "pager noprint" });
  const tail = el("div", {});
  v.append(el("div", { class: "row noprint", style: { marginBottom: "10px" } },
    backLink("#/read" + (bk.kind === "classic" ? "?shelf=classics" : ""), "Reading room"),
    el("span", { class: "tag", style: { background: LEVELS[bk.level].band, color: "#fff" }, text: bk.level === 7 ? "文学" : "Level " + bk.level }),
    el("span", { class: "small muted", html: furi(bk.title, "on") + " — " + esc(bk.en) })),
    bar_, pageEl, pager, tail);

  /* toolbar */
  function tools() {
    bar_.innerHTML = "";
    bar_.append(
      el("span", { class: "tiny muted", text: "ふりがな" }),
      segButtons([["on", "All"], ["smart", "Smart"], ["off", "Off"]], R.furi, x => { R.furi = x; Store.save(); paint(); }),
      el("span", { class: "tiny muted", text: "English" }),
      segButtons([["show", "Show"], ["tap", "Tap"], ["off", "Off"]], R.en, x => { R.en = x; Store.save(); paint(); }),
      chipToggle("縦書き", R.vert === "on", on => { R.vert = on ? "on" : "off"; Store.save(); paint(); }),
      segButtons([["s", "A"], ["m", "A"], ["l", "A"], ["xl", "A"]], R.size, x => { R.size = x; Store.save(); paint(); }, "seg sizes"),
      readBtn);
  }
  const readBtn = el("button", { class: "btn sm pri", text: "▶ Read aloud", onclick: () => speaking ? stopRead() : startRead() });

  function sentenceNode(sent, si) {
    const wrap = el("span", { class: "sent", "data-si": si });
    wrap.append(lookupText(sent.s, { furi: R.furi, sub: bk.title ? plain(bk.title) : "" }));
    return wrap;
  }
  function paint() {
    stopRead();
    const p = bk.pages[i];
    pageEl.className = "rpage size-" + R.size + (R.vert === "on" ? " vert-page" : "") + (R.en === "off" ? " en-off" : R.en === "tap" ? " en-tap" : "");
    pageEl.innerHTML = "";
    let si = 0;
    if (p.ic) pageEl.append(el("div", { class: "scene", text: p.ic }));
    const body = el("div", { class: "rtext" });
    if (p.paras) {
      for (const para of p.paras) {
        if (para.h) { body.append(el("h3", { class: "rh" }, lookupText(para.h, { furi: R.furi }), para.hEn ? el("span", { class: "tiny muted", text: " " + para.hEn }) : null)); continue; }
        const pe = el("p", { class: "rp" });
        const ens = [];
        for (const sent of para.s) { pe.append(sentenceNode(sent, si++)); if (sent.en) ens.push(sent.en); }
        body.append(pe);
        if (ens.length && R.en !== "off" && R.vert !== "on") {
          const en = el("p", { class: "ren" + (R.en === "tap" ? " blur" : ""), text: ens.join(" ") });
          en.onclick = () => en.classList.toggle("blur");
          body.append(en);
        }
      }
    } else {
      const pe = el("p", { class: "rp picture" });
      for (const sent of p.s) pe.append(sentenceNode(sent, si++));
      body.append(pe);
      const ens = p.s.map(x => x.en).filter(Boolean);
      if (ens.length && R.en !== "off") {
        const en = el("p", { class: "ren center" + (R.en === "tap" ? " blur" : ""), text: ens.join(" ") });
        en.onclick = () => en.classList.toggle("blur"); body.append(en);
      }
    }
    pageEl.append(body);
    if (R.vert === "on") requestAnimationFrame(() => { body.scrollLeft = body.scrollWidth; });

    pager.innerHTML = "";
    const pips = el("div", { class: "pips" });
    if (bk.pages.length <= 40) bk.pages.forEach((_, n) => pips.append(el("button", { class: "pip" + (n === i ? " on" : n < i ? " seen" : ""), title: "page " + (n + 1), onclick: () => { i = n; save(); paint(); } })));
    else pips.append(el("span", { class: "mono tiny muted", text: `page ${i + 1} of ${bk.pages.length}` }));
    pager.append(
      el("button", { class: "btn sm ghost", onclick: prev, disabled: i === 0 || null }, "← 前"),
      pips,
      el("button", { class: "btn sm pri", onclick: next }, i === bk.pages.length - 1 ? "終わり ✓" : "次 →"));
    paintTail();
  }
  function paintTail() {
    tail.innerHTML = "";
    const last = i === bk.pages.length - 1;
    if (bk.kind === "classic") tail.append(classicAbout(bk.classic, last));
    if (bk.summary && i === 0 && bk.kind !== "classic") tail.append(el("div", { class: "card", style: { marginTop: "18px" } }, el("div", { class: "eyebrow" }, "About this story"), el("p", { class: "small", text: bk.summary })));
    if (bk.gloss && bk.gloss.length) {
      tail.append(sec("Words in this story", bk.gloss.length, el("div", { class: "grid g4" }, bk.gloss.map(([kana, kanji, en]) =>
        el("div", { class: "card", style: { padding: "10px 12px" } },
          el("div", { style: { fontFamily: "var(--hand)", fontSize: "19px" }, text: kanji || kana }),
          kanji ? el("div", { class: "mono tiny muted", text: kana }) : null,
          el("div", { class: "small", style: { marginTop: "2px" }, text: en }))))));
    }
    if (last && bk.quiz && bk.quiz.length) tail.append(storyQuiz(bk));
    if (last && bk.notes) tail.append(el("div", { class: "card", style: { marginTop: "18px" } }, el("div", { class: "eyebrow" }, "Notes"), el("div", { class: "small", html: mdLite(bk.notes).replace(/\n\n/g, "<br><br>") })));
  }
  function save() { st.page = i; st.last = Date.now(); Store.save(); if (bk.kind === "tiny") { bookState(bk.id).page = i; } }
  function top() { window.scrollTo({ top: 0, behavior: "smooth" }); }
  function prev() { if (i > 0) { i--; save(); paint(); top(); } }
  function next() {
    if (i < bk.pages.length - 1) { i++; save(); touchDay("read"); paint(); top(); }
    else finish();
  }
  function finish() {
    st.done = (st.done || 0) + 1; st.page = 0; st.last = Date.now(); Store.save();
    if (bk.kind === "tiny") { const b = bookState(bk.id); b.done = true; b.reads = (b.reads || 0) + 1; b.page = 0; Store.save(); }
    touchDay("read"); Sfx.ok();
    const books = allBooks();
    const nextB = books.find(b => b.level === bk.level && b.key !== bk.key && !((Store.d.read || {})[b.key] || {}).done) || books.find(b => b.level === bk.level + 1);
    const close = modal("読み終わりました！", el("div", {},
      el("p", { html: `You finished <b>${esc(plain(bk.title))}</b>${st.done > 1 ? ` — that's ${st.done} times now` : ""}.` }),
      el("p", { class: "small muted", style: { marginTop: "8px" }, text: "Re-reading something you understood is not wasted time — the second pass is where the grammar stops being visible and starts being automatic." }),
      el("div", { class: "row", style: { marginTop: "16px" } },
        nextB && el("a", { class: "btn pri sm", href: nextB.href, onclick: () => close() }, el("span", { html: "Next: " + furi(nextB.title, "off") })),
        el("a", { class: "btn ghost sm", href: "#/read", onclick: () => close() }, "Reading room"),
        el("button", { class: "btn ghost sm", onclick: () => { i = 0; save(); paint(); close(); } }, "Read again"))), { sub: bk.en });
  }

  /* read-aloud: one sentence at a time, highlighted */
  function startRead() {
    if (!("speechSynthesis" in window)) { toast("This browser has no speech voices."); return; }
    const nodes = [...pageEl.querySelectorAll(".sent")];
    if (!nodes.length) return;
    speaking = true; readBtn.textContent = "■ Stop";
    let k = 0;
    const step = () => {
      if (!speaking) return;
      nodes.forEach(n => n.classList.remove("speaking"));
      if (k >= nodes.length) { stopRead(); if (i < bk.pages.length - 1 && R.auto) { next(); setTimeout(startRead, 400); } return; }
      const node = nodes[k++]; node.classList.add("speaking");
      node.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
      const text = node.querySelector(".lk").dataset.plain;
      speakNow(text, step);
    };
    step();
  }
  function stopRead() {
    speaking = false; readBtn.textContent = "▶ Read aloud";
    try { speechSynthesis.cancel(); } catch (e) {}
    pageEl.querySelectorAll(".speaking").forEach(n => n.classList.remove("speaking"));
  }
  onLeave(stopRead);
  const key = e => {
    if (e.target.matches && e.target.matches("input,textarea,select")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); R.vert === "on" ? prev() : next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); R.vert === "on" ? next() : prev(); }
  };
  document.addEventListener("keydown", key); onLeave(() => document.removeEventListener("keydown", key));
  tools(); paint();
  st.last = Date.now(); Store.save();
}

/* speak one string and call back when it ends (with a watchdog for browsers
   that never fire onend) */
function speakNow(text, done) {
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[「」『』（）()]/g, " "));
    u.lang = "ja-JP"; u.rate = Number(SET().rate) || 0.85;
    const want = SET().voice, voice = Speech.voices.find(x => x.name === want) || Speech.voices[0];
    if (voice) u.voice = voice;
    let fired = false;
    const fin = () => { if (fired) return; fired = true; clearTimeout(wd); done && done(); };
    const wd = setTimeout(fin, 1500 + text.length * 260 / (u.rate || 1));
    u.onend = fin; u.onerror = fin;
    speechSynthesis.speak(u);
  } catch (e) { done && done(); }
}

function storyQuiz(bk) {
  const box = el("div", { class: "card", style: { marginTop: "18px" } }, el("div", { class: "eyebrow" }, "Did you get it? · よめたかな"));
  let right = 0, answered = 0;
  const score = el("div", { class: "small muted", style: { marginTop: "10px" } });
  bk.quiz.forEach((q, qi) => {
    const opts = q.a.map((a, k) => ({ a, ok: k === q.ok }));
    const shuffled = shuffle(opts);
    const ans = el("div", { class: "answers", style: { gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" } });
    let done = false;
    shuffled.forEach(o => ans.append(el("button", { class: "ans", onclick: e => {
      if (done) return; done = true; answered++;
      if (o.ok) { right++; e.currentTarget.classList.add("ok"); Sfx.ok(); } else { e.currentTarget.classList.add("bad"); Sfx.no(); [...ans.children][shuffled.findIndex(x => x.ok)].classList.add("ok"); }
      if (answered === bk.quiz.length) score.textContent = `${right} / ${bk.quiz.length} — ${right === bk.quiz.length ? "完璧！" : "nice work."}`;
    } }, el("span", { html: furi(o.a) }))));
    box.append(el("div", { style: { marginTop: qi ? "16px" : "6px" } },
      el("div", { html: `<b>${qi + 1}.</b> ` + furi(q.q) }), q.qEn ? el("div", { class: "tiny muted", text: q.qEn }) : null, ans));
  });
  box.append(score);
  return box;
}

function classicAbout(c, last) {
  const box = el("div", { class: "card", style: { marginTop: "18px" } });
  box.append(el("div", { class: "eyebrow" }, "About this text"),
    el("h3", { style: { fontSize: "18px" } }, c.title, el("span", { class: "small muted", style: { fontWeight: 400 }, text: `  ${c.en} · ${c.author}, ${c.year}` })),
    el("p", { class: "small", style: { marginTop: "6px" }, text: c.sum }),
    c.why ? el("p", { class: "small muted", text: c.why }) : null,
    c.cw ? el("p", { class: "small", style: { color: "var(--shu)" }, text: "Content note: " + c.cw }) : null,
    c.words && c.words.length ? el("div", { style: { marginTop: "10px" } }, el("div", { class: "tiny muted", text: "Key words" }),
      el("div", { class: "row", style: { gap: "6px", marginTop: "4px" } }, c.words.map(([w, r, en]) => el("span", { class: "chip" }, el("b", { style: { fontFamily: "var(--hand)" }, text: w }), r ? el("span", { class: "tiny mono", text: r }) : null, el("span", { class: "tiny", text: en }))))) : null,
    el("p", { class: "tiny muted", style: { marginTop: "12px" }, html: `${c.excerpt ? "An excerpt. " : ""}${c.uniq} different kanji, ${c.rare} outside the jōyō list. Text from 青空文庫 (Aozora Bunko), public domain; readings the original edition printed are kept, the rest were added automatically and may occasionally be wrong. ` }),
    el("details", { class: "tiny muted" }, el("summary", { text: "Source edition & volunteers (底本・入力・校正)" }), el("pre", { style: { whiteSpace: "pre-wrap", fontFamily: "var(--jp)", fontSize: "11px" }, text: c.colophon || "" })));
  return box;
}

/* ==========================================================================
   GRAMMAR — N5 to N1, plus the classical forms you meet in literature.
   ========================================================================== */
const GRAMMAR_ALL = () => {
  if (!GRAMMAR_ALL._c) {
    const ext = DATA.get("grammar_ext") || [];
    const seen = new Set(GRAMMAR.map(g => g.id));
    GRAMMAR_ALL._c = [...GRAMMAR, ...ext.filter(g => !seen.has(g.id))];
  }
  return GRAMMAR_ALL._c;
};
const GLV = [["all", "All"], ["5", "N5"], ["4", "N4"], ["3", "N3"], ["2", "N2"], ["1", "N1"], ["0", "文語 Literary"]];

function viewGrammar() {
  const v = $("#view");
  const all = GRAMMAR_ALL();
  const count = n => all.filter(g => String(g.jlpt) === n).length;
  let q = QUERY.q || "", lvl = QUERY.lv || Store.d.glv || "all";
  v.append(page("ぶんぽう", "Grammar", "文",
    `${all.length} patterns from the first です to the classical なり and けり — ${count("5")} at N5, ${count("4")} at N4, ${count("3")} at N3, ${count("2")} at N2, ${count("1")} at N1, and ${count("0")} literary forms. Explained the way you'd explain them to a friend. Tap any word in an example to look it up.`));
  const search = el("input", { class: "type-in", placeholder: "search: pattern, meaning, or what it does", value: q,
    style: { fontFamily: "var(--jp)", fontSize: "16px", textAlign: "left", maxWidth: "320px", padding: "9px 12px" } });
  search.addEventListener("input", debounce(() => { q = search.value.trim().toLowerCase(); paint(); }, 160));
  v.append(el("div", { class: "row", style: { marginBottom: "10px" } }, search,
    el("button", { class: "btn sm ghost", onclick: () => grammarQuiz(listNow()) }, "✎ Quiz me on these")));
  v.append(el("div", { class: "row", style: { marginBottom: "18px" } }, segButtons(GLV, lvl, x => { lvl = x; Store.d.glv = x; Store.save(); paint(); })));
  const host = el("div", {});
  v.append(host);
  function listNow() {
    return all.filter(g => (lvl === "all" || String(g.jlpt) === lvl) &&
      (!q || g.jp.includes(q) || g.en.toLowerCase().includes(q) || (g.note || "").toLowerCase().includes(q) || (g.form || "").toLowerCase().includes(q) || (g.ex || []).some(e => plain(e[0]).includes(q))));
  }
  function paint() {
    host.innerHTML = "";
    const list = listNow();
    if (!list.length) { host.append(empty("無", "No pattern matches that.")); return; }
    host.append(el("div", { class: "tiny muted mono", style: { marginBottom: "10px" }, text: list.length + " patterns" }));
    let lastLv = null;
    let n = 0;
    const more = () => {
      const chunk = list.slice(n, n + 40); n += chunk.length;
      for (const g of chunk) {
        if (lvl === "all" && g.jlpt !== lastLv) { lastLv = g.jlpt; host.append(el("h2", { class: "glvh", text: g.jlpt ? "N" + g.jlpt : "文語 · literary & classical" })); }
        host.append(grammarCard(g));
      }
      if (n < list.length) { const b = el("button", { class: "btn ghost", style: { width: "100%", marginTop: "8px" }, text: `Show more (${list.length - n} left)` }); b.onclick = () => { b.remove(); more(); }; host.append(b); }
    };
    more();
  }
  paint();
}

function grammarCard(g) {
  const card = el("div", { class: "card gcard", style: { marginBottom: "12px" }, id: "g-" + g.id });
  card.append(el("div", { class: "spread", style: { alignItems: "flex-start" } },
    el("div", {},
      el("div", { class: "gpat", html: furi(g.jp, "on") }),
      el("div", { class: "small muted", text: g.en })),
    el("div", { class: "row", style: { gap: "6px" } }, lvTag(g.jlpt), starBtn("g:" + g.id))));
  if (g.form) card.append(el("div", { class: "formbox", text: g.form }));
  if (g.note) card.append(el("p", { class: "small", style: { marginTop: "10px", color: "var(--sumi-2)" }, text: g.note }));
  if (g.ex && g.ex.length) {
    const ex = el("div", { class: "exbox" });
    for (const [jp2, en] of g.ex) ex.append(el("div", { class: "exrow" }, jpLine(jp2), el("div", { class: "small muted", text: en })));
    card.append(ex);
  }
  return card;
}

/* quick self-test: see the English, pick the pattern (or the reverse) */
function grammarQuiz(list) {
  list = list.filter(g => g.ex && g.ex.length);
  if (list.length < 4) { toast("Pick a bigger set first."); return; }
  const v = $("#view"); v.innerHTML = "";
  const qs = shuffle(list).slice(0, 12);
  let k = 0, right = 0;
  const host = el("div", {});
  v.append(el("div", { class: "row", style: { marginBottom: "14px" } }, el("button", { class: "btn ghost sm", onclick: () => render() }, "← Grammar")),
    page("ぶんぽう クイズ", "Which pattern is it?", "問", "Read the sentence, then pick the pattern it uses."), host);
  function step() {
    host.innerHTML = "";
    if (k >= qs.length) { host.append(endCard("おつかれ！", [`${right} / ${qs.length} right`], () => grammarQuiz(list))); Sfx.ok(); return; }
    const g = qs[k], [jp, en] = pick(g.ex);
    const opts = shuffle([g, ...sample(list.filter(x => x.id !== g.id && x.jlpt === g.jlpt).concat(list.filter(x => x.id !== g.id)), 3)]).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
    if (!opts.includes(g)) opts[0] = g;
    host.append(el("div", { class: "card" }, el("div", { class: "mono tiny muted", text: `${k + 1} / ${qs.length}` }),
      el("div", { style: { fontFamily: "var(--hand)", fontSize: "22px", lineHeight: "2", margin: "8px 0" } }, lookupText(jp)),
      el("div", { class: "small muted", text: en })));
    const ans = el("div", { class: "answers" });
    let done = false;
    shuffle(opts).forEach(o => ans.append(el("button", { class: "ans", onclick: e => {
      if (done) return; done = true;
      if (o.id === g.id) { right++; e.currentTarget.classList.add("ok"); Sfx.ok(); } else { e.currentTarget.classList.add("bad"); Sfx.no(); }
      host.append(grammarCard(g), el("button", { class: "btn pri", onclick: () => { k++; step(); } }, "Next →"));
    } }, el("span", {}, el("b", { html: furi(o.jp, "on") }), el("br"), el("span", { class: "tiny muted", text: o.en })))));
    host.append(ans);
  }
  step();
}

/* ---- dictionary page ---------------------------------------------------------- */
function viewDict() {
  const v = $("#view");
  v.append(page("じしょ", "Dictionary", "辞",
    `${DICT.size.toLocaleString()} words — every JLPT word N5 to N1 plus thousands more — searchable in kanji, kana, romaji or English. Conjugated forms work too: try <i>tabemashita</i> or 行かなかった.`));
  const inp = el("input", { class: "type-in", placeholder: "日本語, nihongo, or English…", value: QUERY.q || "", style: { textAlign: "left", fontFamily: "var(--jp)", fontSize: "20px" } });
  const res = el("div", { style: { marginTop: "14px" } });
  const run = () => {
    const q = inp.value.trim();
    res.innerHTML = "";
    if (!q) {
      res.append(el("div", { class: "card" }, el("div", { class: "eyebrow" }, "My words"),
        myWords().length ? el("div", { class: "row" }, myWords().slice(-40).reverse().map(w => el("button", { class: "chip", onclick: () => { inp.value = w.w; run(); } }, el("b", { text: w.w }), el("span", { class: "tiny", text: w.m.split(";")[0] })))) :
          el("p", { class: "small muted", text: "Words you add from here or from any reader collect here — and become a flashcard deck." })));
      return;
    }
    const lk = !/^[a-z0-9\s'\-]+$/i.test(q) ? lookupAt(q, 0, 20) : null;
    const list = DICT.search(q, 80);
    const seen = new Set();
    const out = [];
    if (lk && lk.len === q.length) for (const h of lk.hits) { seen.add(h.e.i); out.push([h.e, h.why]); }
    for (const e of list) if (!seen.has(e.i)) { seen.add(e.i); out.push([e, []]); }
    if (!out.length) { res.append(empty("無", "Nothing found. Try the dictionary form, or fewer letters.")); return; }
    res.append(el("div", { class: "tiny muted mono", style: { marginBottom: "8px" }, text: out.length + (out.length >= 80 ? "+" : "") + " results" }));
    for (const [e, why] of out.slice(0, 80)) res.append(entryCard(e, why));
  };
  inp.addEventListener("input", debounce(() => { history.replaceState(null, "", "#/dict?q=" + encodeURIComponent(inp.value.trim())); run(); }, 220));
  v.append(inp, el("div", { class: "imehint", text: "romaji is converted automatically · English searches whole words first" }), res);
  run();
  setTimeout(() => inp.focus(), 50);
}

/* ==========================================================================
   FAITH & MISSION — the club exists to prepare people for mission work in
   Japan. Prayers (horizontal and vertical, like the club handout), verses to
   memorise, church words and phrases, a testimony builder, and notes.
   ========================================================================== */
function viewFaith() {
  const v = $("#view");
  const F = DATA.get("faith");
  if (!F) { v.append(empty("？", "Faith content missing.")); return; }
  const tab = QUERY.t || "pray";
  v.append(page("しんこう・でんどう", "Faith & Mission", "信",
    `${esc(CLUB().mission || "")} This section is the practical side of that: the words and habits you'll need at a Japanese church, with friends, and when you're asked why you believe.`));
  const tabs = [["pray", "祈 Prayers"], ["verses", "聖 Verses"], ["words", "語 Church words"], ["phrases", "話 Phrases"], ["testimony", "証 Testimony"], ["notes", "史 Notes"]];
  v.append(el("div", { class: "row", style: { marginBottom: "18px" } }, tabs.map(([k, lab]) => el("a", { class: "chip" + (tab === k ? " on" : ""), href: "#/faith?t=" + k }, lab))));
  const host = el("div", {});
  v.append(host);
  ({ pray: faithPrayers, verses: faithVerses, words: faithWords, phrases: faithPhrases, testimony: faithTestimony, notes: faithNotes }[tab] || faithPrayers)(host, F);
}

function faithPrayers(host, F) {
  for (const p of F.prayers) {
    const card = el("div", { class: "card prayer", style: { marginBottom: "16px" } });
    let vert = p.id === "lords-club" ? false : false, furiMode = "on", showEn = true;
    const body = el("div", {});
    const paint = () => {
      body.innerHTML = "";
      const lines = el("div", { class: "prayer-lines" + (vert ? " vert-block" : "") });
      p.lines.forEach(([jp, en]) => lines.append(el("div", { class: "pl" },
        el("div", { class: "pj" }, lookupText(jp, { furi: furiMode })),
        !vert && showEn ? el("div", { class: "pe", text: en }) : null)));
      body.append(lines);
    };
    card.append(el("div", { class: "spread" },
      el("div", {}, el("h3", { html: furi(p.title, "on") }), el("div", { class: "small muted", text: p.en })),
      el("div", { class: "row noprint", style: { gap: "6px" } },
        chipToggle("縦書き", vert, on => { vert = on; paint(); }),
        chipToggle("ふりがな", true, on => { furiMode = on ? "on" : "off"; paint(); }),
        chipToggle("English", true, on => { showEn = on; paint(); }),
        el("button", { class: "btn sm pri", onclick: () => speakLines(p.lines.map(l => plain(l[0])), card) }, "▶ Pray it aloud"),
        el("button", { class: "btn sm ghost", onclick: () => memorise(p) }, "暗 Memorise"))),
      p.note ? el("p", { class: "small muted", style: { margin: "8px 0" }, text: p.note }) : null, body);
    if (p.grammar) card.append(el("details", { class: "small", style: { marginTop: "10px" } }, el("summary", { text: "Grammar in this prayer" }),
      el("dl", { class: "kv", style: { marginTop: "8px" } }, p.grammar.map(([a, b]) => [el("dt", { style: { fontFamily: "var(--hand)", fontSize: "15px", textTransform: "none", letterSpacing: 0 }, text: a }), el("dd", { class: "small", text: b })]).flat())));
    paint();
    host.append(card);
  }
}
function speakLines(lines, scope) {
  let k = 0;
  const nodes = scope ? [...scope.querySelectorAll(".pl")] : [];
  const step = () => {
    nodes.forEach(n => n.classList.remove("speaking"));
    if (k >= lines.length) return;
    if (nodes[k]) nodes[k].classList.add("speaking");
    speakNow(lines[k++], step);
  };
  step();
}

/* memorise: words fade out a little more each round */
function memorise(item) {
  const lines = item.lines ? item.lines.map(l => l[0]) : [item.jp];
  let level = 0;
  const body = el("div", {});
  const words = src => {
    const t = plain(src); const out = [];
    let cur = "";
    for (const c of t) { cur += c; if (/[、。，！？」]/.test(c)) { out.push(cur); cur = ""; } }
    if (cur) out.push(cur);
    return out.flatMap(chunk => chunk.match(/.{1,4}/g) || []);
  };
  const paint = () => {
    body.innerHTML = "";
    const box = el("div", { class: "memo" });
    let n = 0;
    for (const l of lines) {
      const line = el("div", { class: "memo-line" });
      for (const w of words(l)) {
        const hide = level > 0 && ((n * 7 + level * 3) % 5) < level + 1 && /[^\s、。]/.test(w);
        const sp = el("span", { class: hide ? "memo-hide" : "", text: w });
        if (hide) sp.onclick = () => sp.classList.toggle("peek");
        line.append(sp); n++;
      }
      box.append(line);
    }
    body.append(box, el("div", { class: "row", style: { marginTop: "14px" } },
      el("button", { class: "btn sm ghost", onclick: () => { level = Math.max(0, level - 1); paint(); } }, "− Show more"),
      el("span", { class: "mono tiny muted", text: `level ${level} / 4` }),
      el("button", { class: "btn sm pri", onclick: () => { level = Math.min(4, level + 1); paint(); } }, "Hide more +"),
      el("button", { class: "btn sm ghost", onclick: () => speakLines(lines.map(plain)) }, "🔊")),
      el("p", { class: "tiny muted", style: { marginTop: "8px" }, text: "Say it out loud; tap a blank to peek. Each level hides more until you can say the whole thing from memory." }));
  };
  paint();
  modal("暗記 · Memorise", body, { sub: item.en || item.ref || "" });
}

function faithVerses(host, F) {
  host.append(el("p", { class: "small muted", style: { marginBottom: "12px" }, html: "From the 口語訳 (Colloquial Japanese Bible, 1954–55), which is out of copyright in Japan, plus one verse from the 1917 literary translation. The English under each verse is a close rendering of <i>this</i> Japanese, so you can see how it's built — compare it with your own Bible." }));
  const lvOrder = [5, 4, 3, 2, 0];
  const list = [...F.verses].sort((a, b) => lvOrder.indexOf(a.lv) - lvOrder.indexOf(b.lv));
  const items = list.map(vs => ({ id: "fv:" + vs.en, type: "card", o: { jp: vs.jp, kana: readingOf(vs.jp), en: vs.en + " — " + vs.lit, tag: "Verse" } }));
  host.append(el("div", { class: "row", style: { marginBottom: "14px" } },
    el("button", { class: "btn sm pri", onclick: () => runFlash(items, "verses") }, `札 Verse flashcards (${items.length})`)));
  for (const vs of list) {
    host.append(el("div", { class: "card verse", style: { marginBottom: "12px" } },
      el("div", { class: "spread" }, el("div", {}, el("b", { html: furi(vs.ref, "on") }), el("span", { class: "small muted", text: "  " + vs.en })),
        el("div", { class: "row", style: { gap: "6px" } }, lvTag(vs.lv), speakBtn(vs.jp), el("button", { class: "btn sm ghost", onclick: () => memorise({ jp: vs.jp, ref: vs.en, lines: [[vs.jp]] }) }, "暗"), starBtn("fv:" + vs.en))),
      el("div", { class: "vjp2" }, lookupText(vs.jp)),
      el("div", { class: "small", style: { color: "var(--sumi-2)" }, text: vs.lit }),
      vs.note ? el("div", { class: "tiny muted", style: { marginTop: "6px" }, text: vs.note }) : null));
  }
}

function faithWords(host, F) {
  const all = [];
  for (const g of F.vocab) {
    const grid = el("div", { class: "vgrid" });
    for (const [jp, en] of g.items) { grid.append(el("div", { class: "vcell" }, el("div", { class: "vjp" }, lookupText(jp)), el("div", { class: "en small", text: en }), speakBtn(jp))); all.push({ id: "fw:" + plain(jp), type: "card", o: { jp, kana: readingOf(jp), en, tag: "Church" } }); }
    host.append(sec(g.h, g.items.length, grid));
  }
  host.prepend(el("div", { class: "row", style: { marginBottom: "6px" } }, el("button", { class: "btn sm pri", onclick: () => runFlash(all, "church") }, `札 Study all ${all.length}`)));
}

function faithPhrases(host, F) {
  for (const g of F.phrases) {
    const list = el("div", { class: "plist" });
    for (const [jp, en, note] of g.items) list.append(el("div", { class: "prow" }, jpLine(jp), el("div", { class: "en", text: en }), note ? el("div", { class: "small muted", text: note }) : null));
    host.append(sec(g.h, g.items.length, list));
  }
}

function faithTestimony(host, F) {
  const T = F.testimony;
  const st = (Store.d.testimony ||= { pick: [], name: "", extra: "" });
  host.append(el("p", { class: "small", style: { marginBottom: "12px" }, text: T.intro }));
  const nameIn = el("input", { class: "type-in small-in", placeholder: "your name in katakana (e.g. コルセン)", value: st.name, style: { textAlign: "left", fontSize: "16px", maxWidth: "320px", padding: "9px 12px" } });
  nameIn.addEventListener("input", () => { st.name = nameIn.value; Store.save(); paintOut(); });
  const romaji = el("input", { class: "type-in small-in", placeholder: "…or type it in romaji", style: { textAlign: "left", fontSize: "16px", maxWidth: "220px", padding: "9px 12px" } });
  romaji.addEventListener("input", () => { nameIn.value = romajiToKana(romaji.value, true); st.name = nameIn.value; Store.save(); paintOut(); });
  host.append(el("div", { class: "row", style: { marginBottom: "14px" } }, nameIn, romaji));
  T.steps.forEach((s, si) => {
    const box = el("div", { class: "card", style: { marginBottom: "10px" } }, el("b", { text: `${si + 1}. ${s.h}` }), el("span", { class: "small muted", text: "  " + s.en }));
    const opts = el("div", { class: "plist", style: { marginTop: "8px" } });
    s.opts.forEach(([jp, en], oi) => {
      const on = st.pick[si] === oi;
      const b = el("button", { class: "prow optpick" + (on ? " on" : ""), onclick: () => { st.pick[si] = st.pick[si] === oi ? null : oi; Store.save(); [...opts.children].forEach((c, k) => c.classList.toggle("on", st.pick[si] === k)); paintOut(); } },
        el("div", { class: "pj", html: furi(jp) }), el("div", { class: "tiny muted", text: en }));
      opts.append(b);
    });
    box.append(opts);
    host.append(box);
  });
  const out = el("div", { class: "card", style: { borderColor: "var(--ai)" } });
  host.append(sec("Your testimony", null, out));
  function paintOut() {
    out.innerHTML = "";
    const name = st.name || "〇〇";
    const lines = T.steps.map((s, si) => st.pick[si] != null ? s.opts[st.pick[si]] : null).filter(Boolean)
      .map(([jp, en]) => [jp.replace(/〇〇/g, name), en.replace(/___/g, st.name ? romajiName(st.name) : "___")]);
    if (!lines.length) { out.append(el("p", { class: "small muted", text: "Pick one line from each step above." })); return; }
    out.append(el("div", {}, lines.map(([jp, en]) => el("div", { style: { marginBottom: "10px" } }, el("div", { class: "pj", style: { fontSize: "19px" } }, lookupText(jp)), el("div", { class: "tiny muted", text: en })))),
      el("div", { class: "row" },
        el("button", { class: "btn sm pri", onclick: () => speakLines(lines.map(l => plain(l[0])), out) }, "▶ Hear it"),
        el("button", { class: "btn sm ghost", onclick: () => { navigator.clipboard && navigator.clipboard.writeText(lines.map(l => plain(l[0])).join("\n")).then(() => toast("Copied.")); } }, "Copy"),
        el("button", { class: "btn sm ghost", onclick: () => memorise({ lines: lines.map(l => [l[0]]), en: "Your testimony" }) }, "暗 Memorise")));
  }
  paintOut();
}
const romajiName = k => kanaToRomaji(toHira(k)).replace(/^./, c => c.toUpperCase());

function faithNotes(host, F) {
  for (const n of F.notes) host.append(el("div", { class: "card", style: { marginBottom: "14px" } },
    el("h3", {}, n.h, el("span", { class: "small muted", style: { fontWeight: 400 }, html: "  " + furi(n.jp, "on") })),
    el("div", { class: "notes" }, n.body.map(p => el("p", { class: "small", html: mdLite(p) })))));
  host.append(el("p", { class: "small muted", html: "More everyday etiquette — bowing, shoes, gifts, reading the air — lives in <a href='#/culture'>Culture notes</a>." }));
}

/* ---- culture notes ------------------------------------------------------------ */
function viewCulture() {
  const v = $("#view");
  const C = DATA.get("culture") || [];
  const id = QUERY.id;
  v.append(page("ぶんか", "Culture notes", "和",
    "Short, practical notes for the first time you're in Japan — or the first time Japanese friends visit you. The language makes a lot more sense once you know what people are doing when they say it."));
  const grid = el("div", { class: "grid g2" });
  for (const c of C) {
    const open = id === c.id;
    const card = el("div", { class: "card culture" + (open ? " open" : ""), id: "c-" + c.id });
    const body = el("div", { class: "cbody" },
      c.body.map(p => el("p", { class: "small", html: mdLite(p) })),
      c.words && c.words.length ? el("div", { class: "row", style: { gap: "6px", marginTop: "8px" } }, c.words.map(([jp, en]) => el("button", { class: "chip", onclick: () => Speech.say(jp, { force: true }) }, el("span", { html: furi(jp) }), el("span", { class: "tiny", text: en })))) : null);
    card.append(el("button", { class: "chead", onclick: () => card.classList.toggle("open") },
      el("span", { style: { fontSize: "28px" }, text: c.ic }),
      el("span", { style: { flex: 1, textAlign: "left" } }, el("b", { text: c.h }), " ", el("span", { class: "small", style: { fontFamily: "var(--hand)" }, html: furi(c.jp, "on") }), el("div", { class: "small muted", text: c.lead })),
      el("span", { class: "muted", text: "▾" })), body);
    grid.append(card);
  }
  v.append(grid);
  if (id) setTimeout(() => { const n = $("#c-" + id); n && n.scrollIntoView({ block: "start" }); }, 60);
}

/* ==========================================================================
   FLASHCARDS, EXTENDED
   Sources: kana · all 2,136 kanji · MASU word decks · the club's JLC Anki
   decks · JLPT N5–N1 vocabulary · My words · imported Anki decks · grammar.
   Anki .apkg import (old and new formats, fully offline) and TSV export.
   ========================================================================== */
const CARDS = (() => {
  let jlcMap = null;
  const jlc = () => {
    if (jlcMap) return jlcMap;
    jlcMap = new Map();
    for (const L of (DATA.get("jlc_anki") || { levels: [] }).levels) for (const c of L.cards) jlcMap.set(c.id, { c, lv: L.n });
    return jlcMap;
  };
  const fromJlc = (c, lv) => c.t === "k"
    ? { id: c.id, type: "card", o: { jp: c.k, kana: [c.on, c.kun].filter(Boolean).join("・"), en: c.en, tag: "JLC Lv " + lv, kanji: true } }
    : { id: c.id, type: "card", o: { jp: c.f || c.w, kana: c.kana, en: c.en, tag: "JLC Lv " + lv } };
  const dictMarkup = e => hasKanjiStr(e.w) && e.r && e.r !== e.w ? `｜${e.w}{${e.r}}` : e.w;
  const fromDict = (e, lv) => ({ id: "d:" + e.w + "|" + e.r, type: "card", o: { jp: dictMarkup(e), kana: e.r, en: (e.s || e.m).split("; ").slice(0, 3).join("; "), tag: lv ? "JLPT N" + lv : "Dictionary" } });
  return {
    jlcLevels() { return (DATA.get("jlc_anki") || { levels: [] }).levels; },
    jlcItems(levels) { const out = []; for (const L of this.jlcLevels()) if (levels.includes(L.n)) for (const c of L.cards) out.push(fromJlc(c, L.n)); return out; },
    jlptItems(n, from = 0, to = 1e9) { return DICT.level(n).slice(from, to).map(i => fromDict(DICT.entry(i), n)); },
    mineItems() { return myWords().map(w => ({ id: "mw:" + w.w + "|" + w.r, type: "card", o: { jp: hasKanjiStr(w.w) && w.r !== w.w ? `｜${w.w}{${w.r}}` : w.w, kana: w.r, en: w.m, tag: "My words" } })); },
    importItems(deckId) { const d = (Store.d.imports || []).find(x => x.id === deckId); return d ? d.cards.map(c => ({ id: "imp:" + d.id + ":" + c.id, type: "card", o: { jp: c.jp, kana: c.kana, en: c.en, tag: d.name, extra: c.extra } })) : []; },
    grammarItems(level) { return GRAMMAR_ALL().filter(g => (level === "all" || String(g.jlpt) === String(level)) && g.ex && g.ex.length).map(g => ({ id: "g:" + g.id, type: "grammar", o: g })); },
    resolve(id) {
      if (id.startsWith("jlc:")) { const x = jlc().get(id); return x ? fromJlc(x.c, x.lv) : null; }
      if (id.startsWith("d:")) { const [w, r] = id.slice(2).split("|"); const e = DICT.exact(w).find(e => e.r === r) || DICT.exact(w)[0]; return e ? fromDict(e, e.j) : null; }
      if (id.startsWith("mw:")) { const [w, r] = id.slice(3).split("|"); return this.mineItems().find(x => x.id === id) || null; }
      if (id.startsWith("imp:")) { const [, deck] = id.split(":"); return this.importItems(deck).find(x => x.id === id) || null; }
      if (id.startsWith("jv:")) { const [, n] = id.split(":"); const ch = JLC().find(c => c.n === +n); return ch ? jlcVocabItems(ch).find(x => x.id === id) || null : null; }
      if (id.startsWith("fv:") || id.startsWith("fw:")) {
        const F = DATA.get("faith"); if (!F) return null;
        if (id.startsWith("fv:")) { const vs = F.verses.find(x => "fv:" + x.en === id); return vs ? { id, type: "card", o: { jp: vs.jp, kana: readingOf(vs.jp), en: vs.en + " — " + vs.lit, tag: "Verse" } } : null; }
        for (const g of F.vocab) for (const [jp, en] of g.items) if ("fw:" + plain(jp) === id) return { id, type: "card", o: { jp, kana: readingOf(jp), en, tag: "Church" } };
        return null;
      }
      if (id.startsWith("g:")) { const g = GRAMMAR_ALL().find(x => "g:" + x.id === id); return g ? { id, type: "grammar", o: g } : null; }
      if (id.startsWith("kanji:")) { const o = kanjiObj(id.slice(6)); return o ? { id, type: "kanji", o } : null; }
      return null;
    }
  };
})();

/* every SRS id the user has touched that is due now, resolvable to a card */
function dueItems(limit = 200) {
  const now = Date.now();
  return Object.entries(Store.d.srs).filter(([, c]) => c.due <= now).sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => itemById(id)).filter(Boolean).slice(0, limit).map(it => it.id ? it : it);
}
function dueCount() { const now = Date.now(); let n = 0; for (const id in Store.d.srs) if (Store.d.srs[id].due <= now) n++; return n; }

/* ---- the picker, with every source -------------------------------------------- */
const FLASH_KINDS = [["kana", "字 Kana"], ["kanji", "漢 Kanji"], ["club", "会 Club · JLC Anki"], ["jlpt", "級 JLPT words"], ["words", "語 Topic decks"], ["mine", "私 My words & imports"], ["grammar", "文 Grammar"]];
function fsel2() {
  const f = FSEL();
  f.jlc ||= [0]; f.jlpt ||= 5; f.jlptPart ||= 0; f.imp ||= []; f.mw ??= true; f.glv ||= "5"; f.klv ||= [5];
  return f;
}
function selectedItems() {
  const f = fsel2();
  if (f.kind === "kana") {
    const pool = [];
    for (const s of f.scripts) pool.push(...kanaList(s, f.sets.length ? f.sets : ["base"]));
    return pool.filter(k => !f.chars.length || inArr(f.chars, k.ch)).map(k => ({ id: kanaId(k), type: "kana", o: k }));
  }
  if (f.kind === "kanji") {
    const pool = KJ.all().filter(k => inArr(f.klv, k.jlpt)).sort((a, b) => (b.jlpt - a.jlpt) || (a.freq || 9e3) - (b.freq || 9e3));
    return pool.filter(k => !f.kanji.length || inArr(f.kanji, k.ch)).map(k => ({ id: "kanji:" + k.ch, type: "kanji", o: kanjiObj(k.ch) })).filter(x => x.o);
  }
  if (f.kind === "club") return CARDS.jlcItems(f.jlc);
  if (f.kind === "jlpt") { const p = +f.jlptPart; return p < 0 ? CARDS.jlptItems(+f.jlpt) : CARDS.jlptItems(+f.jlpt, p * 100, p * 100 + 100); }
  if (f.kind === "mine") { const out = f.mw ? CARDS.mineItems() : []; for (const d of f.imp) out.push(...CARDS.importItems(d)); return out; }
  if (f.kind === "grammar") return CARDS.grammarItems(f.glv);
  const decks = f.decks.length ? f.decks : DECKS.map(d => d.id);
  return VOCAB.filter(v => inArr(decks, v.deck)).map(v => ({ id: v.id, type: "vocab", o: v }));
}
function applyScope(scope, f) {
  if (scope.startsWith("kana:")) { f.kind = "kana"; f.scripts = [scope.slice(5)]; f.chars = []; }
  else if (scope === "kana") { f.kind = "kana"; f.scripts = ["hira", "kata"]; f.chars = []; }
  else if (scope === "kanji") { f.kind = "kanji"; f.klv = [5, 4]; f.kanji = []; }
  else if (scope.startsWith("kanji:")) { f.kind = "kanji"; f.klv = [+scope.slice(6)]; f.kanji = []; }
  else if (scope === "vocab") { f.kind = "words"; f.decks = []; }
  else if (scope.startsWith("deck:")) { f.kind = "words"; f.decks = [scope.slice(5)]; }
  else if (scope.startsWith("jlc:")) { f.kind = "club"; f.jlc = scope.slice(4).split(",").map(Number); }
  else if (scope.startsWith("jlpt:")) { f.kind = "jlpt"; f.jlpt = +scope.slice(5); f.jlptPart = 0; }
  else if (scope === "mine") { f.kind = "mine"; }
  else if (scope.startsWith("grammar")) { f.kind = "grammar"; f.glv = scope.split(":")[1] || "5"; }
  else if (scope.startsWith("chapter:")) {
    const ch = CHAPTERS.find(c => c.n === +scope.slice(8));
    if (ch) { const d = ch.sections.filter(s => s.t === "vocab").map(s => s.deck); if (d.length) { f.kind = "words"; f.decks = d; } }
  }
  fsave();
}

function viewFlash(scope) {
  const v = $("#view");
  const f = fsel2();
  if (scope) applyScope(scope, f);
  const due = dueCount();
  v.append(page("フラッシュカード", "Flashcards", "札",
    "Spaced repetition on anything in the app — kana, all the kanji, the club's own Anki decks, every JLPT word list, words you've saved while reading, grammar, or any Anki deck you import. Pick a source, narrow it down, start."));

  v.append(el("div", { class: "card duecard" },
    el("div", { class: "spread" },
      el("div", {}, el("div", { class: "eyebrow" }, "Everything due"), el("div", { class: "row", style: { gap: "22px" } }, stat(due, "cards due"), stat(Object.keys(Store.d.srs).length, "cards in rotation"))),
      el("div", { class: "row" },
        el("button", { class: "btn pri lg", disabled: !due || null, onclick: () => { const it = dueItems(+SET().srsCap || 60); it.length ? runFlash(it, "due") : toast("Nothing due."); } }, due ? `Review ${Math.min(due, +SET().srsCap || 60)} due` : "Nothing due 🎉"),
        el("a", { class: "btn ghost", href: "#/anki" }, "Import / export Anki")))));

  const kindRow = el("div", { class: "row", style: { margin: "22px 0 14px" } });
  for (const [k, lab] of FLASH_KINDS) kindRow.append(el("button", { class: "chip" + (f.kind === k ? " on" : ""), text: lab, onclick: () => { f.kind = k; fsave(); render(); } }));
  v.append(kindRow);

  const panel = el("div", {});
  v.append(panel);
  if (f.kind === "kana") kanaPicker(panel, f);
  else if (f.kind === "kanji") kanjiPicker2(panel, f);
  else if (f.kind === "club") clubPicker(panel, f);
  else if (f.kind === "jlpt") jlptPicker(panel, f);
  else if (f.kind === "mine") minePicker(panel, f);
  else if (f.kind === "grammar") panel.append(el("div", { class: "row", style: { marginBottom: "14px" } }, el("span", { class: "tiny muted", text: "Level" }),
    segButtons(GLV, f.glv, x => { f.glv = x; fsave(); syncCount(); })), el("p", { class: "small muted", text: "The front shows a real sentence; you recall the pattern and what it means." }));
  else wordPicker(panel, f);

  v.append(sec("How to run it", null, el("div", { class: "card" },
    optRow("Direction", "Which side of the card you see first.", pickSeg(f, "dir", [["jp2en", "見る Japanese first"], ["en2jp", "言う Meaning first"], ["mix", "混 Mixed"]])),
    optRow("Grading", "SRS schedules each card. Browse just flips cards and changes nothing.", pickSeg(f, "mode", [["srs", "SRS"], ["flip", "Browse"]])),
    optRow("Order", null, pickSeg(f, "order", [["srs", "Due first"], ["random", "Shuffled"], ["chart", "In order"]])),
    optRow("Cards per session", null, pickSeg(f, "limit", [[20, "20"], [40, "40"], [100, "100"], [0, "All"]])),
    optRow("Read each card aloud", "Uses your device's Japanese voice.",
      el("button", { class: "sw" + (f.auto === "on" ? " on" : ""), role: "switch", onclick: e => { f.auto = f.auto === "on" ? "off" : "on"; fsave(); e.currentTarget.classList.toggle("on", f.auto === "on"); } }, el("i", {}))))));

  const count = el("b", { class: "mono", style: { fontSize: "20px" } });
  const detail = el("span", { class: "small muted" });
  v.append(el("div", { class: "selbar" },
    el("div", {}, count, el("span", { class: "small muted", text: " selected" }), el("br"), detail),
    el("span", { style: { flex: 1 } }),
    el("button", { class: "btn ghost sm", onclick: () => exportTSV(selectedItems(), "flashcards") }, "⇩ TSV"),
    el("button", { class: "btn pri lg", onclick: () => begin(selectedItems().filter(x => SRS.isNew(x.id) || SRS.due(x.id)).length ? selectedItems() : selectedItems()) }, "Start")));
  function syncCount() {
    const items = selectedItems();
    count.textContent = String(items.length);
    const c = SRS.counts(items.map(x => x.id));
    detail.textContent = `${c.due} due · ${c.fresh} new · ${c.known} solid`;
  }
  syncCount();
  v.addEventListener("click", () => setTimeout(syncCount, 0));
  function begin(items) { if (!items.length) { toast("Nothing selected yet."); return; } runFlash(items, "all"); }
}

function kanjiPicker2(host, f) {
  const lvRow = el("div", { class: "row", style: { marginBottom: "14px" } }, el("span", { class: "tiny muted", text: "Level:" }));
  for (const n of [5, 4, 3, 2, 1]) lvRow.append(el("button", { class: "chip" + (inArr(f.klv, n) ? " on" : ""), text: "N" + n + " · " + KJ.all().filter(k => k.jlpt === n).length,
    onclick: () => { toggleIn(f.klv, n); if (!f.klv.length) f.klv.push(5); f.kanji = []; fsave(); render(); } }));
  host.append(lvRow, presetRow(f, "kanji", () => KJ.all().filter(k => inArr(f.klv, k.jlpt)).map(k => ({ key: k.ch, id: "kanji:" + k.ch }))));
  const list = KJ.all().filter(k => inArr(f.klv, k.jlpt)).sort((a, b) => (b.jlpt - a.jlpt) || (a.freq || 9e3) - (b.freq || 9e3));
  const grid = el("div", { class: "pickgrid wide" });
  for (const k of list.slice(0, 600)) {
    const id = "kanji:" + k.ch;
    const due = !SRS.isNew(id) && SRS.due(id);
    const b = el("button", { class: "pk" + (inArr(f.kanji, k.ch) ? " on" : ""), title: k.mean }, due && el("span", { class: "dot" }), el("span", { text: k.ch }), el("span", { class: "rm", text: "N" + k.jlpt }));
    b.onclick = () => { toggleIn(f.kanji, k.ch); fsave(); b.classList.toggle("on", inArr(f.kanji, k.ch)); };
    grid.append(b);
  }
  host.append(sec("Tap the ones you want (or leave all off for the whole level)", list.length, grid));
}
function clubPicker(host, f) {
  const L = CARDS.jlcLevels();
  host.append(el("p", { class: "small muted", style: { marginBottom: "10px" }, text: "The club's own Anki decks, Level 0 to 8 — the same cards, now with furigana, audio and spaced repetition in the browser. Pick levels:" }));
  host.append(el("div", { class: "row", style: { marginBottom: "12px" } }, L.map(l => el("button", { class: "chip" + (inArr(f.jlc, l.n) ? " on" : ""),
    onclick: e => { toggleIn(f.jlc, l.n); if (!f.jlc.length) f.jlc.push(l.n); fsave(); e.currentTarget.classList.toggle("on", inArr(f.jlc, l.n)); } }, "Level " + l.n, el("span", { class: "mono tiny", text: String(l.cards.length) })))),
    el("div", { class: "row" }, el("button", { class: "btn sm ghost", onclick: () => { f.jlc = L.map(l => l.n); fsave(); render(); } }, "All levels"),
      el("button", { class: "btn sm ghost", onclick: () => exportTSV(CARDS.jlcItems(f.jlc), "JLC-levels-" + f.jlc.join("-")) }, "⇩ Export for Anki (TSV)")));
}
function jlptPicker(host, f) {
  const sizes = { 5: DICT.level(5).length, 4: DICT.level(4).length, 3: DICT.level(3).length, 2: DICT.level(2).length, 1: DICT.level(1).length };
  host.append(el("div", { class: "row", style: { marginBottom: "10px" } }, el("span", { class: "tiny muted", text: "Level" }),
    segButtons([5, 4, 3, 2, 1].map(n => [n, `N${n} · ${sizes[n]}`]), f.jlpt, x => { f.jlpt = +x; f.jlptPart = 0; fsave(); render(); })));
  const parts = Math.ceil(sizes[f.jlpt] / 100);
  const row = el("div", { class: "row", style: { gap: "6px" } }, el("span", { class: "tiny muted", text: "Slice of 100" }));
  for (let p = 0; p < parts; p++) {
    const ids = CARDS.jlptItems(f.jlpt, p * 100, p * 100 + 100).map(x => x.id);
    const c = SRS.counts(ids);
    row.append(el("button", { class: "chip" + (+f.jlptPart === p ? " on" : ""), title: `${c.known} solid · ${c.due} due`, onclick: () => { f.jlptPart = p; fsave(); render(); } },
      `${p * 100 + 1}–${Math.min(sizes[f.jlpt], p * 100 + 100)}`, c.total - c.fresh ? el("span", { class: "mono tiny", text: pct(c.total - c.fresh, c.total) + "%" }) : null));
  }
  row.append(el("button", { class: "chip" + (+f.jlptPart === -1 ? " on" : ""), onclick: () => { f.jlptPart = -1; fsave(); render(); } }, "All"));
  host.append(row, el("p", { class: "tiny muted", style: { marginTop: "8px" }, text: "JLPT lists: open-anki-jlpt-decks (MIT). Meanings: JMdict (EDRDG, CC BY-SA). The official JLPT hasn't published word lists since 2010, so every list is an educated reconstruction." }));
}
function minePicker(host, f) {
  const imps = Store.d.imports || [];
  host.append(el("div", { class: "row", style: { marginBottom: "10px" } },
    el("button", { class: "chip" + (f.mw ? " on" : ""), onclick: e => { f.mw = !f.mw; fsave(); e.currentTarget.classList.toggle("on", f.mw); } }, "My words", el("span", { class: "mono tiny", text: String(myWords().length) })),
    imps.map(d => el("button", { class: "chip" + (inArr(f.imp, d.id) ? " on" : ""), onclick: e => { toggleIn(f.imp, d.id); fsave(); e.currentTarget.classList.toggle("on", inArr(f.imp, d.id)); } }, d.name, el("span", { class: "mono tiny", text: String(d.cards.length) })))));
  host.append(el("p", { class: "small muted" }, "Add words from the ", el("a", { href: "#/dict" }, "dictionary"), " or by tapping words while reading. Bring in your own decks on the ", el("a", { href: "#/anki" }, "Anki page"), "."));
}

/* ---- card faces for the new types (used by runFlash) ------------------------------ */
const _faceOf = faceOf, _faceText = faceText, _sayOf = sayOf, _shortOf = shortOf, _cornerOf = cornerOf;
faceOf = function (it, jpFirst, isBack) {
  if (it.type === "card") {
    const c = it.o, showJp = jpFirst !== isBack;
    const kanaLine = c.kana && plain(c.jp) !== c.kana && !/\{/.test(c.jp) ? el("div", { class: "rom", style: { fontSize: "18px" }, text: c.kana }) : null;
    return showJp
      ? el("div", {}, el("div", { class: c.kanji ? "big" : "mid", html: furi(c.jp, isBack ? "on" : "off") }), isBack && kanaLine, isBack && el("div", { class: "en", text: c.en }))
      : el("div", {}, el("div", { class: "en", style: { fontSize: "22px" }, text: c.en }),
          isBack && el("div", { class: c.kanji ? "big" : "mid", html: furi(c.jp, "on") }), isBack && kanaLine,
          !isBack && el("div", { class: "sub", text: "say it in Japanese" }));
  }
  if (it.type === "grammar") {
    const g = it.o, ex = g.ex[0];
    return !isBack
      ? el("div", {}, el("div", { class: "sub", text: "what pattern · what does it mean?" }), el("div", { class: "mid", style: { fontSize: "clamp(20px,5vw,30px)" }, html: furi(ex[0], "on") }))
      : el("div", {}, el("div", { class: "mid", html: furi(g.jp, "on") }), el("div", { class: "en", text: g.en }), el("div", { class: "mn", html: furi(ex[0], "on") + "<br>" + esc(ex[1]) }));
  }
  return _faceOf(it, jpFirst, isBack);
};
faceText = it => it.type === "card" ? plain(it.o.jp) : it.type === "grammar" ? it.o.jp : _faceText(it);
sayOf = it => it.type === "card" ? (it.o.kanji ? plain(it.o.jp) : it.o.kana || plain(it.o.jp)) : it.type === "grammar" ? plain(it.o.ex[0][0]) : _sayOf(it);
shortOf = it => it.type === "card" ? it.o.en : it.type === "grammar" ? it.o.en : _shortOf(it);
cornerOf = it => it.type === "card" ? it.o.tag || "" : it.type === "grammar" ? (it.o.jlpt ? "N" + it.o.jlpt : "文語") : it.type === "kanji" && !it.o.jlpt ? "jōyō" : _cornerOf(it);
const _openItem = openItem;
openItem = function (it) {
  if (it.type === "card") { const r = lookupAt(plain(it.o.jp), 0, 30); if (r) lookupSheet(r); else modal(plain(it.o.jp), el("div", {}, el("p", { html: furi(it.o.jp, "on") }), el("p", { text: it.o.en }))); return; }
  if (it.type === "grammar") { modal(it.o.jp, grammarCard(it.o)); return; }
  if (it.type === "kanji" && !KANJI_BY[it.o.ch]) { openKanji(it.o.ch); return; }
  _openItem(it);
};

/* ---- export ------------------------------------------------------------------------ */
function exportTSV(items, name) {
  if (!items.length) { toast("Nothing to export."); return; }
  const clean = s => String(s || "").replace(/[\t\n\r]+/g, " ");
  const rows = items.map(it => {
    if (it.type === "card") return [plain(it.o.jp), it.o.kana || "", it.o.en, (it.o.tag || "").replace(/\s+/g, "_")];
    if (it.type === "vocab") return [plain(it.o.form), it.o.kana, it.o.en, "MASU"];
    if (it.type === "kanji") return [it.o.ch, [it.o.on, it.o.kun].filter(Boolean).join(" / "), it.o.mean, "kanji"];
    if (it.type === "kana") return [it.o.ch, it.o.rom, it.o.rom, "kana"];
    if (it.type === "grammar") return [it.o.jp, it.o.form || "", it.o.en, "grammar"];
    return null;
  }).filter(Boolean).map(r => r.map(clean).join("\t"));
  download(`${name}.txt`, "#separator:tab\n#html:false\n#columns:Japanese\tReading\tMeaning\tTags\n#tags column:4\n" + rows.join("\n"), "text/tab-separated-values");
  toast(`Exported ${rows.length} cards — in Anki: File → Import.`);
}

/* ---- import: .apkg (zip → sqlite) and plain text ------------------------------------ */

function importText(name, text) {
  const lines = text.replace(/\r/g, "").split("\n").filter(l => l.trim() && !l.startsWith("#"));
  const sep = lines.some(l => l.includes("\t")) ? "\t" : ",";
  const cards = lines.map((l, i) => {
    const f = (sep === "," ? l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).map(x => x.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"')) : l.split("\t")).map(ankiField);
    let jpI = f.findIndex(hasJp); if (jpI < 0) jpI = 0;
    const jp = f[jpI], rest = f.filter((_, k) => k !== jpI);
    const kanaI = rest.findIndex(x => /^[ぁ-んァ-ンー・\s]+$/.test(x));
    const kana = kanaI >= 0 ? rest[kanaI] : readingOf(jp);
    const en = rest.filter((_, k) => k !== kanaI).find(x => x && !hasJp(x)) || "";
    return { id: String(i + 1), jp, kana: plain(kana), en };
  }).filter(c => c.jp);
  return [{ name: name.replace(/\.(txt|tsv|csv)$/i, ""), cards }];
}
function saveImports(decks) {
  const imps = (Store.d.imports ||= []);
  let n = 0;
  for (const d of decks) {
    if (!d.cards.length) continue;
    const id = "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    imps.push({ id, name: d.name, cards: d.cards, ts: Date.now() });
    n += d.cards.length;
  }
  Store.save();
  return n;
}

function viewAnki() {
  const v = $("#view");
  v.append(page("アンキ", "Anki decks", "暗",
    "Bring your Anki decks into the browser, or take this site's decks into Anki. Everything happens on your device — nothing is uploaded anywhere."));
  const out = el("div", {});
  const zone = el("label", { class: "dropzone", style: { display: "block", cursor: "pointer" } },
    el("div", { style: { fontSize: "28px" }, text: "⇪" }),
    el("b", { text: "Drop an .apkg (or a .txt / .csv export) here, or tap to choose" }),
    el("div", { class: "small", text: "Old and new Anki formats both work. Cards keep their furigana." }));
  const inp = el("input", { type: "file", accept: ".apkg,.txt,.tsv,.csv", multiple: true, style: { display: "none" } });
  zone.append(inp);
  const handle = async files => {
    out.innerHTML = "";
    for (const file of files) {
      const line = el("div", { class: "small", text: "Reading " + file.name + "…" }); out.append(line);
      try {
        const decks = /\.apkg$/i.test(file.name) ? await importApkg(file) : importText(file.name, await file.text());
        const n = saveImports(decks);
        line.innerHTML = ""; line.append(el("b", { text: "✓ " + file.name }), ` — ${decks.length} deck${decks.length === 1 ? "" : "s"}, ${n} cards: `, decks.map(d => d.name).join(", "));
      } catch (e) { console.error(e); line.innerHTML = ""; line.append(el("b", { style: { color: "var(--shu)" }, text: "✗ " + file.name }), " — " + (e.message || e)); }
    }
    paintList();
  };
  inp.onchange = e => handle([...e.target.files]);
  zone.addEventListener("dragover", e => { e.preventDefault(); zone.classList.add("hot"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("hot"));
  zone.addEventListener("drop", e => { e.preventDefault(); zone.classList.remove("hot"); handle([...e.dataTransfer.files]); });
  v.append(zone, out);

  const list = el("div", {});
  v.append(sec("Your imported decks", null, list));
  function paintList() {
    list.innerHTML = "";
    const imps = Store.d.imports || [];
    if (!imps.length) { list.append(el("p", { class: "small muted", text: "None yet." })); return; }
    list.append(el("div", { class: "lst" }, imps.map(d => el("div", { class: "li", style: { cursor: "default" } },
      el("span", { class: "lead", style: { fontSize: "18px" }, html: furi(d.cards[0]?.jp || "", "on") }),
      el("span", { class: "body" }, el("b", { text: d.name }), el("span", { text: `${d.cards.length} cards · imported ${new Date(d.ts).toLocaleDateString()}` })),
      el("span", { class: "row", style: { gap: "6px", flexWrap: "nowrap" } },
        el("button", { class: "btn sm pri", onclick: () => runFlash(CARDS.importItems(d.id), "import") }, "Study"),
        el("button", { class: "btn sm ghost", onclick: () => exportTSV(CARDS.importItems(d.id), d.name) }, "⇩"),
        el("button", { class: "btn sm ghost", title: "Delete", onclick: () => { if (confirmDelete(d.name)) { Store.d.imports = imps.filter(x => x !== d); Store.save(); paintList(); } } }, "✕"))))));
  }
  paintList();

  v.append(sec("Take these decks into Anki", null, el("div", { class: "card" },
    el("p", { class: "small", text: "Tab-separated text files that Anki imports directly (File → Import). Each has Japanese, reading, meaning and a tag." }),
    el("div", { class: "row", style: { marginTop: "10px" } },
      CARDS.jlcLevels().map(l => el("button", { class: "btn sm ghost", onclick: () => exportTSV(CARDS.jlcItems([l.n]), "JLC-Level-" + l.n) }, "JLC Lv " + l.n)),
      [5, 4, 3, 2, 1].map(n => el("button", { class: "btn sm ghost", onclick: () => exportTSV(CARDS.jlptItems(n), "JLPT-N" + n) }, "JLPT N" + n)),
      el("button", { class: "btn sm ghost", onclick: () => exportTSV(CARDS.mineItems(), "My-words") }, "My words")))));
}
function confirmDelete(name) { return window.confirm ? window.confirm(`Delete “${name}”? Your review history for it stays, but the cards go.`) : true; }

/* ==========================================================================
   CLUB — meeting info, what's coming up, the practice-test builder, and a
   projector mode for running a meeting straight from a chapter.
   Club details live in the d-club JSON block near the top of index.html:
   officers can edit meeting time, room and events there each semester.
   ========================================================================== */
function nextMeeting() {
  const C = CLUB(), m = C.meeting || {};
  const dayIdx = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(String(m.day || "").toLowerCase());
  if (dayIdx < 0) return null;
  const now = new Date(), d = new Date(now);
  const endH = m.endHour ?? 18.5;
  let add = (dayIdx - now.getDay() + 7) % 7;
  if (add === 0 && now.getHours() + now.getMinutes() / 60 > endH) add = 7;
  d.setDate(now.getDate() + add);
  return { date: d, days: add };
}

function viewClub() {
  const v = $("#view");
  const C = CLUB(), m = C.meeting || {};
  const nm = nextMeeting();
  v.append(el("div", { class: "clubhero" },
    el("div", {},
      el("div", { class: "eyebrow" }, "日本語クラブ · " + (C.short || "JLC")),
      el("h1", { class: "kicker", html: esc(C.name || "Japanese Language Club") }),
      C.mission ? el("p", { class: "small", style: { maxWidth: "60ch" }, text: C.mission }) : null,
      el("div", { class: "row", style: { marginTop: "14px" } },
        C.site && el("a", { class: "btn sm", href: C.site, target: "_blank", rel: "noopener" }, "Club website ↗"),
        C.discord && el("a", { class: "btn sm ghost", href: C.discord, target: "_blank", rel: "noopener" }, "Discord ↗"),
        C.resources && el("a", { class: "btn sm ghost", href: C.resources, target: "_blank", rel: "noopener" }, "Club resources ↗"))),
    el("div", { class: "card meetcard" },
      el("div", { class: "eyebrow" }, "We meet"),
      el("div", { class: "meetbig", text: `${m.day || ""}s` }),
      el("div", { class: "mono", text: m.time || "" }),
      el("div", { text: m.place || "" }),
      m.bring ? el("div", { class: "small muted", text: "Bring: " + m.bring }) : null,
      nm ? el("div", { class: "tag n5", style: { marginTop: "10px", display: "inline-block" }, text: "Next: " + (nm.days === 0 ? "today" : nm.days === 1 ? "tomorrow" : nm.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })) }) : null,
      el("div", { class: "tiny muted", style: { marginTop: "6px" }, text: "Breaks and changes are announced on Discord." }))));

  const ev = (C.events || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  if (ev.length) v.append(sec("Coming up", null, el("div", { class: "evlist" }, ev.map(e => {
    const d = daysUntil(e.date), past = d < 0;
    return el("div", { class: "ev" + (past ? " past" : "") + " k-" + (e.kind || "event") },
      el("div", { class: "evdate" }, el("b", { text: fmtDate(e.date, { day: "numeric" }) }), el("span", { text: fmtDate(e.date, { month: "short" }) })),
      el("div", { style: { flex: 1 } }, el("b", { text: e.title }), el("div", { class: "small muted", text: (e.note || "") + (e.note ? " · " : "") + fmtDate(e.date, { weekday: "long" }) })),
      el("span", { class: "tag" + (past ? "" : d <= 7 ? " n3" : " n4"), text: past ? "done" : untilLabel(d) }),
      e.kind === "exam" && !past ? el("a", { class: "btn sm pri", href: "#/exam" }, "Practise") : null);
  }))));

  const cur = +(Store.d.clubCh || 0);
  const chs = JLC();
  const picker = el("div", { class: "row", style: { gap: "6px" } }, el("span", { class: "small", text: "We're on chapter:" }),
    chs.map(c => el("button", { class: "chip" + (cur === c.n ? " on" : ""), onclick: () => { Store.d.clubCh = c.n; Store.save(); render(); } }, String(c.n))));
  const curCh = chs.find(c => c.n === cur);
  v.append(sec("This week", null, el("div", { class: "card" }, picker,
    curCh ? el("div", { class: "grid g3", style: { marginTop: "14px" } },
      el("a", { class: "card tilebtn", href: "#/jlc/" + cur }, el("b", { text: "第" + cur + "章 " + curCh.en }), el("span", { class: "small muted", text: "open the chapter" })),
      el("a", { class: "card tilebtn", href: "#/present/" + cur }, el("b", { text: "📽 Present it" }), el("span", { class: "small muted", text: "projector mode for the meeting" })),
      el("a", { class: "card tilebtn", href: "#/exam?ch=" + cur }, el("b", { text: "✎ Quiz on it" }), el("span", { class: "small muted", text: "practice test for this chapter" }))) :
      el("p", { class: "small muted", style: { marginTop: "10px" }, text: "Pick the chapter the club is on and this card becomes a shortcut to it (saved on this device only)." }))));

  if (C.flow || C.focus) v.append(sec("What happens at a meeting", null, el("div", { class: "grid g2" },
    C.focus ? el("div", { class: "card" }, el("div", { class: "eyebrow" }, "Four parts"), el("dl", { class: "kv" }, C.focus.map(([a, b]) => [el("dt", { text: a }), el("dd", { class: "small", text: b })]).flat())) : null,
    C.flow ? el("div", { class: "card" }, el("div", { class: "eyebrow" }, "Flow"), el("ol", { class: "small", style: { margin: "4px 0 0 18px", lineHeight: "1.9" } }, C.flow.map(x => el("li", { text: x })))) : null)));

  v.append(sec("Club tools", null, el("div", { class: "grid g3" },
    tile("章", "Club chapters", "The handout, chapter by chapter", "#/chapters?t=club"),
    tile("札", "JLC Anki decks", "Levels 0–8, in the browser", "#/review/jlc:0"),
    tile("✎", "Practice tests", "Build one from any chapters", "#/exam"),
    tile("📽", "Projector mode", "Run a meeting from a chapter", "#/present/" + (cur || 1)),
    tile("信", "Faith & Mission", "Prayers, verses, testimony", "#/faith"),
    tile("和", "Culture notes", "Bowing, shoes, gifts, trains", "#/culture"))));
  v.append(el("p", { class: "tiny muted", style: { marginTop: "18px" }, text: "Unofficial study companion made by a club member. Meeting details come from the club website — check Discord for the latest." }));
}

/* ---- practice-test builder ----------------------------------------------------- */
function seeded(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function shuf(a, rnd) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const PARTS = ["は", "が", "を", "に", "で", "へ", "と", "も", "の", "から", "まで", "や", "より"];

function buildExam(chNums, opts, seed) {
  const rnd = seeded(seed);
  const chs = JLC().filter(c => chNums.includes(c.n));
  const vocab = [], sentences = [], practice = [], conjs = [];
  for (const ch of chs) for (const s of ch.sections) {
    if (s.t === "vocab") for (const [jp, en] of s.items) vocab.push({ jp, en, ch: ch.n });
    if (s.t === "phrases") for (const [jp, en] of s.items) sentences.push({ jp, en, ch: ch.n });
    if (["grammar", "pattern"].includes(s.t) && s.ex) for (const [jp, en] of s.ex) sentences.push({ jp, en, ch: ch.n });
    if (s.t === "particles") for (const p of s.items) for (const [jp, en] of p.ex) sentences.push({ jp, en, ch: ch.n });
    if (s.t === "practice") for (const [en, jp] of s.items) practice.push({ jp, en, ch: ch.n });
    if (s.t === "conj") for (const w of s.items) { const a = analyzeVerb(w); if (a) conjs.push({ w, a }); }
    if (s.t === "tegroups") for (const [, list] of s.groups) for (const [d, te] of list) conjs.push({ w: plain(d), te: plain(te) });
  }
  const Q = [];
  const pickN = (arr, n) => shuf(arr, rnd).slice(0, n);
  const distract = (pool, right, key, n = 3) => shuf(pool.filter(x => x[key] !== right[key]), rnd).slice(0, n).map(x => x[key]);
  for (const w of pickN(vocab, opts.vocab)) {
    if (rnd() < 0.5) Q.push({ kind: "vocab", q: w.jp, qFuri: false, prompt: "What does this mean?", a: w.en, opts: shuf([w.en, ...distract(vocab, w, "en")], rnd) });
    else Q.push({ kind: "vocab", q: w.en, prompt: "Which Japanese word?", a: w.jp, opts: shuf([w.jp, ...distract(vocab, w, "jp")], rnd), jpOpts: true });
  }
  const withKanji = vocab.filter(w => hasKanjiStr(plain(w.jp)));
  for (const w of pickN(withKanji, opts.reading)) {
    const rd = readingOf(w.jp);
    const others = shuf(withKanji.filter(x => readingOf(x.jp) !== rd), rnd).slice(0, 3).map(x => readingOf(x.jp));
    Q.push({ kind: "reading", q: w.jp, qFuri: false, prompt: "How is it read?", a: rd, opts: shuf([rd, ...others], rnd), jpOpts: true });
  }
  const partSents = [];
  for (const s of sentences) {
    const t = plain(s.jp), hits = [];
    for (const p of PARTS) { let k = t.indexOf(p); while (k > 0) { if (/[\u4e00-\u9fff々ァ-ヶー）」]/.test(t[k - 1])) hits.push([k, p]); k = t.indexOf(p, k + 1); } }
    if (hits.length) partSents.push({ s, t, hits });
  }
  for (const x of pickN(partSents, opts.particle)) {
    const [i, p] = x.hits[Math.floor(rnd() * x.hits.length)];
    const blank = x.t.slice(0, i) + "（　）" + x.t.slice(i + p.length);
    const wrong = shuf(PARTS.filter(q => q !== p && q.length <= 2), rnd).slice(0, 3);
    Q.push({ kind: "particle", q: blank, prompt: "Fill in the particle — " + x.s.en, a: p, opts: shuf([p, ...wrong], rnd), jpOpts: true, raw: true });
  }
  for (const c of pickN(conjs, opts.conj)) {
    if (c.te) {
      const wrong = [c.w.replace(/.$/, "って"), c.w.replace(/.$/, "いて"), c.w.replace(/.$/, "んで"), c.w.replace(/る$/, "て"), c.w.replace(/.$/, "して")].filter(x => x !== c.te && x !== c.w);
      Q.push({ kind: "conj", q: c.w, prompt: "て-form?", a: c.te, opts: shuf([c.te, ...shuf([...new Set(wrong)], rnd).slice(0, 3)], rnd), jpOpts: true, raw: true });
    } else {
      const [lab, ans] = c.a.flips[Math.floor(rnd() * c.a.flips.length)];
      const pool = Object.values(conjAll(c.a.dict, c.a.group)).filter(x => x !== ans && x !== c.w);
      Q.push({ kind: "conj", q: c.w, prompt: `Change to ${lab}`, a: ans, opts: shuf([ans, ...shuf(pool, rnd).slice(0, 3)], rnd), jpOpts: true, raw: true });
    }
  }
  for (const p of pickN(practice, opts.translate)) Q.push({ kind: "translate", q: p.en, prompt: "Say / write it in Japanese", a: p.jp });
  return Q;
}

function viewExam() {
  const v = $("#view");
  const E = (Store.d.exam ||= { chs: [1], vocab: 10, reading: 5, particle: 5, conj: 5, translate: 5, seed: 1 });
  if (QUERY.ch) E.chs = QUERY.ch.split(",").map(Number);
  const club = CLUB();
  const exams = (club.events || []).filter(e => e.kind === "exam" && daysUntil(e.date) >= 0);
  v.append(el("div", { class: "noprint" }, page("しけん", "Practice tests", "試",
    `Build a test from any club chapters: vocabulary, kanji readings, particles, conjugation and translation. Take it here with instant grading, or print a copy with an answer key.${exams.length ? ` <b>${esc(exams[0].title)} is ${untilLabel(daysUntil(exams[0].date))}</b> (${fmtDate(exams[0].date)}).` : ""}`)));
  const chs = JLC();
  const controls = el("div", { class: "card noprint" },
    el("div", { class: "row", style: { gap: "6px" } }, el("span", { class: "tiny muted", text: "Chapters" }),
      chs.map(c => el("button", { class: "chip" + (E.chs.includes(c.n) ? " on" : ""), onclick: e => { toggleIn(E.chs, c.n); if (!E.chs.length) E.chs.push(c.n); Store.save(); e.currentTarget.classList.toggle("on", E.chs.includes(c.n)); } }, String(c.n))),
      el("button", { class: "btn sm ghost", onclick: () => { E.chs = chs.map(c => c.n); Store.save(); render(); } }, "All")),
    el("div", { class: "row", style: { marginTop: "10px" } }, [["vocab", "Vocabulary"], ["reading", "Kanji readings"], ["particle", "Particles"], ["conj", "Conjugation"], ["translate", "Translation"]].map(([k, lab]) =>
      el("label", { class: "row small", style: { gap: "6px" } }, lab, el("select", { class: "chip", onchange: e => { E[k] = +e.target.value; Store.save(); } }, [0, 3, 5, 8, 10, 15, 20].map(n => el("option", { value: n, selected: E[k] === n || null, text: String(n) })))))),
    el("div", { class: "row", style: { marginTop: "12px" } },
      el("button", { class: "btn pri", onclick: () => { take(); } }, "Take it here"),
      el("button", { class: "btn", onclick: () => { printable(); } }, "🖨 Print version + key"),
      el("button", { class: "btn ghost sm", onclick: () => { E.seed = (E.seed * 7 + 13) % 99991 + 1; Store.save(); toast("New version generated."); } }, "↻ New version")));
  v.append(controls);
  const host = el("div", { style: { marginTop: "16px" } });
  v.append(host);

  function take() {
    const Q = buildExam(E.chs, E, E.seed);
    host.innerHTML = "";
    if (!Q.length) { host.append(empty("空", "Those chapters don't have enough material — add more chapters.")); return; }
    let score = 0, answered = 0; const total = Q.filter(q => q.opts).length;
    const sc = el("div", { class: "examscore" });
    const sync = () => sc.textContent = `${score} / ${answered} correct · ${total - answered} multiple-choice left`;
    Q.forEach((q, i) => {
      const box = el("div", { class: "card exq" }, el("div", { class: "tiny muted mono", text: `${i + 1} · ${q.kind}` }),
        el("div", { class: "small muted", text: q.prompt }),
        el("div", { class: "exqq" + (q.raw || hasJp(q.q) ? " jp" : "") }, q.raw ? q.q : hasJp(q.q) ? el("span", { html: furi(q.q, q.qFuri === false ? "off" : "on") }) : q.q));
      if (q.opts) {
        const ans = el("div", { class: "answers" });
        let done = false;
        q.opts.forEach(o => ans.append(el("button", { class: "ans" + (q.jpOpts ? " jp" : ""), onclick: e => {
          if (done) return; done = true; answered++;
          if (o === q.a) { score++; e.currentTarget.classList.add("ok"); Sfx.ok(); } else { e.currentTarget.classList.add("bad"); Sfx.no(); [...ans.children].find(b => b.dataset.v === q.a)?.classList.add("ok"); }
          sync();
        }, "data-v": o }, q.jpOpts ? el("span", { html: furi(o, q.kind === "reading" ? "off" : "on") }) : o)));
        box.append(ans);
      } else {
        const a = el("div", { class: "ans-hide" }, jpLine(q.a));
        box.append(el("button", { class: "btn sm ghost", style: { marginTop: "8px" }, onclick: () => a.classList.toggle("show") }, "Show answer"), a);
      }
      host.append(box);
    });
    host.append(sc); sync();
    window.scrollTo({ top: host.offsetTop - 20, behavior: "smooth" });
  }
  function printable() {
    const Q = buildExam(E.chs, E, E.seed);
    host.innerHTML = "";
    const paper = el("div", { class: "exampaper" });
    paper.append(el("div", { class: "ps-head" }, el("span", { text: "名前 Name: ______________________" }), el("span", { text: "JLC practice test · chapters " + E.chs.join(", ") }), el("span", { text: "____ / " + Q.length })));
    Q.forEach((q, i) => {
      paper.append(el("div", { class: "pq" }, el("b", { text: `${i + 1}. ` }), el("span", { class: "small", text: q.prompt + "  " }),
        el("span", { class: "pqq", html: q.raw ? esc(q.q) : hasJp(q.q) ? furi(q.q, q.qFuri === false ? "off" : "on") : esc(q.q) }),
        q.opts ? el("div", { class: "pqo" }, q.opts.map((o, k) => el("span", { html: "ABCD"[k] + ") " + (q.jpOpts ? furi(o, q.kind === "reading" ? "off" : "on") : esc(o)) }))) : el("div", { class: "pqline" })));
    });
    const key = el("div", { class: "examkey" }, el("h3", { text: "Answer key" }),
      el("ol", { class: "small" }, Q.map(q => el("li", { html: q.opts ? "ABCD"[q.opts.indexOf(q.a)] + ") " + furi(q.a, "on") : furi(q.a, "on") }))));
    host.append(paper, key, el("div", { class: "row noprint", style: { marginTop: "12px" } }, el("button", { class: "btn pri", onclick: () => window.print() }, "🖨 Print")));
  }
}

/* ---- projector mode --------------------------------------------------------------- */
function jlcSlides(ch) {
  const S = [{ t: "title", jp: ch.jp, en: ch.en, sub: ch.goal, n: ch.n }];
  for (const s of ch.sections) {
    const head = { title: s.title, jp: s.jp };
    if (s.t === "phrases") for (let i = 0; i < s.items.length; i += 3) S.push({ ...head, t: "lines", lines: s.items.slice(i, i + 3).map(([jp, en]) => [jp, en]) });
    else if (s.t === "vocab") for (let i = 0; i < s.items.length; i += 8) S.push({ ...head, t: "grid", items: s.items.slice(i, i + 8) });
    else if (["grammar", "pattern"].includes(s.t)) { S.push({ ...head, t: "grammar", form: s.form, body: s.body, table: s.table }); if (s.ex && s.ex.length) S.push({ ...head, t: "lines", lines: s.ex.slice(0, 4) }); }
    else if (s.t === "particles") for (const p of s.items) S.push({ ...head, t: "lines", big: p.p + " — " + p.name, lines: p.ex.slice(0, 3) });
    else if (s.t === "practice") for (const [en, jp] of s.items) S.push({ ...head, t: "quiz", en, jp });
    else if (s.t === "kanji") for (const [k, en] of s.items) S.push({ ...head, t: "kanji", k, en });
    else if (s.t === "table" || s.t === "family") S.push({ ...head, t: "table", cols: s.cols || ["mine", "yours", "English"], rows: s.rows });
    else if (s.t === "counters" || s.t === "onoma") for (let i = 0; i < s.items.length; i += 3) S.push({ ...head, t: "lines", lines: s.items.slice(i, i + 3).map(([a, b, jp, en]) => [jp, `${a} — ${b} · ${en}`]) });
    else if (s.t === "describe") for (const [pic, words, jp] of s.items) S.push({ ...head, t: "quiz", pic, en: words, jp, words: true });
    else if (s.t === "conj") S.push({ ...head, t: "grid", items: s.items.map(w => [w, ""]) });
  }
  S.push({ t: "end", n: ch.n });
  return S;
}
function viewPresent(n) {
  const ch = JLC().find(c => c.n === n);
  const v = $("#view");
  if (!ch) { v.append(empty("？", "No such chapter.")); return; }
  const slides = jlcSlides(ch);
  let i = 0, reveal = false;
  document.body.classList.add("presenting");
  onLeave(() => { document.body.classList.remove("presenting"); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); });
  const stage = el("div", { class: "pstage" });
  const foot = el("div", { class: "pfoot" });
  v.append(stage, foot);
  function paint() {
    const s = slides[i];
    stage.innerHTML = ""; reveal = false;
    const box = el("div", { class: "pslide t-" + s.t });
    if (s.title) box.append(el("div", { class: "phead" }, s.title, s.jp ? el("span", { html: " · " + furi(s.jp, "on") }) : null));
    if (s.t === "title") box.append(el("div", { class: "pch", text: "第" + s.n + "章" }), el("div", { class: "pbigjp", html: furi(s.jp, "on") }), el("div", { class: "pen", text: s.en }), el("div", { class: "psub", text: s.sub }));
    else if (s.t === "lines") { if (s.big) box.append(el("div", { class: "pbigjp", text: s.big })); for (const [jp, en] of s.lines) box.append(el("div", { class: "pline" }, el("div", { class: "pjp", html: furi(jp, "on") }), el("div", { class: "pen hideable", text: en }))); }
    else if (s.t === "grid") box.append(el("div", { class: "pgrid" }, s.items.map(([jp, en]) => el("div", { class: "pcell" }, el("div", { class: "pjp", html: furi(jp, "on") }), en ? el("div", { class: "pen hideable", text: en }) : null))));
    else if (s.t === "grammar") box.append(s.form ? el("div", { class: "pform", text: s.form }) : null, s.body ? el("div", { class: "psub", text: s.body }) : null, s.table ? tableOf(s.table.cols, s.table.rows) : null);
    else if (s.t === "quiz") box.append(s.pic ? el("div", { style: { fontSize: "90px" }, text: s.pic }) : null, el("div", { class: "pen", style: { fontSize: "clamp(22px,4vw,44px)" }, html: s.words ? furi(s.en, "on") : esc(s.en) }), el("div", { class: "pjp hideable reveal-only", html: furi(s.jp, "on") }));
    else if (s.t === "kanji") box.append(el("div", { class: "prow2" }, strokePlayer([...s.k].find(c => STROKES.has(c)) || s.k, { size: 300 }), el("div", {}, el("div", { class: "pbigjp", text: s.k }), el("div", { class: "pen hideable", text: s.en }))));
    else if (s.t === "table") box.append(tableOf(s.cols, s.rows));
    else if (s.t === "end") box.append(el("div", { class: "pbigjp", text: "おつかれさまでした！" }), el("div", { class: "pen", text: "Chapter " + s.n + " — done. Review it with flashcards this week." }));
    stage.append(box);
    foot.innerHTML = "";
    foot.append(el("button", { class: "btn sm ghost", onclick: () => go("#/jlc/" + n) }, "✕ Exit"),
      el("span", { class: "mono small", text: `${i + 1} / ${slides.length}` }),
      el("button", { class: "btn sm ghost", onclick: () => toggleReveal() }, "R reveal"),
      el("button", { class: "btn sm ghost", onclick: () => Speech.say(stage.innerText.split("\n").find(l => hasJp(l)) || "", { force: true }) }, "🔊"),
      el("button", { class: "btn sm ghost", onclick: () => { document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); } }, "⛶"),
      el("button", { class: "btn sm", onclick: prev }, "←"), el("button", { class: "btn sm pri", onclick: nextS }, "→"));
  }
  function toggleReveal() { reveal = !reveal; stage.classList.toggle("revealed", reveal); }
  function nextS() { if (i < slides.length - 1) { i++; paint(); } }
  function prev() { if (i > 0) { i--; paint(); } }
  const key = e => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); if (!reveal && stage.querySelector(".hideable")) toggleReveal(); else nextS(); }
    else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "r" || e.key === "R") toggleReveal();
    else if (e.key === "Escape") go("#/jlc/" + n);
  };
  document.addEventListener("keydown", key); onLeave(() => document.removeEventListener("keydown", key));
  stage.addEventListener("click", e => { if (!e.target.closest("button")) { if (!reveal && stage.querySelector(".hideable")) toggleReveal(); else nextS(); } });
  paint();
}

/* ==========================================================================
   PLACEMENT — a five-minute check that climbs from kana to N1 and stops
   where it gets hard. The result sets your level for the home page and,
   if you like, which kanji get furigana.
   ========================================================================== */
const LEVEL_NAMES = ["What's hiragana?", "I can read kana", "Around N5", "Around N4", "Around N3", "Around N2", "Around N1", "Fluent / native-level"];
const LEVEL_SHORT = ["Zero", "Kana", "N5", "N4", "N3", "N2", "N1", "Fluent"];

function placementBlocks() {
  const B = [];
  const kana = shuffle(Object.values(KM).filter(x => x.script === "h").flatMap(x => x.cards));
  const kata = shuffle(Object.values(KM).filter(x => x.script === "k").flatMap(x => x.cards));
  const kq = (list, n, label) => list.slice(0, n).map(c => ({ label, q: c.k, big: true, a: c.r, opts: shuffle([c.r, ...sample(list.filter(x => x.r !== c.r).map(x => x.r), 3)]) }));
  B.push({ name: "Hiragana", lv: 1, qs: kq(kana, 5, "Which sound is this?") });
  B.push({ name: "Katakana", lv: 1, qs: kq(kata, 4, "Which sound is this?") });
  const G = GRAMMAR_ALL();
  const vocabQ = (n, k) => {
    const ids = DICT.level(n).map(i => DICT.entry(i)).filter(e => hasKanjiStr(e.w) || n === 5);
    return sample(ids, k).map(e => {
      const en = (e.s || e.m).split(/[;,]/)[0];
      const others = sample(ids.filter(x => x.i !== e.i), 3).map(x => (x.s || x.m).split(/[;,]/)[0]);
      return { label: "What does this word mean?", q: e.w, sub: n >= 4 ? e.r : "", a: en, opts: shuffle([en, ...others]) };
    });
  };
  const sentQ = (n, k) => {
    const pool = G.filter(g => g.jlpt === n && g.ex && g.ex.length).flatMap(g => g.ex.map(e => ({ jp: e[0], en: e[1] })));
    return sample(pool, k).map(x => ({ label: "What does this sentence mean?", q: x.jp, furi: n >= 4 ? "on" : n >= 3 ? "smart" : "off", a: x.en, opts: shuffle([x.en, ...sample(pool.filter(y => y.en !== x.en), 3).map(y => y.en)]), sentence: true }));
  };
  B.push({ name: "N5", lv: 2, qs: [...vocabQ(5, 3), ...sentQ(5, 2)] });
  B.push({ name: "N4", lv: 3, qs: [...vocabQ(4, 3), ...sentQ(4, 2)] });
  B.push({ name: "N3", lv: 4, qs: [...vocabQ(3, 3), ...sentQ(3, 2)] });
  B.push({ name: "N2", lv: 5, qs: [...vocabQ(2, 3), ...sentQ(2, 2)] });
  B.push({ name: "N1", lv: 6, qs: [...vocabQ(1, 3), ...sentQ(1, 2)] });
  const kumo = (DATA.get("classics") || []).find(c => c.id === "c-kumo");
  if (kumo) {
    const pairs = []; for (const p of kumo.paras) if (p.s && p.en) p.s.forEach((s, i) => { if (plain(s).length > 25 && plain(s).length < 70) pairs.push({ jp: s, en: p.en[i] }); });
    B.push({ name: "Literature", lv: 7, qs: sample(pairs, 3).map(x => ({ label: "Akutagawa, 1918 — what does this say?", q: x.jp, furi: "off", sentence: true, a: x.en, opts: shuffle([x.en, ...sample(pairs.filter(y => y.en !== x.en), 3).map(y => y.en)]) })) });
  }
  return B;
}

function viewPlacement() {
  const v = $("#view");
  v.append(page("レベルチェック", "Where are you?", "測",
    "A short check that starts with a single hiragana and climbs to real literature. It stops as soon as a level gets hard, so beginners are done in a minute. Don't guess wildly — “I don't know” is a perfectly good answer."));
  const prev = Store.d.place;
  if (prev) v.append(el("div", { class: "card", style: { marginBottom: "14px" } }, el("span", { class: "small", html: `Last time: <b>${LEVEL_NAMES[prev.level]}</b> (${new Date(prev.ts).toLocaleDateString()}).` })));
  const host = el("div", {});
  v.append(host);
  host.append(el("div", { class: "row" },
    el("button", { class: "btn pri lg", onclick: () => run() }, "Start the check"),
    el("span", { class: "small muted", text: "or just pick your level:" }),
    LEVEL_SHORT.map((l, i) => el("button", { class: "chip", onclick: () => finish(i, true) }, l))));

  function run() {
    const blocks = placementBlocks();
    let b = 0, q = 0, right = 0, wrong = 0, passedLv = 0;
    const step = () => {
      host.innerHTML = "";
      const blk = blocks[b];
      if (!blk) return finish(passedLv);
      const doomed = (blk.qs.length - wrong) / blk.qs.length < 0.6;
      if (q >= blk.qs.length || doomed) {
        const ok = !doomed && right / blk.qs.length >= 0.6;
        if (!ok) return finish(passedLv);
        passedLv = blk.lv; b++; q = 0; right = 0; wrong = 0;
        return step();
      }
      const Q = blk.qs[q];
      host.append(el("div", { class: "row small muted", style: { marginBottom: "8px" } }, el("span", { class: "tag", text: blk.name }), el("span", { text: `question ${q + 1} of ${blk.qs.length}` })),
        el("div", { class: "card center", style: { padding: "26px 18px" } },
          el("div", { class: "small muted", text: Q.label }),
          el("div", { style: { fontFamily: "var(--hand)", fontSize: Q.big ? "86px" : Q.sentence ? "clamp(20px,4.5vw,28px)" : "44px", lineHeight: Q.sentence ? "2" : "1.3", marginTop: "10px" }, html: furi(Q.q, Q.furi || "off") }),
          Q.sub ? el("div", { class: "mono small muted", text: Q.sub }) : null));
      const ans = el("div", { class: "answers" });
      let done = false;
      const opts = Q.opts.filter((x, i, a) => a.indexOf(x) === i);
      opts.forEach(o => ans.append(el("button", { class: "ans", onclick: e => {
        if (done) return; done = true;
        if (o === Q.a) { right++; e.currentTarget.classList.add("ok"); } else { wrong++; e.currentTarget.classList.add("bad"); [...ans.children].find(x => x.dataset.v === Q.a)?.classList.add("ok"); }
        setTimeout(() => { q++; step(); }, 650);
      }, "data-v": o }, o)));
      ans.append(el("button", { class: "ans", style: { opacity: .7 }, onclick: () => { if (done) return; done = true; wrong++; q++; step(); } }, "I don't know"));
      host.append(ans);
    };
    step();
  }
  function finish(level, manual) {
    Store.d.place = { level, ts: Date.now(), manual: !!manual };
    Store.set("settings.level", level);
    host.innerHTML = "";
    const known = [0, 0, 0, 5, 4, 3, 2, 1][level];
    host.append(el("div", { class: "card" },
      el("div", { class: "eyebrow" }, "Your level"),
      el("h2", { style: { fontSize: "28px", fontFamily: "var(--hand)" }, text: LEVEL_NAMES[level] }),
      el("p", { class: "small", style: { marginTop: "8px" }, text: levelAdvice(level) }),
      el("div", { class: "row", style: { marginTop: "14px" } },
        el("a", { class: "btn pri", href: "#/" }, "Show me my home page"),
        known ? el("button", { class: "btn", onclick: e => { Store.set("settings.knownLevel", known); Store.set("settings.furigana", "smart"); e.currentTarget.disabled = true; toast(`Smart furigana on: hidden over N${known} kanji and easier.`); } }, `Hide furigana over N${known}+ kanji`) : null,
        el("button", { class: "btn ghost", onclick: () => render() }, "Take it again"))));
  }
}
function levelAdvice(l) {
  return [
    "Start with Kana Master and the first chapters of the Start-at-zero track. Hiragana takes most people one to two weeks of a little every day; the picture books at level 0 are there to celebrate each row.",
    "You can read kana — now it's words. Work through the club chapters from the top, use the JLC Anki decks, and read the level 1 picture books out loud.",
    "N5 territory. Keep going through the club chapters, start the N5 JLPT word list in Flashcards, and read level 2 stories without the English.",
    "Around N4. Finish the club chapters, drill N4 grammar and kanji, and read level 3 — the folk tales are a great test.",
    "Intermediate. Start the Beyond track: N3 grammar, level 4 stories, and the dictionary whenever you tap a word you don't know.",
    "Upper intermediate. N2 grammar, level 5 stories, and your first classic: 蜘蛛の糸, with the line-by-line English.",
    "Advanced. N1 grammar, the level 6 stories, and real literature — Akutagawa, Kenji, Sōseki. Turn furigana to smart.",
    "Fluent. The classics shelf with furigana off, the literary grammar, the traditional Lord's Prayer — and helping the rest of the club with projector mode and practice tests."][l];
}

/* ==========================================================================
   HOME — tells you where you are, what's due, when the club meets next,
   and what to do today at your level.
   ========================================================================== */
const PATH_TILES = [
  /* 0 */ [["字", "Kana Master", "Learn hiragana row by row", "#/kanamaster"], ["〇", "Chapter 1", "The very first kana", "#/chapter/1"], ["筆", "Write あいうえお", "Stroke by stroke", "#/write?set=hira&mode=strokes"], ["本", "Picture books", "Level 0 — all kana", "#/read?lv=0"]],
  /* 1 */ [["会", "Club chapter 1", "Greetings & introductions", "#/jlc/1"], ["札", "JLC Anki · Level 0–1", "The club's first decks", "#/review/jlc:0,1"], ["カ", "Katakana", "Kana Master, katakana rows", "#/kanamaster"], ["本", "First sentences", "Level 1 books", "#/read?lv=1"]],
  /* 2 */ [["会", "Club chapters", "Pick up where you are", "#/chapters?t=club"], ["級", "JLPT N5 words", "In slices of 100", "#/review/jlpt:5"], ["文", "N5 grammar", "The core patterns", "#/grammar?lv=5"], ["本", "Short stories", "Level 2", "#/read?lv=2"]],
  /* 3 */ [["文", "N4 grammar", "て-form and beyond", "#/grammar?lv=4"], ["漢", "N4 kanji", "With stroke order", "#/kanji"], ["本", "Folk tales", "Level 3 — ももたろう & more", "#/read?lv=3"], ["級", "JLPT N4 words", "Flashcards", "#/review/jlpt:4"]],
  /* 4 */ [["上", "Beyond · chapter 1", "Bridge to intermediate", "#/beyond/1"], ["文", "N3 grammar", "49 patterns", "#/grammar?lv=3"], ["本", "Level 4 stories", "Real plots", "#/read?lv=4"], ["辞", "Dictionary", "Tap-to-look-up everywhere", "#/dict"]],
  /* 5 */ [["上", "Beyond · chapter 3", "Written Japanese", "#/beyond/3"], ["文", "N2 grammar", "71 patterns", "#/grammar?lv=2"], ["典", "蜘蛛の糸", "Your first classic, line by line", "#/classic/c-kumo"], ["本", "Level 5 stories", "Nuance", "#/read?lv=5"]],
  /* 6 */ [["上", "Beyond · chapter 5", "Advanced grammar", "#/beyond/5"], ["文", "N1 grammar", "53 patterns", "#/grammar?lv=1"], ["本", "Level 6 stories", "金継ぎ, 聞き屋, オラショ", "#/read?lv=6"], ["典", "Classics", "Akutagawa, Kenji, Sōseki, Ōgai", "#/read?shelf=classics"]],
  /* 7 */ [["典", "Classics shelf", "Furigana off", "#/read?shelf=classics"], ["古", "Literary grammar", "なり・けり・べし", "#/grammar?lv=0"], ["祈", "主の祈り（文語）", "The traditional prayer", "#/faith?t=pray"], ["📽", "Help the club", "Projector mode & tests", "#/club"]]
];

function viewHome() {
  const v = $("#view");
  const st = Store.d.stats, d = today();
  const tdy = st.days[d] || { rev: 0, write: 0, read: 0 };
  const lvl = +SET().level;
  const due = dueCount();
  const C = CLUB();

  v.append(el("div", { class: "hero" },
    el("div", {},
      el("div", { class: "eyebrow" }, "ますで まなぶ · " + (C.short || "JLC") + " edition"),
      el("h1", { class: "kicker", html: 'Zero to <em>fluent</em>,<br>one square at a time.' }),
      el("p", { html: `Everything the ${esc(C.name || "club")} studies, in one place — kana, the club chapters, all 2,136 kanji with stroke order, flashcards (with the club's Anki decks built in), ${(DATA.get("stories") || []).length + READERS.length} graded stories, real Japanese literature, grammar to N1, and a Faith &amp; Mission section.<br><span class='small muted'>Learn like a local, speak like a local.</span>` }),
      el("div", { class: "row", style: { marginTop: "16px" } },
        el("a", { class: "btn pri lg", href: "#/review" }, due ? `Review · ${due} due` : "Flashcards"),
        lvl >= 0 ? el("a", { class: "btn lg", href: PATH_TILES[lvl][0][3] }, "Continue: " + PATH_TILES[lvl][0][1]) : el("a", { class: "btn lg", href: "#/placement" }, "Find my level")),
      st.streak > 0 && el("div", { class: "streak", style: { marginTop: "14px" } },
        "朱", el("b", { text: String(st.streak) }), el("span", { text: st.streak === 1 ? "day" : "days in a row" }),
        st.best > st.streak && el("span", { class: "muted", text: `· best ${st.best}` }))),
    inkWall()));

  /* level picker */
  const lvRow = el("div", { class: "lvpick" });
  LEVEL_SHORT.forEach((l, i) => lvRow.append(el("button", { class: "lvbtn" + (lvl === i ? " on" : ""), title: LEVEL_NAMES[i], onclick: () => { Store.set("settings.level", i); render(); } },
    el("b", { text: String(i) }), el("span", { text: l }))));
  v.append(sec("Where are you?", null, el("div", { class: "card" }, lvRow,
    el("div", { class: "small muted", style: { marginTop: "8px" } }, lvl >= 0 ? LEVEL_NAMES[lvl] + " — " : "", el("a", { href: "#/placement" }, lvl >= 0 ? "retake the placement check" : "not sure? take the five-minute placement check")))));

  if (lvl >= 0) v.append(sec("Your path today", null, el("p", { class: "small muted", style: { marginTop: "-6px", marginBottom: "10px" }, text: levelAdvice(lvl) }),
    el("div", { class: "grid g4 fit" }, PATH_TILES[lvl].map(([ji, t, s, h]) => tile(ji, t, s, h)))));

  /* club strip */
  const nm = nextMeeting(), ev = upcomingEvents(2);
  v.append(sec("Club", null, el("a", { class: "card clubstrip", href: "#/club", style: { textDecoration: "none", color: "inherit" } },
    el("div", {}, el("div", { class: "eyebrow" }, C.name || "Club"),
      el("b", { text: nm ? `Next meeting ${nm.days === 0 ? "today" : nm.days === 1 ? "tomorrow" : nm.date.toLocaleDateString("en-US", { weekday: "long" })} · ${C.meeting?.time || ""}` : "" }),
      el("div", { class: "small muted", text: C.meeting?.place || "" })),
    el("div", { class: "row", style: { gap: "8px" } }, ev.map(e => el("span", { class: "tag " + (e.kind === "exam" ? "n3" : "n4"), text: `${e.title} · ${untilLabel(daysUntil(e.date))}` }))))));

  v.append(sec("Today", null, el("div", { class: "card" },
    el("div", { class: "row", style: { gap: "26px" } },
      stat(tdy.rev || 0, "reviews"), stat(tdy.write || 0, "written"), stat(tdy.read || 0, "pages read"),
      stat(due, "due now"), stat(Object.keys(Store.d.srs).length, "cards in rotation")))));

  const last = allBooks().map(b => [b, (Store.d.read || {})[b.key]]).filter(([, s]) => s && s.last).sort((a, b) => b[1].last - a[1].last)[0];
  if (last) v.append(sec("Keep reading", null, el("div", { class: "grid g3" }, bookCard(last[0]))));

  v.append(sec(null, null, wordOfTheDay()));

  v.append(sec("Everything", null, el("div", { class: "grid g3" },
    tile("会", "Club", "Meetings, events, practice tests", "#/club"),
    tile("章", "Chapters", "Club · Start at zero · Beyond", "#/chapters"),
    tile("字", "Kana Master", "The original drill, rebuilt", "#/kanamaster"),
    tile("漢", "Kanji", "All 2,136 with stroke order", "#/kanji"),
    tile("筆", "Write", "Watch · stroke by stroke · freehand", "#/write"),
    tile("🖨", "Practice sheets", "Printable genkō-yōshi", "#/print"),
    tile("札", "Flashcards", "SRS on everything + Anki import", "#/review"),
    tile("本", "Reading room", "Picture books to Sōseki", "#/read"),
    tile("文", "Grammar", "N5 → N1 + literary", "#/grammar"),
    tile("辞", "Dictionary", "23,000+ words, conjugations too", "#/dict"),
    tile("話", "Phrases", "Casual · polite · keigo", "#/phrases"),
    tile("遊", "Mini-games", "Sixteen ways to drill", "#/games"),
    tile("信", "Faith & Mission", "Prayers, verses, testimony", "#/faith"),
    tile("和", "Culture notes", "How things are done", "#/culture"),
    tile("表", "Reference", "Counters, colours, numbers", "#/reference"),
    tile("計", "Progress", "Streaks and weak spots", "#/stats"))));

  if (!Store.persistent) {
    v.append(el("div", { class: "card", style: { marginTop: "26px", borderColor: "var(--shu)" } },
      el("b", { text: "Heads up — storage is blocked in this browser." }),
      el("p", { class: "small muted", text: "Progress will work for this session but won't survive a reload. Private browsing or a strict blocker is the usual cause." })));
  }
}

/* ==========================================================================
   ABOUT — what's in here, where it came from, and whose work it rests on.
   ========================================================================== */
function viewAbout() {
  const v = $("#view");
  const C = CLUB();
  const n = x => x.toLocaleString();
  v.append(page("このサイトについて", "About & credits", "印",
    `MASU · ${esc(C.short || "JLC")} Edition is one HTML file: no server, no accounts, no tracking. Your progress lives in your own browser. It was built for the ${esc(C.name || "club")} and for anyone else learning Japanese — from the first hiragana to reading literature.`));
  const stories = DATA.get("stories") || [], classics = DATA.get("classics") || [];
  v.append(el("div", { class: "grid g4" },
    statCard(n(KJ.size), "kanji with stroke order"), statCard(n(DICT.size), "dictionary entries"), statCard(n(GRAMMAR_ALL().length), "grammar patterns"),
    statCard(n(stories.length + READERS.length), "graded stories"), statCard(classics.length, "classic works"), statCard(JLC().length, "club chapters"),
    statCard(n(CARDS.jlcLevels().reduce((a, l) => a + l.cards.length, 0)), "JLC Anki cards"), statCard(n(VOCAB.length), "topic-deck words")));

  v.append(sec("Credits", null, el("div", { class: "card credits" },
    cr("Stroke order", "KanjiVG", "© Ulrich Apel and contributors, licensed CC BY-SA 3.0. Stroke paths for every kana and jōyō kanji are used unmodified.", "https://kanjivg.tagaini.net/"),
    cr("Dictionary & kanji data", "JMdict and KANJIDIC2", "© the Electronic Dictionary Research and Development Group (EDRDG), CC BY-SA 4.0, via the kotobako-data package, used under the EDRDG licence. JLPT word levels from open-anki-jlpt-decks (MIT, © Jamie Sinclair); kanji frequency and JLPT levels from kanji-data (MIT, © David Luz Gouveia).", "https://www.edrdg.org/edrdg/licence.html"),
    cr("Literature", "青空文庫 Aozora Bunko", "Works by 芥川龍之介, 宮沢賢治, 夏目漱石 and 森鴎外, all first published 1905–1926 and in the public domain. Each text's source edition and the volunteers who typed and proofread it (入力・校正) are listed with it. Summaries, key words and the translation of 蜘蛛の糸 were written for this site.", "https://www.aozora.gr.jp/"),
    cr("Bible verses", "口語訳 (1954–55) & 文語訳 (1917)", "Japan Bible Society translations that are out of copyright in Japan. English lines under them are close renderings written for this site."),
    cr("Club materials", C.name || "the club", "Chapter content is adapted from the club's chapter-activities handout and its JLC Vocab Anki decks (Levels 0–8). The Lord's Prayer text follows the club's handout."),
    cr("Anki import", "fzstd", "Zstandard decompression by Arjun Barrett, MIT license, so new-format .apkg files open offline.", "https://github.com/101arrowz/fzstd"),
    cr("Build-time furigana", "kuromoji.js", "Apache 2.0 — used while building to add readings; not shipped in the page."),
    cr("Original content", "Written for this site", "Stories (level 0–6), the MASU chapters and tiny books, the grammar explanations, culture notes, the Faith & Mission section, mnemonics and every quiz."))));

  v.append(sec("For club officers", null, el("div", { class: "card" },
    el("p", { class: "small", html: "Meeting time, room and events come from a small block of JSON near the top of <code>index.html</code> — search the file for <code>d-club</code>. Edit the dates and titles there each semester and re-upload to GitHub Pages; nothing else needs to change." }),
    el("pre", { class: "small", style: { whiteSpace: "pre-wrap", background: "var(--paper-2)", padding: "10px", borderRadius: "4px", marginTop: "8px" }, text: JSON.stringify({ meeting: C.meeting, events: (C.events || []).slice(0, 2) }, null, 1) }))));

  v.append(sec("Privacy", null, el("div", { class: "card" },
    el("p", { class: "small", text: "Nothing you do here leaves your device. Progress, notes, imported decks and settings are stored in your browser's local storage; export a backup in Settings if you switch devices. The page loads fonts from Google Fonts — everything else is in the file." }))));
  v.append(el("div", { class: "row", style: { marginTop: "18px" } }, el("a", { class: "btn", href: "#/settings" }, "Settings"), el("a", { class: "btn ghost", href: "#/" }, "Home")));
}
function statCard(n, label) { return el("div", { class: "card" }, stat(n, label)); }
function cr(what, who, text, url) {
  return el("div", { class: "cr" }, el("div", { class: "tiny muted mono", text: what.toUpperCase() }), url ? el("a", { href: url, target: "_blank", rel: "noopener" }, el("b", { text: who + " ↗" })) : el("b", { text: who }), el("p", { class: "small", text }));
}

/* ==========================================================================
   NAVIGATION & ROUTES for the JLC edition.
   Desktop: the full rail. Phone: five tabs plus a "More" sheet.
   ========================================================================== */
NAV.length = 0;
NAV.push(
  { ji: "家", en: "Home", href: "#/", match: /^#?\/?$/, tab: 1 },
  { ji: "会", en: "Club", href: "#/club", match: /^#\/(club|exam|present)/ },
  { ji: "章", en: "Chapters", href: "#/chapters", match: /^#\/(chapters|chapter|jlc|beyond)/, tab: 1 },
  { ji: "字", en: "Kana", href: "#/kanamaster", match: /^#\/(kana)/ },
  { ji: "漢", en: "Kanji", href: "#/kanji", match: /^#\/kanji/ },
  { ji: "筆", en: "Write", href: "#/write", match: /^#\/(write|print)/ },
  { ji: "札", en: "Cards", href: "#/review", match: /^#\/(review|queue|anki|deck)/, tab: 1 },
  { ji: "本", en: "Read", href: "#/read", match: /^#\/(read|story|classic)/, tab: 1 },
  { ji: "文", en: "Grammar", href: "#/grammar", match: /^#\/grammar/ },
  { ji: "辞", en: "Dict", href: "#/dict", match: /^#\/dict/ },
  { ji: "話", en: "Phrases", href: "#/phrases", match: /^#\/(phrases|phrase)/ },
  { ji: "遊", en: "Games", href: "#/games", match: /^#\/game/ },
  { ji: "信", en: "Faith", href: "#/faith", match: /^#\/(faith|culture)/ },
  { ji: "設", en: "Setup", href: "#/settings", match: /^#\/(settings|stats|about|placement|reference|counters|colors|numbers|starred|shelf)/ }
);
function buildNav() {
  const rail = $("#railnav"), tabs = $("#tabnav");
  if (rail) {
    rail.innerHTML = "";
    for (const n of NAV) rail.append(el("a", { class: "railbtn", href: n.href, "data-m": n.en }, el("span", { class: "ji", text: n.ji }), el("span", { class: "en", text: n.en })));
    rail.append(el("button", { class: "railbtn", title: "Search (/)", onclick: () => openSearch() }, el("span", { class: "ji", text: "探" }), el("span", { class: "en", text: "Search" })));
  }
  if (tabs) {
    tabs.innerHTML = "";
    for (const n of NAV.filter(x => x.tab)) tabs.append(el("a", { class: "railbtn", href: n.href, "data-m": n.en }, el("span", { class: "ji", text: n.ji }), el("span", { class: "en", text: n.en })));
    tabs.append(el("button", { class: "railbtn", "data-m": "More", onclick: moreSheet }, el("span", { class: "ji", text: "≡" }), el("span", { class: "en", text: "More" })));
  }
}
function moreSheet() {
  const g = el("div", { class: "moregrid" });
  for (const n of NAV) g.append(el("a", { class: "morebtn", href: n.href, onclick: () => close() }, el("span", { class: "ji", text: n.ji }), el("span", { text: n.en })));
  g.append(
    el("button", { class: "morebtn", onclick: () => { close(); openAccountModal(); } }, el("span", { class: "ji", text: "人" }), el("span", { text: Store.user ? "Account" : "Sign in" })),
    el("button", { class: "morebtn", onclick: () => { close(); openSearch(); } }, el("span", { class: "ji", text: "探" }), el("span", { text: "Search" })),
    el("a", { class: "morebtn", href: "#/dict", onclick: () => close() }, el("span", { class: "ji", text: "辞" }), el("span", { text: "Dictionary" })),
    el("a", { class: "morebtn", href: "#/culture", onclick: () => close() }, el("span", { class: "ji", text: "和" }), el("span", { text: "Culture" })),
    el("a", { class: "morebtn", href: "#/placement", onclick: () => close() }, el("span", { class: "ji", text: "測" }), el("span", { text: "My level" })),
    el("a", { class: "morebtn", href: "#/about", onclick: () => close() }, el("span", { class: "ji", text: "印" }), el("span", { text: "About" })),
    el("button", { class: "morebtn", onclick: () => { close(); themeMenu(); } }, el("span", { class: "ji", text: $("#themeji")?.textContent || "墨" }), el("span", { text: "Theme" })));
  const close = modal("Everything", g);
}
/* the "More" tab lights up for anything that isn't one of the four tabs */
const _syncNav = syncNav;
syncNav = function () {
  _syncNav();
  const h = location.hash || "#/";
  const more = $('#tabnav [data-m="More"]');
  if (more) { const inTab = NAV.filter(x => x.tab).some(n => n.match.test(h)); if (inTab) more.removeAttribute("aria-current"); else more.setAttribute("aria-current", "page"); }
  document.title = routeTitle(h) + " · MASU · JLC";
};
function routeTitle(h) {
  const n = NAV.find(x => x.match.test(h));
  return n ? (n.en === "Home" ? "Japanese from zero to fluent" : n.en) : "Japanese";
}

/* newest routes first so they win over MASU's originals */
ROUTES.unshift(
  [/^\/club$/, () => viewClub()],
  [/^\/exam$/, () => viewExam()],
  [/^\/present\/(\d+)$/, m => viewPresent(+m[1])],
  [/^\/chapters$/, () => viewChapters()],
  [/^\/jlc\/(\d+)$/, m => viewJlc(+m[1])],
  [/^\/beyond\/(\d+)$/, m => viewBeyond(+m[1])],
  [/^\/kanamaster$/, () => viewKanaMaster()],
  [/^\/kanji$/, () => viewKanji()],
  [/^\/kanji\/(.+)$/, m => viewKanjiPage(decodeURIComponent(m[1]))],
  [/^\/write$/, () => viewWrite()],
  [/^\/print$/, () => viewPrint()],
  [/^\/review$/, () => viewFlash()],
  [/^\/review\/(.+)$/, m => viewFlash(decodeURIComponent(m[1]))],
  [/^\/anki$/, () => viewAnki()],
  [/^\/read$/, () => viewLibrary()],
  [/^\/read\/([\w-]+)$/, m => viewBook("tiny", m[1])],
  [/^\/story\/([\w-]+)$/, m => viewBook("story", m[1])],
  [/^\/classic\/([\w-]+)$/, m => viewBook("classic", m[1])],
  [/^\/grammar$/, () => viewGrammar()],
  [/^\/dict$/, () => viewDict()],
  [/^\/faith$/, () => viewFaith()],
  [/^\/culture$/, () => viewCulture()],
  [/^\/placement$/, () => viewPlacement()],
  [/^\/about$/, () => viewAbout()]
);

/* ---- search: everything in the app, plus a dictionary fallback --------------------- */
const AUTHOR_KANA = { "芥川龍之介": "あくたがわりゅうのすけ akutagawa", "宮沢賢治": "みやざわけんじ miyazawa kenji", "夏目漱石": "なつめそうせき natsume soseki", "森鴎外": "もりおうがい mori ogai" };
function buildIndex() {
  if (SEARCH_INDEX) return SEARCH_INDEX;
  const ix = [];
  const P = (t, key, label, sub, go) => ix.push({ t, key, label, sub, go });
  for (const n of NAV) P("page", n.en + " " + n.ji, n.ji + " " + n.en, "go to " + n.en, () => go(n.href));
  for (const [h, lab] of [["#/kanamaster", "Kana Master"], ["#/print", "Practice sheets print"], ["#/anki", "Anki import export"], ["#/culture", "Culture notes"], ["#/placement", "Placement check my level"], ["#/about", "About credits"], ["#/exam", "Practice test exam"]]) P("page", lab, lab, "page", () => go(h));
  for (const k of ALL_KANA) P("kana", k.ch + " " + k.rom, k.ch, k.rom + " · " + KANA[k.script].en, () => kanaSheet(k));
  for (const k of KJ.all()) P("kanji", k.ch + " " + k.mean + " " + (k.on || "") + " " + (k.kun || "") + " " + toHira(k.on || ""), k.ch, k.mean + (k.jlpt ? " · N" + k.jlpt : ""), () => openKanji(k.ch));
  for (const v of VOCAB) P("word", plain(v.form) + " " + v.kana + " " + v.en + " " + kanaToRomaji(v.kana), plain(v.form), v.en, () => vocabSheet(v));
  for (const g of GRAMMAR_ALL()) P("grammar", g.jp + " " + g.en + " " + (g.form || ""), plain(g.jp), g.en + (g.jlpt ? " · N" + g.jlpt : ""), () => modal(plain(g.jp), grammarCard(g)));
  for (const s of SITUATIONS) P("phrases", s.jp + " " + s.en + " " + (s.when || ""), s.en, s.jp, () => go("#/phrase/" + s.id));
  for (const b of allBooks()) P(b.kind === "classic" ? "classic" : "story", plain(b.title) + " " + readingOf(b.title) + " " + (b.kana || "") + " " + b.en + " " + (b.author || "") + " " + (AUTHOR_KANA[b.author] || ""), plain(b.title), b.en + " · " + (b.level === 7 ? "literature" : "level " + b.level), () => go(b.href));
  for (const ch of JLC()) { P("club", "JLC chapter " + ch.n + " " + plain(ch.jp) + " " + ch.en, "JLC 第" + ch.n + "章", ch.en, () => go("#/jlc/" + ch.n)); ch.sections.forEach((s, i) => P("club", s.title + " " + plain(s.jp || "") + " JLC " + ch.n, s.title, "JLC chapter " + ch.n, () => { go("#/jlc/" + ch.n); setTimeout(() => $("#s" + i)?.scrollIntoView({ block: "start" }), 120); })); }
  for (const c of (DATA.get("culture") || [])) P("culture", c.h + " " + plain(c.jp) + " " + c.lead, c.h, c.lead, () => go("#/culture?id=" + c.id));
  const F = DATA.get("faith");
  if (F) { for (const v of F.verses) P("verse", v.en + " " + plain(v.ref) + " " + plain(v.jp) + " " + v.lit, v.en, plain(v.jp).slice(0, 40), () => go("#/faith?t=verses")); for (const p of F.prayers) P("prayer", plain(p.title) + " " + p.en, plain(p.title), p.en, () => go("#/faith?t=pray")); }
  for (const d of DECKS) P("deck", d.jp + " " + d.en + " " + d.blurb, d.en, d.jp, () => go("#/deck/" + d.id));
  for (const c of COUNTERS) P("counter", plain(c.c) + " " + c.what, plain(c.c), c.what, () => go("#/counters"));
  SEARCH_INDEX = ix;
  return ix;
}
const TYPE_BONUS = { page: 16, classic: 13, story: 12, club: 10, grammar: 8, culture: 8, verse: 7, prayer: 7, kanji: 6, word: 5, phrases: 5, kana: 4, deck: 4, counter: 2 };
openSearch = function () {
  const ix = buildIndex();
  const input = el("input", { class: "type-in", placeholder: "search anything — kana, kanji, meaning, romaji…", autocomplete: "off", spellcheck: "false",
    style: { fontFamily: "var(--jp)", fontSize: "17px", textAlign: "left", padding: "11px 14px" } });
  const hint = el("div", { class: "imehint", style: { minHeight: "20px" } });
  const results = el("div", { class: "lst", style: { marginTop: "12px", maxHeight: "52vh", overflowY: "auto" } });
  const close = modal("Search", el("div", {}, input, hint,
    el("p", { class: "tiny muted", style: { marginTop: "6px" }, text: "Type romaji and it converts as you go, so you can search Japanese without a Japanese keyboard." }), results));
  let sel = 0, hits = [];
  function draw() {
    const q = input.value.trim(), raw = q.toLowerCase();
    const kana = /^[a-z' -]+$/i.test(q) ? romajiToKana(q) : "";
    hint.textContent = kana && kana !== q ? kana : "";
    results.innerHTML = "";
    if (!raw) { results.append(el("p", { class: "small muted", style: { padding: "12px" }, text: "Start typing." })); hits = []; return; }
    const kk = kana ? toKata(kana) : "";
    const scored = [];
    for (const x of ix) {
      const k = x.key.toLowerCase(), lab = x.label.toLowerCase();
      let sc = 0;
      if (lab === raw || (kana && (lab === kana || lab === kk))) sc += 100;
      else if (lab.startsWith(raw) || (kana && (lab.startsWith(kana) || lab.startsWith(kk)))) sc += 50;
      if (k.includes(raw)) sc += (new RegExp("(^|\\s)" + raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(\\s|$)").test(k) ? 25 : 12);
      else if (kana && (k.includes(kana) || k.includes(kk))) sc += 18;
      if (!sc) continue;
      scored.push([sc + (TYPE_BONUS[x.t] || 0), x]);
    }
    scored.sort((a, b) => b[0] - a[0]);
    hits = scored.slice(0, 40).map(s => s[1]);
    hits.forEach((h, n) => {
      const row = el("button", { class: "li", style: n === sel ? { background: "var(--ai-wash)" } : {} },
        el("span", { class: "lead", style: { fontFamily: "var(--hand)", fontSize: "19px", minWidth: "2em", textAlign: "center" }, text: h.label.slice(0, 6) }),
        el("span", { class: "body" }, el("b", { text: h.label }), el("span", { text: h.sub })),
        el("span", { class: "trail" }, el("span", { class: "tag", text: h.t })));
      row.onclick = () => { close(); h.go(); };
      results.append(row);
    });
    const dict = el("button", { class: "li" }, el("span", { class: "lead", style: { fontFamily: "var(--hand)", fontSize: "19px" }, text: "辞" }),
      el("span", { class: "body" }, el("b", { text: `Look up “${q}” in the dictionary` }), el("span", { text: "23,000+ words, conjugated forms too" })));
    dict.onclick = () => { close(); go("#/dict?q=" + encodeURIComponent(q)); };
    results.append(dict);
  }
  input.addEventListener("input", () => { sel = 0; draw(); });
  input.addEventListener("keydown", e => {
    if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(sel + 1, hits.length - 1); draw(); results.children[sel]?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(sel - 1, 0); draw(); results.children[sel]?.scrollIntoView({ block: "nearest" }); }
    if (e.key === "Enter") { e.preventDefault(); if (hits[sel]) { close(); hits[sel].go(); } else if (input.value.trim()) { close(); go("#/dict?q=" + encodeURIComponent(input.value.trim())); } }
  });
  draw();
  setTimeout(() => input.focus(), 60);
};

/* ---- Start application ---- */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
