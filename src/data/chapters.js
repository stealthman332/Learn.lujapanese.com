/* ==========================================================================
   DATA — CHAPTERS
   Nothing is locked. This is a suggested order, not a gate. Jump anywhere.
   Section types: kana | kanji | vocab | grammar | sit | read | write | game
   ========================================================================== */
export const CHAPTERS = [
{ n:1, jp:"あいさつ", en:"Hello, and the first ten kana", goal:"Read あ〜そ and survive a first meeting without English.",
  sections:[
    {t:"kana", label:"Hiragana あ・か・さ rows", script:"hira", rows:[0,1,2]},
    {t:"write", label:"Write あ〜そ by hand", chars:["あ","い","う","え","お","か","き","く","け","こ","さ","し","す","せ","そ"]},
    {t:"vocab", label:"Greetings & courtesies", deck:"greet"},
    {t:"sit", label:"Small talk that works", id:"smalltalk"},
    {t:"read", label:"Read: ねこ", id:"r-neko"},
    {t:"game", label:"Kana rain", g:"rain"}
  ]},
{ n:2, jp:"じこしょうかい", en:"Introducing yourself", goal:"Read た〜ほ and say who you are, where you're from, and what you study.",
  sections:[
    {t:"kana", label:"Hiragana た・な・は rows", script:"hira", rows:[3,4,5]},
    {t:"write", label:"Write た〜ほ by hand", chars:["た","ち","つ","て","と","な","に","ぬ","ね","の","は","ひ","ふ","へ","ほ"]},
    {t:"vocab", label:"Introducing yourself", deck:"self"},
    {t:"grammar", label:"A is B, は vs が, の", ids:["g-desu","g-wa-ga","g-no"]},
    {t:"read", label:"Read: たべる", id:"r-taberu"},
    {t:"game", label:"Kana match", g:"match"}
  ]},
{ n:3, jp:"かず", en:"The rest of hiragana, and numbers", goal:"Finish the hiragana chart including dakuten and yōon. Count things.",
  sections:[
    {t:"kana", label:"Hiragana ま row → ん", script:"hira", rows:[6,7,8,9,10]},
    {t:"kana", label:"Dakuten & yōon", script:"hira", extra:["daku","yoon"]},
    {t:"write", label:"Write ま〜ん by hand", chars:["ま","み","む","め","も","や","ゆ","よ","ら","り","る","れ","ろ","わ","を","ん"]},
    {t:"vocab", label:"Numbers & counters", deck:"num"},
    {t:"read", label:"Read: あかい あおい", id:"r-iro"},
    {t:"game", label:"Speed reading", g:"speed"}
  ]},
{ n:4, jp:"カタカナ・たべもの", en:"Katakana and food", goal:"Read the first half of katakana — which is most of a menu — and name what you eat.",
  sections:[
    {t:"kana", label:"Katakana ア・カ・サ・タ rows", script:"kata", rows:[0,1,2,3]},
    {t:"write", label:"Write ア〜ト by hand", chars:["ア","イ","ウ","エ","オ","カ","キ","ク","ケ","コ","サ","シ","ス","セ","ソ","タ","チ","ツ","テ","ト"]},
    {t:"vocab", label:"Food & drink", deck:"food"},
    {t:"sit", label:"Eating out", id:"resto"},
    {t:"game", label:"Look-alike trainer", g:"lookalike"}
  ]},
{ n:5, jp:"かいもの", en:"Katakana done, and shopping", goal:"Finish katakana. Get through a konbini transaction start to finish.",
  sections:[
    {t:"kana", label:"Katakana ナ row → ン", script:"kata", rows:[4,5,6,7,8,9,10]},
    {t:"kana", label:"Katakana dakuten & yōon", script:"kata", extra:["daku","yoon"]},
    {t:"vocab", label:"Shops & konbini", deck:"shop"},
    {t:"vocab", label:"Money & payment", deck:"money"},
    {t:"sit", label:"At the convenience store", id:"konbini"},
    {t:"read", label:"Read: コンビニ", id:"r-konbini"},
    {t:"game", label:"Typing drill", g:"type"}
  ]},
{ n:6, jp:"かぞく", en:"First sentences, and family", goal:"Build simple です sentences and talk about the people around you.",
  sections:[
    {t:"kanji", label:"First kanji: 一〜十, 人, 日", chars:["一","二","三","四","五","六","七","八","九","十","人","日"]},
    {t:"vocab", label:"Family", deck:"family"},
    {t:"grammar", label:"も, と/や, あります・います", ids:["g-mo","g-to-toka","g-arimasu"]},
    {t:"read", label:"Read: ボールは どこ?", id:"r-doko"},
    {t:"game", label:"Word match", g:"match"}
  ]},
{ n:7, jp:"まいにち", en:"Verbs and the shape of a day", goal:"Use ます-form to describe a whole ordinary day.",
  sections:[
    {t:"kanji", label:"Kanji: 月火水木金土曜", chars:["月","火","水","木","金","土","曜","週"]},
    {t:"vocab", label:"Everyday life", deck:"daily"},
    {t:"vocab", label:"Core verbs", deck:"verbs"},
    {t:"grammar", label:"ます／ません, ました, ませんか", ids:["g-masu","g-mashita","g-masenka"]},
    {t:"read", label:"Read: あさ", id:"r-asa"},
    {t:"game", label:"Sentence builder", g:"build"}
  ]},
{ n:8, jp:"まちを あるく", en:"Particles, and finding your way", goal:"Stop guessing between に and で. Ask directions and follow the answer.",
  sections:[
    {t:"kanji", label:"Kanji: 上下左右前後中外", chars:["上","下","左","右","前","後","中","外"]},
    {t:"vocab", label:"Around town & directions", deck:"town"},
    {t:"grammar", label:"を, に vs で, へ, から〜まで", ids:["g-o","g-ni-de","g-e","g-kara-made"]},
    {t:"sit", label:"Asking the way", id:"directions"},
    {t:"game", label:"Particle drill", g:"particle"}
  ]},
{ n:9, jp:"じかんと ようす", en:"Time, and describing things", goal:"Tell time, name the day, and use both adjective types correctly.",
  sections:[
    {t:"kanji", label:"Kanji: 時分半今年何", chars:["時","分","半","今","年","何","午","間"]},
    {t:"vocab", label:"Time & calendar", deck:"time"},
    {t:"vocab", label:"Core adjectives", deck:"adj"},
    {t:"grammar", label:"い-adj, な-adj, くて/で, なる", ids:["g-i-adj","g-na-adj","g-kute-de","g-kunaru"]},
    {t:"game", label:"Conjugation gym", g:"conj"}
  ]},
{ n:10, jp:"てフォーム", en:"The て-form", goal:"The single highest-leverage form in Japanese. Chain actions and make requests.",
  sections:[
    {t:"grammar", label:"て-form, てください, ている, てもいい", ids:["g-te","g-tekudasai","g-teiru","g-temoii","g-tewaikenai"]},
    {t:"vocab", label:"Restaurants & ordering", deck:"rest"},
    {t:"game", label:"Conjugation gym", g:"conj"},
    {t:"read", label:"Read: あめの ひ", id:"r-ame"},
    {t:"write", label:"Write kanji: 食飲買行来", chars:["食","飲","買","行","来"]}
  ]},
{ n:11, jp:"でんしゃ", en:"Getting around Japan", goal:"Read station signs, ask about platforms, and handle a delay.",
  sections:[
    {t:"kanji", label:"Kanji: 駅電車行来出入口", chars:["駅","電","車","行","来","出","入","口"]},
    {t:"vocab", label:"Trains & getting around", deck:"travel"},
    {t:"sit", label:"Trains and stations", id:"station"},
    {t:"read", label:"Read: でんしゃ", id:"r-densha"},
    {t:"game", label:"Speed reading", g:"speed"}
  ]},
{ n:12, jp:"ふつうけい", en:"Plain form, and real conversation", goal:"Drop です／ます where it belongs, and learn the noises that keep a conversation alive.",
  sections:[
    {t:"grammar", label:"Plain form, た-form, と思う, けど", ids:["g-plain","g-ta","g-toomou","g-kedo"]},
    {t:"vocab", label:"Keeping a conversation alive", deck:"talk"},
    {t:"read", label:"Read: あたらしい ともだち", id:"r-tomodachi"},
    {t:"game", label:"Conjugation gym", g:"conj"}
  ]},
{ n:13, jp:"したいこと", en:"Wants, plans, invitations", goal:"Say what you want to do and get someone to come along.",
  sections:[
    {t:"kanji", label:"Kanji: 好楽新古高安", chars:["楽","新","古","高","安","多","少","友"]},
    {t:"vocab", label:"Hobbies, anime & games", deck:"hobby"},
    {t:"vocab", label:"Feelings & opinions", deck:"feel"},
    {t:"grammar", label:"たい, ほしい, が上手, たことがある, たり", ids:["g-tai","g-hoshii","g-jouzu","g-takoto","g-tarisuru"]},
    {t:"read", label:"Read: おべんとうを つくる", id:"r-bento"}
  ]},
{ n:14, jp:"できること", en:"Ability, and talking shop", goal:"Say what you can and can't do — then say it about your own field.",
  sections:[
    {t:"grammar", label:"ことができる, potential form, すぎる, やすい", ids:["g-koto-dekiru","g-potential","g-sugiru","g-yasui"]},
    {t:"vocab", label:"Computers & security", deck:"tech"},
    {t:"sit", label:"Talking shop (IT & security)", id:"cyber"},
    {t:"game", label:"Conjugation gym", g:"conj"},
    {t:"read", label:"Read: サーバーが おちた ばん", id:"r-server"}
  ]},
{ n:15, jp:"りゆう", en:"Reasons and explanations", goal:"Master んです and ので — the two patterns that make you sound like a person instead of a phrasebook.",
  sections:[
    {t:"grammar", label:"んです, ので/から, のに, でしょう, かも", ids:["g-nda","g-node","g-noni","g-deshou","g-kamo"]},
    {t:"vocab", label:"Phone calls", deck:"phone"},
    {t:"sit", label:"Business phone call", id:"bizphone"},
    {t:"read", label:"Read: でんわが こわい", id:"r-denwa"},
    {t:"game", label:"Listening drill", g:"listen"}
  ]},
{ n:16, jp:"もしも", en:"Conditionals, and when things go wrong", goal:"Handle たら / と / ば, and know exactly what to say in an emergency.",
  sections:[
    {t:"grammar", label:"たら, と, ば, なければならない, なくてもいい", ids:["g-tara","g-to-cond","g-ba","g-nakereba","g-nakutemoii"]},
    {t:"vocab", label:"Trouble & emergencies", deck:"emerg"},
    {t:"sit", label:"When something goes wrong", id:"trouble"},
    {t:"read", label:"Read: じてんしゃが ない", id:"r-jitensha"}
  ]},
{ n:17, jp:"やりもらい", en:"Giving, receiving, and the office", goal:"Get あげる／くれる／もらう straight — the direction of a favor is baked into the verb.",
  sections:[
    {t:"grammar", label:"あげる/くれる/もらう, ておく, てしまう, てみる", ids:["g-ageru","g-teoku","g-teshimau","g-temiru","g-teiku"]},
    {t:"kanji", label:"Kanji: 会社仕事持待", chars:["会","社","事","持","待","使","働","立"]},
    {t:"vocab", label:"Work & the office", deck:"work"},
    {t:"sit", label:"First day at work", id:"firstday"},
    {t:"sit", label:"Drinking with coworkers", id:"izakaya"}
  ]},
{ n:18, jp:"けいご", en:"The politeness ladder", goal:"Recognize keigo at full speed, and refuse something without ever saying no.",
  sections:[
    {t:"grammar", label:"させていただく, keigo verbs, ていただけませんか", ids:["g-saseteitadaku","g-keigo-verbs","g-kudasaimasenka"]},
    {t:"sit", label:"Saying no without saying no", id:"decline"},
    {t:"sit", label:"Apologizing", id:"apolog"},
    {t:"sit", label:"Asking for help or a favor", id:"help"},
    {t:"sit", label:"Interview & applications", id:"interview"},
    {t:"read", label:"Read: インターンに おうぼする", id:"r-intern"}
  ]},
{ n:19, jp:"からだ", en:"Passive, causative, and the clinic", goal:"Two forms that look scary and aren't. Then use them where it counts: describing what happened to you.",
  sections:[
    {t:"grammar", label:"passive, causative, 前に/てから, とき, ながら", ids:["g-passive","g-causative","g-mae-ato","g-toki","g-nagara"]},
    {t:"vocab", label:"Body & health", deck:"body"},
    {t:"sit", label:"At the clinic", id:"clinic"},
    {t:"vocab", label:"Home & rooms", deck:"home"},
    {t:"sit", label:"Apartment hunting", id:"apart"}
  ]},
{ n:20, jp:"しあげ", en:"Pulling it together", goal:"The rest of the N4 grammar, a full kanji sweep, and the longest reads in the library.",
  sections:[
    {t:"grammar", label:"はず, つもり, 予定, そう, よう, らしい, ばかり", ids:["g-hazu","g-tsumori","g-youtei","g-sou","g-you","g-rashii","g-bakari","g-teiruaida","g-toitte"]},
    {t:"kanji", label:"Kanji sweep: everything N4", jlpt:4},
    {t:"vocab", label:"University & class", deck:"school"},
    {t:"vocab", label:"Clothes & sizes", deck:"clothes"},
    {t:"vocab", label:"Weather & seasons", deck:"weather"},
    {t:"read", label:"Read: なつまつり", id:"r-matsuri"},
    {t:"read", label:"Read: まいごの いぬ", id:"r-inu"},
    {t:"read", label:"Read: はじめての ラーメンや", id:"r-ramen"}
  ]}
];

/* the user's own shelf — their PDFs stay on their machine, we track progress only */
const SHELF = [
  { id:"jfz1", title:"Japanese From Zero! 1", pages:333, band:"#5E7A52", units:13, unitWord:"Lesson",
    note:"Hiragana is introduced across the whole book — pair it with chapters 1–3 here." },
  { id:"jfz2", title:"Japanese From Zero! 2", pages:391, band:"#1E3A5F", units:13, unitWord:"Lesson",
    note:"Katakana plus early grammar. Lines up with chapters 4–9." },
  { id:"jfz3", title:"Japanese From Zero! 3", pages:366, band:"#A9762B", units:13, unitWord:"Lesson",
    note:"Kanji starts in earnest. Chapters 10–14." },
  { id:"jfz4", title:"Japanese From Zero! 4", pages:439, band:"#C4402C", units:13, unitWord:"Lesson",
    note:"Solid N4 territory. Chapters 15–18." },
  { id:"jfz5", title:"Japanese From Zero! 5", pages:443, band:"#7A4B8C", units:13, unitWord:"Lesson",
    note:"Late N4 into N3. Chapters 19–20 and beyond." },
  { id:"rtk-kana", title:"Remembering the Kana", pages:153, band:"#2F5A8C", units:2, unitWord:"Part",
    note:"Kana mnemonics. If a mnemonic here beats mine, use theirs — yours beat both." },
  { id:"tadoku-chotto", title:"ちょっと来て！ (tadoku, Level S)", pages:21, band:"#C87F2C", units:1, unitWord:"Book",
    note:"Free graded reader from NPO 多言語多読, CC BY-NC-ND. More free books at tadoku.org." }
];

