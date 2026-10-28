/* ==========================================================================
   DATA — GRADED READERS (Parts A & B)
   ========================================================================== */

export const READER_LEVELS = [
  { n:0, jp:"レベル0", en:"First words", desc:"All kana. One idea per page. Repetition on purpose." },
  { n:1, jp:"レベル1", en:"First sentences", desc:"Short です／ます sentences. N5 kanji with furigana." },
  { n:2, jp:"レベル2", en:"Short stories", desc:"Two or three sentences per page. Past tense appears." },
  { n:3, jp:"レベル3", en:"Everyday scenes", desc:"Dialogue, て-form chains, natural rhythm." },
  { n:4, jp:"レベル4", en:"Longer reads", desc:"N4 grammar, paragraphs, opinions." }
];



const READERS_A = [
/* ---------------- level 0 ---------------- */
{ id:"r-neko", level:0, title:"ねこ", titleEn:"Cat", ic:"🐱",
  pages:[
    {ic:"🐱", s:"ねこ。", en:"A cat."},
    {ic:"🐈", s:"ねこがいる。", en:"There is a cat."},
    {ic:"⬜🐈", s:"しろいねこ。", en:"A white cat."},
    {ic:"⬛🐈‍⬛", s:"くろいねこ。", en:"A black cat."},
    {ic:"🐈🐈‍⬛", s:"ねこが 二{に}ひき。", en:"Two cats."},
    {ic:"😴🐈", s:"ねこが ねる。", en:"The cat sleeps."},
    {ic:"🐟🐈", s:"ねこが たべる。", en:"The cat eats."},
    {ic:"🏃🐈", s:"ねこが はしる。", en:"The cat runs."},
    {ic:"❓", s:"ねこは どこ?", en:"Where is the cat?"},
    {ic:"📦🐈", s:"ここ!", en:"Here!"},
    {ic:"😊🐈", s:"ねこが すき。", en:"I like cats."}
  ],
  gloss:[["ねこ","","cat"],["いる","","to exist (animals)"],["しろい","白い","white"],["くろい","黒い","black"],["ねる","寝る","to sleep"],["どこ","","where"]]},

{ id:"r-taberu", level:0, title:"たべる", titleEn:"Eat", ic:"🍞",
  pages:[
    {ic:"🍞", s:"パン。", en:"Bread."},
    {ic:"😋🍞", s:"パンを たべる。", en:"I eat bread."},
    {ic:"🍚", s:"ごはん。", en:"Rice."},
    {ic:"😋🍚", s:"ごはんを たべる。", en:"I eat rice."},
    {ic:"🍜", s:"ラーメン。", en:"Ramen."},
    {ic:"😋🍜", s:"ラーメンを たべる。", en:"I eat ramen."},
    {ic:"🥛", s:"ぎゅうにゅう。", en:"Milk."},
    {ic:"🥛😋", s:"ぎゅうにゅうを のむ。", en:"I drink milk."},
    {ic:"☕", s:"コーヒーも のむ。", en:"I drink coffee too."},
    {ic:"😋", s:"おいしい!", en:"Delicious!"},
    {ic:"🙏", s:"ごちそうさま。", en:"Thanks for the meal."}
  ],
  gloss:[["たべる","食べる","to eat"],["のむ","飲む","to drink"],["おいしい","","delicious"],["も","","also, too"]]},

{ id:"r-iro", level:0, title:"あかい あおい", titleEn:"Red and blue", ic:"🎨",
  pages:[
    {ic:"🍎", s:"りんご。", en:"An apple."},
    {ic:"🔴", s:"りんごは あかい。", en:"The apple is red."},
    {ic:"🌊", s:"うみ。", en:"The sea."},
    {ic:"🔵", s:"うみは あおい。", en:"The sea is blue."},
    {ic:"🍋", s:"レモンは きいろい。", en:"The lemon is yellow."},
    {ic:"🌿", s:"はっぱは みどり。", en:"The leaf is green."},
    {ic:"☁️", s:"くもは しろい。", en:"The cloud is white."},
    {ic:"🌃", s:"よるは くろい。", en:"The night is black."},
    {ic:"🌈", s:"にじは いろいろ!", en:"The rainbow is all sorts of colors!"},
    {ic:"❤️", s:"すきな いろは なに?", en:"What color do you like?"}
  ],
  gloss:[["あかい","赤い","red"],["あおい","青い","blue"],["きいろい","黄色い","yellow"],["みどり","緑","green"],["いろ","色","color"],["いろいろ","色々","all sorts"]]},

{ id:"r-doko", level:0, title:"ボールは どこ?", titleEn:"Where is the ball?", ic:"⚽",
  pages:[
    {ic:"⚽", s:"ボール。", en:"A ball."},
    {ic:"❓⚽", s:"ボールは どこ?", en:"Where is the ball?"},
    {ic:"🪑", s:"いすの 上{うえ}?", en:"On the chair?"},
    {ic:"🚫", s:"ない。", en:"Not there."},
    {ic:"🛏️", s:"ベッドの 下{した}?", en:"Under the bed?"},
    {ic:"🚫", s:"ない。", en:"Not there."},
    {ic:"📦", s:"はこの 中{なか}?", en:"In the box?"},
    {ic:"🚫", s:"ない!", en:"Not there!"},
    {ic:"🐕", s:"あ! いぬ!", en:"Ah! The dog!"},
    {ic:"🐕⚽", s:"いぬが もっている。", en:"The dog has it."},
    {ic:"😄", s:"あった!", en:"Found it!"}
  ],
  gloss:[["どこ","","where"],["うえ","上","on top, above"],["した","下","under, below"],["なか","中","inside"],["ない","","there isn't"],["あった","","found it / there it was"]]},

/* ---------------- level 1 ---------------- */
{ id:"r-asa", level:1, title:"あさ", titleEn:"Morning", ic:"🌅",
  pages:[
    {ic:"⏰", s:"七{しち}時{じ}です。", en:"It's seven o'clock."},
    {ic:"🛏️", s:"わたしは 起{お}きます。", en:"I get up."},
    {ic:"🚿", s:"シャワーを あびます。", en:"I take a shower."},
    {ic:"🍞☕", s:"パンを 食{た}べて、コーヒーを 飲{の}みます。", en:"I eat bread and drink coffee."},
    {ic:"👕", s:"シャツを 着{き}ます。", en:"I put on a shirt."},
    {ic:"🎒", s:"かばんを 持{も}ちます。", en:"I take my bag."},
    {ic:"🚪", s:"「いってきます。」", en:"\"I'm off.\""},
    {ic:"🚃", s:"電{でん}車{しゃ}に 乗{の}ります。", en:"I get on the train."},
    {ic:"🏫", s:"八{はち}時{じ}半{はん}に 学{がっ}校{こう}に 着{つ}きます。", en:"I arrive at school at 8:30."},
    {ic:"👋", s:"「おはようございます!」", en:"\"Good morning!\""}
  ],
  gloss:[["おきる","起きる","to get up"],["あびる","浴びる","to bathe in"],["きる","着る","to wear"],["のる","乗る","to board"],["つく","着く","to arrive"]]},

{ id:"r-konbini", level:1, title:"コンビニ", titleEn:"The convenience store", ic:"🏪",
  pages:[
    {ic:"🏪", s:"コンビニに 行{い}きます。", en:"I go to the convenience store."},
    {ic:"🍙", s:"おにぎりが あります。", en:"There are rice balls."},
    {ic:"🍱", s:"おべんとうも あります。", en:"There are bentos too."},
    {ic:"🥤", s:"のみものは どこですか。", en:"Where are the drinks?"},
    {ic:"🧊", s:"あそこです。", en:"Over there."},
    {ic:"🧺", s:"おにぎりを 二{ふた}つ 買{か}います。", en:"I buy two rice balls."},
    {ic:"💳", s:"「袋{ふくろ}は いりますか。」", en:"\"Do you need a bag?\""},
    {ic:"🙅", s:"「大{だい}丈{じょう}夫{ぶ}です。」", en:"\"I'm fine, thanks.\""},
    {ic:"♨️", s:"「温{あたた}めますか。」", en:"\"Shall I warm it up?\""},
    {ic:"🙏", s:"「はい、お願{ねが}いします。」", en:"\"Yes, please.\""},
    {ic:"🧾", s:"三{さん}百{びゃく}円{えん}でした。", en:"It was 300 yen."},
    {ic:"😊", s:"「ありがとうございました。」", en:"\"Thank you very much.\""}
  ],
  gloss:[["ある","","to exist (things)"],["かう","買う","to buy"],["ふくろ","袋","bag"],["あたためる","温める","to warm up"]]},

{ id:"r-ame", level:1, title:"あめの ひ", titleEn:"A rainy day", ic:"☔",
  pages:[
    {ic:"🌧️", s:"今{きょ}日{う}は 雨{あめ}です。", en:"It's raining today."},
    {ic:"🌂", s:"かさが ありません。", en:"I don't have an umbrella."},
    {ic:"😟", s:"こまりました。", en:"I'm in trouble."},
    {ic:"🏪", s:"コンビニで かさを 買{か}いました。", en:"I bought an umbrella at the convenience store."},
    {ic:"💴", s:"六{ろっ}百{ぴゃく}円{えん}でした。", en:"It was 600 yen."},
    {ic:"🚶", s:"駅{えき}まで 歩{ある}きます。", en:"I walk to the station."},
    {ic:"💨", s:"風{かぜ}が つよいです。", en:"The wind is strong."},
    {ic:"💔🌂", s:"あ! かさが こわれました。", en:"Ah! The umbrella broke."},
    {ic:"😅", s:"六{ろっ}百{ぴゃく}円{えん}…。", en:"Six hundred yen..."},
    {ic:"🌈", s:"でも、雨{あめ}が やみました。", en:"But the rain stopped."},
    {ic:"😄", s:"よかったです。", en:"That's a relief."}
  ],
  gloss:[["かさ","傘","umbrella"],["こまる","困る","to be in trouble"],["あるく","歩く","to walk"],["こわれる","壊れる","to break"],["やむ","止む","to stop (rain)"]]},

{ id:"r-densha", level:1, title:"でんしゃ", titleEn:"The train", ic:"🚃",
  pages:[
    {ic:"🚉", s:"駅{えき}は 人{ひと}が 多{おお}いです。", en:"The station is crowded."},
    {ic:"🎫", s:"ICカードを 使{つか}います。", en:"I use my IC card."},
    {ic:"3️⃣", s:"三{さん}番{ばん}線{せん}です。", en:"It's platform three."},
    {ic:"🚃", s:"電{でん}車{しゃ}が 来{き}ました。", en:"The train came."},
    {ic:"🧍🧍🧍", s:"満{まん}員{いん}です。", en:"It's packed."},
    {ic:"📱", s:"みんな スマホを 見{み}ています。", en:"Everyone is looking at their phones."},
    {ic:"🔇", s:"だれも 話{はな}しません。", en:"Nobody is talking."},
    {ic:"🔀", s:"次{つぎ}の 駅{えき}で 乗{の}り換{か}えます。", en:"I transfer at the next station."},
    {ic:"🏃", s:"急{いそ}ぎます!", en:"I hurry!"},
    {ic:"🚪", s:"ドアが しまりました。", en:"The doors closed."},
    {ic:"😌", s:"間{ま}に合{あ}いました。", en:"I made it in time."}
  ],
  gloss:[["おおい","多い","many"],["つかう","使う","to use"],["まんいん","満員","full, packed"],["のりかえる","乗り換える","to transfer"],["まにあう","間に合う","to make it in time"]]},

/* ---------------- level 2 ---------------- */
{ id:"r-tomodachi", level:2, title:"あたらしい ともだち", titleEn:"A new friend", ic:"🤝",
  pages:[
    {ic:"🏫", s:"四{し}月{がつ}、新{あたら}しい クラスが 始{はじ}まりました。となりの 席{せき}に 知{し}らない 人{ひと}が いました。", en:"In April a new class started. There was someone I didn't know in the seat next to me."},
    {ic:"😶", s:"わたしは 少{すこ}し 緊{きん}張{ちょう}しました。何{なに}を 言{い}えば いいか 分{わ}かりませんでした。", en:"I was a little nervous. I didn't know what I should say."},
    {ic:"📖", s:"その 人{ひと}は 日{に}本{ほん}語{ご}の 本{ほん}を 読{よ}んでいました。わたしも 同{おな}じ 本{ほん}を 持{も}っています。", en:"That person was reading a Japanese book. I have the same book."},
    {ic:"💬", s:"「その 本{ほん}、おもしろいですか。」と 聞{き}きました。", en:"\"Is that book interesting?\" I asked."},
    {ic:"😊", s:"「はい、とても おもしろいです!」と 言{い}いました。そして 笑{わら}いました。", en:"\"Yes, it's very interesting!\" they said. And then they smiled."},
    {ic:"🗣️", s:"わたしたちは 三{さん}十{じゅっ}分{ぷん}ぐらい 話{はな}しました。時{じ}間{かん}が 早{はや}かったです。", en:"We talked for about thirty minutes. The time went fast."},
    {ic:"📱", s:"「連{れん}絡{らく}先{さき}を 交{こう}換{かん}しませんか。」と 言{い}われて、うれしかったです。", en:"I was asked \"shall we exchange contacts?\" and I was happy."},
    {ic:"🍜", s:"来{らい}週{しゅう}、いっしょに ラーメンを 食{た}べに 行{い}きます。", en:"Next week we're going to eat ramen together."},
    {ic:"💭", s:"最{さい}初{しょ}の 一{ひと}言{こと}が いちばん むずかしいです。でも、言{い}ってよかったです。", en:"The first thing you say is the hardest. But I'm glad I said it."}
  ],
  gloss:[["となり","隣","next to"],["きんちょう","緊張","nervousness"],["おなじ","同じ","the same"],["わらう","笑う","to laugh, smile"],["こうかん","交換","exchange"],["さいしょ","最初","the first"]]},

{ id:"r-bento", level:2, title:"おべんとうを つくる", titleEn:"Making a bento", ic:"🍱",
  pages:[
    {ic:"⏰", s:"日{に}曜{よう}日{び}の 朝{あさ}、六{ろく}時{じ}に 起{お}きました。今{きょ}日{う}は おべんとうを 作{つく}ります。", en:"Sunday morning, I got up at six. Today I'm making a bento."},
    {ic:"🍚", s:"まず、ご飯{はん}を たきます。それから 卵{たまご}を 焼{や}きます。", en:"First I cook the rice. Then I fry an egg."},
    {ic:"🥚", s:"卵{たまご}焼{や}きは むずかしいです。三{さん}回{かい} 失{しっ}敗{ぱい}しました。", en:"The rolled omelette is hard. I failed three times."},
    {ic:"🥦", s:"野{や}菜{さい}も 入{い}れます。緑{みどり}が あると きれいです。", en:"I put in vegetables too. With some green it looks nice."},
    {ic:"🍙", s:"ご飯{はん}で おにぎりを 二{ふた}つ 作{つく}りました。中{なか}は しゃけです。", en:"I made two rice balls. Inside is salmon."},
    {ic:"📦", s:"はこに ぜんぶ 入{い}れました。思{おも}ったより きれいに できました。", en:"I put it all in the box. It came out nicer than I expected."},
    {ic:"📷", s:"写{しゃ}真{しん}を 撮{と}って、友{とも}だちに 送{おく}りました。", en:"I took a photo and sent it to a friend."},
    {ic:"💬", s:"「すごい! 売{う}れますよ!」と 返{へん}事{じ}が 来{き}ました。うれしかったです。", en:"\"Amazing! You could sell that!\" came the reply. I was pleased."},
    {ic:"😋", s:"公{こう}園{えん}で 食{た}べました。自{じ}分{ぶん}で 作{つく}った ものは おいしいです。", en:"I ate it in the park. Things you make yourself taste good."}
  ],
  gloss:[["つくる","作る","to make"],["たく","炊く","to cook (rice)"],["やく","焼く","to grill, fry"],["しっぱい","失敗","failure"],["おもったより","思ったより","more than I expected"],["じぶん","自分","oneself"]]},

{ id:"r-matsuri", level:2, title:"なつまつり", titleEn:"Summer festival", ic:"🎆",
  pages:[
    {ic:"🎐", s:"八{はち}月{がつ}の 夜{よる}、町{まち}で 夏{なつ}祭{まつ}りが ありました。とても 暑{あつ}かったです。", en:"On an August night there was a summer festival in town. It was very hot."},
    {ic:"👘", s:"友{とも}だちは 浴{ゆ}衣{かた}を 着{き}ていました。わたしは Tシャツでした。", en:"My friend was wearing a yukata. I was in a T-shirt."},
    {ic:"🏮", s:"道{みち}に 赤{あか}い ちょうちんが たくさん ならんでいました。", en:"Red lanterns were lined up along the road."},
    {ic:"🍢", s:"焼{や}きそば、たこ焼{や}き、かき氷{ごおり}。どれも 食{た}べたいです。", en:"Yakisoba, takoyaki, shaved ice. I want to eat all of it."},
    {ic:"🎣", s:"金{きん}魚{ぎょ}すくいを やりました。一{いっ}匹{ぴき}も とれませんでした。", en:"I tried goldfish scooping. I didn't catch a single one."},
    {ic:"🥁", s:"太{たい}鼓{こ}の 音{おと}が 聞{き}こえました。おなかに ひびきます。", en:"I could hear the taiko drums. You feel it in your stomach."},
    {ic:"🎆", s:"九{く}時{じ}に 花{はな}火{び}が 始{はじ}まりました。みんな 空{そら}を 見{み}ました。", en:"At nine the fireworks began. Everyone looked up at the sky."},
    {ic:"🤫", s:"だれも 話{はな}しませんでした。とても しずかでした。", en:"No one spoke. It was very quiet."},
    {ic:"🌙", s:"帰{かえ}り道{みち}、友{とも}だちが 「また 来{らい}年{ねん}も 来{こ}ようね」と 言{い}いました。", en:"On the way home my friend said, \"Let's come again next year.\""}
  ],
  gloss:[["まつり","祭り","festival"],["ゆかた","浴衣","summer kimono"],["ならぶ","並ぶ","to line up"],["きこえる","聞こえる","to be audible"],["はなび","花火","fireworks"],["かえりみち","帰り道","the way home"]]},

{ id:"r-inu", level:2, title:"まいごの いぬ", titleEn:"The lost dog", ic:"🐕",
  pages:[
    {ic:"🌧️", s:"雨{あめ}の 夕{ゆう}方{がた}、駅{えき}の 前{まえ}に 小{ちい}さい 犬{いぬ}が いました。", en:"On a rainy evening there was a small dog in front of the station."},
    {ic:"🐕", s:"首{くび}に 赤{あか}い ひもが ありましたが、人{ひと}は いませんでした。", en:"It had a red lead on its neck, but there was no one with it."},
    {ic:"🤔", s:"まいごかもしれません。わたしは どうしたら いいか 分{わ}かりませんでした。", en:"It might be lost. I didn't know what I should do."},
    {ic:"👮", s:"交{こう}番{ばん}に 連{つ}れて 行{い}きました。おまわりさんが 「よく 来{き}ましたね」と 言{い}いました。", en:"I took it to the police box. The officer said, \"Good that you came.\""},
    {ic:"📝", s:"名{な}前{まえ}と 電{でん}話{わ}番{ばん}号{ごう}を 書{か}きました。少{すこ}し 緊{きん}張{ちょう}しました。", en:"I wrote my name and phone number. I was a little nervous."},
    {ic:"📞", s:"三{さん}十{じゅっ}分{ぷん}後{ご}、飼{か}い主{ぬし}から 電{でん}話{わ}が ありました。", en:"Thirty minutes later there was a call from the owner."},
    {ic:"🏃‍♀️", s:"おばあさんが 走{はし}って 来{き}ました。犬{いぬ}は しっぽを ふりました。", en:"An old woman came running. The dog wagged its tail."},
    {ic:"🙇", s:"「本{ほん}当{とう}に ありがとうございました」と 何{なん}回{かい}も 言{い}われました。", en:"\"Thank you so very much,\" she said to me again and again."},
    {ic:"😊", s:"日{に}本{ほん}語{ご}は まだ 下{へ}手{た}です。でも、その 日{ひ}は 役{やく}に 立{た}ちました。", en:"My Japanese is still poor. But that day, it was useful."}
  ],
  gloss:[["まいご","迷子","lost child/pet"],["くび","首","neck"],["つれていく","連れて行く","to take (someone) along"],["こうばん","交番","police box"],["かいぬし","飼い主","pet owner"],["やくにたつ","役に立つ","to be useful"]]},

/* ---------------- level 3 ---------------- */
{ id:"r-ramen", level:3, title:"はじめての ラーメンや", titleEn:"First time at a ramen shop", ic:"🍜",
  pages:[
    {ic:"🚪", s:"店{みせ}の 前{まえ}に 券{けん}売{ばい}機{き}が ありました。日{に}本{ほん}語{ご}ばかりで、写{しゃ}真{しん}は ありません。うしろに 人{ひと}が ならんでいます。", en:"There was a ticket machine in front of the shop. All Japanese, no photos. People were lining up behind me."},
    {ic:"😰", s:"急{いそ}がなければ なりません。でも、どのボタンか 分{わ}かりません。", en:"I had to hurry. But I couldn't tell which button it was."},
    {ic:"👆", s:"いちばん 上{うえ}の 左{ひだり}が 基{き}本{ほん}の ラーメンだと 聞{き}いたことが あります。押{お}してみました。", en:"I'd heard that the top left is the basic ramen. I tried pressing it."},
    {ic:"🎫", s:"食{しょっ}券{けん}が 出{で}ました。店{てん}員{いん}さんに わたすと、「お好{この}みは?」と 聞{き}かれました。", en:"A meal ticket came out. When I handed it to the staff, I was asked \"How would you like it?\""},
    {ic:"❓", s:"「すみません、もう 一{いち}度{ど} お願{ねが}いします。」ゆっくり 言{い}ってくれました。麺{めん}の かたさの ことでした。", en:"\"Sorry, once more please.\" They said it slowly for me. It was about the firmness of the noodles."},
    {ic:"👌", s:"「ふつうで お願{ねが}いします。」と 答{こた}えました。通{つう}じました!", en:"\"Normal, please,\" I answered. It got through!"},
    {ic:"🍜", s:"五{ご}分{ふん}で ラーメンが 来{き}ました。スープは 思{おも}ったより こいです。", en:"The ramen came in five minutes. The soup is richer than I expected."},
    {ic:"🥢", s:"となりの おじさんは 三{さん}分{ぷん}で 食{た}べ終{お}わって、出{で}て 行{い}きました。速{はや}すぎます。", en:"The man next to me finished in three minutes and left. Way too fast."},
    {ic:"😋", s:"わたしは 十{じゅっ}分{ぷん}かかりました。スープも ぜんぶ 飲{の}みました。", en:"It took me ten minutes. I drank all the soup too."},
    {ic:"🙏", s:"出{で}るとき、「ごちそうさまでした」と 言{い}いました。店{てん}員{いん}さんが 笑{わら}って くれました。", en:"On the way out I said \"thank you for the meal.\" The staff smiled at me."},
    {ic:"💭", s:"次{つぎ}は、こわくないと 思{おも}います。", en:"Next time, I don't think I'll be scared."}
  ],
  gloss:[["けんばいき","券売機","ticket vending machine"],["ならぶ","並ぶ","to queue"],["しょっけん","食券","meal ticket"],["このみ","好み","preference"],["かたさ","硬さ","firmness"],["つうじる","通じる","to get through, be understood"],["こい","濃い","rich, strong"]]},

{ id:"r-denwa", level:3, title:"でんわが こわい", titleEn:"Phone calls are scary", ic:"📞",
  pages:[
    {ic:"📱", s:"日{に}本{ほん}語{ご}で いちばん こわいのは 電{でん}話{わ}です。相{あい}手{て}の 顔{かお}が 見{み}えないからです。", en:"The scariest thing in Japanese is the phone. Because you can't see the other person's face."},
    {ic:"🏥", s:"きのう、病{びょう}院{いん}に 予{よ}約{やく}の 電{でん}話{わ}を しました。三{さん}回{かい} 練{れん}習{しゅう}してから かけました。", en:"Yesterday I called the clinic to make an appointment. I practiced three times before calling."},
    {ic:"🗣️", s:"「もしもし、予{よ}約{やく}を お願{ねが}いしたいんですが。」ここまでは 完{かん}ぺきでした。", en:"\"Hello, I'd like to make an appointment.\" Up to here it was perfect."},
    {ic:"💨", s:"そのあと、相{あい}手{て}の 人{ひと}が とても 速{はや}く 話{はな}しました。半{はん}分{ぶん}しか 分{わ}かりません。", en:"After that, the person spoke very fast. I only understood half."},
    {ic:"😅", s:"「すみません、日{に}本{ほん}語{ご}が あまり 上{じょう}手{ず}じゃないので、ゆっくり お願{ねが}いできますか。」", en:"\"I'm sorry, my Japanese isn't very good, so could you speak slowly?\""},
    {ic:"🐢", s:"その 一{ひと}言{こと}で ぜんぶ 変{か}わりました。ゆっくり、はっきり 話{はな}して くれました。", en:"That one sentence changed everything. They spoke slowly and clearly for me."},
    {ic:"📅", s:"「では、木{もく}曜{よう}日{び}の 三{さん}時{じ}で よろしいですか。」「はい、大{だい}丈{じょう}夫{ぶ}です。」", en:"\"Then, is Thursday at three all right?\" \"Yes, that's fine.\""},
    {ic:"✅", s:"名{な}前{まえ}を 二{に}回{かい} 聞{き}かれました。外{がい}国{こく}の 名{な}前{まえ}は むずかしいですから。", en:"They asked my name twice. Because foreign names are difficult."},
    {ic:"😮‍💨", s:"電{でん}話{わ}を 切{き}ったあと、少{すこ}し 手{て}が ふるえていました。でも、できました。", en:"After hanging up, my hands were shaking a little. But I did it."},
    {ic:"💪", s:"できないことを 一{ひと}つずつ 減{へ}らしていく。それだけです。", en:"Reduce the things you can't do, one at a time. That's all it is."}
  ],
  gloss:[["あいて","相手","the other party"],["れんしゅう","練習","practice"],["かんぺき","完璧","perfect"],["はっきり","","clearly"],["ふるえる","震える","to tremble"],["へらす","減らす","to reduce"]]},

{ id:"r-jitensha", level:3, title:"じてんしゃが ない", titleEn:"My bike is gone", ic:"🚲",
  pages:[
    {ic:"🚲", s:"駅{えき}の 近{ちか}くに 自{じ}転{てん}車{しゃ}を とめました。十{じゅう}分{ぷん}だけの つもりでした。", en:"I parked my bike near the station. I only meant to be ten minutes."},
    {ic:"❓", s:"帰{かえ}ってきたら、自{じ}転{てん}車{しゃ}が ありませんでした。ぬすまれたと 思{おも}いました。", en:"When I came back, the bike wasn't there. I thought it had been stolen."},
    {ic:"📄", s:"でも、地{じ}面{めん}に 紙{かみ}が はってありました。「放{ほう}置{ち}自{じ}転{てん}車{しゃ}」と 書{か}いてあります。", en:"But there was a paper stuck to the ground. It said \"abandoned bicycle.\""},
    {ic:"🚛", s:"市{し}が 持{も}って 行{い}ったのです。ぬすまれたのでは ありませんでした。", en:"The city had taken it. It hadn't been stolen."},
    {ic:"🗺️", s:"紙{かみ}に 住{じゅう}所{しょ}と 地{ち}図{ず}が ありました。バスで 二{に}十{じゅっ}分{ぷん}の ところです。", en:"The paper had an address and a map. It's twenty minutes by bus."},
    {ic:"💴", s:"「三{さん}千{ぜん}円{えん}です」と 言{い}われました。高{たか}いですが、しかたが ありません。", en:"\"That'll be 3,000 yen,\" I was told. It's expensive, but there's nothing to be done."},
    {ic:"🧑‍💼", s:"係{かかり}の 人{ひと}が 「ここは だめですよ。白{しろ}い 線{せん}の 中{なか}に とめてください」と 教{おし}えて くれました。", en:"The staff member told me, \"You can't park there. Please park inside the white lines.\""},
    {ic:"🙇", s:"「知{し}りませんでした。すみません。」と 言{い}いました。おこられませんでした。", en:"\"I didn't know. I'm sorry,\" I said. I didn't get scolded."},
    {ic:"🚲", s:"帰{かえ}り、自{じ}転{てん}車{しゃ}で 走{はし}りながら 考{かんが}えました。ルールを 知{し}らないと、高{たか}いです。", en:"On the way home, riding along, I thought: not knowing the rules is expensive."}
  ],
  gloss:[["とめる","止める","to park"],["ぬすむ","盗む","to steal"],["ほうち","放置","abandonment"],["し","市","city (government)"],["しかたがない","仕方がない","it can't be helped"],["かかりのひと","係の人","the person in charge"]]},

/* ---------------- level 4 ---------------- */
{ id:"r-intern", level:4, title:"インターンに おうぼする", titleEn:"Applying for the internship", ic:"📨",
  pages:[
    {ic:"💻", s:"夏{なつ}に 日{に}本{ほん}で インターンシップを したいと ずっと 思{おも}っていました。でも、日{に}本{ほん}語{ご}が 足{た}りないので、なかなか 応{おう}募{ぼ}できませんでした。", en:"I'd been thinking for a long time that I wanted to do an internship in Japan over the summer. But my Japanese wasn't enough, so I couldn't quite bring myself to apply."},
    {ic:"📋", s:"募{ぼ}集{しゅう}の ページには 「日{に}本{ほん}語{ご}能{のう}力{りょく}試{し}験{けん}N4以{い}上{じょう}が 望{のぞ}ましい」と 書{か}いてありました。「必{ひつ}要{よう}」ではなく 「望{のぞ}ましい」です。", en:"The listing said \"JLPT N4 or above is desirable.\" Not \"required\" — \"desirable.\""},
    {ic:"🤔", s:"その 二{ふた}つの 言{こと}葉{ば}の ちがいを 辞{じ}書{しょ}で 調{しら}べました。つまり、だめとは 書{か}いていないということです。", en:"I looked up the difference between those two words in a dictionary. Which is to say: it doesn't say I can't."},
    {ic:"✍️", s:"志{し}望{ぼう}動{どう}機{き}を 書{か}くのに 三{さん}日{か} かかりました。英{えい}語{ご}で 書{か}いてから、日{に}本{ほん}語{ご}に しました。", en:"It took me three days to write the statement of motivation. I wrote it in English first, then put it into Japanese."},
    {ic:"🔁", s:"最{さい}初{しょ}の 文{ぶん}は 長{なが}すぎました。短{みじか}く すると、言{い}いたいことが はっきり しました。", en:"My first draft was too long. When I made it shorter, what I wanted to say became clear."},
    {ic:"🗣️", s:"「日{に}本{ほん}語{ご}は まだ 勉{べん}強{きょう}中{ちゅう}ですが、毎{まい}日{にち}続{つづ}けています」と 正{しょう}直{じき}に 書{か}きました。うそを 書{か}いても、面{めん}接{せつ}で すぐ 分{わ}かります。", en:"I honestly wrote, \"My Japanese is still in progress, but I keep at it every day.\" If I'd written a lie, it would show immediately in the interview."},
    {ic:"📤", s:"送{おく}るボタンを 押{お}すまでに 十{じゅっ}分{ぷん} かかりました。押{お}したあとは、何{なに}も 変{か}わりませんでした。", en:"It took ten minutes to press the send button. After I pressed it, nothing had changed."},
    {ic:"⏳", s:"返{へん}事{じ}は 二{に}週{しゅう}間{かん}後{ご}に 来{く}るそうです。その 間{あいだ}に、面{めん}接{せつ}の 練{れん}習{しゅう}を しておこうと 思{おも}います。", en:"Apparently the reply comes in two weeks. In the meantime, I think I'll get some interview practice in."},
    {ic:"🌱", s:"だめだったら、また 来{らい}年{ねん} 出{だ}せば いいです。応{おう}募{ぼ}しなければ、可{か}能{のう}性{せい}は ゼロですから。", en:"If it doesn't work out, I can just submit again next year. Because if you don't apply, the chance is zero."}
  ],
  gloss:[["おうぼ","応募","application"],["のぞましい","望ましい","desirable"],["しぼうどうき","志望動機","statement of motivation"],["しょうじき","正直","honest"],["つづける","続ける","to continue"],["かのうせい","可能性","possibility"]]},

{ id:"r-server", level:4, title:"サーバーが おちた ばん", titleEn:"The night the server went down", ic:"🖥️",
  pages:[
    {ic:"🌙", s:"夜{よる}の 十{じゅう}一{いち}時{じ}、電{でん}話{わ}が 鳴{な}りました。研{けん}究{きゅう}室{しつ}の サーバーが 落{お}ちたそうです。", en:"At eleven at night, the phone rang. Apparently the lab's server had gone down."},
    {ic:"🚴", s:"自{じ}転{てん}車{しゃ}で 大{だい}学{がく}まで 行{い}きました。夜{よる}の キャンパスは 静{しず}かで、少{すこ}し こわかったです。", en:"I went to the university by bike. The campus at night was quiet, and a little frightening."},
    {ic:"🔑", s:"サーバー室{しつ}は 寒{さむ}いです。いつも セーターを 持{も}っていくように しています。", en:"The server room is cold. I make a point of always bringing a sweater."},
    {ic:"📊", s:"ログを 見{み}ると、二{に}時{じ}間{かん}前{まえ}から 同{おな}じ エラーが 何{なん}百{びゃく}回{かい}も 出{で}ていました。", en:"Looking at the logs, the same error had appeared hundreds of times starting two hours earlier."},
    {ic:"💾", s:"ディスクが いっぱいでした。原{げん}因{いん}は 大{おお}きい ログファイルでした。よくある ことです。", en:"The disk was full. The cause was a huge log file. It happens all the time."},
    {ic:"🧹", s:"古{ふる}い ファイルを 消{け}して、サービスを 再{さい}起{き}動{どう}しました。三{さん}分{ぷん}で 直{なお}りました。", en:"I deleted the old files and restarted the service. It was fixed in three minutes."},
    {ic:"📝", s:"次{つぎ}の 人{ひと}の ために、何{なに}を したか メモに 書{か}いておきました。日{に}本{ほん}語{ご}でも 書{か}いてみました。", en:"For the sake of whoever comes next, I wrote down what I did in a note. I tried writing it in Japanese too."},
    {ic:"🌏", s:"いつか 日{に}本{ほん}の 会{かい}社{しゃ}で 同{おな}じ 仕{し}事{ごと}を するかもしれません。そのとき、この メモが 役{やく}に 立{た}つと 思{おも}います。", en:"Someday I might do the same job at a Japanese company. When that time comes, I think this note will be useful."},
    {ic:"☕", s:"帰{かえ}ったのは 一{いち}時{じ}半{はん}でした。つかれましたが、いやな 気{き}分{ぶん}では ありませんでした。", en:"I got home at one thirty. I was tired, but it wasn't a bad feeling."}
  ],
  gloss:[["なる","鳴る","to ring"],["おちる","落ちる","to go down, fall"],["げんいん","原因","cause"],["けす","消す","to delete, erase"],["さいきどう","再起動","reboot"],["なおる","直る","to be fixed"],["きぶん","気分","mood, feeling"]]}
];


const READERS_B = [

/* ============================ LEVEL 0 ============================ */
{ id:"r-inu2", level:0, title:"いぬ", titleEn:"Dog", ic:"🐕",
  pages:[
    {ic:"🐕", s:"いぬ。", en:"A dog."},
    {ic:"🐕", s:"いぬが いる。", en:"There is a dog."},
    {ic:"🟤🐕", s:"ちゃいろい いぬ。", en:"A brown dog."},
    {ic:"⬜🐕", s:"しろい いぬ。", en:"A white dog."},
    {ic:"🐕🐕", s:"いぬが 二{に}ひき。", en:"Two dogs."},
    {ic:"🏃🐕", s:"いぬが はしる。", en:"The dog runs."},
    {ic:"🦴🐕", s:"いぬが たべる。", en:"The dog eats."},
    {ic:"💧🐕", s:"いぬが のむ。", en:"The dog drinks."},
    {ic:"😴🐕", s:"いぬが ねる。", en:"The dog sleeps."},
    {ic:"🐕🐈", s:"いぬと ねこ。", en:"A dog and a cat."},
    {ic:"❤️🐕", s:"いぬが すき。", en:"I like dogs."}
  ],
  gloss:[["いぬ","犬","dog"],["ちゃいろい","茶色い","brown"],["はしる","走る","to run"],["のむ","飲む","to drink"]]},

{ id:"r-kazu", level:0, title:"かず", titleEn:"Numbers", ic:"🔢",
  pages:[
    {ic:"1️⃣🍎", s:"りんごが ひとつ。", en:"One apple."},
    {ic:"2️⃣🍎", s:"りんごが ふたつ。", en:"Two apples."},
    {ic:"3️⃣🍎", s:"りんごが みっつ。", en:"Three apples."},
    {ic:"4️⃣🍊", s:"みかんが よっつ。", en:"Four mandarins."},
    {ic:"5️⃣🍊", s:"みかんが いつつ。", en:"Five mandarins."},
    {ic:"🐈🐈", s:"ねこが 二{に}ひき。", en:"Two cats."},
    {ic:"👥", s:"ひとが 三{さん}にん。", en:"Three people."},
    {ic:"📚", s:"ほんが 二{に}さつ。", en:"Two books."},
    {ic:"🖊️", s:"ペンが 三{さん}ぼん。", en:"Three pens."},
    {ic:"❓", s:"いくつ ありますか。", en:"How many are there?"},
    {ic:"🔟", s:"とお! ぜんぶで とお。", en:"Ten! Ten altogether."}
  ],
  gloss:[["ひとつ","一つ","one thing"],["いくつ","","how many"],["ぜんぶ","全部","all, altogether"]]},

{ id:"r-kazoku0", level:0, title:"かぞく", titleEn:"Family", ic:"👨‍👩‍👧",
  pages:[
    {ic:"👨", s:"おとうさん。", en:"Dad."},
    {ic:"👩", s:"おかあさん。", en:"Mum."},
    {ic:"👦", s:"おにいさん。", en:"Big brother."},
    {ic:"👧", s:"おねえさん。", en:"Big sister."},
    {ic:"👴", s:"おじいさん。", en:"Grandpa."},
    {ic:"👵", s:"おばあさん。", en:"Grandma."},
    {ic:"👨‍👩‍👧", s:"みんな いる。", en:"Everyone's here."},
    {ic:"🍚", s:"みんなで たべる。", en:"We eat together."},
    {ic:"😊", s:"たのしい。", en:"It's fun."},
    {ic:"🌙", s:"おやすみなさい。", en:"Goodnight."}
  ],
  gloss:[["みんな","","everyone"],["たのしい","楽しい","fun"]]},

{ id:"r-karada", level:0, title:"からだ", titleEn:"Body", ic:"🧍",
  pages:[
    {ic:"👁️", s:"め。", en:"Eyes."},
    {ic:"👂", s:"みみ。", en:"Ears."},
    {ic:"👄", s:"くち。", en:"A mouth."},
    {ic:"👃", s:"はな。", en:"A nose."},
    {ic:"✋", s:"て。", en:"A hand."},
    {ic:"🦶", s:"あし。", en:"A foot."},
    {ic:"👀", s:"めで みる。", en:"I see with my eyes."},
    {ic:"👂🎵", s:"みみで きく。", en:"I hear with my ears."},
    {ic:"👄🗣️", s:"くちで はなす。", en:"I speak with my mouth."},
    {ic:"✋✍️", s:"てで かく。", en:"I write with my hand."},
    {ic:"🏃", s:"あしで はしる。", en:"I run with my feet."}
  ],
  gloss:[["め","目","eye"],["みみ","耳","ear"],["くち","口","mouth"],["て","手","hand"],["あし","足","foot, leg"]]},

{ id:"r-tenki0", level:0, title:"きょうの てんき", titleEn:"Today's Weather", ic:"🌤️",
  pages:[
    {ic:"☀️", s:"はれ。", en:"Sunny."},
    {ic:"☀️", s:"きょうは はれです。", en:"Today is sunny."},
    {ic:"☁️", s:"くもり。", en:"Cloudy."},
    {ic:"🌧️", s:"あめ。", en:"Rain."},
    {ic:"🌧️", s:"あめが ふる。", en:"It rains."},
    {ic:"☂️", s:"かさが いる。", en:"I need an umbrella."},
    {ic:"❄️", s:"ゆき。", en:"Snow."},
    {ic:"🥶", s:"さむい!", en:"Cold!"},
    {ic:"🥵", s:"あつい!", en:"Hot!"},
    {ic:"🌈", s:"にじが でた。", en:"A rainbow came out."},
    {ic:"😊", s:"いい てんきですね。", en:"Nice weather, isn't it."}
  ],
  gloss:[["はれ","晴れ","clear weather"],["くもり","曇り","cloudy"],["かさ","傘","umbrella"],["にじ","虹","rainbow"]]},

{ id:"r-asagohan", level:0, title:"あさごはん", titleEn:"Breakfast", ic:"🍳",
  pages:[
    {ic:"🌅", s:"あさ。", en:"Morning."},
    {ic:"🙋", s:"おきる。", en:"I get up."},
    {ic:"🍚", s:"ごはんを たべる。", en:"I eat rice."},
    {ic:"🥚", s:"たまごも たべる。", en:"I eat an egg too."},
    {ic:"🐟", s:"さかなも たべる。", en:"I eat fish too."},
    {ic:"🍵", s:"おちゃを のむ。", en:"I drink tea."},
    {ic:"😋", s:"おいしい!", en:"Delicious!"},
    {ic:"🙏", s:"ごちそうさま。", en:"Thanks for the meal."},
    {ic:"🎒", s:"がっこうへ いく。", en:"I go to school."},
    {ic:"👋", s:"いってきます!", en:"I'm off!"}
  ],
  gloss:[["あさ","朝","morning"],["おきる","起きる","to get up"],["たまご","卵","egg"],["おちゃ","お茶","tea"]]},

{ id:"r-doubutsuen", level:0, title:"どうぶつえん", titleEn:"The Zoo", ic:"🦁",
  pages:[
    {ic:"🦁", s:"どうぶつえんへ いく。", en:"I go to the zoo."},
    {ic:"🐘", s:"ぞうが いる。", en:"There's an elephant."},
    {ic:"🐘", s:"ぞうは おおきい。", en:"The elephant is big."},
    {ic:"🐰", s:"うさぎが いる。", en:"There's a rabbit."},
    {ic:"🐰", s:"うさぎは ちいさい。", en:"The rabbit is small."},
    {ic:"🐒", s:"さるが たべる。", en:"The monkey is eating."},
    {ic:"🦁", s:"ライオンが ねる。", en:"The lion is sleeping."},
    {ic:"🐧", s:"ペンギンが およぐ。", en:"The penguin swims."},
    {ic:"📸", s:"しゃしんを とる。", en:"I take a photo."},
    {ic:"😄", s:"たのしかった!", en:"That was fun!"}
  ],
  gloss:[["どうぶつえん","動物園","zoo"],["ぞう","象","elephant"],["さる","猿","monkey"],["しゃしん","写真","photo"]]},

{ id:"r-nanji", level:0, title:"なんじ?", titleEn:"What Time?", ic:"🕐",
  pages:[
    {ic:"🕕", s:"ろくじ。", en:"Six o'clock."},
    {ic:"🙋", s:"ろくじに おきる。", en:"I get up at six."},
    {ic:"🕖", s:"しちじ。", en:"Seven o'clock."},
    {ic:"🍞", s:"しちじに たべる。", en:"I eat at seven."},
    {ic:"🕗", s:"はちじ。", en:"Eight o'clock."},
    {ic:"🏫", s:"はちじに いく。", en:"I go at eight."},
    {ic:"🕛", s:"じゅうにじ。", en:"Twelve o'clock."},
    {ic:"🍱", s:"ひるごはん!", en:"Lunch!"},
    {ic:"🕕", s:"ろくじに かえる。", en:"I come home at six."},
    {ic:"🕘", s:"くじに ねる。", en:"I sleep at nine."},
    {ic:"❓", s:"いま なんじですか。", en:"What time is it now?"}
  ],
  gloss:[["なんじ","何時","what time"],["ひるごはん","昼ご飯","lunch"],["いま","今","now"]]},

{ id:"r-suki", level:0, title:"すきな もの", titleEn:"Things I Like", ic:"❤️",
  pages:[
    {ic:"🍜", s:"ラーメンが すき。", en:"I like ramen."},
    {ic:"🍣", s:"すしも すき。", en:"I like sushi too."},
    {ic:"🍰", s:"ケーキが だいすき!", en:"I love cake!"},
    {ic:"🥦", s:"やさいは あまり…", en:"Vegetables, not so much…"},
    {ic:"🎮", s:"ゲームが すき。", en:"I like games."},
    {ic:"📚", s:"ほんも すき。", en:"I like books too."},
    {ic:"🎵", s:"おんがくが すき。", en:"I like music."},
    {ic:"🐈", s:"ねこが だいすき。", en:"I love cats."},
    {ic:"☔", s:"あめは すきじゃない。", en:"I don't like rain."},
    {ic:"❓", s:"なにが すきですか。", en:"What do you like?"}
  ],
  gloss:[["すき","好き","liked"],["だいすき","大好き","loved"],["あまり","","not much (with a negative)"],["やさい","野菜","vegetables"]]},

/* ============================ LEVEL 1 ============================ */
{ id:"r-gakko", level:1, title:"がっこうの 一{いち}日{にち}", titleEn:"A Day at School", ic:"🏫",
  pages:[
    {ic:"🌅", s:"七{しち}時{じ}に 起{お}きます。", en:"I get up at seven."},
    {ic:"🎒", s:"かばんを 持{も}って、家{いえ}を 出{で}ます。", en:"I take my bag and leave the house."},
    {ic:"🚌", s:"バスで 学{がっ}校{こう}へ 行{い}きます。", en:"I go to school by bus."},
    {ic:"🏫", s:"八{はち}時{じ}半{はん}に 着{つ}きます。", en:"I arrive at eight thirty."},
    {ic:"📖", s:"一{いち}時{じ}間{かん}目{め}は 日{に}本{ほん}語{ご}です。", en:"First period is Japanese."},
    {ic:"✍️", s:"漢{かん}字{じ}を 十{じゅう}個{こ} 書{か}きます。", en:"I write ten kanji."},
    {ic:"🍱", s:"十{じゅう}二{に}時{じ}に お弁{べん}当{とう}を 食{た}べます。", en:"I eat my bento at twelve."},
    {ic:"⚽", s:"昼{ひる}休{やす}みに サッカーを します。", en:"I play football at lunch break."},
    {ic:"🧹", s:"みんなで 教{きょう}室{しつ}を 掃{そう}除{じ}します。", en:"Everyone cleans the classroom together."},
    {ic:"👋", s:"四{よ}時{じ}に 帰{かえ}ります。", en:"I go home at four."},
    {ic:"😊", s:"今{きょ}日{う}も いい 一{いち}日{にち}でした。", en:"Today was a good day too."}
  ],
  gloss:[["じかんめ","時間目","period (class)"],["おべんとう","お弁当","packed lunch"],["ひるやすみ","昼休み","lunch break"],["そうじ","掃除","cleaning"]]},

{ id:"r-kaimono", level:1, title:"スーパーで", titleEn:"At the Supermarket", ic:"🛒",
  pages:[
    {ic:"🛒", s:"スーパーへ 行{い}きます。", en:"I'm going to the supermarket."},
    {ic:"📝", s:"メモを 持{も}っています。", en:"I have a list."},
    {ic:"🥛", s:"牛{ぎゅう}乳{にゅう}を 一{いっ}本{ぽん} 買{か}います。", en:"I buy one bottle of milk."},
    {ic:"🥚", s:"卵{たまご}も 買{か}います。", en:"I buy eggs too."},
    {ic:"🍎", s:"りんごは 三{みっ}つで 三{さん}百{びゃく}円{えん}です。", en:"Apples are three for three hundred yen."},
    {ic:"🐟", s:"魚{さかな}は 少{すこ}し 高{たか}いです。", en:"The fish is a little expensive."},
    {ic:"🥦", s:"野{や}菜{さい}は 安{やす}いです。", en:"The vegetables are cheap."},
    {ic:"💳", s:"カードで 払{はら}います。", en:"I pay by card."},
    {ic:"🛍️", s:"袋{ふくろ}は 要{い}りません。", en:"I don't need a bag."},
    {ic:"🏠", s:"家{いえ}へ 帰{かえ}ります。", en:"I head home."}
  ],
  gloss:[["メモ","","note, list"],["ぎゅうにゅう","牛乳","milk"],["ふくろ","袋","bag"],["いる","要る","to need"]]},

{ id:"r-heya", level:1, title:"わたしの 部{へ}屋{や}", titleEn:"My Room", ic:"🛏️",
  pages:[
    {ic:"🚪", s:"これは わたしの 部{へ}屋{や}です。", en:"This is my room."},
    {ic:"🛏️", s:"ベッドが あります。", en:"There's a bed."},
    {ic:"🪑", s:"机{つくえ}と 椅{い}子{す}も あります。", en:"There's a desk and a chair too."},
    {ic:"📚", s:"机{つくえ}の 上{うえ}に 本{ほん}が 五{ご}冊{さつ} あります。", en:"There are five books on the desk."},
    {ic:"🪟", s:"窓{まど}の そばに 花{はな}が あります。", en:"There are flowers by the window."},
    {ic:"💻", s:"パソコンで 勉{べん}強{きょう}します。", en:"I study on my computer."},
    {ic:"🎸", s:"ギターは 壁{かべ}の 前{まえ}です。", en:"The guitar is in front of the wall."},
    {ic:"🐈", s:"猫{ねこ}は いつも ベッドの 上{うえ}です。", en:"The cat is always on the bed."},
    {ic:"🧹", s:"日{にち}曜{よう}日{び}に 掃{そう}除{じ}します。", en:"I clean on Sundays."},
    {ic:"😊", s:"小{ちい}さいですが、好{す}きな 部{へ}屋{や}です。", en:"It's small, but it's a room I like."}
  ],
  gloss:[["へや","部屋","room"],["そば","","beside, near"],["かべ","壁","wall"],["いつも","","always"]]},

{ id:"r-yuubinkyoku", level:1, title:"ゆうびんきょくへ", titleEn:"To the Post Office", ic:"📮",
  pages:[
    {ic:"✉️", s:"手{て}紙{がみ}を 出{だ}したいです。", en:"I want to send a letter."},
    {ic:"🗺️", s:"郵{ゆう}便{びん}局{きょく}は どこですか。", en:"Where is the post office?"},
    {ic:"👉", s:"駅{えき}の 前{まえ}に あります。", en:"It's in front of the station."},
    {ic:"🚶", s:"歩{ある}いて 五{ご}分{ふん}です。", en:"It's five minutes on foot."},
    {ic:"📮", s:"切{き}手{って}を 二{に}枚{まい} ください。", en:"Two stamps, please."},
    {ic:"💴", s:"百{ひゃく}八{はち}十{じゅう}円{えん}です。", en:"That's one hundred eighty yen."},
    {ic:"✍️", s:"住{じゅう}所{しょ}を 書{か}きます。", en:"I write the address."},
    {ic:"📦", s:"小{こ}包{づつみ}も 送{おく}ります。", en:"I send a parcel too."},
    {ic:"⏳", s:"三{みっ}日{か}ぐらい かかります。", en:"It takes about three days."},
    {ic:"🙏", s:"ありがとうございました。", en:"Thank you very much."}
  ],
  gloss:[["てがみ","手紙","letter"],["ゆうびんきょく","郵便局","post office"],["きって","切手","stamp"],["じゅうしょ","住所","address"],["こづつみ","小包","parcel"]]},

/* ============================ LEVEL 2 ============================ */
{ id:"r-hikkoshi", level:2, title:"ひっこしの 日{ひ}", titleEn:"Moving Day", ic:"📦",
  pages:[
    {ic:"📦", s:"今{きょ}日{う}は 引{ひ}っ越{こ}しの 日{ひ}です。朝{あさ}から 荷{に}物{もつ}を 運{はこ}びました。", en:"Today is moving day. I've been carrying boxes since morning."},
    {ic:"😅", s:"本{ほん}が 多{おお}すぎて、箱{はこ}が 十{じゅっ}個{こ}に なりました。", en:"I had too many books — it came to ten boxes."},
    {ic:"🚚", s:"友{とも}だちが 車{くるま}で 手{て}伝{つだ}って くれました。", en:"A friend helped me out with his car."},
    {ic:"🏠", s:"新{あたら}しい 部{へ}屋{や}は 前{まえ}より 広{ひろ}いです。", en:"The new room is bigger than the last one."},
    {ic:"🪟", s:"窓{まど}が 大{おお}きくて、明{あか}るいです。", en:"The window is large, so it's bright."},
    {ic:"🧹", s:"まず 掃{そう}除{じ}を してから、荷{に}物{もつ}を 開{あ}けました。", en:"First I cleaned, and then I opened the boxes."},
    {ic:"🍕", s:"夜{よる}、みんなで ピザを 食{た}べました。", en:"In the evening we all ate pizza."},
    {ic:"😴", s:"疲{つか}れましたが、気{き}分{ぶん}は いいです。", en:"I'm tired, but I feel good."},
    {ic:"🌙", s:"新{あたら}しい 生{せい}活{かつ}が 始{はじ}まります。", en:"A new life is starting."}
  ],
  gloss:[["ひっこし","引っ越し","moving house"],["にもつ","荷物","luggage, boxes"],["てつだう","手伝う","to help"],["つかれる","疲れる","to get tired"],["せいかつ","生活","daily life"]]},

{ id:"r-byouin", level:2, title:"かぜを ひいた", titleEn:"I Caught a Cold", ic:"🤒",
  pages:[
    {ic:"🤒", s:"朝{あさ} 起{お}きたら、頭{あたま}が 痛{いた}かったです。", en:"When I got up this morning, my head hurt."},
    {ic:"🌡️", s:"熱{ねつ}を 測{はか}ったら、三{さん}十{じゅう}八{はち}度{ど}でした。", en:"I took my temperature and it was thirty-eight degrees."},
    {ic:"🏥", s:"授{じゅ}業{ぎょう}を 休{やす}んで、病{びょう}院{いん}へ 行{い}きました。", en:"I skipped class and went to the clinic."},
    {ic:"👩‍⚕️", s:"先{せん}生{せい}は「風{か}邪{ぜ}ですね」と 言{い}いました。", en:"The doctor said, \"It's a cold.\""},
    {ic:"💊", s:"薬{くすり}を もらって、家{いえ}に 帰{かえ}りました。", en:"I got some medicine and went home."},
    {ic:"🛏️", s:"一{いち}日{にち}中{じゅう} 寝{ね}ていました。", en:"I was in bed all day."},
    {ic:"🍲", s:"ルームメイトが スープを 作{つく}って くれました。", en:"My roommate made me some soup."},
    {ic:"😊", s:"次{つぎ}の 日{ひ}、少{すこ}し 良{よ}く なりました。", en:"The next day I was a little better."},
    {ic:"🙏", s:"やさしい 友{とも}だちが いて、よかったです。", en:"I'm glad I have kind friends."}
  ],
  gloss:[["かぜをひく","風邪をひく","to catch a cold"],["ねつ","熱","fever"],["はかる","測る","to measure"],["くすり","薬","medicine"],["いちにちじゅう","一日中","all day long"]]},

/* ============================ LEVEL 3 ============================ */
{ id:"r-nihongokyoushitsu", level:3, title:"はじめての 日{に}本{ほん}語{ご}教{きょう}室{しつ}", titleEn:"First Japanese Class", ic:"📖",
  pages:[
    {ic:"🚪", s:"教{きょう}室{しつ}の ドアを 開{あ}けるとき、心{しん}臓{ぞう}が どきどき していた。", en:"When I opened the classroom door, my heart was pounding."},
    {ic:"👥", s:"知{し}らない 人{ひと}ばかりで、どこに 座{すわ}れば いいか 分{わ}からなかった。", en:"It was all strangers, and I had no idea where to sit."},
    {ic:"🧑‍🏫", s:"先{せん}生{せい}が 入{はい}ってきて、日{に}本{ほん}語{ご}だけで 話{はな}し始{はじ}めた。", en:"The teacher came in and started speaking only in Japanese."},
    {ic:"😰", s:"最{さい}初{しょ}は 一{ひと}言{こと}も 分{わ}からなかった。", en:"At first I couldn't understand a single word."},
    {ic:"✍️", s:"でも、先{せん}生{せい}が 黒{こく}板{ばん}に 書{か}いてくれたので、少{すこ}しずつ 分{わ}かってきた。", en:"But the teacher wrote it on the board, so bit by bit I started to follow."},
    {ic:"🙋", s:"「お名{な}前{まえ}は?」と 聞{き}かれて、初{はじ}めて 日{に}本{ほん}語{ご}で 答{こた}えた。", en:"I was asked \"What's your name?\" and answered in Japanese for the first time."},
    {ic:"😊", s:"「上{じょう}手{ず}ですね」と 言{い}われて、うれしかった。", en:"They told me I was good at it, and I was happy."},
    {ic:"🤝", s:"隣{となり}の 人{ひと}が 話{はな}しかけて くれて、友{とも}だちに なった。", en:"The person next to me struck up a conversation, and we became friends."},
    {ic:"🚶", s:"帰{かえ}り道{みち}で、今{きょ}日{う} 習{なら}った 言{こと}葉{ば}を 何{なん}度{ど}も 言{い}ってみた。", en:"On the way home I said the words I'd learned over and over."},
    {ic:"📔", s:"難{むずか}しかったけど、また 来{らい}週{しゅう}も 行{い}きたいと 思{おも}う。", en:"It was hard, but I think I want to go again next week."}
  ],
  gloss:[["しんぞう","心臓","heart"],["どきどき","","pounding"],["ばかり","","nothing but"],["こくばん","黒板","blackboard"],["すこしずつ","少しずつ","little by little"],["となり","隣","next to"],["はなしかける","話しかける","to strike up a conversation"]]},

{ id:"r-arubaito", level:3, title:"コンビニの アルバイト", titleEn:"The Konbini Job", ic:"🏪",
  pages:[
    {ic:"🏪", s:"大{だい}学{がく}の 近{ちか}くの コンビニで 働{はたら}き始{はじ}めた。", en:"I started working at a konbini near the university."},
    {ic:"😅", s:"初{はじ}めの 日{ひ}は、レジの 使{つか}い方{かた}が 全{ぜん}然{ぜん} 分{わ}からなかった。", en:"On the first day I had no idea how to use the register."},
    {ic:"🧑‍🏫", s:"先{せん}輩{ぱい}が ゆっくり 教{おし}えて くれたので、助{たす}かった。", en:"A senior showed me slowly, which was a real help."},
    {ic:"🍱", s:"「お弁{べん}当{とう}、温{あたた}めますか」を 一{いち}日{にち}に 何{なん}十{じゅっ}回{かい}も 言{い}う。", en:"I say \"Shall I heat up your bento?\" dozens of times a day."},
    {ic:"🌃", s:"夜{よる}の シフトは 静{しず}かで、少{すこ}し 寂{さび}しい。", en:"The night shift is quiet, and a little lonely."},
    {ic:"👴", s:"毎{まい}晩{ばん} 同{おな}じ おじいさんが コーヒーを 買{か}いに 来{く}る。", en:"The same old man comes to buy coffee every night."},
    {ic:"☕", s:"ある 日{ひ}、「いつも ありがとう」と 言{い}われて、びっくりした。", en:"One day he said \"thanks, as always,\" and it took me by surprise."},
    {ic:"💬", s:"日{に}本{ほん}語{ご}が 通{つう}じると、こんなに うれしいものだと 思{おも}わなかった。", en:"I never knew it would feel this good to have my Japanese actually get through."},
    {ic:"🌅", s:"仕{し}事{ごと}は 大{たい}変{へん}だけど、続{つづ}けて よかったと 思{おも}っている。", en:"The work is tough, but I'm glad I stuck with it."}
  ],
  gloss:[["はたらく","働く","to work"],["レジ","","register, till"],["あたためる","温める","to heat up"],["シフト","","shift"],["つうじる","通じる","to get through, be understood"]]}
];



export const READERS = [...READERS_A, ...READERS_B];
export const READER_BY = Object.fromEntries(READERS.map(r => [r.id, r]));
