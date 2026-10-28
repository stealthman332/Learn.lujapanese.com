import { plain, readingOf, RUBY_RE, furiHidden } from "../core/furigana.js";
import { esc, el } from "../core/dom.js";
import { SET } from "../core/store.js";

/* ==========================================================================
   LEXICON & TOKENIZER
   No morphological analyser here — just greedy longest-match against every
   word the app already knows, plus particles and common endings. It's enough
   to make reading tappable and to chunk a sentence for the builder game.
   ========================================================================== */
export const PARTICLES = ["は", "が", "を", "に", "で", "へ", "と", "も", "の", "や", "から", "まで", "より", "ね", "よ", "か", "な", "ば", "し", "けど", "ので", "のに", "だけ", "しか", "ぐらい", "くらい", "など", "ほど", "でも"];
export const ENDINGS = ["ます", "ません", "ました", "ませんでした", "です", "でした", "じゃない", "ください", "ている", "ています", "でした", "たい", "ない", "なかった", "たら", "ながら"];

export let LEX;
export function initLexicon(VOCAB, KANJI, READERS) {
  LEX = (() => {
  const m = new Map();
  const add = (surface, reading, en, src) => {
    if (!surface || surface.length > 14) return;
    if (!m.has(surface)) m.set(surface, { s: surface, r: reading || surface, en, src });
  };
  /* particles go in first: a bare は is the topic marker far more often
     than it is 歯, and glossing it as "tooth" mid-sentence is worse than
     useless */
  for (const p of PARTICLES) add(p, p, "(particle)", "particle");
  for (const e of ENDINGS) add(e, e, "(ending)", "ending");
  for (const v of VOCAB) {
    add(plain(v.form), readingOf(v.form), v.en, "vocab");
    if (v.kana !== plain(v.form)) add(v.kana, v.kana, v.en, "vocab");
  }
  for (const k of KANJI) for (const w of k.words) add(w.w, w.r, w.g, "kanji");
  for (const b of READERS) for (const g of (b.gloss || [])) {
    const [kana, kanji, en] = g;
    if (kanji) add(kanji, kana, en, "book");
    add(kana, kana, en, "book");
  }
  const maxLen = Math.max(...[...m.keys()].map(k => k.length));
  return { map: m, maxLen, get: s => m.get(s) };
  })();
  return LEX;
}

/* split a furigana-marked string into display units that also carry surface text */
export function units(src) {
  const out = [], re = new RegExp(RUBY_RE.source, "g");
  const smart = SET().furigana === "smart";
  let last = 0, m;
  while ((m = re.exec(src))) {
    for (const c of src.slice(last, m.index)) out.push({ ch: c, html: esc(c) });
    const b = m[1] ?? m[3], r = m[2] ?? m[4];
    out.push({ ch: b, rd: r, html: smart && furiHidden(b) ? esc(b) : `<ruby>${esc(b)}<rt>${esc(r)}</rt></ruby>` });
    last = re.lastIndex;
  }
  for (const c of src.slice(last)) out.push({ ch: c, html: esc(c) });
  return out;
}

/* greedy longest-match over the surface text; returns runs of unit indices */
export function segment(us) {
  const surf = us.map(u => u.ch);
  /* index map: character offset -> unit index */
  const pos = [], flat = [];
  us.forEach((u, ui) => { for (const c of u.ch) { pos.push(ui); flat.push(c); } });
  const text = flat.join("");
  const runs = [];
  let i = 0;
  while (i < text.length) {
    let hit = null;
    for (let n = Math.min(LEX.maxLen, text.length - i); n >= 1; n--) {
      const cand = text.slice(i, i + n);
      const e = LEX.get(cand);
      if (e && (n > 1 || /[\u4e00-\u9fff]/.test(cand) || PARTICLES.includes(cand))) { hit = { e, n }; break; }
    }
    if (hit) {
      runs.push({ from: pos[i], to: pos[i + hit.n - 1], word: hit.e });
      i += hit.n;
    } else {
      runs.push({ from: pos[i], to: pos[i], word: null });
      i += 1;
    }
  }
  return runs;
}

/* render a sentence with tappable words */
export function tappable(src, onWord) {
  const us = units(src);
  const runs = segment(us);
  const host = el("span", {});
  for (const r of runs) {
    const html = us.slice(r.from, r.to + 1).map(u => u.html).join("");
    if (r.word && r.word.src !== "particle") {
      const w = el("w", { html, tabindex: "0", role: "button" });
      w.addEventListener("click", () => onWord(r.word));
      w.addEventListener("keydown", e => { if (e.key === "Enter") onWord(r.word); });
      host.append(w);
    } else {
      host.append(el("span", { html }));
    }
  }
  return host;
}

/* chunk a sentence into word+particle blocks, for the builder game */
export function chunks(src) {
  const us = units(src);

  /* Books written for beginners already put spaces between phrases — exactly
     the boundaries we want. If the sentence has them, trust them. */
  if (us.some(u => /^\s$/.test(u.ch))) {
    const out = [];
    let cur = "";
    for (const u of us) {
      if (/^\s$/.test(u.ch)) { if (cur) out.push(cur); cur = ""; }
      else cur += u.ch;
    }
    if (cur) out.push(cur);
    return out;
  }

  const runs = segment(us);
  const out = [];
  for (const r of runs) {
    const text = us.slice(r.from, r.to + 1).map(u => u.ch).join("");
    const isPunct = /^[。、！？「」…・]+$/.test(text);
    const isPart = PARTICLES.includes(text);
    const isEnding = ENDINGS.includes(text);
    /* an unmatched run of plain hiragana after a stem is okurigana or an
       inflection — glue it back on rather than making it its own puzzle piece */
    const isTail = !r.word && /^[ぁ-んー]+$/.test(text);
    if ((isPart || isPunct || isEnding || isTail) && out.length) out[out.length - 1] += text;
    else out.push(text);
  }
  return out.filter(Boolean);
}

