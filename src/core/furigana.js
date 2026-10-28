/* ---- furigana ------------------------------------------------------------
   Markup:  食{た}べる   — reading for the kanji run just before the brace
            ｜今日{きょう} — explicit start marker, for any base text
   Modes:   "on" always · "off" never · "smart" only over kanji you don't know
            yet (your known-kanji level in settings, plus anything your reviews
            say is solid).                                                   */
import { Store, SET } from './store.js';
import { isKanjiCh } from './kana-convert.js';

const KJ_CLASS = "\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff々〆ヶ";
export const RUBY_RE = new RegExp("｜([^｜{}]+)\\{([^}]+)\\}|([" + KJ_CLASS + "]+)\\{([^}]+)\\}", "g");

export function knownKanji(ch) {
  const lv = +(SET().knownLevel || 0);               /* 0 none · 5 = N5 · … · 1 = all JLPT */
  if (lv) {
    const j = (typeof kanjiLevel === "function") ? kanjiLevel(ch) : 0;
    if (j && j >= lv) return true;
  }
  const c = Store.d.srs["kanji:" + ch];
  return !!(c && c.rep >= 2 && c.iv >= 7);
}

export function furiHidden(base) {
  for (const c of base) if (isKanjiCh(c) && !knownKanji(c)) return false;
  return true;
}

export function furi(text, mode) {
  const m = mode ?? SET().furigana;
  return String(text).replace(RUBY_RE, (_, b1, r1, b2, r2) => {
    const b = b1 ?? b2, r = r1 ?? r2;
    if (m === "off" || (m === "smart" && furiHidden(b))) return b;
    return `<ruby>${b}<rt>${r}</rt></ruby>`;
  });
}

export const plain = t => String(t).replace(/\{[^}]*\}/g, "").replace(/｜/g, "");
export const readingOf = t => String(t).replace(RUBY_RE, (_, b1, r1, b2, r2) => r1 ?? r2).replace(/｜/g, "");
