/* ---- deinflection -----------------------------------------------------------
   Rules run backwards from the end of a word: [surface ending, base ending,
   types the surface may be, type of the result]. Applied repeatedly, so
   書かれていました → 書かれている → 書かれて → 書かれる → 書く.            */
export const DEINFLECT = (() => {
  const G = [ /* dict, i, a, e, o, te, ta */
    ["う", "い", "わ", "え", "お", "って", "った"], ["く", "き", "か", "け", "こ", "いて", "いた"],
    ["ぐ", "ぎ", "が", "げ", "ご", "いで", "いだ"], ["す", "し", "さ", "せ", "そ", "して", "した"],
    ["つ", "ち", "た", "て", "と", "って", "った"], ["ぬ", "に", "な", "ね", "の", "んで", "んだ"],
    ["ぶ", "び", "ば", "べ", "ぼ", "んで", "んだ"], ["む", "み", "ま", "め", "も", "んで", "んだ"],
    ["る", "り", "ら", "れ", "ろ", "って", "った"]
  ];
  const rules = [];
  const r = (from, to, inT, out, why) => rules.push([from, to, inT, out, why]);
  const ANY = ["*"], V1 = ["*", "v1"], V5 = ["*", "v5"], ADJ = ["*", "adj"], TE = ["*", "te"];
  /* endings that hang off the ます-stem */
  const I_SUF = [["ます", "polite"], ["ました", "polite past"], ["ません", "polite negative"], ["ませんでした", "polite past negative"],
    ["ましょう", "let's"], ["まして", "polite て"], ["ませ", "polite imperative"], ["なさい", "command"], ["ながら", "while"],
    ["そう", "looks like"], ["すぎる", "too much"], ["やすい", "easy to"], ["にくい", "hard to"], ["たい", "want to"], ["かた", "way of"]];
  for (const [s, why] of I_SUF) {
    const inT = ["たい", "やすい", "にくい"].includes(s) ? ADJ : s === "すぎる" ? V1 : ANY;
    r(s, "る", inT, "v1", why);
    for (const g of G) r(g[1] + s, g[0], inT, "v5", why);
    r("き" + s, "くる", inT, "vk", why); r("し" + s, "する", inT, "vs", why);
  }
  /* negative (未然形) */
  const A_SUF = [["ない", "negative", ADJ], ["ず", "negative (written)", ANY], ["ずに", "without", ANY], ["ぬ", "negative (old)", ANY],
    ["ん", "negative (colloquial)", ANY], ["ないで", "without / don't", ANY], ["なきゃ", "must", ANY], ["なくちゃ", "must", ANY]];
  for (const [s, why, inT] of A_SUF) {
    r(s, "る", inT, "v1", why);
    for (const g of G) r(g[2] + s, g[0], inT, "v5", why);
    r("こ" + s, "くる", inT, "vk", why); r("し" + s, "する", inT, "vs", why);
  }
  r("せず", "する", ANY, "vs", "without"); r("せずに", "する", ANY, "vs", "without");
  /* passive / causative / potential — the results conjugate like 食べる */
  for (const g of G) {
    r(g[2] + "れる", g[0], V1, "v5", "passive"); r(g[2] + "せる", g[0], V1, "v5", "causative");
    r(g[2] + "される", g[0], V1, "v5", "causative passive"); r(g[2] + "せられる", g[0], V1, "v5", "causative passive");
    r(g[3] + "る", g[0], V1, "v5", "potential");
  }
  r("られる", "る", V1, "v1", "passive / potential"); r("させる", "る", V1, "v1", "causative"); r("させられる", "る", V1, "v1", "causative passive");
  r("れる", "る", V1, "v1", "potential (colloquial)");
  r("こられる", "くる", V1, "vk", "passive / potential"); r("こさせる", "くる", V1, "vk", "causative");
  r("される", "する", V1, "vs", "passive"); r("させる", "する", V1, "vs", "causative"); r("できる", "する", V1, "vs", "can do");
  /* past, て, conditional-た, -たり */
  const T = [["て", 5, "て-form"], ["た", 6, "past"], ["たら", 6, "if / when"], ["たり", 6, "-tari"]];
  for (const [s, gi, why] of T) {
    const inT = s === "て" ? TE : ANY;
    r(s, "る", inT, "v1", why);
    for (const g of G) r(g[gi] + s.slice(1), g[0], inT, "v5", why);
    r("き" + s, "くる", inT, "vk", why); r("し" + s, "する", inT, "vs", why);
    r((gi === 5 ? "って" : "った") + s.slice(1), "く", inT, "v5", why + " (行く)");
  }
  /* things built on the て-form */
  const TE_AUX = [["いる", V1, "-ing / state"], ["る", V1, "-ing (casual)"], ["いた", ANY, "was -ing"], ["た", ANY, "was -ing (casual)"],
    ["います", ANY, "-ing (polite)"], ["いました", ANY, "was -ing (polite)"], ["しまう", V5, "completely / regrettably"],
    ["おく", V5, "in advance"], ["ある", V5, "has been done"], ["みる", V1, "try"], ["いく", V5, "go on -ing"], ["くる", ["*", "vk"], "come to"],
    ["くれる", V1, "for me"], ["もらう", V5, "get someone to"], ["あげる", V1, "for someone"], ["ください", ANY, "please"],
    ["ほしい", ADJ, "want someone to"], ["も", ANY, "even if"], ["は", ANY, "(topic)"]];
  for (const [s, inT, why] of TE_AUX) { r("て" + s, "て", inT, "te", why); r("で" + s, "で", inT, "te", why); }
  r("ちゃう", "て", V5, "te", "completely (casual)"); r("じゃう", "で", V5, "te", "completely (casual)");
  r("とく", "て", V5, "te", "in advance (casual)"); r("どく", "で", V5, "te", "in advance (casual)");
  /* conditional, volitional, imperative */
  r("れば", "る", ANY, "v1", "if"); for (const g of G) r(g[3] + "ば", g[0], ANY, "v5", "if");
  r("くれば", "くる", ANY, "vk", "if"); r("すれば", "する", ANY, "vs", "if");
  r("よう", "る", ANY, "v1", "let's / will"); for (const g of G) r(g[4] + "う", g[0], ANY, "v5", "let's / will");
  r("こよう", "くる", ANY, "vk", "let's"); r("しよう", "する", ANY, "vs", "let's");
  r("ろ", "る", ANY, "v1", "command"); r("よ", "る", ANY, "v1", "command (written)"); for (const g of G) r(g[3], g[0], ANY, "v5", "command");
  r("こい", "くる", ANY, "vk", "command"); r("しろ", "する", ANY, "vs", "command"); r("せよ", "する", ANY, "vs", "command (written)");
  r("るな", "る", ANY, "v1", "don't"); for (const g of G) r(g[0] + "な", g[0], ANY, "v5", "don't");
  /* い-adjectives */
  const ADJ_R = [["く", "adverb"], ["くない", "negative"], ["かった", "past"], ["くなかった", "past negative"], ["くて", "て-form"],
    ["ければ", "if"], ["さ", "-ness"], ["そう", "looks"], ["すぎる", "too"], ["くなる", "become"], ["かったら", "if"], ["くありません", "negative (polite)"],
    ["き", "(literary)"], ["し", "(literary)"]];
  for (const [s, why] of ADJ_R) r(s, "い", s === "すぎる" ? V1 : ANY, "adj", why);
  r("なかった", "ない", ANY, "adj", "past"); r("なくて", "ない", ANY, "adj", "て-form"); r("なければ", "ない", ANY, "adj", "if not");
  r("たかった", "たい", ANY, "adj", "past"); r("たくない", "たい", ANY, "adj", "negative"); r("たくて", "たい", ANY, "adj", "て-form");
  /* bare ます-stem as a noun (読み → 読む) — lowest priority */
  for (const g of G) r(g[1], g[0], ["*"], "v5", "stem");
  rules.sort((a, b) => b[0].length - a[0].length);
  return rules;
})();

export function deinflect(word) {
  const out = [{ t: word, type: "*", why: [] }];
  const seen = new Map([[word + "|*", 0]]);
  for (let k = 0; k < out.length && k < 200; k++) {
    const cur = out[k];
    if (cur.why.length >= 5) continue;
    for (const [from, to, inT, outT, why] of DEINFLECT) {
      if (!cur.t.endsWith(from) || cur.t.length === from.length && to.length === 0) continue;
      if (!(inT.includes("*") && cur.type === "*") && !inT.includes(cur.type)) continue;
      const t = cur.t.slice(0, cur.t.length - from.length) + to;
      if (!t) continue;
      const key = t + "|" + outT;
      if (seen.has(key)) continue;
      seen.set(key, 1);
      out.push({ t, type: outT, why: [why, ...cur.why] });
    }
  }
  return out;
}
export function posOk(pos, type, word) {
  if (type === "*") return true;
  const ps = pos.split(",");
  if (type === "v1") return ps.includes("v1") || ps.includes("vk") || /来る$|くる$/.test(word);
  if (type === "v5") return ps.some(p => p.startsWith("v5"));
  if (type === "vk") return ps.includes("vk") || /来る$|くる$/.test(word);
  if (type === "vs") return ps.includes("vs") || ps.includes("vss") || ps.includes("vz") || word === "する";
  if (type === "adj") return ps.includes("i") || ps.includes("ix") || ps.includes("aux") || ps.includes("auxadj");
  return false;
}
