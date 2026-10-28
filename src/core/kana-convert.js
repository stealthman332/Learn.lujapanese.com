/* ---- kana tables & romaji IME ------------------------------------------- */

export const HIRA = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽっゃゅょぁぃぅぇぉ";
export const KATA = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポッャュョァィゥェォ";

export const toKata = s => (s ? String(s) : "").replace(/[\u3041-\u3096]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60));
export const toHira = s => (s ? String(s) : "").replace(/[\u30a1-\u30f6]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));

export const R2K = {
  a:"あ",i:"い",u:"う",e:"え",o:"お",
  ka:"か",ki:"き",ku:"く",ke:"け",ko:"こ",ga:"が",gi:"ぎ",gu:"ぐ",ge:"げ",go:"ご",
  sa:"さ",shi:"し",si:"し",su:"す",se:"せ",so:"そ",za:"ざ",ji:"じ",zi:"じ",zu:"ず",ze:"ぜ",zo:"ぞ",
  ta:"た",chi:"ち",ti:"ち",tsu:"つ",tu:"つ",te:"て",to:"と",da:"だ",di:"ぢ",du:"づ",de:"で",do:"ど",
  na:"な",ni:"に",nu:"ぬ",ne:"ね",no:"の",
  ha:"は",hi:"ひ",fu:"ふ",hu:"ふ",he:"へ",ho:"ほ",
  ba:"ば",bi:"び",bu:"ぶ",be:"べ",bo:"ぼ",pa:"ぱ",pi:"ぴ",pu:"ぷ",pe:"ぺ",po:"ぽ",
  ma:"ま",mi:"み",mu:"む",me:"め",mo:"も",ya:"や",yu:"ゆ",yo:"よ",
  ra:"ら",ri:"り",ru:"る",re:"れ",ro:"ろ",wa:"わ",wo:"を",nn:"ん","n'":"ん",
  kya:"きゃ",kyu:"きゅ",kyo:"きょ",gya:"ぎゃ",gyu:"ぎゅ",gyo:"ぎょ",
  sha:"しゃ",shu:"しゅ",sho:"しょ",sya:"しゃ",syu:"しゅ",syo:"しょ",
  ja:"じゃ",ju:"じゅ",jo:"じょ",jya:"じゃ",jyu:"じゅ",jyo:"じょ",zya:"じゃ",zyu:"じゅ",zyo:"じょ",
  cha:"ちゃ",chu:"ちゅ",cho:"ちょ",tya:"ちゃ",tyu:"ちゅ",tyo:"ちょ",
  nya:"にゃ",nyu:"にゅ",nyo:"にょ",hya:"ひゃ",hyu:"ひゅ",hyo:"ひょ",
  bya:"びゃ",byu:"びゅ",byo:"びょ",pya:"ぴゃ",pyu:"ぴゅ",pyo:"ぴょ",
  mya:"みゃ",myu:"みゅ",myo:"みょ",rya:"りゃ",ryu:"りゅ",ryo:"りょ",
  fa:"ふぁ",fi:"ふぃ",fe:"ふぇ",fo:"ふぉ",va:"ゔぁ",vi:"ゔぃ",vu:"ゔ",ve:"ゔぇ",vo:"ゔぉ",
  ti_:"てぃ",xa:"ぁ",xi:"ぃ",xu:"ぅ",xe:"ぇ",xo:"ぉ",xtu:"っ",xtsu:"っ",
  xya:"ゃ",xyu:"ゅ",xyo:"ょ",la:"ぁ",li:"ぃ",lu:"ぅ",le:"ぇ",lo:"ぉ",
  "-":"ー"
};

export const K2R = (() => {
  const m = {}; for (const k in R2K) if (!m[R2K[k]]) m[R2K[k]] = k;
  Object.assign(m, { し:"shi",ち:"chi",つ:"tsu",ふ:"fu",じ:"ji",を:"o",ん:"n",づ:"zu",ぢ:"ji" });
  return m;
})();

/* romaji → kana, greedy longest match. Handles っ (double consonant) and ん. */
export function romajiToKana(input, katakana = false) {
  let s = input.toLowerCase().replace(/[^a-z\-'ー]/g, ""), out = "", i = 0;
  while (i < s.length) {
    if (s[i] === "n" && /^n(?![aiueoy'])/.test(s.slice(i)) && s[i + 1] !== "n") { out += "ん"; i++; continue; }
    if (s[i] === "n" && s[i + 1] === "n") { out += "ん"; i += 2; continue; }
    if (/[bcdfghjklmpqrstvwxyz]/.test(s[i]) && s[i + 1] === s[i]) { out += "っ"; i++; continue; }
    let hit = "";
    for (let n = 4; n >= 1; n--) { const t = s.slice(i, i + n); if (R2K[t]) { hit = t; break; } }
    if (hit) { out += R2K[hit]; i += hit.length; } else { i++; }
  }
  return katakana ? toKata(out) : out;
}

export function kanaToRomaji(k) {
  if (!k) return "";
  const h = toHira(k); let out = "", i = 0;
  while (i < h.length) {
    const two = h.slice(i, i + 2);
    if (K2R[two]) { out += K2R[two]; i += 2; continue; }
    const c = h[i];
    if (c === "っ") { const nx = K2R[h[i + 1]] || ""; out += nx[0] || ""; i++; continue; }
    if (c === "ー") { out += out.slice(-1); i++; continue; }
    out += K2R[c] || c; i++;
  }
  return out;
}

/* Kanji character detection */
const KJ_CLASS = "\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff々〆ヶ";
const KJ_RE = new RegExp("[" + KJ_CLASS + "]");
export const isKanjiCh = c => KJ_RE.test(c);

export const toHiragana = toHira;
export const R2H = R2K;
export const H2R = K2R;
