import { unzip } from "./unzip.js";
import { sqliteTables } from "./sqlite.js";
import { isKanjiCh } from "../core/kana-convert.js";
import { plain, readingOf } from "../core/furigana.js";

/* Anki field → our markup: strip HTML, turn 漢字[かんじ] furigana into 漢字{かんじ} */
export function ankiField(s) {
  s = String(s || "").replace(/\[sound:[^\]]*\]/g, "").replace(/<br\s*\/?>/gi, " ");
  s = s.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
  let prev;
  do {
    prev = s;
    s = s.replace(/<[^>]*>/g, "");
  } while (s !== prev);
  s = s.trim();
  s = s.replace(/ ?([^\s\[\]]+?)\[([^\]]+)\]/g, (m, base, rd) => {
    const k = [...base]; let i = k.length; while (i > 0 && isKanjiCh(k[i - 1])) i--;
    const pre = k.slice(0, i).join(""), kan = k.slice(i).join("");
    return kan ? pre + kan + "{" + rd + "}" : pre + "｜" + base.slice(pre.length) + "{" + rd + "}";
  });
  return s;
}
export const hasJp = s => /[぀-ヿ一-鿿]/.test(s);
export async function importApkg(file) {
  const buf = await file.arrayBuffer();
  const z = await unzip(buf);
  let db = null;
  if (z.names.includes("collection.anki21b")) {
    const raw = await z.read("collection.anki21b");
    if (!self.fzstd) throw new Error("Zstandard decoder missing.");
    db = self.fzstd.decompress(raw);
  } else if (z.names.includes("collection.anki21")) db = await z.read("collection.anki21");
  else if (z.names.includes("collection.anki2")) db = await z.read("collection.anki2");
  if (!db) throw new Error("No Anki collection inside this file.");
  const S = sqliteTables(db);
  const notes = S.rows("notes");
  /* legacy-stub check: new-format exports keep a one-note "please update" collection.anki2 */
  if (notes.length === 1 && /update|please/i.test(notes[0].flds || "") && !z.names.includes("collection.anki21b")) throw new Error("This deck needs a newer importer — re-export from Anki with “Support older Anki versions” ticked.");
  /* deck names, if we can find them */
  const deckName = {};
  if (S.has("decks")) for (const d of S.rows("decks")) deckName[d.id] = String(d.name || "").replace(/\x1f/g, "::");
  else if (S.has("col")) { try { const c = S.rows("col")[0]; const j = JSON.parse(c.decks || "{}"); for (const k in j) deckName[k] = j[k].name; } catch (e) {} }
  const nid2did = {};
  if (S.has("cards")) for (const c of S.rows("cards")) if (nid2did[c.nid] == null) nid2did[c.nid] = c.did;
  const byDeck = {};
  for (const n of notes) {
    const f = String(n.flds || "").split("\x1f").map(ankiField).filter(x => x !== "");
    if (!f.length) continue;
    let jpI = f.findIndex(hasJp); if (jpI < 0) jpI = 0;
    const jp = f[jpI];
    const rest = f.filter((_, i) => i !== jpI);
    const kanaI = rest.findIndex(x => /^[ぁ-んァ-ンー・\s、]+$/.test(plain(x)) && x !== jp);
    const kana = kanaI >= 0 ? rest[kanaI] : readingOf(jp);
    const others = rest.filter((_, i) => i !== kanaI);
    const en = others.find(x => !hasJp(x)) || others[0] || "";
    const did = nid2did[n.id];
    const name = (deckName[did] || file.name.replace(/\.apkg$/i, "")).replace(/^.*::/, "");
    (byDeck[name] ||= []).push({ id: String(n.id), jp, kana: plain(kana), en: plain(en), extra: others.filter(x => x !== en).slice(0, 2).join(" · ") });
  }
  return Object.entries(byDeck).map(([name, cards]) => ({ name, cards }));
}
