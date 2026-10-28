/* ==========================================================================
   CONJUGATION ENGINE
   Works on kana so the rules stay visible. group: 1 godan · 2 ichidan · 3 irregular
   ========================================================================== */
export const U_ROW = { う:"わいうえお", く:"かきくけこ", ぐ:"がぎぐげご", す:"さしすせそ",
                つ:"たちつてと", ぬ:"なにぬねの", ぶ:"ばびぶべぼ", む:"まみむめも", る:"らりるれろ" };
const A = 0, I = 1, U = 2, E = 3, O = 4;
const shiftRow = (k, to) => { const r = U_ROW[k.slice(-1)]; return r ? k.slice(0, -1) + r[to] : k; };

export const TE_MAP = { う:"って", つ:"って", る:"って", ぬ:"んで", ぶ:"んで", む:"んで", く:"いて", ぐ:"いで", す:"して" };
export const TA_MAP = { う:"った", つ:"った", る:"った", ぬ:"んだ", ぶ:"んだ", む:"んだ", く:"いた", ぐ:"いだ", す:"した" };

export function conj(kana, group, form) {
  const last = kana.slice(-1), stem = kana.slice(0, -1);
  if (group === 3) {
    const suru = kana.endsWith("する"), kuru = kana === "くる" || kana.endsWith("くる");
    const base = suru ? kana.slice(0, -2) : kana.slice(0, -2);
    if (suru) return ({ masu: base + "します", masen: base + "しません", mashita: base + "しました",
      te: base + "して", ta: base + "した", nai: base + "しない", nakatta: base + "しなかった",
      pot: base + "できる", vol: base + "しよう", ba: base + "すれば", imp: base + "しろ",
      pass: base + "される", caus: base + "させる", tai: base + "したい" })[form] || kana;
    if (kuru) return ({ masu: base + "きます", masen: base + "きません", mashita: base + "きました",
      te: base + "きて", ta: base + "きた", nai: base + "こない", nakatta: base + "こなかった",
      pot: base + "こられる", vol: base + "こよう", ba: base + "くれば", imp: base + "こい",
      pass: base + "こられる", caus: base + "こさせる", tai: base + "きたい" })[form] || kana;
  }
  if (group === 2) {
    switch (form) {
      case "masu": return stem + "ます";
      case "masen": return stem + "ません";
      case "mashita": return stem + "ました";
      case "te": return stem + "て";
      case "ta": return stem + "た";
      case "nai": return stem + "ない";
      case "nakatta": return stem + "なかった";
      case "pot": return stem + "られる";
      case "vol": return stem + "よう";
      case "ba": return stem + "れば";
      case "imp": return stem + "ろ";
      case "pass": return stem + "られる";
      case "caus": return stem + "させる";
      case "tai": return stem + "たい";
    }
  }
  /* godan */
  const iStem = shiftRow(kana, I);
  const irregIku = kana.endsWith("いく");
  switch (form) {
    case "masu": return iStem + "ます";
    case "masen": return iStem + "ません";
    case "mashita": return iStem + "ました";
    case "te": return irregIku ? kana.slice(0, -1) + "って" : stem + (TE_MAP[last] || "て");
    case "ta": return irregIku ? kana.slice(0, -1) + "った" : stem + (TA_MAP[last] || "た");
    case "nai": return (last === "う" ? stem + "わ" : shiftRow(kana, A)) + "ない";
    case "nakatta": return (last === "う" ? stem + "わ" : shiftRow(kana, A)) + "なかった";
    case "pot": return shiftRow(kana, E) + "る";
    case "vol": return shiftRow(kana, O) + "う";
    case "ba": return shiftRow(kana, E) + "ば";
    case "imp": return shiftRow(kana, E);
    case "pass": return (last === "う" ? stem + "わ" : shiftRow(kana, A)) + "れる";
    case "caus": return (last === "う" ? stem + "わ" : shiftRow(kana, A)) + "せる";
    case "tai": return iStem + "たい";
  }
  return kana;
}

export const FORMS = [
  { id:"masu", name:"polite present", ex:"〜ます" },
  { id:"masen", name:"polite negative", ex:"〜ません" },
  { id:"mashita", name:"polite past", ex:"〜ました" },
  { id:"te", name:"て-form", ex:"〜て" },
  { id:"ta", name:"plain past", ex:"〜た" },
  { id:"nai", name:"plain negative", ex:"〜ない" },
  { id:"nakatta", name:"plain past negative", ex:"〜なかった" },
  { id:"pot", name:"potential (can do)", ex:"〜られる/える" },
  { id:"vol", name:"volitional (let's)", ex:"〜よう/おう" },
  { id:"ba", name:"conditional ば", ex:"〜ば" },
  { id:"tai", name:"want to", ex:"〜たい" },
  { id:"pass", name:"passive", ex:"〜られる/あれる" },
  { id:"caus", name:"causative", ex:"〜させる/あせる" }
];

/* [kana, display with furigana, english, group] */
export const VERBS = [
["たべる","食{た}べる","to eat",2],["のむ","飲{の}む","to drink",1],["みる","見{み}る","to see, watch",2],
["きく","聞{き}く","to listen, ask",1],["よむ","読{よ}む","to read",1],["かく","書{か}く","to write",1],
["はなす","話{はな}す","to speak",1],["いく","行{い}く","to go",1],["くる","来{く}る","to come",3],
["する","する","to do",3],["かう","買{か}う","to buy",1],["まつ","待{ま}つ","to wait",1],
["おきる","起{お}きる","to get up",2],["ねる","寝{ね}る","to sleep",2],["はたらく","働{はたら}く","to work",1],
["やすむ","休{やす}む","to rest",1],["あそぶ","遊{あそ}ぶ","to play, hang out",1],["つくる","作{つく}る","to make",1],
["おぼえる","覚{おぼ}える","to memorise",2],["わすれる","忘{わす}れる","to forget",2],
["おしえる","教{おし}える","to teach",2],["ならう","習{なら}う","to learn",1],
["あう","会{あ}う","to meet",1],["かえる","帰{かえ}る","to go home",1],
["でる","出{で}る","to leave, exit",2],["はいる","入{はい}る","to enter",1],
["のる","乗{の}る","to ride, board",1],["おりる","降{お}りる","to get off",2],
["あるく","歩{ある}く","to walk",1],["はしる","走{はし}る","to run",1],
["およぐ","泳{およ}ぐ","to swim",1],["うたう","歌{うた}う","to sing",1],
["すわる","座{すわ}る","to sit",1],["たつ","立{た}つ","to stand",1],
["つかう","使{つか}う","to use",1],["もつ","持{も}つ","to hold, have",1],
["わかる","分{わ}かる","to understand",1],["しる","知{し}る","to know",1],
["おもう","思{おも}う","to think",1],["いう","言{い}う","to say",1],
["あける","開{あ}ける","to open",2],["しめる","閉{し}める","to close",2],
["つける","つける","to turn on",2],["けす","消{け}す","to turn off, erase",1],
["はじめる","始{はじ}める","to begin",2],["おわる","終{お}わる","to end",1],
["いそぐ","急{いそ}ぐ","to hurry",1],["まちがえる","間{ま}違{ちが}える","to make a mistake",2],
["てつだう","手{て}伝{つだ}う","to help out",1],["よぶ","呼{よ}ぶ","to call, summon",1],
["おくる","送{おく}る","to send",1],["とる","取{と}る","to take",1],
["さがす","探{さが}す","to look for",1],["みつける","見{み}つける","to find",2],
["なおす","直{なお}す","to fix",1],["こわれる","壊{こわ}れる","to break (itself)",2],
["ふる","降{ふ}る","to fall (rain)",1],["きる","着{き}る","to wear",2],
["あらう","洗{あら}う","to wash",1],["そうじする","掃{そう}除{じ}する","to clean",3],
["べんきょうする","勉{べん}強{きょう}する","to study",3],["れんしゅうする","練{れん}習{しゅう}する","to practise",3]
];

/* [kana, display, english, type] type: "i" or "na" */
export const ADJS = [
["たかい","高{たか}い","expensive, tall","i"],["やすい","安{やす}い","cheap","i"],
["おおきい","大{おお}きい","big","i"],["ちいさい","小{ちい}さい","small","i"],
["あたらしい","新{あたら}しい","new","i"],["ふるい","古{ふる}い","old (thing)","i"],
["おいしい","おいしい","tasty","i"],["たのしい","楽{たの}しい","fun","i"],
["いそがしい","忙{いそが}しい","busy","i"],["むずかしい","難{むずか}しい","difficult","i"],
["やさしい","優{やさ}しい","kind, easy","i"],["さむい","寒{さむ}い","cold (weather)","i"],
["あつい","暑{あつ}い","hot (weather)","i"],["いい","いい","good","i"],
["ちかい","近{ちか}い","near","i"],["とおい","遠{とお}い","far","i"],
["はやい","早{はや}い","early, fast","i"],["おそい","遅{おそ}い","late, slow","i"],
["しずか","静{しず}か","quiet","na"],["にぎやか","にぎやか","lively","na"],
["きれい","きれい","pretty, clean","na"],["べんり","便{べん}利{り}","convenient","na"],
["ゆうめい","有{ゆう}名{めい}","famous","na"],["しんせつ","親{しん}切{せつ}","kind","na"],
["げんき","元{げん}気{き}","healthy, energetic","na"],["たいへん","大{たい}変{へん}","tough, awful","na"],
["ひま","暇{ひま}","free (time)","na"],["だいじょうぶ","大{だい}丈{じょう}夫{ぶ}","fine, okay","na"],
["すき","好{す}き","liked","na"],["じょうず","上{じょう}手{ず}","skilled","na"]
];

function conjAdj(kana, type, form) {
  if (type === "i") {
    const irregular = kana === "いい";
    const s = irregular ? "よ" : kana.slice(0, -1);
    switch (form) {
      case "neg": return s + "くない";
      case "past": return s + "かった";
      case "pastneg": return s + "くなかった";
      case "te": return s + "くて";
      case "adv": return s + "く";
      case "polite": return kana + "です";
    }
    return kana;
  }
  switch (form) {
    case "neg": return kana + "じゃない";
    case "past": return kana + "だった";
    case "pastneg": return kana + "じゃなかった";
    case "te": return kana + "で";
    case "adv": return kana + "に";
    case "polite": return kana + "です";
  }
  return kana;
}
export const ADJ_FORMS = [
  { id:"neg", name:"negative", ex:"not ~" },
  { id:"past", name:"past", ex:"was ~" },
  { id:"pastneg", name:"past negative", ex:"wasn't ~" },
  { id:"te", name:"て-form (and…)", ex:"~ and" },
  { id:"adv", name:"adverb", ex:"~ly" }
];

export const CONJ_FORMS = typeof FORMS !== "undefined" ? FORMS : [];
