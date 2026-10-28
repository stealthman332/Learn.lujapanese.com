/* ==========================================================================
   DATA — KANA.  [char, romaji, strokes, mnemonic]   null = empty chart cell
   Mnemonics written for this app; they are hooks, not doctrine. Replace any
   that don't stick for you — the ones you invent yourself always win.
   ========================================================================== */
export const KANA = {
  hira: {
    label: "ひらがな", en: "Hiragana", note: "The round one. Native words, grammar glue, verb endings.",
    rows: [
      ["a", [["あ","a",3,"An Antenna crossed by a curl."],["い","i",2,"Two ii sticks leaning together."],["う","u",2,"A nose in profile going ooh."],["え","e",2,"An Exhausted ninja mid-backflip."],["お","o",3,"あ that grew an extra foot: oh!"]]],
      ["ka",[["か","ka",3,"A Karate kick, knee up."],["き","ki",4,"A Key with two teeth."],["く","ku",1,"A Cuckoo's open beak."],["け","ke",3,"A Keg tap on a wall."],["こ","ko",2,"Two Coins stacked."]]],
      ["sa",[["さ","sa",3,"A Salmon hooked on a line."],["し","shi",1,"The fishing hook She used."],["す","su",2,"Sue's swirl with one leg down."],["せ","se",3,"A Seesaw on a post."],["そ","so",1,"A zigzag Sock stitch."]]],
      ["ta",[["た","ta",4,"A 't' and an 'a' standing side by side."],["ち","chi",2,"A Cheerleader bent backward."],["つ","tsu",1,"One Tsunami curl."],["て","te",1,"A hand holding a Tea tray."],["と","to",2,"A Toe with a splinter in it."]]],
      ["na",[["な","na",4,"A Nail knotted with twine."],["に","ni",3,"Knitting needles: one bar, two lines."],["ぬ","nu",2,"Noodles twirled into a loop."],["ね","ne",2,"A cat's tail curling — ne?"],["の","no",1,"A NO sign with the bar removed."]]],
      ["ha",[["は","ha",3,"An H with a belly. Ha!"],["ひ","hi",1,"A wide smiling mouth: hee."],["ふ","fu",4,"Mount Fuji seen from the side."],["へ","he",1,"A hill you Heave yourself over."],["ほ","ho",4,"は with one more bar. Ho ho."]]],
      ["ma",[["ま","ma",3,"Mama tying a bow."],["み","mi",2,"The number 21 — Minutes."],["む","mu",3,"A Mooing cow with one horn."],["め","me",2,"An eye with a lash — look at ME."],["も","mo",3,"A fish Monster on a hook."]]],
      ["ya",[["や","ya",3,"A Yacht with its sail up."],null,["ゆ","yu",2,"A Unique fish swimming past."],null,["よ","yo",2,"A Yo-yo on its string."]]],
      ["ra",[["ら","ra",2,"A Rabbit ear over a curl."],["り","ri",2,"Two River reeds."],["る","ru",1,"A loop Running into a knot."],["れ","re",2,"る but the tail flicks out — Rebel."],["ろ","ro",1,"A Road with no knot at the end."]]],
      ["wa",[["わ","wa",2,"Waving with a bent arm."],null,null,null,["を","wo",3,"A mouth swallowing the object."]]],
      ["n", [["ん","n",1,"An 'n' scrawled in one stroke."],null,null,null,null]]
    ],
    daku: [
      ["が","ga",4],["ぎ","gi",5],["ぐ","gu",2],["げ","ge",4],["ご","go",3],
      ["ざ","za",4],["じ","ji",2],["ず","zu",3],["ぜ","ze",4],["ぞ","zo",2],
      ["だ","da",5],["ぢ","ji",3],["づ","zu",2],["で","de",2],["ど","do",3],
      ["ば","ba",4],["び","bi",2],["ぶ","bu",5],["べ","be",2],["ぼ","bo",5],
      ["ぱ","pa",4],["ぴ","pi",2],["ぷ","pu",5],["ぺ","pe",2],["ぽ","po",5]
    ],
    yoon: [
      ["きゃ","kya"],["きゅ","kyu"],["きょ","kyo"],["しゃ","sha"],["しゅ","shu"],["しょ","sho"],
      ["ちゃ","cha"],["ちゅ","chu"],["ちょ","cho"],["にゃ","nya"],["にゅ","nyu"],["にょ","nyo"],
      ["ひゃ","hya"],["ひゅ","hyu"],["ひょ","hyo"],["みゃ","mya"],["みゅ","myu"],["みょ","myo"],
      ["りゃ","rya"],["りゅ","ryu"],["りょ","ryo"],["ぎゃ","gya"],["ぎゅ","gyu"],["ぎょ","gyo"],
      ["じゃ","ja"],["じゅ","ju"],["じょ","jo"],["びゃ","bya"],["びゅ","byu"],["びょ","byo"],
      ["ぴゃ","pya"],["ぴゅ","pyu"],["ぴょ","pyo"]
    ]
  },
  kata: {
    label: "カタカナ", en: "Katakana", note: "The angular one. Loanwords, names, sound effects, emphasis.",
    rows: [
      ["a", [["ア","a",2,"An Ax head."],["イ","i",2,"An Eagle's beak."],["ウ","u",3,"A roof — shelter, ooh."],["エ","e",3,"An E laid on its side."],["オ","o",3,"Oh — a cross with a tail."]]],
      ["ka",[["カ","ka",2,"The same Karate kick, sharper."],["キ","ki",3,"A sharp Key."],["ク","ku",2,"A Cookie with a bite out."],["ケ","ke",3,"A Keg tipped over."],["コ","ko",2,"Two Corners."]]],
      ["sa",[["サ","sa",3,"A Sandcastle rake."],["シ","shi",3,"She winks: two lashes, swoop left→right."],["ス","su",2,"Sue's slope."],["セ","se",2,"A Setsquare."],["ソ","so",2,"So — one lash, swoop top→bottom."]]],
      ["ta",[["タ","ta",3,"A luggage Tag with a slash."],["チ","chi",3,"A Cheese knife."],["ツ","tsu",3,"Two lashes, Tsunami swoop top→bottom."],["テ","te",3,"A Television antenna."],["ト","to",2,"A Toe post."]]],
      ["na",[["ナ","na",2,"A Nail cross."],["ニ","ni",2,"Two bars = Ni."],["ヌ","nu",2,"Noodles crossed."],["ネ","ne",4,"A Necktie."],["ノ","no",1,"A single NO slash."]]],
      ["ha",[["ハ","ha",2,"Ha — two legs apart."],["ヒ","hi",2,"A Heel on a step."],["フ","fu",1,"Half of Fuji."],["ヘ","he",1,"The same hill as へ."],["ホ","ho",4,"A Holy cross with legs."]]],
      ["ma",[["マ","ma",2,"A Map corner."],["ミ","mi",3,"Three Minute marks."],["ム","mu",2,"Moo — a corner with a foot."],["メ","me",2,"A Mess of an X."],["モ","mo",3,"More bars than ヨ."]]],
      ["ya",[["ヤ","ya",2,"A Yacht mast."],null,["ユ","yu",2,"A U turned upright."],null,["ヨ","yo",3,"An E facing backward — Yo."]]],
      ["ra",[["ラ","ra",2,"A Rack."],["リ","ri",2,"Two River lines."],["ル","ru",2,"Running legs."],["レ","re",1,"A Leg-shaped check mark."],["ロ","ro",3,"A Room, boxed."]]],
      ["wa",[["ワ","wa",2,"A Washbasin."],null,null,null,["ヲ","wo",3,"The rare Wo shelf."]]],
      ["n", [["ン","n",2,"One lash, swoop bottom→top (vs ソ)."],null,null,null,null]]
    ],
    daku: [
      ["ガ","ga",3],["ギ","gi",4],["グ","gu",3],["ゲ","ge",4],["ゴ","go",3],
      ["ザ","za",4],["ジ","ji",4],["ズ","zu",3],["ゼ","ze",3],["ゾ","zo",3],
      ["ダ","da",4],["ヂ","ji",4],["ヅ","zu",4],["デ","de",4],["ド","do",3],
      ["バ","ba",3],["ビ","bi",3],["ブ","bu",2],["ベ","be",2],["ボ","bo",5],
      ["パ","pa",3],["ピ","pi",3],["プ","pu",2],["ペ","pe",2],["ポ","po",5]
    ],
    yoon: [
      ["キャ","kya"],["キュ","kyu"],["キョ","kyo"],["シャ","sha"],["シュ","shu"],["ショ","sho"],
      ["チャ","cha"],["チュ","chu"],["チョ","cho"],["ニャ","nya"],["ニュ","nyu"],["ニョ","nyo"],
      ["ヒャ","hya"],["ヒュ","hyu"],["ヒョ","hyo"],["ミャ","mya"],["ミュ","myu"],["ミョ","myo"],
      ["リャ","rya"],["リュ","ryu"],["リョ","ryo"],["ギャ","gya"],["ギュ","gyu"],["ギョ","gyo"],
      ["ジャ","ja"],["ジュ","ju"],["ジョ","jo"],["ビャ","bya"],["ビュ","byu"],["ビョ","byo"],
      ["ピャ","pya"],["ピュ","pyu"],["ピョ","pyo"],
      ["ファ","fa"],["フィ","fi"],["フェ","fe"],["フォ","fo"],["ヴ","vu"],["ティ","ti"],["ディ","di"],["ウォ","wo"]
    ]
  }
};

/* the pairs that actually cost people points */
export const LOOKALIKES = [
  ["シ","ツ","シ's strokes come in from the LEFT and the long swoop goes bottom-left → top-right. ツ's marks sit on TOP and the swoop goes top-right → bottom-left. Think: shi = smile lines on the side, tsu = tsunami falling."],
  ["ソ","ン","Same rule as シ/ツ. ン (n) sweeps upward from the bottom. ソ (so) sweeps downward from the top."],
  ["ぬ","め","ぬ has the loop at the end (nu = noodles you can twirl). め stops clean (me = one eye, no loop)."],
  ["る","ろ","る ends in a knot. ろ is the open road — no knot."],
  ["れ","わ","れ's tail flicks out to the right. わ's tail curls back in."],
  ["は","ほ","ほ has one extra horizontal bar."],
  ["さ","き","き has two bars crossing the stem; さ has one."],
  ["ク","タ","タ has an extra slash inside the corner."],
  ["ン","ソ","(see above — the direction of the long stroke is the whole answer)"],
  ["ま","も","ま's loop hangs below and the bars are on top; も has the hook first, bars after."],
  ["ワ","フ","ワ has a left shoulder; フ is a single bent stroke."],
  ["コ","ユ","ユ's bottom bar sticks out to the left; コ is a clean bracket."],
  ["イ","ヘ","イ has a vertical stem; ヘ is only the shoulder."],
  ["ケ","タ","ケ is open at the bottom-left; タ closes into a hook."]
];

/* flatten helpers */
export const kanaList = (script, parts = ["base"]) => {
  const k = KANA[script], out = [];
  if (parts.includes("base")) for (const [, row] of k.rows) for (const c of row) if (c) out.push({ ch: c[0], rom: c[1], strokes: c[2], mn: c[3], set: "base", script });
  if (parts.includes("daku")) for (const c of k.daku) out.push({ ch: c[0], rom: c[1], strokes: c[2], mn: "", set: "daku", script });
  if (parts.includes("yoon")) for (const c of k.yoon) out.push({ ch: c[0], rom: c[1], strokes: 0, mn: "", set: "yoon", script });
  return out;
};
export const ALL_KANA = [...kanaList("hira", ["base", "daku", "yoon"]), ...kanaList("kata", ["base", "daku", "yoon"])];
export const kanaId = k => "kana:" + k.ch;

