/* ==========================================================================
   REFERENCE DATA — counters, colours, numbers, time
   Counters are the thing that makes people quit. The irregularities aren't
   random: they're sound changes that happen at predictable places, and once
   you see the pattern you stop memorising 200 separate facts.
   ========================================================================== */

/* [1..10] readings; "—" where the form is simply not used */
export const COUNTERS = [
  { id:"tsu",  c:"つ",   what:"General things", note:"The universal fallback. If you don't know the right counter, use this — it works for almost any inanimate object up to ten. There is no eleven; after十 you switch to 個 or plain numbers.",
    r:["ひとつ","ふたつ","みっつ","よっつ","いつつ","むっつ","ななつ","やっつ","ここのつ","とお"], q:"いくつ", ic:"🔟", irregular:"Entirely native Japanese numbers — nothing here comes from Chinese." },
  { id:"nin",  c:"人{にん}", what:"People", note:"One and two are irregular and native: ひとり, ふたり. From three it's regular. 四人 is よにん, never しにん — し also means death, so it's avoided.",
    r:["ひとり","ふたり","さんにん","よにん","ごにん","ろくにん","しちにん","はちにん","きゅうにん","じゅうにん"], q:"何人{なんにん}", ic:"👥", irregular:"ひとり・ふたり・よにん" },
  { id:"mai",  c:"枚{まい}", what:"Flat thin things", note:"Paper, stamps, tickets, plates, shirts, slices of bread, CDs. Completely regular — the easiest counter in the language.",
    r:["いちまい","にまい","さんまい","よんまい","ごまい","ろくまい","ななまい","はちまい","きゅうまい","じゅうまい"], q:"何枚{なんまい}", ic:"📄", irregular:"none" },
  { id:"hon",  c:"本{ほん}", what:"Long cylindrical things", note:"Pens, bottles, umbrellas, trees, bananas, phone calls, train lines. The h sound shifts to p after 1, 6, 8, 10 and to b after 3 — that shift is the whole difficulty.",
    r:["いっぽん","にほん","さんぼん","よんほん","ごほん","ろっぽん","ななほん","はっぽん","きゅうほん","じゅっぽん"], q:"何本{なんぼん}", ic:"🖊️", irregular:"1・6・8・10 → ぽん　3 → ぼん" },
  { id:"hiki", c:"匹{ひき}", what:"Small animals", note:"Cats, dogs, fish, insects. Same h→p→b pattern as 本. Large animals take 頭 instead, and birds take 羽.",
    r:["いっぴき","にひき","さんびき","よんひき","ごひき","ろっぴき","ななひき","はっぴき","きゅうひき","じゅっぴき"], q:"何匹{なんびき}", ic:"🐈", irregular:"1・6・8・10 → ぴき　3 → びき" },
  { id:"satsu",c:"冊{さつ}", what:"Bound volumes", note:"Books, magazines, notebooks. The s doubles after 1, 8 and 10.",
    r:["いっさつ","にさつ","さんさつ","よんさつ","ごさつ","ろくさつ","ななさつ","はっさつ","きゅうさつ","じゅっさつ"], q:"何冊{なんさつ}", ic:"📚", irregular:"1・8・10 → っさつ" },
  { id:"dai",  c:"台{だい}", what:"Machines & vehicles", note:"Cars, computers, washing machines, bicycles. Fully regular.",
    r:["いちだい","にだい","さんだい","よんだい","ごだい","ろくだい","ななだい","はちだい","きゅうだい","じゅうだい"], q:"何台{なんだい}", ic:"🚗", irregular:"none" },
  { id:"hai",  c:"杯{はい}", what:"Cupfuls & glassfuls", note:"Coffee, beer, rice in a bowl. Also, oddly, octopus and squid. Same h→p→b shifts as 本.",
    r:["いっぱい","にはい","さんばい","よんはい","ごはい","ろっぱい","ななはい","はっぱい","きゅうはい","じゅっぱい"], q:"何杯{なんばい}", ic:"🍵", irregular:"1・6・8・10 → ぱい　3 → ばい" },
  { id:"ko",   c:"個{こ}", what:"Small round things", note:"Eggs, apples, erasers, batteries. The practical replacement for つ once you pass ten.",
    r:["いっこ","にこ","さんこ","よんこ","ごこ","ろっこ","ななこ","はっこ","きゅうこ","じゅっこ"], q:"何個{なんこ}", ic:"⚪", irregular:"1・6・8・10 → っこ" },
  { id:"kai",  c:"回{かい}", what:"Times, occurrences", note:"How many times something happened. 一回, 二回, 三回 — regular apart from the doubling at 1, 6, 8, 10.",
    r:["いっかい","にかい","さんかい","よんかい","ごかい","ろっかい","ななかい","はっかい","きゅうかい","じゅっかい"], q:"何回{なんかい}", ic:"🔁", irregular:"1・6・8・10 → っかい" },
  { id:"kaif", c:"階{かい}", what:"Floors of a building", note:"Written with a different kanji from 回 but pronounced the same, except three: 三階 is さんがい. The ground floor in Japan is 一階, not zero.",
    r:["いっかい","にかい","さんがい","よんかい","ごかい","ろっかい","ななかい","はっかい","きゅうかい","じゅっかい"], q:"何階{なんがい}", ic:"🏢", irregular:"3 → さんがい" },
  { id:"sai",  c:"歳{さい}", what:"Age in years", note:"Regular except twenty, which is はたち — a completely separate native word, and the one everyone remembers because it's the age of adulthood.",
    r:["いっさい","にさい","さんさい","よんさい","ごさい","ろくさい","ななさい","はっさい","きゅうさい","じゅっさい"], q:"何歳{なんさい}", ic:"🎂", irregular:"20 → はたち" },
  { id:"ji",   c:"時{じ}", what:"O'clock", note:"Four, seven and nine are the irregular ones: よじ, しちじ, くじ. Never よんじ or ななじ.",
    r:["いちじ","にじ","さんじ","よじ","ごじ","ろくじ","しちじ","はちじ","くじ","じゅうじ"], q:"何時{なんじ}", ic:"🕐", irregular:"4 → よじ　7 → しちじ　9 → くじ" },
  { id:"fun",  c:"分{ふん}", what:"Minutes", note:"The nastiest one. Same p/b shifts as 本, plus 四分 is よんぷん. Worth drilling until it's automatic, because you use it every day.",
    r:["いっぷん","にふん","さんぷん","よんぷん","ごふん","ろっぷん","ななふん","はっぷん","きゅうふん","じゅっぷん"], q:"何分{なんぷん}", ic:"⏱️", irregular:"1・3・4・6・8・10 → ぷん" },
  { id:"nichi",c:"日{にち}", what:"Days of the month", note:"Days 1 through 10 use native readings that look nothing like the numbers, then it goes regular — apart from 14, 20 and 24. 二十日 is はつか.",
    r:["ついたち","ふつか","みっか","よっか","いつか","むいか","なのか","ようか","ここのか","とおか"], q:"何日{なんにち}", ic:"📅", irregular:"1–10 native　14 → じゅうよっか　20 → はつか" },
  { id:"soku", c:"足{そく}", what:"Pairs of footwear", note:"Shoes, socks. One pair, not one shoe.",
    r:["いっそく","にそく","さんぞく","よんそく","ごそく","ろくそく","ななそく","はっそく","きゅうそく","じゅっそく"], q:"何足{なんぞく}", ic:"👟", irregular:"1・8・10 → っそく　3 → ぞく" },
  { id:"ken",  c:"軒{けん}", what:"Houses & shops", note:"Buildings you'd walk into on a street.",
    r:["いっけん","にけん","さんげん","よんけん","ごけん","ろっけん","ななけん","はっけん","きゅうけん","じゅっけん"], q:"何軒{なんけん}", ic:"🏠", irregular:"3 → さんげん" },
  { id:"tsuu", c:"通{つう}", what:"Letters & documents", note:"Emails count too, in formal writing.",
    r:["いっつう","につう","さんつう","よんつう","ごつう","ろくつう","ななつう","はっつう","きゅうつう","じゅっつう"], q:"何通{なんつう}", ic:"✉️", irregular:"1・8・10 → っつう" }
];

export const COUNTER_RULE = `Three sound changes explain almost every irregular counter:

**1 · 6 · 8 · 10 double the following consonant.** いち + かい becomes いっかい. ろく + ぽん becomes ろっぽん. Your mouth is already closing on that final consonant, so the next one gets doubled.

**h becomes p after a doubled consonant, and b after ん.** That's why 本 is いっぽん, さんぼん, にほん — same word, three shapes, entirely predictable.

**3 sometimes voices the next sound.** さんがい, さんぼん, さんびき. The ん pulls the consonant into a voiced version of itself.

Four, seven and nine each have two readings — よん/し, なな/しち, きゅう/く — and which one a counter takes is the only thing you genuinely have to memorise. The general rule: counters prefer よん and なな, but 時 and 日 prefer し and しち.`;

/* colour swatches for the colours deck */
export const COLORS = [
  { jp:"赤{あか}",    kana:"あか",    en:"red",     hex:"#C1272D", adj:"赤い" },
  { jp:"青{あお}",    kana:"あお",    en:"blue",    hex:"#1E3A8A", adj:"青い" },
  { jp:"黄{き}色{いろ}", kana:"きいろ", en:"yellow",  hex:"#E8B923", adj:"黄色い" },
  { jp:"緑{みどり}",  kana:"みどり",  en:"green",   hex:"#3E7C4A", adj:"— (noun only)" },
  { jp:"白{しろ}",    kana:"しろ",    en:"white",   hex:"#F4F2EC", adj:"白い" },
  { jp:"黒{くろ}",    kana:"くろ",    en:"black",   hex:"#15171A", adj:"黒い" },
  { jp:"茶{ちゃ}色{いろ}", kana:"ちゃいろ", en:"brown", hex:"#7A5230", adj:"茶色い" },
  { jp:"紫{むらさき}", kana:"むらさき", en:"purple", hex:"#6B4A8C", adj:"— (noun only)" },
  { jp:"ピンク",      kana:"ピンク",  en:"pink",    hex:"#E8879C", adj:"— (noun only)" },
  { jp:"オレンジ",    kana:"オレンジ", en:"orange", hex:"#E07B39", adj:"— (noun only)" },
  { jp:"灰{はい}色{いろ}", kana:"はいいろ", en:"grey", hex:"#8A8F94", adj:"— (noun only)" },
  { jp:"水{みず}色{いろ}", kana:"みずいろ", en:"light blue", hex:"#8FC7DE", adj:"— (noun only)" },
  { jp:"金{きん}色{いろ}", kana:"きんいろ", en:"gold", hex:"#B8912F", adj:"— (noun only)" },
  { jp:"銀{ぎん}色{いろ}", kana:"ぎんいろ", en:"silver", hex:"#A8AEB3", adj:"— (noun only)" },
  { jp:"紺{こん}",    kana:"こん",    en:"navy",    hex:"#1B2A4A", adj:"— (noun only)" },
  { jp:"黄{き}緑{みどり}", kana:"きみどり", en:"yellow-green", hex:"#8DB255", adj:"— (noun only)" }
];

export const COLOR_NOTE = `Only five colours are true adjectives in Japanese: 赤い, 青い, 黄色い, 白い, 黒い — plus 茶色い, which is accepted but sounds slightly odd to some speakers. Everything else is a noun, so it needs の to attach to something: 緑のかばん, ピンクのシャツ.

Get that wrong and you get 「緑いかばん」, which is the kind of mistake that makes a native speaker tilt their head. When in doubt, use の.

One more trap: 青 covers a lot of what English calls green. Green traffic lights are 青信号. Unripe fruit is 青い. Fresh leaves are 青葉. This is a genuine difference in where the colour boundary sits, not a mistake.`;

/* big numbers, for the number drill */
export const NUMBERS = [
  ["0","ゼロ / 零{れい}"], ["1","いち"], ["2","に"], ["3","さん"], ["4","よん / し"], ["5","ご"],
  ["6","ろく"], ["7","なな / しち"], ["8","はち"], ["9","きゅう / く"], ["10","じゅう"],
  ["11","じゅういち"], ["20","にじゅう"], ["30","さんじゅう"], ["40","よんじゅう"],
  ["100","ひゃく"], ["300","さんびゃく"], ["600","ろっぴゃく"], ["800","はっぴゃく"],
  ["1000","せん"], ["3000","さんぜん"], ["8000","はっせん"],
  ["10000","いちまん"], ["100000","じゅうまん"], ["1000000","ひゃくまん"], ["100000000","いちおく"]
];
export const NUMBER_NOTE = `Japanese groups large numbers by ten thousand, not by thousand. 万 is 10,000, 億 is 100,000,000. So one million is 百万 — literally "a hundred ten-thousands" — and converting in your head means regrouping the digits, not just swapping words. This is the single biggest source of number confusion for English speakers, and the only fix is practice.

Watch the sound changes at 300 (さんびゃく), 600 (ろっぴゃく), 800 (はっぴゃく), 3000 (さんぜん) and 8000 (はっせん) — the same doubling and voicing rules as the counters.`;


export const COLOURS = typeof COLORS !== "undefined" ? COLORS : [];
export const TIME_DATA = {};
