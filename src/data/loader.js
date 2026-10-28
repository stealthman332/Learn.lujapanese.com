/* ==========================================================================
   DATA LOADER
   Lazy-loads JSON and TSV data blocks on demand with in-memory caching.
   Keeps initial page load ultra-fast (< 50 KB shell) and decouples large
   static datasets from the JavaScript runtime bundle.
   ========================================================================== */

const cache = new Map();

export const DATA = {
  get(name) {
    const key = name.replace("_", "-");
    return cache.get(key) || null;
  },
  has(name) {
    const key = name.replace("_", "-");
    return cache.has(key);
  },
  set(name, value) {
    const key = name.replace("_", "-");
    cache.set(key, value);
  },
  async ensure(...names) {
    return Promise.all(
      names.map(async (name) => {
        const key = name.replace("_", "-");
        if (cache.has(key)) return cache.get(key);
        try {
          const isTsv = key === "dict";
          const ext = isTsv ? ".tsv" : ".json";
          const res = await fetch(`./data/${key}${ext}`);
          if (!res.ok) throw new Error(`HTTP ${res.status} loading ${key}${ext}`);
          const val = isTsv ? await res.text() : await res.json();
          cache.set(key, val);
          return val;
        } catch (e) {
          console.error(`Failed to load data/${key}:`, e);
          return null;
        }
      })
    );
  }
};

export const getClassics = () => DATA.ensure("classics").then(() => DATA.get("classics"));
export const getClub = () => DATA.ensure("club").then(() => DATA.get("club"));
export const getCulture = () => DATA.ensure("culture").then(() => DATA.get("culture"));
export const getFaith = () => DATA.ensure("faith").then(() => DATA.get("faith"));
export const getGrammarExt = () => DATA.ensure("grammar-ext").then(() => DATA.get("grammar-ext"));
export const getJlc = () => DATA.ensure("jlc").then(() => DATA.get("jlc"));
export const getJlcAnki = () => DATA.ensure("jlc-anki").then(() => DATA.get("jlc-anki"));
export const getKanjiData = () => DATA.ensure("kanji").then(() => DATA.get("kanji"));
export const getStories = () => DATA.ensure("stories").then(() => DATA.get("stories"));
export const getStrokes = () => DATA.ensure("strokes").then(() => DATA.get("strokes"));
export const getDict = () => DATA.ensure("dict").then(() => DATA.get("dict"));

export async function preload(...names) {
  return DATA.ensure(...names);
}
