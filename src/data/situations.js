/* ==========================================================================
   DATA — SITUATIONS
   Every line is given at three registers so you can hear the same thought
   move up and down the politeness ladder. Pick the rung that fits the room.
     casual  — friends, siblings, people clearly younger, your own head
     polite  — the default with anyone you don't know. Start here. Always.
     keigo   — customers, clients, professors, your boss's boss, interviews
   ========================================================================== */
const REGISTER_NOTE = `Japanese doesn't have one "correct" way to say a thing — it has a ladder, and choosing the wrong rung is the mistake that actually makes people wince. Two rules carry you a long way:

1. **Default to polite (です／ます).** It is never rude. Being too casual is rude; being slightly too formal just reads as careful.
2. **Let them drop first.** When a Japanese friend switches to casual with you, you can follow. Don't lead.

Keigo splits into 尊敬語 (raising them: いらっしゃる, なさる, おっしゃる) and 謙譲語 (lowering yourself: おる, いたす, 申す). You don't need to produce much keigo to survive — but you need to *understand* it, because shop staff and phone receptionists will fire it at you at full speed.`;

export const SITUATIONS = [
  { id:"konbini", jp:"コンビニ", en:"At the convenience store", ic:"🏪",
    when:"You will do this more than any other interaction in Japan. The clerk's lines are fixed — learn to recognize them and you can run the whole exchange on autopilot.",
    lines:[
      { en:"(clerk) Welcome.", casual:"—", polite:"いらっしゃいませ。", keigo:"いらっしゃいませ。", note:"You never answer this. A small nod is plenty." },
      { en:"Just these, please.", casual:"これで。", polite:"これでお願{ねが}いします。", keigo:"こちらでお願{ねが}いいたします。" },
      { en:"(clerk) Do you want a bag?", casual:"—", polite:"袋{ふくろ}はいりますか。", keigo:"レジ袋{ぶくろ}はご利{り}用{よう}になりますか。" },
      { en:"No bag, thanks.", casual:"いい、大{だい}丈{じょう}夫{ぶ}。", polite:"大{だい}丈{じょう}夫{ぶ}です。", keigo:"結{けっ}構{こう}です。", note:"大丈夫です is the modern all-purpose polite no. 結構です can sound cold if you're not careful." },
      { en:"(clerk) Shall I warm it up?", casual:"—", polite:"温{あたた}めますか。", keigo:"温{あたた}めましょうか。" },
      { en:"Yes please.", casual:"うん、お願{ねが}い。", polite:"はい、お願{ねが}いします。", keigo:"はい、お願{ねが}いいたします。" },
      { en:"Can I pay by card?", casual:"カード使{つか}える?", polite:"カードは使{つか}えますか。", keigo:"クレジットカードはご利{り}用{よう}いただけますか。" },
      { en:"Where's the restroom?", casual:"トイレどこ?", polite:"お手{て}洗{あら}いはどこですか。", keigo:"お手{て}洗{あら}いはどちらでしょうか。" }
    ]},
  { id:"resto", jp:"レストラン", en:"Eating out", ic:"🍽️",
    when:"From the door to the bill. Note that in most places you flag the server with すみません rather than waiting to be noticed — that is normal, not rude.",
    lines:[
      { en:"Table for two.", casual:"二{ふた}人{り}。", polite:"二{ふた}人{り}です。", keigo:"二{に}名{めい}でお願{ねが}いいたします。", note:"名 (めい) is the polite counter for people in service settings." },
      { en:"Excuse me! (calling a server)", casual:"すみませーん。", polite:"すみません。", keigo:"恐{おそ}れ入{い}ります。" },
      { en:"What do you recommend?", casual:"おすすめは?", polite:"おすすめは何{なん}ですか。", keigo:"おすすめはございますか。" },
      { en:"I'll have this one.", casual:"これ。", polite:"これをお願{ねが}いします。", keigo:"こちらをいただけますか。" },
      { en:"Does this contain eggs?", casual:"これ、卵{たまご}入{はい}ってる?", polite:"これに卵{たまご}は入{はい}っていますか。", keigo:"こちらに卵{たまご}は含{ふく}まれておりますでしょうか。" },
      { en:"The bill, please.", casual:"お会{かい}計{けい}。", polite:"お会{かい}計{けい}お願{ねが}いします。", keigo:"お会{かい}計{けい}をお願{ねが}いいたします。" },
      { en:"Can we pay separately?", casual:"別{べつ}々{べつ}でいい?", polite:"別{べつ}々{べつ}にできますか。", keigo:"お会{かい}計{けい}は別{べつ}々{べつ}に承{うけたまわ}れますか。" },
      { en:"It was delicious. Thank you.", casual:"うまかった、ごちそうさま。", polite:"おいしかったです。ごちそうさまでした。", keigo:"大{たい}変{へん}おいしゅうございました。" }
    ]},
  { id:"station", jp:"駅", en:"Trains and stations", ic:"🚉",
    when:"Station staff are used to helping. Pointing at your phone map while saying the polite line works better than a perfect sentence you can't follow up.",
    lines:[
      { en:"Which platform for Tokyo?", casual:"東{とう}京{きょう}、何{なん}番{ばん}線{せん}?", polite:"東{とう}京{きょう}は何{なん}番{ばん}線{せん}ですか。", keigo:"東{とう}京{きょう}方{ほう}面{めん}は何{なん}番{ばん}線{せん}でしょうか。" },
      { en:"Do I transfer anywhere?", casual:"乗{の}り換{か}えある?", polite:"乗{の}り換{か}えはありますか。", keigo:"お乗{の}り換{か}えは必{ひつ}要{よう}でしょうか。" },
      { en:"Does this train stop at Ueno?", casual:"これ、上{うえ}野{の}止{と}まる?", polite:"この電{でん}車{しゃ}は上{うえ}野{の}に止{と}まりますか。", keigo:"こちらの電{でん}車{しゃ}は上{うえ}野{の}に停{てい}車{しゃ}いたしますか。" },
      { en:"What time is the last train?", casual:"終{しゅう}電{でん}、何{なん}時{じ}?", polite:"終{しゅう}電{でん}は何{なん}時{じ}ですか。", keigo:"終{しゅう}電{でん}は何{なん}時{じ}でございますか。" },
      { en:"I think I got on the wrong train.", casual:"電{でん}車{しゃ}、間{ま}違{ちが}えたかも。", polite:"電{でん}車{しゃ}を間{ま}違{ちが}えたようです。", keigo:"電{でん}車{しゃ}を乗{の}り間{ま}違{ちが}えてしまいました。" },
      { en:"My IC card won't scan.", casual:"カード、反{はん}応{のう}しない。", polite:"ICカードが反{はん}応{のう}しないんですが。", keigo:"ICカードが反{はん}応{のう}しないようでございます。", note:"Ending an explanation with ～んですが softly invites help. It is the single most useful sentence pattern for asking for anything." }
    ]},
  { id:"directions", jp:"道をきく", en:"Asking the way", ic:"🗺️",
    when:"The trick isn't asking — it's understanding the answer. Drill the reply words (まっすぐ, 角, 信号, 突き当たり) harder than the question.",
    lines:[
      { en:"Excuse me, may I ask something?", casual:"ちょっといい?", polite:"すみません、ちょっといいですか。", keigo:"恐{おそ}れ入{い}ります、少{すこ}々{しょう}よろしいでしょうか。" },
      { en:"Where is the post office?", casual:"郵{ゆう}便{びん}局{きょく}どこ?", polite:"郵{ゆう}便{びん}局{きょく}はどこですか。", keigo:"郵{ゆう}便{びん}局{きょく}はどちらでしょうか。" },
      { en:"Is it far from here?", casual:"ここから遠{とお}い?", polite:"ここから遠{とお}いですか。", keigo:"こちらから遠{とお}うございますか。" },
      { en:"(reply) Go straight and turn right at the light.", casual:"まっすぐ行{い}って、信{しん}号{ごう}を右{みぎ}。", polite:"まっすぐ行{い}って、信{しん}号{ごう}を右{みぎ}に曲{ま}がってください。", keigo:"まっすぐお進{すす}みになり、信{しん}号{ごう}を右{みぎ}にお曲{ま}がりください。" },
      { en:"Sorry, one more time?", casual:"もう一{いち}回{かい}?", polite:"すみません、もう一{いち}度{ど}お願{ねが}いします。", keigo:"恐{おそ}れ入{い}ります、もう一{いち}度{ど}お願{ねが}いできますでしょうか。" },
      { en:"Thanks, that helps a lot.", casual:"ありがとう、助{たす}かる。", polite:"ありがとうございます、助{たす}かります。", keigo:"ご丁{てい}寧{ねい}にありがとうございます。" }
    ]},
  { id:"firstday", jp:"はじめての職場", en:"First day at work", ic:"💼",
    when:"Your first ten sentences at a Japanese workplace are almost scripted. Learn them cold and you buy yourself weeks of goodwill.",
    lines:[
      { en:"Nice to meet you. I'm Colsen.", casual:"コルセンです、よろしく。", polite:"初{はじ}めまして、コルセンです。よろしくお願{ねが}いします。", keigo:"初{はじ}めまして、コルセンと申{もう}します。どうぞよろしくお願{ねが}いいたします。", note:"申します is the humble form of 言う. In a self-introduction it is standard, not stiff." },
      { en:"I'll be starting today.", casual:"今{きょ}日{う}から。", polite:"今{きょ}日{う}から働{はたら}きます。", keigo:"本{ほん}日{じつ}よりお世{せ}話{わ}になります。" },
      { en:"Please let me know if I make a mistake.", casual:"間{ま}違{ちが}ってたら言{い}って。", polite:"間{ま}違{ちが}っていたら教{おし}えてください。", keigo:"至{し}らない点{てん}がございましたらご指{し}摘{てき}ください。" },
      { en:"May I ask a question?", casual:"ちょっと聞{き}いていい?", polite:"質{しつ}問{もん}してもいいですか。", keigo:"一{ひと}つお伺{うかが}いしてもよろしいでしょうか。" },
      { en:"Understood.", casual:"わかった。", polite:"分{わ}かりました。", keigo:"承{しょう}知{ち}しました。", note:"了解です is common among peers but reads as slightly casual to a superior. 承知しました is always safe." },
      { en:"I'm heading out. Good work today.", casual:"お疲{つか}れ。", polite:"お先{さき}に失{しつ}礼{れい}します。", keigo:"お先{さき}に失{しつ}礼{れい}いたします。" }
    ]},
  { id:"bizphone", jp:"電話（仕事）", en:"Business phone call", ic:"📞",
    when:"Phone Japanese is the hardest kind — no face, no gestures, and the other side is often speaking in fast keigo. Script your side completely.",
    lines:[
      { en:"Hello, this is Colsen from Liberty University.", casual:"もしもし、コルセンだけど。", polite:"もしもし、リバティ大{だい}学{がく}のコルセンです。", keigo:"お世{せ}話{わ}になっております。リバティ大{だい}学{がく}のコルセンと申{もう}します。" },
      { en:"Is Ms. Tanaka available?", casual:"田{た}中{なか}さんいる?", polite:"田{た}中{なか}さんはいますか。", keigo:"田{た}中{なか}様{さま}はいらっしゃいますでしょうか。" },
      { en:"(reply) She's away from her desk.", casual:"今{いま}いないよ。", polite:"今{いま}、席{せき}にいません。", keigo:"ただいま席{せき}を外{はず}しております。" },
      { en:"Then I'll call back later.", casual:"じゃあまたかける。", polite:"では、後{あと}でかけ直{なお}します。", keigo:"それでは、改{あらた}めてお電{でん}話{わ}いたします。" },
      { en:"Could I leave a message?", casual:"伝{つた}えといて。", polite:"伝{でん}言{ごん}をお願{ねが}いできますか。", keigo:"ご伝{でん}言{ごん}をお願{ねが}いしてもよろしいでしょうか。" },
      { en:"Sorry — could you say that once more?", casual:"ごめん、もう一{いち}回{かい}。", polite:"すみません、もう一{いち}度{ど}お願{ねが}いします。", keigo:"恐{おそ}れ入{い}ります、もう一{いち}度{ど}お願{ねが}いできますでしょうか。" },
      { en:"Thank you. Goodbye.", casual:"じゃあね。", polite:"失{しつ}礼{れい}します。", keigo:"失{しつ}礼{れい}いたします。", note:"You never say さようなら on a business call. 失礼します is the hang-up phrase." }
    ]},
  { id:"decline", jp:"ことわる", en:"Saying no without saying no", ic:"🙅",
    when:"A flat いいえ lands hard. Japanese refuses by trailing off and letting the other person finish the thought. This is the highest-value social skill on the list.",
    lines:[
      { en:"Ah, that's a little...", casual:"うーん、それはちょっと…", polite:"それはちょっと…", keigo:"少{すこ}々{しょう}難{むずか}しいかと存{ぞん}じます。", note:"ちょっと followed by silence is a complete refusal. Everyone understands it. Do not fill the silence." },
      { en:"I'd love to, but that day is bad.", casual:"行{い}きたいけど、その日{ひ}ダメなんだ。", polite:"行{い}きたいんですが、その日{ひ}はちょっと…", keigo:"ぜひ伺{うかが}いたいのですが、あいにく都{つ}合{ごう}がつきません。" },
      { en:"Let me think about it.", casual:"考{かんが}えとく。", polite:"考{かんが}えておきます。", keigo:"検{けん}討{とう}させていただきます。", note:"検討します in business very often means no." },
      { en:"Maybe next time.", casual:"また今{こん}度{ど}ね。", polite:"また今{こん}度{ど}お願{ねが}いします。", keigo:"また機{き}会{かい}がございましたら。" },
      { en:"I'm sorry, I can't.", casual:"ごめん、無{む}理{り}。", polite:"すみません、できません。", keigo:"申{もう}し訳{わけ}ございませんが、致{いた}しかねます。" },
      { en:"No thank you (offered something).", casual:"あ、大{だい}丈{じょう}夫{ぶ}。", polite:"いえ、大{だい}丈{じょう}夫{ぶ}です。", keigo:"お気{き}持{も}ちだけいただきます。" }
    ]},
  { id:"apolog", jp:"あやまる", en:"Apologizing", ic:"🙇",
    when:"Weight matters more than wording. Match the size of the apology to the size of the mistake — over-apologizing for something trivial is its own kind of awkward.",
    lines:[
      { en:"Sorry! (bumped into someone)", casual:"ごめん。", polite:"すみません。", keigo:"失{しつ}礼{れい}いたしました。" },
      { en:"Sorry I'm late.", casual:"遅{おく}れてごめん。", polite:"遅{おく}れてすみません。", keigo:"遅{ち}参{さん}いたしまして申{もう}し訳{わけ}ございません。" },
      { en:"That was my mistake.", casual:"俺{おれ}のミス。", polite:"私{わたし}のミスです。", keigo:"私{わたくし}の不{ふ}手{て}際{ぎわ}でございます。" },
      { en:"I'm very sorry.", casual:"本{ほん}当{とう}にごめん。", polite:"本{ほん}当{とう}にすみませんでした。", keigo:"誠{まこと}に申{もう}し訳{わけ}ございませんでした。" },
      { en:"It won't happen again.", casual:"もうしない。", polite:"気{き}をつけます。", keigo:"今{こん}後{ご}このようなことがないよう努{つと}めます。" },
      { en:"(reply) Don't worry about it.", casual:"気{き}にしないで。", polite:"大{だい}丈{じょう}夫{ぶ}ですよ。", keigo:"どうぞお気{き}になさらないでください。" }
    ]},
  { id:"help", jp:"たのむ", en:"Asking for help or a favor", ic:"🙏",
    when:"The pattern is: soften, explain, then ask. Leading with the ask feels abrupt in Japanese in a way it doesn't in English.",
    lines:[
      { en:"Sorry to bother you...", casual:"ちょっといい?", polite:"すみません、ちょっといいですか。", keigo:"お忙{いそが}しいところ恐{おそ}れ入{い}ります。" },
      { en:"Could you help me a little?", casual:"手{て}伝{つだ}って。", polite:"ちょっと手{て}伝{つだ}ってもらえますか。", keigo:"お手{て}伝{つだ}いいただけますでしょうか。" },
      { en:"Would it be okay if I...?", casual:"〜してもいい?", polite:"〜してもいいですか。", keigo:"〜させていただいてもよろしいでしょうか。" },
      { en:"If it's not too much trouble.", casual:"よかったら。", polite:"もしよろしければ。", keigo:"ご迷{めい}惑{わく}でなければ。" },
      { en:"Thank you, that really helps.", casual:"助{たす}かる、ありがと。", polite:"ありがとうございます、助{たす}かります。", keigo:"誠{まこと}にありがとうございます。" },
      { en:"Sorry for the trouble.", casual:"悪{わる}いね。", polite:"お手{て}数{すう}をおかけしました。", keigo:"お手{て}数{すう}をおかけし申{もう}し訳{わけ}ございません。" }
    ]},
  { id:"clinic", jp:"病院", en:"At the clinic", ic:"🩺",
    when:"Symptom + が + 痛い／する gets you most of the way. Bring your insurance card and be ready to write your address.",
    lines:[
      { en:"I don't feel well.", casual:"具{ぐ}合{あい}悪{わる}い。", polite:"具{ぐ}合{あい}が悪{わる}いんです。", keigo:"体{たい}調{ちょう}が優{すぐ}れません。" },
      { en:"My head hurts.", casual:"頭{あたま}痛{いた}い。", polite:"頭{あたま}が痛{いた}いです。", keigo:"頭{ず}痛{つう}がございます。" },
      { en:"Since about three days ago.", casual:"三{みっ}日{か}前{まえ}から。", polite:"三{みっ}日{か}前{まえ}からです。", keigo:"三{みっ}日{か}ほど前{まえ}からでございます。" },
      { en:"I have a fever of 38 degrees.", casual:"熱{ねつ}、三{さん}十{じゅう}八{はち}度{ど}。", polite:"熱{ねつ}が三{さん}十{じゅう}八{はち}度{ど}あります。", keigo:"三{さん}十{じゅう}八{はち}度{ど}の発{はつ}熱{ねつ}がございます。" },
      { en:"I'm allergic to eggs.", casual:"卵{たまご}アレルギーある。", polite:"卵{たまご}のアレルギーがあります。", keigo:"卵{たまご}のアレルギーがございます。" },
      { en:"Is there an English-speaking doctor?", casual:"英{えい}語{ご}できる先{せん}生{せい}いる?", polite:"英{えい}語{ご}が話{はな}せる先{せん}生{せい}はいますか。", keigo:"英{えい}語{ご}対{たい}応{おう}の医{い}師{し}はいらっしゃいますか。" }
    ]},
  { id:"apart", jp:"部屋さがし", en:"Apartment hunting", ic:"🏠",
    when:"Useful for a summer placement. Expect questions about your guarantor (保証人) and move-in month.",
    lines:[
      { en:"I'm looking for a room.", casual:"部{へ}屋{や}探{さが}してる。", polite:"部{へ}屋{や}を探{さが}しています。", keigo:"お部{へ}屋{や}を探{さが}しております。" },
      { en:"How much is the rent?", casual:"家{や}賃{ちん}いくら?", polite:"家{や}賃{ちん}はいくらですか。", keigo:"家{や}賃{ちん}はおいくらでしょうか。" },
      { en:"Are utilities included?", casual:"光{こう}熱{ねつ}費{ひ}込{こ}み?", polite:"光{こう}熱{ねつ}費{ひ}は込{こ}みですか。", keigo:"光{こう}熱{ねつ}費{ひ}は含{ふく}まれておりますか。" },
      { en:"How far is it from the station?", casual:"駅{えき}から何{なん}分{ぷん}?", polite:"駅{えき}から何{なん}分{ぷん}ですか。", keigo:"最{さい}寄{よ}り駅{えき}から徒{と}歩{ほ}何{なん}分{ぷん}でしょうか。" },
      { en:"May I see it?", casual:"見{み}られる?", polite:"見{み}せてもらえますか。", keigo:"内{ない}見{けん}させていただけますでしょうか。" },
      { en:"I'd like to move in from August.", casual:"八{はち}月{がつ}から入{はい}りたい。", polite:"八{はち}月{がつ}から入{にゅう}居{きょ}したいです。", keigo:"八{はち}月{がつ}よりの入{にゅう}居{きょ}を希{き}望{ぼう}しております。" }
    ]},
  { id:"interview", jp:"面接", en:"Interview & applications", ic:"🗣️",
    when:"Aimed at the internship. Rehearse these out loud until the rhythm is automatic — interviewers listen for fluency of delivery as much as content.",
    lines:[
      { en:"Thank you for your time today.", casual:"今{きょ}日{う}ありがとう。", polite:"本{ほん}日{じつ}はありがとうございます。", keigo:"本{ほん}日{じつ}はお時{じ}間{かん}をいただき、ありがとうございます。" },
      { en:"I study cybersecurity at Liberty University.", casual:"大{だい}学{がく}でセキュリティやってる。", polite:"リバティ大{だい}学{がく}でサイバーセキュリティを勉{べん}強{きょう}しています。", keigo:"リバティ大{だい}学{がく}にてサイバーセキュリティを専{せん}攻{こう}しております。" },
      { en:"I want to work in Japan someday.", casual:"いつか日{に}本{ほん}で働{はたら}きたい。", polite:"いつか日{に}本{ほん}で働{はたら}きたいです。", keigo:"将{しょう}来{らい}、日{に}本{ほん}で働{はたら}きたいと考{かんが}えております。" },
      { en:"My Japanese is still limited, but I'm studying every day.", casual:"日{に}本{ほん}語{ご}まだだけど毎{まい}日{にち}勉{べん}強{きょう}してる。", polite:"日{に}本{ほん}語{ご}はまだ上{じょう}手{ず}ではありませんが、毎{まい}日{にち}勉{べん}強{きょう}しています。", keigo:"日{に}本{ほん}語{ご}は未{み}熟{じゅく}ですが、日{にち}々{にち}努{どりょく}力{りょく}しております。" },
      { en:"May I ask a question?", casual:"聞{き}いていい?", polite:"質{しつ}問{もん}してもいいですか。", keigo:"一{ひと}つお伺{うかが}いしてもよろしいでしょうか。" },
      { en:"I look forward to hearing from you.", casual:"連{れん}絡{らく}待{ま}ってる。", polite:"ご連{れん}絡{らく}をお待{ま}ちしています。", keigo:"ご連{れん}絡{らく}を心{こころ}よりお待{ま}ち申{もう}し上{あ}げております。" }
    ]},
  { id:"smalltalk", jp:"雑談", en:"Small talk that works", ic:"💬",
    when:"Weather, food, and the trip you just took are the safe three. Avoid opening with salary, politics, or why someone isn't married.",
    lines:[
      { en:"It's hot today, isn't it.", casual:"今{きょ}日{う}暑{あつ}いね。", polite:"今{きょ}日{う}は暑{あつ}いですね。", keigo:"本{ほん}日{じつ}はお暑{あつ}うございますね。", note:"The ～ね ending invites agreement. It is the engine of Japanese small talk." },
      { en:"Have you eaten yet?", casual:"ご飯{はん}食{た}べた?", polite:"もう食{た}べましたか。", keigo:"お食{しょく}事{じ}はお済{す}みでしょうか。" },
      { en:"Where are you from?", casual:"どこ出{しゅっ}身{しん}?", polite:"ご出{しゅっ}身{しん}はどちらですか。", keigo:"ご出{しゅっ}身{しん}はどちらでいらっしゃいますか。" },
      { en:"(reply to a compliment) Not at all, I'm still learning.", casual:"いやいや、まだまだ。", polite:"いえいえ、まだまだです。", keigo:"とんでもございません。", note:"Deflecting a compliment is expected. Accepting one flatly can read as boastful." },
      { en:"That sounds great.", casual:"いいね!", polite:"いいですね。", keigo:"素{す}晴{ば}らしいですね。" },
      { en:"Let's get a meal sometime.", casual:"今{こん}度{ど}ご飯{はん}行{い}こう。", polite:"今{こん}度{ど}食{しょく}事{じ}に行{い}きませんか。", keigo:"またお食{しょく}事{じ}でもご一{いっ}緒{しょ}できれば幸{さいわ}いです。" }
    ]},
  { id:"cyber", jp:"IT・技術", en:"Talking shop (IT & security)", ic:"🖥️",
    when:"Your field, in Japanese. Most technical nouns are katakana loanwords, which means you can often say the English word slowly and be understood — but the verbs around them are native.",
    lines:[
      { en:"The server is down.", casual:"サーバー落{お}ちてる。", polite:"サーバーが落{お}ちています。", keigo:"サーバーが停{てい}止{し}しております。" },
      { en:"I'll check the logs.", casual:"ログ見{み}とく。", polite:"ログを確{かく}認{にん}します。", keigo:"ログを確{かく}認{にん}いたします。" },
      { en:"Have you tried restarting it?", casual:"再{さい}起{き}動{どう}した?", polite:"再{さい}起{き}動{どう}してみましたか。", keigo:"再{さい}起{き}動{どう}はお試{ため}しになりましたでしょうか。" },
      { en:"There may have been unauthorized access.", casual:"不{ふ}正{せい}アクセスかも。", polite:"不{ふ}正{せい}アクセスの可{か}能{のう}性{せい}があります。", keigo:"不{ふ}正{せい}アクセスの可{か}能{のう}性{せい}がございます。" },
      { en:"Please change your password.", casual:"パスワード変{か}えて。", polite:"パスワードを変{か}えてください。", keigo:"パスワードのご変{へん}更{こう}をお願{ねが}いいたします。" },
      { en:"I'll send you the documentation.", casual:"資{し}料{りょう}送{おく}る。", polite:"資{し}料{りょう}を送{おく}ります。", keigo:"資{し}料{りょう}をお送{おく}りいたします。" }
    ]},
  { id:"izakaya", jp:"飲み会", en:"Drinking with coworkers", ic:"🍻",
    when:"The 飲み会 is where a lot of workplace relationships actually form. You do not have to drink — but you do have to show up, pour for others, and stay for the first toast.",
    lines:[
      { en:"Cheers!", casual:"かんぱーい!", polite:"乾{かん}杯{ぱい}!", keigo:"乾{かん}杯{ぱい}。", note:"Nobody drinks before the first 乾杯. Wait for it." },
      { en:"Let me pour for you.", casual:"はい、どうぞ。", polite:"どうぞ。", keigo:"お注{つ}ぎいたします。", note:"You pour for others, they pour for you. Pouring your own drink is a quiet signal that nobody is looking after you." },
      { en:"I don't drink alcohol.", casual:"お酒{さけ}飲{の}まないんだ。", polite:"お酒{さけ}は飲{の}まないんです。", keigo:"あいにくお酒{さけ}はいただかないもので。" },
      { en:"Oolong tea for me, thanks.", casual:"ウーロン茶{ちゃ}で。", polite:"ウーロン茶{ちゃ}をお願{ねが}いします。", keigo:"ウーロン茶{ちゃ}をいただけますか。" },
      { en:"I should get going soon.", casual:"そろそろ帰{かえ}るわ。", polite:"そろそろ失{しつ}礼{れい}します。", keigo:"そろそろ失{しつ}礼{れい}いたします。" },
      { en:"Thanks for tonight.", casual:"今{きょ}日{う}ありがと!", polite:"今{きょ}日{う}はありがとうございました。", keigo:"本{ほん}日{じつ}はありがとうございました。" }
    ]},
  { id:"trouble", jp:"こまった時", en:"When something goes wrong", ic:"🚨",
    when:"Memorize the polite column of this one before you get on the plane. Emergency numbers: 110 police, 119 fire and ambulance.",
    lines:[
      { en:"Help!", casual:"助{たす}けて!", polite:"助{たす}けてください!", keigo:"—" },
      { en:"Please call the police.", casual:"警{けい}察{さつ}呼{よ}んで。", polite:"警{けい}察{さつ}を呼{よ}んでください。", keigo:"警{けい}察{さつ}をお呼{よ}びいただけますか。" },
      { en:"I lost my wallet.", casual:"財{さい}布{ふ}なくした。", polite:"財{さい}布{ふ}をなくしました。", keigo:"財{さい}布{ふ}を紛{ふん}失{しつ}いたしました。" },
      { en:"I'm lost.", casual:"道{みち}わかんない。", polite:"道{みち}に迷{まよ}いました。", keigo:"道{みち}に迷{まよ}ってしまいました。" },
      { en:"Is there anyone who speaks English?", casual:"英{えい}語{ご}わかる人{ひと}いる?", polite:"英{えい}語{ご}が話{はな}せる人{ひと}はいますか。", keigo:"英{えい}語{ご}の分{わ}かる方{かた}はいらっしゃいますか。" },
      { en:"Please write it down for me.", casual:"書{か}いて。", polite:"書{か}いてもらえますか。", keigo:"お書{か}きいただけますでしょうか。", note:"Always have this one ready. Reading is easier than listening when you're stressed." }
    ]}
];

