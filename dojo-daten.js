/* ------------------------------------------------------------------
   Daten für das Dojo: JLPT-Aufgaben und Lesetexte

   Alle Aufgaben und Texte sind selbst geschrieben. Übernommen ist nur
   die Form der Aufgaben, so wie sie in der Prüfung vorkommt - keine
   einzige Frage stammt aus den amtlichen Beispielheften.

   Schreibweise im Japanischen:
     {漢字|かんじ}   Kanji mit Lesung; die App zeigt je nach Einstellung
                    Furigana, nur Kana oder nur Kanji
     [ことば]       das unterstrichene Wort, um das es geht
     （　　）       die Lücke

   Bei jeder Aufgabe steht die richtige Antwort an erster Stelle. Die
   App mischt die Antworten vor dem Anzeigen.
   ------------------------------------------------------------------ */

const JLPT_TYPEN = {
  lesung:    { name: "Kanji lesen",       kreis: "wort", antworten: 4,
               auftrag: "Wie liest man das unterstrichene Wort?" },
  schrift:   { name: "Schreibung",        kreis: "wort", antworten: 4,
               auftrag: "Wie schreibt man das unterstrichene Wort?" },
  kontext:   { name: "Passendes Wort",    kreis: "wort", antworten: 4,
               auftrag: "Was passt in die Lücke?" },
  gleich:    { name: "Gleiche Bedeutung", kreis: "wort", antworten: 4,
               auftrag: "Welcher Satz bedeutet fast dasselbe?" },
  gebrauch:  { name: "Wortgebrauch",      kreis: "wort", antworten: 4,
               auftrag: "In welchem Satz ist das Wort richtig verwendet?" },
  grammatik: { name: "Grammatik",         kreis: "gram", antworten: 4,
               auftrag: "Was passt in die Lücke?" },
  stern:     { name: "Satzbau",           kreis: "gram", antworten: 4,
               auftrag: "Ordne die vier Teile. Welcher gehört an die Stelle mit dem Stern?" },
  ausdruck:  { name: "Was sagst du?",     kreis: "hoer", antworten: 3,
               auftrag: "" },
  antwort:   { name: "Schnelle Antwort",  kreis: "hoer", antworten: 3,
               auftrag: "Hör zu. Welche Antwort passt?" }
};

const JLPT_KREISE = {
  alle: "Gemischt",
  wort: "Schrift und Wortschatz",
  gram: "Grammatik",
  hoer: "Sprechen und Hören"
};

/* Aufbau je Typ
   lesung, schrift, kontext, gleich, grammatik:
       [Kennung, Satz, [Antworten], Übersetzung, Erklärung]
   gebrauch:  [Kennung, Wort, [Sätze], Bedeutung, Erklärung]
   stern:     [Kennung, davor, [vier Teile in richtiger Folge],
               Stelle des Sterns ab 0, danach, Übersetzung, Erklärung]
   ausdruck:  [Kennung, Bild, Lage, [Antworten], Erklärung]
   antwort:   [Kennung, Gehörtes, [Antworten], Übersetzung, Erklärung]
   Die Kennung bleibt für immer bei ihrer Aufgabe: unter ihr merkt sich
   die App, was schon gelöst wurde. Neue Aufgaben bekommen neue Kennungen. */
const JLPT_ROH = {

/* ================================================================
   N5
   ================================================================ */
5: {
lesung: [
["5l01","この [本] は おもしろいです。",["ほん","もと","き","はん"],"Dieses Buch ist interessant.","本 liest man hier ほん. もと ist eine andere Lesung desselben Zeichens, き wäre 木."],
["5l02","あの [山] は とても たかいです。",["やま","かわ","うみ","まち"],"Der Berg dort ist sehr hoch.","山 = やま. 川 ist かわ, 海 ist うみ."],
["5l03","[水] を ください。",["みず","き","ひ","つち"],"Wasser, bitte.","水 = みず. Die anderen sind 木 (き), 火 (ひ) und 土 (つち) – die Zeichen der Wochentage."],
["5l04","きょうは [天気] が いいです。",["てんき","でんき","げんき","てんぎ"],"Heute ist das Wetter schön.","天気 = てんき (Wetter). でんき (電気) ist Strom, げんき (元気) ist munter."],
["5l05","[学校] は ９じに はじまります。",["がっこう","がこう","がっこ","かっこう"],"Die Schule beginnt um 9 Uhr.","学校 = がっこう: kleines っ und langes こう."],
["5l06","えきの [前] に コンビニが あります。",["まえ","あと","うえ","した"],"Vor dem Bahnhof gibt es einen Konbini.","前 = まえ (vor). 上 ist うえ, 下 ist した."],
["5l07","あしたは [金曜日] です。",["きんようび","げつようび","かようび","もくようび"],"Morgen ist Freitag.","金曜日 = きんようび. 月 = げつ, 火 = か, 木 = もく."],
["5l08","[新しい] くつを かいました。",["あたらしい","あだらしい","あらたしい","あたなしい"],"Ich habe neue Schuhe gekauft.","新しい = あたらしい."],
["5l09","らいしゅう きょうとへ [行きます]。",["いきます","かきます","ききます","あるきます"],"Nächste Woche fahre ich nach Kyoto.","行きます = いきます (gehen, fahren)."],
["5l10","ちちは [会社] で はたらいて います。",["かいしゃ","しゃかい","がいしゃ","かいじゃ"],"Mein Vater arbeitet in einer Firma.","会社 = かいしゃ. Umgedreht ergibt 社会 しゃかい (Gesellschaft)."],
["5l11","[百] えんの りんごを かいました。",["ひゃく","せん","まん","じゅう"],"Ich habe einen Apfel für 100 Yen gekauft.","百 = ひゃく. 千 = せん, 万 = まん, 十 = じゅう."],
["5l12","りんごを [三つ] ください。",["みっつ","ふたつ","よっつ","むっつ"],"Drei Äpfel, bitte.","三つ = みっつ. 二つ = ふたつ, 四つ = よっつ, 六つ = むっつ."]
],
schrift: [
["5s01","まいにち [がっこう] へ いきます。",["学校","学枚","字校","学交"],"Ich gehe jeden Tag zur Schule.","学校: 学 (lernen) und 校 (Schule) mit dem Baum 木 links."],
["5s02","[あめ] が ふって います。",["雨","雪","電","両"],"Es regnet.","雨 = あめ. 雪 ist ゆき (Schnee), 電 steckt in 電気."],
["5s03","この [てれび] は あたらしいです。",["テレビ","チレビ","テレピ","ラレビ"],"Dieser Fernseher ist neu.","テ・レ・ビ. Achte auf テ gegen チ und ビ gegen ピ."],
["5s04","あそこに [おとこ] の ひとが います。",["男","女","田","力"],"Dort drüben ist ein Mann.","男 = おとこ, zusammengesetzt aus 田 und 力. 女 ist おんな."],
["5s05","ともだちと [はなし] ました。",["話し","語し","読し","言し"],"Ich habe mit einem Freund gesprochen.","話します = はなします. 読 gehört zu よみます, 言 zu いいます."],
["5s06","[ちいさい] ねこが います。",["小さい","少さい","小い","少い"],"Da ist eine kleine Katze.","小さい = ちいさい. 少 gehört zu すくない und すこし."],
["5s07","まいあさ [しゃわー] を あびます。",["シャワー","ツャワー","シャウー","シャクー"],"Ich dusche jeden Morgen.","シ gegen ツ und ワ gegen ウ und ク: シャワー."],
["5s08","[せんせい] に ききます。",["先生","生先","先王","光生"],"Ich frage die Lehrerin.","先生 = せんせい: 先 (vorher) + 生 (geboren)."],
["5s09","つぎの かどを [みぎ] に まがって ください。",["右","左","石","古"],"Biegen Sie bitte an der nächsten Ecke rechts ab.","右 = みぎ, 左 = ひだり. 石 (いし) sieht ähnlich aus."],
["5s10","えきまで [くるま] で いきます。",["車","東","軍","単"],"Ich fahre mit dem Auto zum Bahnhof.","車 = くるま. 東 ist ひがし (Osten)."]
],
kontext: [
["5k01","まいあさ コーヒーを （　　）。",["のみます","たべます","よみます","かきます"],"Ich trinke jeden Morgen Kaffee.","Getränke: のみます."],
["5k02","あついですから、まどを （　　） ください。",["あけて","しめて","つけて","けして"],"Es ist heiß, öffnen Sie bitte das Fenster.","まどを あけます = das Fenster öffnen. つけます und けします gehören zu Licht und Geräten."],
["5k03","としょかんで ほんを （　　）。",["かります","かします","かいます","うります"],"Ich leihe in der Bibliothek ein Buch aus.","かります = sich etwas ausleihen. かします = verleihen."],
["5k04","にもつが （　　） ですから、タクシーで かえります。",["おもい","かるい","やすい","みじかい"],"Das Gepäck ist schwer, deshalb fahre ich mit dem Taxi nach Hause.","おもい = schwer, かるい = leicht."],
["5k05","えきで きっぷを （　　）。",["かいます","よみます","あらいます","のぼります"],"Ich kaufe am Bahnhof eine Fahrkarte.","きっぷを かいます."],
["5k06","ゆうべは ７じかん （　　）。",["ねました","おきました","いきました","あいました"],"Letzte Nacht habe ich sieben Stunden geschlafen.","〜じかん ねます = so viele Stunden schlafen."],
["5k07","この りょうりは とても （　　） です。もう ひとつ ください。",["おいしい","まずい","いそがしい","せまい"],"Dieses Gericht ist sehr lecker. Noch eins, bitte.","Wer noch eins bestellt, findet es おいしい."],
["5k08","へやが くらいですね。でんきを （　　） ください。",["つけて","けして","あけて","しめて"],"Das Zimmer ist dunkel. Machen Sie bitte das Licht an.","でんきを つけます = Licht anmachen, けします = ausmachen."],
["5k09","あしたは がっこうが （　　） です。うみへ いきます。",["やすみ","しけん","じゅぎょう","しゅくだい"],"Morgen ist schulfrei. Ich fahre ans Meer.","やすみ = frei, Ferien."],
["5k10","ここで たばこを （　　） ください。",["すわないで","のまないで","たべないで","きかないで"],"Rauchen Sie hier bitte nicht.","たばこを すいます. 〜ないで ください = bitte nicht …"],
["5k11","あめですから、（　　） を もって いきます。",["かさ","めがね","さいふ","かぎ"],"Es regnet, also nehme ich einen Schirm mit.","Bei Regen: かさ."],
["5k12","この もんだいは （　　） ですから、すぐ わかります。",["かんたん","たいへん","ふべん","にぎやか"],"Diese Aufgabe ist einfach, man versteht sie sofort.","かんたん = einfach."],
["5k13","きってを ３（　　） ください。",["まい","ほん","さつ","だい"],"Drei Briefmarken, bitte.","Flaches zählt man mit まい. ほん für Langes, さつ für Bücher, だい für Geräte und Fahrzeuge."],
["5k14","えいがは ７じに （　　）。",["はじまります","おきます","ねます","はたらきます"],"Der Film beginnt um 7 Uhr.","はじまります = beginnen."]
],
gleich: [
["5g01","この へやは あかるくないです。",["この へやは くらいです。","この へやは ひろいです。","この へやは しずかです。","この へやは きれいです。"],"Dieses Zimmer ist nicht hell.","あかるくない = くらい (dunkel)."],
["5g02","きょうは ひまです。",["きょうは いそがしくないです。","きょうは いそがしいです。","きょうは しごとが たくさん あります。","きょうは やすみじゃ ありません。"],"Heute habe ich Zeit.","ひま = Zeit haben, also nicht いそがしい."],
["5g03","ちちは きょうしです。",["ちちは せんせいです。","ちちは いしゃです。","ちちは がくせいです。","ちちは かいしゃいんです。"],"Mein Vater ist Lehrkraft.","きょうし ist die Berufsbezeichnung für せんせい."],
["5g04","やまださんは えいごが へたです。",["やまださんは えいごが じょうずじゃ ありません。","やまださんは えいごが じょうずです。","やまださんは えいごが すきじゃ ありません。","やまださんは えいごを べんきょうしません。"],"Herr Yamada ist schlecht in Englisch.","へた = nicht じょうず."],
["5g05","おととい としょかんへ いきました。",["ふつかまえに としょかんへ いきました。","きのう としょかんへ いきました。","いっしゅうかんまえに としょかんへ いきました。","あした としょかんへ いきます。"],"Vorgestern war ich in der Bibliothek.","おととい = vor zwei Tagen (ふつかまえ)."],
["5g06","トイレは どこですか。",["おてあらいは どこですか。","おふろは どこですか。","だいどころは どこですか。","げんかんは どこですか。"],"Wo ist die Toilette?","おてあらい ist das höflichere Wort für トイレ."],
["5g07","まいばん ほんを よみます。",["よるは いつも ほんを よみます。","あさは いつも ほんを よみます。","よるは ときどき ほんを よみます。","よるは ぜんぜん ほんを よみません。"],"Ich lese jeden Abend.","まいばん = jeden Abend, also よるは いつも."],
["5g08","この みせは ごぜん 10じに あきます。",["この みせは ごぜん 10じに はじまります。","この みせは ごぜん 10じに おわります。","この みせは ごぜん 10じに しまります。","この みせは ごぜん 10じまで あいて います。"],"Dieser Laden öffnet um 10 Uhr vormittags.","あきます = aufgehen: der Laden はじまります. しまります ist das Gegenteil."]
],
grammatik: [
["5b01","わたしは まいあさ ６じ（　　） おきます。",["に","で","を","へ"],"Ich stehe jeden Morgen um 6 Uhr auf.","Zeitpunkt + に."],
["5b02","としょかん（　　） べんきょうします。",["で","に","を","が"],"Ich lerne in der Bibliothek.","Ort einer Handlung + で."],
["5b03","バス（　　） がっこうへ いきます。",["で","を","に","と"],"Ich fahre mit dem Bus zur Schule.","Verkehrsmittel + で."],
["5b04","きのう ともだち（　　） えいがを みました。",["と","を","が","へ"],"Gestern habe ich mit einem Freund einen Film gesehen.","Zusammen mit jemandem: と."],
["5b05","つくえの うえ（　　） ほんが あります。",["に","で","を","と"],"Auf dem Tisch liegt ein Buch.","Ort, an dem etwas ist: に … あります oder います."],
["5b06","わたしは ねこ（　　） すきです。",["が","を","に","で"],"Ich mag Katzen.","すき, きらい, じょうず und ほしい stehen mit が."],
["5b07","これは わたし（　　） かさです。",["の","が","を","に"],"Das ist mein Schirm.","Besitz: わたしの."],
["5b08","きのうは とても （　　）。",["あつかったです","あついでした","あつくでした","あついかったです"],"Gestern war es sehr heiß.","い-Adjektiv in der Vergangenheit: あつい → あつかったです."],
["5b09","この へやは （　　） きれいです。",["ひろくて","ひろいで","ひろいくて","ひろくと"],"Dieses Zimmer ist geräumig und sauber.","い-Adjektive verbindet man mit 〜くて."],
["5b10","ここに なまえを （　　） ください。",["かいて","かきて","かくて","かいで"],"Schreiben Sie bitte hier Ihren Namen hin.","かきます → かいて (て-Form, Gruppe 1 auf き)."],
["5b11","Ａ「いっしょに ひるごはんを （　　）。」 Ｂ「ええ、いいですね。」",["たべませんか","たべましたか","たべませんでした","たべて います"],"A: Wollen wir zusammen zu Mittag essen? – B: Ja, gern.","Einladung: 〜ませんか."],
["5b12","あした ともだちに （　　） に いきます。",["あい","あう","あって","あいます"],"Morgen gehe ich einen Freund treffen.","Zweck einer Bewegung: Verbstamm + に いきます."],
["5b13","わたしは あたらしい くつが （　　） です。",["ほしい","ほしく","ほしいだ","ほしがり"],"Ich hätte gern neue Schuhe.","〜が ほしいです = etwas haben wollen."],
["5b14","にほんへ （　　） ことが ありますか。",["いった","いく","いって","いきます"],"Warst du schon einmal in Japan?","Erfahrung: た-Form + ことが あります."],
["5b15","ごはんを （　　） まえに、てを あらいます。",["たべる","たべた","たべて","たべます"],"Vor dem Essen wasche ich mir die Hände.","Vor まえに steht die Wörterbuchform."],
["5b16","Ａ「この ケーキは （　　） ですか。」 Ｂ「500えんです。」",["いくら","いくつ","どれ","だれ"],"A: Was kostet dieser Kuchen? – B: 500 Yen.","Nach dem Preis fragt いくら, nach der Anzahl いくつ."],
["5b17","Ａ「（　　） くにへ かえりますか。」 Ｂ「らいげつ かえります。」",["いつ","どこ","だれ","なに"],"A: Wann fährst du in die Heimat zurück? – B: Nächsten Monat.","Die Antwort nennt einen Zeitpunkt: いつ."],
["5b18","きのうは どこ（　　） いきませんでした。",["へも","へ","で","を"],"Gestern bin ich nirgendwohin gegangen.","Fragewort + も + Verneinung = gar nicht, nirgends."]
],
stern: [
["5t01","つくえの",["うえ","に","ほん","が"],2,"あります。","Auf dem Tisch liegt ein Buch.","Ort の うえ に, dann die Sache mit が あります."],
["5t02","すみません、",["トイレ","は","どこ","です"],2,"か。","Entschuldigung, wo ist die Toilette?","〜は どこですか。"],
["5t03","わたしの",["あね","は","とうきょう","に"],2,"います。","Meine große Schwester ist in Tokyo.","Person は Ort に います。"],
["5t04","あした",["えいが","を","みに","いきません"],2,"か。","Wollen wir morgen ins Kino gehen?","Verbstamm + に いきます nennt den Zweck, 〜ませんか lädt ein."],
["5t05","きのう かった",["ほん","は","とても","おもしろい"],2,"です。","Das Buch, das ich gestern gekauft habe, ist sehr interessant.","きのう かった ほん = das gestern gekaufte Buch."],
["5t06","わたしは",["ふじさんに","のぼった","こと","が"],2,"あります。","Ich bin schon einmal auf den Fuji gestiegen.","た-Form + ことが あります = etwas schon einmal getan haben."],
["5t07","テストは",["あまり","むずかしく","ありません","でした"],1,"。","Der Test war nicht besonders schwierig.","あまり + Verneinung. むずかしい → むずかしく ありませんでした."],
["5t08","へやが",["くらいですから","でんき","を","つけて"],1,"ください。","Das Zimmer ist dunkel, machen Sie bitte das Licht an.","Erst der Grund mit から, dann die Bitte."]
],
ausdruck: [
["5a01","🏠","Du kommst nach Hause. Was sagst du?",["ただいま。","おかえりなさい。","いってきます。"],"ただいま = Ich bin wieder da. おかえりなさい antwortet, wer zu Hause ist."],
["5a02","🍚","Das Essen steht auf dem Tisch. Was sagst du, bevor du anfängst?",["いただきます。","ごちそうさまでした。","おねがいします。"],"いただきます sagt man vor dem Essen, ごちそうさまでした danach."],
["5a03","🌙","Du gehst ins Bett. Was sagst du?",["おやすみなさい。","おはようございます。","こんばんは。"],"おやすみなさい = Gute Nacht. こんばんは ist die Begrüßung am Abend."],
["5a04","🎁","Du bekommst ein Geschenk. Was sagst du?",["ありがとうございます。","どういたしまして。","ごめんなさい。"],"どういたしまして wäre die Antwort auf den Dank."],
["5a05","🚪","Du betrittst das Büro deiner Lehrerin. Was sagst du?",["しつれいします。","いらっしゃいませ。","いってらっしゃい。"],"しつれいします sagt man beim Eintreten und beim Gehen."],
["5a06","🍎","Im Laden: Du möchtest diesen Apfel haben. Was sagst du?",["これを ください。","これを あげます。","これを かして ください。"],"〜を ください = Ich hätte gern …"],
["5a07","⏰","Du kommst zu spät zum Unterricht. Was sagst du?",["おそく なって すみません。","おさきに しつれいします。","おつかれさまでした。"],"おそく なって すみません = Entschuldigung, dass ich zu spät bin."],
["5a08","👋","Deine Mitbewohnerin geht aus dem Haus, du bleibst. Was sagst du?",["いってらっしゃい。","いってきます。","ただいま。"],"Wer geht, sagt いってきます. Wer bleibt, sagt いってらっしゃい."],
["5a09","🤒","Dein Freund ist krank. Was sagst du zum Abschied?",["おだいじに。","おげんきですか。","おめでとう。"],"おだいじに = Gute Besserung."],
["5a10","🎂","Deine Freundin hat Geburtstag. Was sagst du?",["おめでとうございます。","おだいじに。","ごちそうさまでした。"],"おたんじょうび おめでとうございます = Herzlichen Glückwunsch zum Geburtstag."],
["5a11","☎️","Du rufst jemanden an. Was sagst du als Erstes?",["もしもし。","ごめんください。","おやすみなさい。"],"もしもし sagt man nur am Telefon."],
["5a12","🍽️","Du bist mit dem Essen fertig. Was sagst du?",["ごちそうさまでした。","いただきます。","いらっしゃいませ。"],"ごちそうさまでした = Danke für das Essen."]
],
antwort: [
["5h01","おなまえは？",["たなかです。","はい、そうです。","いいえ、ちがいます。"],"Wie heißen Sie?","Gefragt ist der Name."],
["5h02","これは だれの かさですか。",["わたしのです。","かさです。","あそこです。"],"Wessen Schirm ist das?","だれの fragt nach dem Besitzer."],
["5h03","いっしょに コーヒーを のみませんか。",["ええ、いいですね。","はい、のみません。","いいえ、コーヒーです。"],"Wollen wir zusammen einen Kaffee trinken?","Auf eine Einladung: ええ、いいですね。"],
["5h04","きのう なにを しましたか。",["えいがを みました。","えいがを みます。","えいがが すきです。"],"Was hast du gestern gemacht?","Gefragt ist die Vergangenheit: みました."],
["5h05","どうやって がっこうへ いきますか。",["でんしゃで いきます。","ともだちと いきます。","８じに いきます。"],"Wie kommst du zur Schule?","どうやって fragt nach dem Weg oder dem Mittel."],
["5h06","この りんごは いくらですか。",["ひゃくえんです。","みっつです。","あかいです。"],"Was kostet dieser Apfel?","いくら fragt nach dem Preis."],
["5h07","おげんきですか。",["はい、げんきです。","はい、そうです。","いいえ、わかりません。"],"Wie geht es Ihnen?","Die übliche Antwort: はい、げんきです。"],
["5h08","トイレは どこですか。",["あそこです。","３じです。","わたしのです。"],"Wo ist die Toilette?","どこ fragt nach dem Ort."],
["5h09","どうも ありがとうございました。",["どういたしまして。","おねがいします。","いただきます。"],"Vielen Dank.","Auf Dank antwortet man mit どういたしまして."],
["5h10","にほんの たべものは どうですか。",["おいしいです。","すしです。","たべました。"],"Wie findest du japanisches Essen?","どうですか fragt nach dem Eindruck."],
["5h11","たんじょうびは いつですか。",["６がつ みっかです。","はたちです。","とうきょうです。"],"Wann hast du Geburtstag?","いつ fragt nach dem Zeitpunkt."],
["5h12","きょうは なんようびですか。",["もくようびです。","よっかです。","よじです。"],"Welcher Wochentag ist heute?","なんようび fragt nach dem Wochentag. よっか ist der Vierte, よじ ist vier Uhr."]
]
},

/* ================================================================
   N4
   ================================================================ */
4: {
lesung: [
["4l01","[特急] に {乗|の}って、{大阪|おおさか}へ {行|い}きます。",["とっきゅう","とくきゅう","とっきゅ","とくぎゅう"],"Ich fahre mit dem Expresszug nach Osaka.","特急 = とっきゅう: aus とく + きゅう wird ein kleines っ."],
["4l02","この [料理] は {母|はは}が {作|つく}りました。",["りょうり","りょり","りょうりい","りゅうり"],"Dieses Gericht hat meine Mutter gekocht.","料理 = りょうり."],
["4l03","{兄|あに}は [銀行] で はたらいて います。",["ぎんこう","きんこう","ぎんこ","ぎんごう"],"Mein großer Bruder arbeitet bei einer Bank.","銀行 = ぎんこう."],
["4l04","しゅうまつは {天気|てんき}が [悪い] そうです。",["わるい","くらい","さむい","ひどい"],"Am Wochenende soll das Wetter schlecht werden.","悪い = わるい."],
["4l05","[急いで] ください。{電車|でんしゃ}が {来|き}ますよ。",["いそいで","およいで","さわいで","ぬいで"],"Beeilen Sie sich bitte. Der Zug kommt.","急ぎます = いそぎます (sich beeilen)."],
["4l06","へやを [借りる] とき、ふどうさんやへ {行|い}きます。",["かりる","かえる","おりる","たりる"],"Wenn man ein Zimmer mietet, geht man zum Makler.","借りる = かりる (leihen, mieten). 貸す = かす ist die Gegenrichtung."],
["4l07","この [地図] を {見|み}て ください。",["ちず","じず","ちと","ちづ"],"Sehen Sie sich bitte diese Karte an.","地図 = ちず."],
["4l08","{駅|えき}の [近く] に {住|す}んで います。",["ちかく","とおく","きんく","ちがく"],"Ich wohne in der Nähe des Bahnhofs.","近く = ちかく. 遠く = とおく ist das Gegenteil."],
["4l09","{来週|らいしゅう}の [試験] の べんきょうを します。",["しけん","じけん","しげん","しっけん"],"Ich lerne für die Prüfung nächste Woche.","試験 = しけん. じけん (事件) wäre ein Vorfall."],
["4l10","[夕方] から {雨|あめ}が ふるでしょう。",["ゆうがた","ゆうかた","ゆがた","ゆうほう"],"Ab dem Spätnachmittag wird es wohl regnen.","夕方 = ゆうがた."],
["4l11","この {町|まち}は [工場] が {多|おお}いです。",["こうじょう","こうじょ","こじょう","こうしょう"],"In dieser Stadt gibt es viele Fabriken.","工場 = こうじょう, beide Silben lang."],
["4l12","{旅行|りょこう}の [計画] を たてます。",["けいかく","けいが","けかく","けいがく"],"Ich mache einen Plan für die Reise.","計画 = けいかく (Plan)."]
],
schrift: [
["4s01","[ちかてつ] で {行|い}きましょう。",["地下鉄","地下鋭","池下鉄","地化鉄"],"Fahren wir mit der U-Bahn.","地 (Erde) + 下 (unter) + 鉄 (Eisen): die Bahn unter der Erde."],
["4s02","[しゅくだい] を わすれました。",["宿題","宿顔","縮題","宿第"],"Ich habe die Hausaufgaben vergessen.","宿題 = しゅくだい."],
["4s03","[あおい] {空|そら}が きれいです。",["青い","春い","晴い","清い"],"Der blaue Himmel ist schön.","青い = あおい. 春 ist はる, 晴 gehört zu はれ."],
["4s04","まどを [あけて] ください。",["開けて","閉けて","問けて","間けて"],"Öffnen Sie bitte das Fenster.","開ける = あける. 閉める = しめる ist das Gegenteil."],
["4s05","ここに [じゅうしょ] を {書|か}いて ください。",["住所","注所","住書","主所"],"Schreiben Sie bitte hier Ihre Adresse hin.","住所 = じゅうしょ: 住 (wohnen) + 所 (Ort)."],
["4s06","となりの へやから [おと] が します。",["音","暗","意","昔"],"Aus dem Nebenzimmer kommt ein Geräusch.","音 = おと (Geräusch, Ton)."],
["4s07","[ぱすぽーと] を {見|み}せて ください。",["パスポート","パヌポート","バスポート","パスボート"],"Zeigen Sie bitte Ihren Pass.","Achte auf ス gegen ヌ und auf die kleinen Kreise bei パ und ポ."],
["4s08","{姉|あね}は {病院|びょういん}で [はたらいて] います。",["働いて","動いて","重いて","勤いて"],"Meine große Schwester arbeitet im Krankenhaus.","働く = はたらく. 動く = うごく (sich bewegen) hat keinen Menschen 亻 links."],
["4s09","{駅|えき}で [きっぷ] を {買|か}います。",["切符","切府","切付","刀符"],"Ich kaufe am Bahnhof eine Fahrkarte.","切符 = きっぷ."],
["4s10","しごとが [おわったら]、{電話|でんわ}します。",["終わったら","絡わったら","冬わったら","紙わったら"],"Wenn die Arbeit zu Ende ist, rufe ich an.","終わる = おわる: Faden 糸 + Winter 冬."]
],
kontext: [
["4k01","{電車|でんしゃ}に かさを （　　） しまいました。",["わすれて","おぼえて","ひろって","しらべて"],"Ich habe meinen Schirm im Zug vergessen.","〜て しまいました drückt Bedauern aus: わすれて しまいました."],
["4k02","やくそくの {時間|じかん}に （　　）、{友|とも}だちを 30{分|ぷん} {待|ま}たせました。",["おくれて","まにあって","いそいで","はやくて"],"Ich kam zu spät zur Verabredung und ließ meinen Freund 30 Minuten warten.","〜に おくれます = sich zu etwas verspäten."],
["4k03","ホテルを インターネットで （　　） しました。",["よやく","よしゅう","やくそく","しょうたい"],"Ich habe das Hotel im Internet gebucht.","よやく = Reservierung. やくそく ist ein Versprechen unter Menschen."],
["4k04","おなかが （　　） から、{何|なに}か {食|た}べたいです。",["すいた","かわいた","いっぱいだ","ふえた"],"Ich habe Hunger, ich möchte etwas essen.","おなかが すきます = Hunger haben. のどが かわきます = Durst haben."],
["4k05","この くすりは １{日|にち}に ３{回|かい} （　　） ください。",["のんで","たべて","すって","かんで"],"Nehmen Sie dieses Medikament bitte dreimal täglich.","Medizin trinkt man auf Japanisch: くすりを のみます."],
["4k06","ここは {車|くるま}が {多|おお}くて （　　） ですから、{気|き}を つけて ください。",["あぶない","あんぜん","しずか","じゆう"],"Hier fahren viele Autos, es ist gefährlich. Passen Sie bitte auf.","あぶない = gefährlich, あんぜん = sicher."],
["4k07","{友|とも}だちが {入院|にゅういん}したので、（　　） に {行|い}きました。",["おみまい","おいわい","おまつり","おれい"],"Mein Freund liegt im Krankenhaus, deshalb habe ich ihn besucht.","おみまい = Krankenbesuch. おいわい = Feier, おれい = Dank."],
["4k08","{日本|にほん}の {生活|せいかつ}に もう （　　） か。",["なれました","ならいました","なりました","ならべました"],"Haben Sie sich schon an das Leben in Japan gewöhnt?","〜に なれます = sich an etwas gewöhnen."],
["4k09","へやが きたないので、（　　） します。",["そうじ","せんたく","しょくじ","さんぽ"],"Das Zimmer ist schmutzig, also putze ich.","そうじ = Putzen. せんたく ist Wäschewaschen."],
["4k10","さいふを おとしたので、（　　） へ {行|い}きました。",["こうばん","びよういん","としょかん","くうこう"],"Ich habe mein Portemonnaie verloren und bin deshalb zum Polizeiposten gegangen.","Verlorenes meldet man beim こうばん. びよういん ist der Friseur, nicht das びょういん."],
["4k11","あしたの かいぎの （　　） を しなければ なりません。",["じゅんび","しゅみ","きょうみ","けが"],"Ich muss die Besprechung von morgen vorbereiten.","じゅんび = Vorbereitung."],
["4k12","この {道|みち}を （　　） {行|い}くと、{右|みぎ}に ゆうびんきょくが あります。",["まっすぐ","はっきり","そろそろ","だんだん"],"Wenn Sie diese Straße geradeaus gehen, ist rechts die Post.","まっすぐ = geradeaus."],
["4k13","（　　） が いたいので、はいしゃに {行|い}きます。",["は","あし","せなか","おなか"],"Ich habe Zahnschmerzen, deshalb gehe ich zum Zahnarzt.","は = Zahn, はいしゃ = Zahnarzt."]
],
gleich: [
["4g01","この {本|ほん}は {読|よ}みやすいです。",["この {本|ほん}は かんたんに {読|よ}めます。","この {本|ほん}は {読|よ}むのが たいへんです。","この {本|ほん}は あまり {読|よ}まれて いません。","この {本|ほん}は {読|よ}んだ ことが ありません。"],"Dieses Buch ist leicht zu lesen.","Verbstamm + やすい = leicht zu tun."],
["4g02","{父|ちち}は るすです。",["{父|ちち}は {今|いま} うちに いません。","{父|ちち}は {今|いま} うちに います。","{父|ちち}は {今|いま} ねて います。","{父|ちち}は {今|いま} いそがしいです。"],"Mein Vater ist nicht da.","るす = nicht zu Hause."],
["4g03","あした {先生|せんせい}の おたくに うかがいます。",["あした {先生|せんせい}の うちへ {行|い}きます。","あした {先生|せんせい}に {電話|でんわ}します。","あした {先生|せんせい}に {手紙|てがみ}を {出|だ}します。","あした {先生|せんせい}が うちへ {来|き}ます。"],"Morgen besuche ich meinen Lehrer zu Hause.","うかがいます ist die bescheidene Form von いきます. おたく = das Zuhause des anderen."],
["4g04","バスは すいて いました。",["バスは {人|ひと}が {少|すく}なかったです。","バスは {人|ひと}が {多|おお}かったです。","バスは おそかったです。","バスは {来|き}ませんでした。"],"Der Bus war leer.","すいて います = nicht voll. Das Gegenteil ist こんで います."],
["4g05","{田中|たなか}さんは {歌|うた}が うまいです。",["{田中|たなか}さんは {歌|うた}が じょうずです。","{田中|たなか}さんは {歌|うた}が すきです。","{田中|たなか}さんは {歌|うた}が へたです。","{田中|たなか}さんは {歌|うた}が きらいです。"],"Herr Tanaka singt gut.","うまい = じょうず (gut können). Beim Essen heißt うまい auch lecker."],
["4g06","しゅくだいは ぜんぶ おわりました。",["しゅくだいは のこって いません。","しゅくだいは まだ あります。","しゅくだいは これから はじめます。","しゅくだいは むずかしかったです。"],"Die Hausaufgaben sind alle fertig.","ぜんぶ おわった = nichts ist übrig (のこって いません)."],
["4g07","この ペンを かして いただけませんか。",["この ペンを かりても いいですか。","この ペンを かしましょうか。","この ペンを {買|か}って ください。","この ペンを かえして ください。"],"Könnten Sie mir diesen Stift leihen?","Wer かして もらう, der かりる: sich etwas leihen."],
["4g08","さいきん いそがしいです。",["このごろ いそがしいです。","きのう いそがしかったです。","むかし いそがしかったです。","しょうらい いそがしく なります。"],"In letzter Zeit bin ich beschäftigt.","さいきん = このごろ (neuerdings)."]
],
gebrauch: [
["4u01","やっと",["３{時間|じかん} {待|ま}って、やっと バスが {来|き}ました。","あしたは やっと {雨|あめ}でしょう。","この へやは やっと ひろいです。","やっと いっしょに {食|た}べませんか。"],"endlich","やっと steht, wenn etwas nach langem Warten oder Mühen eintritt."],
["4u02","るす",["{友|とも}だちの うちへ {行|い}きましたが、るすでした。","この せきは るすですか。","さいふの {中|なか}が るすです。","きょうは {学校|がっこう}が るすです。"],"nicht zu Hause","るす sagt man nur von Menschen, die nicht daheim sind. Ein freier Platz ist あいて います, schulfrei ist やすみ."],
["4u03","にがて",["わたしは からい {食|た}べものが にがてです。","この コーヒーは にがてな あじです。","きょうは にがてな {天気|てんき}です。","この かばんは にがてで、{持|も}てません。"],"nicht mögen, nicht gut können","にがて beschreibt, womit jemand schlecht zurechtkommt. Der bittere Geschmack ist にがい."],
["4u04","こわれる",["パソコンが こわれて、しごとが できません。","やくそくが こわれました。","{雨|あめ}で しあいが こわれました。","{紙|かみ}が こわれました。"],"kaputtgehen","こわれる gilt für Geräte und feste Dinge. Papier やぶれる, ein Spiel wird ちゅうし."],
["4u05","そだてる",["{母|はは}は にわで やさいを そだてて います。","{毎朝|まいあさ} ６{時|じ}に {子|こ}どもを そだてます。","{銀行|ぎんこう}で お{金|かね}を そだてて います。","かみを {長|なが}く そだてて います。"],"aufziehen, großziehen","そだてる: Kinder, Tiere und Pflanzen großziehen. Wecken ist おこす, Haare wachsen lassen ist のばす."],
["4u06","にあう",["その ぼうし、よく にあいますね。","{駅|えき}で {先生|せんせい}に にあいました。","この こたえは にあって います。","バスの {時間|じかん}に にあいました。"],"gut stehen, passen","にあう = jemandem gut stehen. Treffen ist あう, rechtzeitig sein ist まにあう."]
],
grammatik: [
["4b01","この ボタンを （　　）、おつりが {出|で}ます。",["おすと","おしながら","おすのに","おしたり"],"Wenn man diesen Knopf drückt, kommt das Wechselgeld heraus.","Wörterbuchform + と: eine Folge, die immer eintritt."],
["4b02","わたしは {日本語|にほんご}の しんぶんが （　　）。",["{読|よ}めます","{読|よ}みます","{読|よ}みました","{読|よ}んで います"],"Ich kann japanische Zeitungen lesen.","Möglichkeitsform: よむ → よめる. Das Objekt steht dann mit が."],
["4b03","わたしは {友|とも}だち（　　） たんじょうびに とけいを もらいました。",["に","を","へ","が"],"Ich habe von einem Freund zum Geburtstag eine Uhr bekommen.","Von wem man etwas bekommt: 〜に もらいます (oder から)."],
["4b04","わたしは {先生|せんせい}に さくぶんを {見|み}て （　　）。",["いただきました","くださいました","あげました","やりました"],"Meine Lehrerin hat sich meinen Aufsatz angesehen.","〜て いただきます = jemand Höhergestelltes tut etwas für mich. くださいました bräuchte 先生が."],
["4b05","ねつが あるので、きょうは {早|はや}く （　　） ほうが いいですよ。",["{帰|かえ}った","{帰|かえ}って","{帰|かえ}り","{帰|かえ}ろう"],"Du hast Fieber, du solltest heute besser früh nach Hause gehen.","Rat: た-Form + ほうが いいです."],
["4b06","この {本|ほん}は {字|じ}が {大|おお}きくて、（　　） やすいです。",["{読|よ}み","{読|よ}む","{読|よ}んで","{読|よ}め"],"Dieses Buch hat große Schrift und ist leicht zu lesen.","Verbstamm + やすい."],
["4b07","わたしは {電車|でんしゃ}で となりの {人|ひと}に {足|あし}を （　　）。",["ふまれました","ふみました","ふんで あげました","ふんで います"],"Im Zug ist mir mein Nachbar auf den Fuß getreten.","Passiv: der Täter steht mit に, das Verb auf 〜(ら)れます."],
["4b08","{先生|せんせい}は {学生|がくせい}に さくぶんを （　　）。",["{書|か}かせました","{書|か}きたがりました","{書|か}けました","{書|か}いて みました"],"Die Lehrerin ließ die Studenten einen Aufsatz schreiben.","Kausativ: かく → かかせる (jemanden schreiben lassen)."],
["4b09","わあ、この ケーキは （　　） そうですね。いただきます。",["おいし","おいしく","おいしくて","おいしさ"],"Oh, dieser Kuchen sieht lecker aus. Guten Appetit.","Aussehen: Adjektivstamm ohne い + そうです."],
["4b10","{今日|きょう}は しゅくだいを （　　） なければ なりません。",["し","する","して","した"],"Heute muss ich Hausaufgaben machen.","Müssen: ない-Stamm + なければ なりません. する → し(ない)."],
["4b11","ここで しゃしんを （　　） も いいですか。",["とって","とる","とった","とり"],"Darf ich hier fotografieren?","Erlaubnis: て-Form + も いいですか."],
["4b12","あの {人|ひと}は {日本人|にほんじん} （　　） じょうずに {日本語|にほんご}を {話|はな}します。",["のように","ように","ような","のような"],"Sie spricht so gut Japanisch wie eine Japanerin.","Nomen + のように vor Adjektiv, Adverb oder Verb. のような stünde vor einem Nomen."],
["4b13","{日本|にほん}へ {来|く}る （　　）、{国|くに}で {日本語|にほんご}を べんきょうしました。",["まえに","あとで","ながら","たら"],"Bevor ich nach Japan kam, habe ich in meiner Heimat Japanisch gelernt.","Wörterbuchform + まえに. あとで bräuchte die た-Form."],
["4b14","テレビを （　　） ながら、ごはんを {食|た}べます。",["{見|み}","{見|み}て","{見|み}る","{見|み}た"],"Ich esse, während ich fernsehe.","Gleichzeitig: Verbstamm + ながら."],
["4b15","さむいですね。あ、まどが あけて （　　）。",["あります","います","おきます","みます"],"Kalt hier. Ah, das Fenster steht offen.","〜が + て-Form eines Verbs mit Objekt + あります: ein Zustand, den jemand hergestellt hat."],
["4b16","わたしは {来年|らいねん} {日本|にほん}へ りゅうがく（　　） と {思|おも}って います。",["しよう","して","した","しろ"],"Ich habe vor, nächstes Jahr in Japan zu studieren.","Absicht: Willensform + と おもって います."],
["4b17","この かんじは どう {読|よ}む （　　） {教|おし}えて ください。",["か","が","を","と"],"Sagen Sie mir bitte, wie man dieses Kanji liest.","Eingebettete Frage: Fragewort … か, dann おしえて ください."],
["4b18","となりの へやが （　　） すぎて、べんきょう できません。",["うるさ","うるさい","うるさく","うるさくて"],"Im Nebenzimmer ist es zu laut, ich kann nicht lernen.","Zu sehr: Adjektivstamm ohne い + すぎます."]
],
stern: [
["4t01","この くすりは",["ごはんを","{食|た}べた","あとで","{飲|の}んで"],2,"ください。","Nehmen Sie dieses Medikament bitte nach dem Essen.","た-Form + あとで = nachdem."],
["4t02","わたしは {日本語|にほんご}で",["{手紙|てがみ}","を","{書|か}く","ことが"],2,"できます。","Ich kann Briefe auf Japanisch schreiben.","Wörterbuchform + ことが できます = können."],
["4t03","きのうは",["あたまが","いたかった","ので","{早|はや}く"],2,"ねました。","Gestern hatte ich Kopfschmerzen, deshalb bin ich früh schlafen gegangen.","Grund + ので."],
["4t04","あの {店|みせ}の",["ラーメンは","{安|やす}くて","おいしい","と"],1,"{思|おも}います。","Ich finde, die Ramen in dem Laden dort sind günstig und lecker.","Meinung: Satz in der Grundform + と おもいます."],
["4t05","{山田|やまだ}さんが あした",["{来|く}る","か","どうか","わかり"],2,"ません。","Ich weiß nicht, ob Herr Yamada morgen kommt.","〜か どうか = ob … oder nicht."],
["4t06","{日本語|にほんご}の しんぶんが",["すこし","{読|よ}める","ように","なり"],1,"ました。","Ich kann inzwischen ein wenig japanische Zeitung lesen.","Möglichkeitsform + ように なります = etwas mit der Zeit können."],
["4t07","ここに",["{車|くるま}を","とめては","いけない","と"],2,"{書|か}いて あります。","Hier steht, dass man nicht parken darf.","〜ては いけない = nicht dürfen. 〜と かいて あります = es steht geschrieben, dass …"],
["4t08","{駅|えき}に",["{着|つ}い","たら","{電話|でんわ}","して"],1,"ください。","Rufen Sie bitte an, wenn Sie am Bahnhof angekommen sind.","〜たら = wenn, sobald."]
],
ausdruck: [
["4a01","🏢","Du gehst vor deinen Kollegen nach Hause. Was sagst du?",["おさきに しつれいします。","おかえりなさい。","いってらっしゃい。"],"おさきに しつれいします = Entschuldigung, dass ich vor Ihnen gehe."],
["4a02","🤝","Du triffst eine Bekannte nach langer Zeit wieder. Was sagst du?",["おひさしぶりです。","はじめまして。","おだいじに。"],"おひさしぶりです = Lange nicht gesehen."],
["4a03","🍵","Du hast Besuch und bietest Tee an. Was sagst du?",["おちゃを どうぞ。","おちゃを ください。","おちゃを いただきます。"],"Mit どうぞ bietet man etwas an."],
["4a04","🚃","Im Zug steht ein alter Mann vor dir. Du bietest deinen Platz an. Was sagst du?",["どうぞ、すわって ください。","すわっても いいですか。","すわりましょうか。"],"どうぞ + て ください lädt den anderen ein. すわりましょうか hieße: Soll ich mich setzen?"],
["4a05","📷","Du möchtest, dass jemand ein Foto von dir macht. Was sagst du?",["すみません、しゃしんを とって いただけませんか。","しゃしんを とりましょうか。","しゃしんを とっても いいですよ。"],"〜て いただけませんか = Könnten Sie bitte …?"],
["4a06","🧳","Deine Freundin trägt schweres Gepäck. Du bietest Hilfe an. Was sagst du?",["にもつを もちましょうか。","にもつを もって くださいませんか。","にもつを もたないで ください。"],"Angebot: 〜ましょうか = Soll ich …?"],
["4a07","🏥","Du hast einen Freund im Krankenhaus besucht und gehst wieder. Was sagst du?",["おだいじに。","おかげさまで。","ごちそうさまでした。"],"おだいじに = Gute Besserung. おかげさまで antwortet der, dem es wieder gut geht."],
["4a08","🎓","Deine Freundin hat die Prüfung bestanden. Was sagst du?",["ごうかく おめでとう。","それは いけませんね。","おじゃまします。"],"ごうかく = Bestehen einer Prüfung."],
["4a09","🏠","Du betrittst die Wohnung einer Bekannten. Was sagst du?",["おじゃまします。","おじゃましました。","いらっしゃい。"],"おじゃまします beim Hereinkommen, おじゃましました beim Gehen."],
["4a10","🤧","Dein Kollege erzählt, dass er erkältet ist. Was sagst du?",["それは いけませんね。","それは よかったですね。","どういたしまして。"],"それは いけませんね = Das ist ja nicht gut. So zeigt man Mitgefühl."]
],
antwort: [
["4h01","この {本|ほん}、かりても いいですか。",["ええ、どうぞ。","いいえ、かりません。","はい、かして ください。"],"Darf ich mir dieses Buch ausleihen?","Erlaubnis geben: ええ、どうぞ。"],
["4h02","{日本|にほん}に {来|き}て どのくらいに なりますか。",["{半年|はんとし}です。","ひこうきで {来|き}ました。","{来年|らいねん} {来|き}ます。"],"Wie lange sind Sie schon in Japan?","どのくらい fragt nach der Dauer."],
["4h03","どうしたんですか。",["ちょっと あたまが いたいんです。","はい、そうしましょう。","いいえ、どういたしまして。"],"Was ist denn los?","Auf どうしたんですか erklärt man mit 〜んです."],
["4h04","コーヒーと こうちゃと どちらが いいですか。",["こうちゃを おねがいします。","はい、いいですよ。","ええ、そうですね。"],"Was möchten Sie lieber, Kaffee oder Tee?","どちら verlangt eine Wahl."],
["4h05","あした、いっしょに えいがを {見|み}に {行|い}きませんか。",["すみません、あしたは ちょっと…。","いいえ、{見|み}ませんでした。","はい、{見|み}た ことが あります。"],"Wollen wir morgen zusammen ins Kino gehen?","Höflich ablehnen: 〜は ちょっと…"],
["4h06","かんじが {読|よ}めますか。",["すこしだけ {読|よ}めます。","はい、{読|よ}んで ください。","いいえ、{読|よ}みませんでした。"],"Können Sie Kanji lesen?","Gefragt ist das Können: よめます."],
["4h07","おそく なって すみません。",["いいえ、だいじょうぶですよ。","どうぞ おだいじに。","ごちそうさまでした。"],"Entschuldigung, dass ich zu spät bin.","Auf eine Entschuldigung: いいえ、だいじょうぶですよ。"],
["4h08","きっぷの {買|か}いかたを {教|おし}えて いただけませんか。",["ええ、いいですよ。","はい、{教|おし}えて ください。","いいえ、{買|か}いません。"],"Könnten Sie mir zeigen, wie man eine Fahrkarte kauft?","Einer Bitte zustimmen: ええ、いいですよ。"],
["4h09","りょこうは どうでしたか。",["とても たのしかったです。","ほっかいどうへ {行|い}きます。","ひこうきで {行|い}きました。"],"Wie war die Reise?","どうでしたか fragt nach dem Eindruck, in der Vergangenheit."],
["4h10","まどを しめましょうか。",["ええ、おねがいします。","はい、しめましょうか。","いいえ、しめませんでした。"],"Soll ich das Fenster schließen?","Ein Angebot nimmt man mit おねがいします an."]
]
}
};

/* ------------------------------------------------------------------
   Lesetexte
   saetze: [Japanisch, Deutsch] - ein Eintrag je Absatz zum Antippen
   tafel:  Aushang oder Liste, wie in den Aufgaben zur Informationssuche
   fragen: [Frage, [Antworten, richtige zuerst], Erklärung]
   ------------------------------------------------------------------ */
const LESETEXTE = [
{
  id: "t5-1", st: 5, art: "Kurztext", bild: "👋",
  titel: "はじめまして", titelDe: "Freut mich",
  saetze: [
    ["はじめまして。わたしは リナです。", "Freut mich. Ich bin Lina."],
    ["ドイツから {来|き}ました。", "Ich komme aus Deutschland."],
    ["{今|いま}、とうきょうの シェアハウスに すんで います。", "Jetzt wohne ich in einer Wohngemeinschaft in Tokyo."],
    ["シェアハウスに キッチンと リビングが あります。", "In der WG gibt es eine Küche und ein Wohnzimmer."],
    ["わたしの へやは ２かいです。あまり ひろくないですが、あかるいです。", "Mein Zimmer ist im zweiten Geschoss. Es ist nicht besonders groß, aber hell."],
    ["まいにち {日本語|にほんご}{学校|がっこう}で べんきょうします。", "Jeden Tag lerne ich an der Japanischschule."],
    ["{日本語|にほんご}は むずかしいですが、おもしろいです。", "Japanisch ist schwierig, aber interessant."],
    ["どうぞ よろしく おねがいします。", "Auf gute Bekanntschaft."]
  ],
  woerter: [["すんで います","wohnen"],["２かい","zweites Geschoss (das Erdgeschoss zählt als erstes)"],["あかるい","hell"]],
  fragen: [
    ["リナさんは {今|いま} どこに すんで いますか。",
     ["とうきょうの シェアハウス","ドイツの うち","とうきょうの ホテル","{日本語|にほんご}{学校|がっこう}"],
     "Dritter Satz: とうきょうの シェアハウスに すんで います。"],
    ["リナさんの へやは どんな へやですか。",
     ["ひろくないですが、あかるい へや","ひろくて あかるい へや","ひろくて くらい へや","せまくて くらい へや"],
     "あまり ひろくないですが、あかるいです。"]
  ]
},
{
  id: "t5-2", st: 5, art: "Kurztext", bild: "⏰",
  titel: "わたしの いちにち", titelDe: "Mein Tag",
  saetze: [
    ["わたしは まいあさ ６じはんに おきます。", "Ich stehe jeden Morgen um halb sieben auf."],
    ["あさごはんは パンと たまごです。コーヒーも のみます。", "Zum Frühstück gibt es Brot und Ei. Ich trinke auch Kaffee."],
    ["８じに うちを でて、でんしゃで {学校|がっこう}へ {行|い}きます。", "Um 8 gehe ich aus dem Haus und fahre mit der Bahn zur Schule."],
    ["じゅぎょうは ９じから 12じはんまでです。", "Der Unterricht geht von 9 bis halb eins."],
    ["ごごは としょかんで しゅくだいを します。", "Nachmittags mache ich in der Bibliothek Hausaufgaben."],
    ["５じから ９じまで コンビニで アルバイトを します。", "Von 5 bis 9 jobbe ich im Konbini."],
    ["うちへ かえって、ばんごはんを {食|た}べます。それから おふろに はいります。", "Ich gehe nach Hause und esse zu Abend. Danach bade ich."],
    ["11じごろ ねます。まいにち いそがしいですが、たのしいです。", "Gegen 11 gehe ich schlafen. Jeder Tag ist voll, aber schön."]
  ],
  woerter: [["うちを でます","aus dem Haus gehen"],["〜ごろ","ungefähr um"],["それから","danach"]],
  fragen: [
    ["この {人|ひと}は なんで {学校|がっこう}へ {行|い}きますか。",
     ["でんしゃ","バス","じてんしゃ","あるいて"],
     "でんしゃで {学校|がっこう}へ {行|い}きます。 なんで fragt hier nach dem Verkehrsmittel."],
    ["アルバイトは なんじかんですか。",
     ["４じかん","３じかん","５じかん","９じかん"],
     "Von 5 bis 9 Uhr sind es vier Stunden."]
  ]
},
{
  id: "t5-3", st: 5, art: "Aushang", bild: "☕",
  titel: "カフェの メニュー", titelDe: "Die Karte im Café",
  tafel: {
    titel: "カフェ さくら　メニュー",
    gruppen: [
      { name: "のみもの", zeilen: [["コーヒー","300えん"],["こうちゃ","280えん"],["カフェオレ","350えん"],["りんごジュース","250えん"]] },
      { name: "たべもの", zeilen: [["サンドイッチ","450えん"],["カレーパン","200えん"],["チーズケーキ","400えん"],["ドーナツ","150えん"]] }
    ],
    fuss: ["ランチタイム（11じ〜２じ）　サンドイッチと のみもので 600えん"]
  },
  saetze: [
    ["カフェ さくらは えきの まえに あります。", "Das Café Sakura ist vor dem Bahnhof."],
    ["あさ ８じから よる ７じまでです。げつようびは やすみです。", "Geöffnet ist von 8 Uhr morgens bis 7 Uhr abends. Montags ist geschlossen."],
    ["ランチタイムは 11じから ２じまでです。サンドイッチと のみもので 600えんです。", "Mittagszeit ist von 11 bis 2. Ein Sandwich mit Getränk kostet dann 600 Yen."]
  ],
  woerter: [["のみもの","Getränk"],["たべもの","Essen"],["ぜんぶで","insgesamt"],["ランチタイム","Mittagszeit"]],
  fragen: [
    ["こうちゃと チーズケーキを かいます。ぜんぶで いくらですか。",
     ["680えん","650えん","700えん","750えん"],
     "280えん + 400えん = 680えん."],
    ["12じに サンドイッチと コーヒーを かいます。いくらですか。",
     ["600えん","750えん","450えん","300えん"],
     "12 Uhr liegt in der Mittagszeit: Sandwich mit Getränk kostet 600 statt 750 Yen."],
    ["カフェは いつ やすみですか。",
     ["げつようび","にちようび","どようび","やすみは ありません"],
     "げつようびは やすみです。"]
  ]
},
{
  id: "t5-4", st: 5, art: "Kurztext", bild: "🏞️",
  titel: "しゅうまつ", titelDe: "Das Wochenende",
  saetze: [
    ["わたしは しゅうまつが {大|だい}すきです。", "Ich liebe das Wochenende."],
    ["どようびは ともだちと こうえんで テニスを します。", "Samstags spiele ich mit Freunden im Park Tennis."],
    ["わたしは テニスが あまり じょうずじゃ ありませんが、たのしいです。", "Ich bin nicht besonders gut im Tennis, aber es macht Spaß."],
    ["にちようびは うちで そうじと せんたくを します。", "Sonntags putze ich zu Hause und wasche Wäsche."],
    ["それから、スーパーへ かいものに {行|い}きます。", "Danach gehe ich im Supermarkt einkaufen."],
    ["よるは カレーを つくります。わたしの カレーは すこし からいですが、おいしいです。", "Abends koche ich Curry. Mein Curry ist etwas scharf, aber lecker."],
    ["らいしゅうの どようびは ともだちと えいがを みに {行|い}きます。", "Nächsten Samstag gehe ich mit Freunden ins Kino."]
  ],
  woerter: [["しゅうまつ","Wochenende"],["かいものに いきます","einkaufen gehen"],["すこし","ein bisschen"]],
  fragen: [
    ["この {人|ひと}は にちようびに なにを しますか。",
     ["そうじと せんたくと かいもの","テニスと かいもの","えいがと そうじ","テニスと りょうり"],
     "にちようび: そうじ, せんたく, dann かいもの. Tennis ist am Samstag."],
    ["この {人|ひと}の テニスは どうですか。",
     ["あまり じょうずじゃ ありません","とても じょうずです","ぜんぜん たのしくないです","テニスは しません"],
     "あまり じょうずじゃ ありませんが、たのしいです。"]
  ]
},
{
  id: "t5-5", st: 5, art: "Nachricht", bild: "🎉",
  titel: "パーティーの おしらせ", titelDe: "Einladung zur Party",
  saetze: [
    ["マリアさんへ", "An Maria"],
    ["らいしゅうの どようびに わたしの うちで パーティーを します。", "Nächsten Samstag mache ich bei mir zu Hause eine Party."],
    ["６じに はじまります。", "Sie beginnt um 6 Uhr."],
    ["{食|た}べものは わたしが つくりますから、のみものを もって きて ください。", "Das Essen mache ich, bring bitte Getränke mit."],
    ["うちは えきから あるいて ５ふんです。ゆうびんきょくの となりです。", "Zu mir sind es vom Bahnhof fünf Minuten zu Fuß. Es ist neben der Post."],
    ["わからない ときは、でんわして ください。", "Wenn du es nicht findest, ruf bitte an."],
    ["たなか", "Tanaka"]
  ],
  woerter: [["おしらせ","Mitteilung"],["もって きます","mitbringen"],["となり","nebenan"],["〜とき","wenn, falls"]],
  fragen: [
    ["マリアさんは なにを もって {行|い}きますか。",
     ["のみもの","{食|た}べもの","ケーキ","なにも もって {行|い}きません"],
     "のみものを もって きて ください。 Das Essen macht Tanaka selbst."],
    ["たなかさんの うちは どこですか。",
     ["ゆうびんきょくの となり","えきの なか","ゆうびんきょくの まえ","えきから バスで ５ふん"],
     "ゆうびんきょくの となりです。 Vom Bahnhof zu Fuß, nicht mit dem Bus."]
  ]
},
{
  id: "t4-1", st: 4, art: "Text", bild: "🏝️",
  titel: "おきなわ りょこう", titelDe: "Reise nach Okinawa",
  saetze: [
    ["{夏休|なつやす}みに {友|とも}だちと おきなわへ {行|い}こうと {思|おも}って います。", "In den Sommerferien möchte ich mit einem Freund nach Okinawa fahren."],
    ["わたしは まだ {一度|いちど}も おきなわへ {行|い}った ことが ありません。", "Ich war noch kein einziges Mal in Okinawa."],
    ["{東京|とうきょう}から ひこうきで ３{時間|じかん}ぐらい かかります。", "Von Tokyo dauert es mit dem Flugzeug etwa drei Stunden."],
    ["おきなわは {海|うみ}が きれいなので、ダイビングを して みたいです。", "Weil das Meer in Okinawa schön ist, möchte ich das Tauchen ausprobieren."],
    ["{友|とも}だちは {泳|およ}げないので、すいぞくかんへ {行|い}きたいと {言|い}って います。", "Mein Freund kann nicht schwimmen und sagt, er möchte ins Aquarium."],
    ["それで、{一日目|いちにちめ}は {海|うみ}へ {行|い}って、{二日目|ふつかめ}は すいぞくかんへ {行|い}く ことに しました。", "Deshalb haben wir beschlossen: am ersten Tag ans Meer, am zweiten ins Aquarium."],
    ["レンタカーを {借|か}りれば、いろいろな ところへ {行|い}けます。", "Wenn wir einen Mietwagen nehmen, kommen wir an viele Orte."],
    ["{今|いま}から とても {楽|たの}しみです。", "Ich freue mich schon jetzt sehr."]
  ],
  woerter: [["〜ようと おもって います","vorhaben zu …"],["いちども 〜ない","kein einziges Mal"],["〜ことに しました","beschlossen haben zu …"],["たのしみ","Vorfreude"]],
  fragen: [
    ["{二人|ふたり}は どうして すいぞくかんへ {行|い}きますか。",
     ["{友|とも}だちが {泳|およ}げないから","{海|うみ}が きれいじゃ ないから","レンタカーが ないから","ダイビングが たかいから"],
     "{友|とも}だちは {泳|およ}げないので、すいぞくかんへ {行|い}きたいと {言|い}って います。"],
    ["この {人|ひと}に ついて ただしい ものは どれですか。",
     ["おきなわへ {行|い}くのは はじめてです。","まえに おきなわで ダイビングを しました。","{一人|ひとり}で りょこうします。","{二日|ふつか}とも {海|うみ}へ {行|い}きます。"],
     "まだ {一度|いちど}も {行|い}った ことが ありません – es ist also das erste Mal."]
  ]
},
{
  id: "t4-2", st: 4, art: "Text", bild: "📝",
  titel: "{日本語|にほんご}の べんきょう", titelDe: "Japanisch lernen",
  saetze: [
    ["{日本|にほん}へ {来|き}てから、もう {半年|はんとし}に なります。", "Seit ich nach Japan gekommen bin, ist schon ein halbes Jahr vergangen."],
    ["はじめは {日本語|にほんご}が ぜんぜん {話|はな}せませんでしたが、{今|いま}は かんたんな {会話|かいわ}が できるように なりました。", "Anfangs konnte ich überhaupt kein Japanisch sprechen, aber inzwischen kann ich einfache Gespräche führen."],
    ["わたしは {毎日|まいにち} たんごカードで ことばを おぼえて います。", "Ich lerne jeden Tag Wörter mit Vokabelkarten."],
    ["{電車|でんしゃ}の {中|なか}でも スマホで {勉強|べんきょう}できるので、とても {便利|べんり}です。", "Auch im Zug kann ich mit dem Smartphone lernen, das ist sehr praktisch."],
    ["でも、{漢字|かんじ}は まだ にがてです。", "Aber Kanji fallen mir noch schwer."],
    ["{読|よ}みかたが たくさん あって、なかなか おぼえられません。", "Es gibt viele Lesungen, und ich kann sie mir einfach nicht merken."],
    ["{先生|せんせい}は「{毎日|まいにち} {少|すこ}しずつ {書|か}いて {練習|れんしゅう}した ほうが いいですよ」と {言|い}いました。", "Meine Lehrerin sagte: „Üben Sie besser jeden Tag ein bisschen mit der Hand.“"],
    ["{来年|らいねん}の {夏|なつ}に {試験|しけん}を {受|う}けたいので、これからも がんばります。", "Nächsten Sommer möchte ich die Prüfung ablegen, deshalb strenge ich mich weiter an."]
  ],
  woerter: [["〜ように なりました","inzwischen können"],["にがて","schwerfallen"],["なかなか 〜ない","einfach nicht"],["すこしずつ","Stück für Stück"],["しけんを うけます","eine Prüfung ablegen"]],
  fragen: [
    ["この {人|ひと}は {今|いま} {何|なに}が にがてですか。",
     ["{漢字|かんじ}","{会話|かいわ}","たんごカード","スマホ"],
     "{漢字|かんじ}は まだ にがてです。 Einfache Gespräche gehen inzwischen."],
    ["{先生|せんせい}は どんな アドバイスを しましたか。",
     ["{毎日|まいにち} {少|すこ}しずつ {書|か}いて {練習|れんしゅう}する","{電車|でんしゃ}の {中|なか}で {勉強|べんきょう}する","{夏|なつ}に {試験|しけん}を {受|う}ける","たんごカードを たくさん {買|か}う"],
     "〜た ほうが いいですよ ist ein Rat: {少|すこ}しずつ {書|か}いて {練習|れんしゅう}する."]
  ]
},
{
  id: "t4-3", st: 4, art: "Aushang", bild: "🚌",
  titel: "{日帰|ひがえ}り バスツアー", titelDe: "Tagesausflug mit dem Bus",
  tafel: {
    titel: "{日帰|ひがえ}り バスツアーの ごあんない",
    gruppen: [
      { name: "", zeilen: [
        ["Ａコース　いちごがりと {温泉|おんせん}","8:00〜17:00","6,500{円|えん}"],
        ["Ｂコース　{工場|こうじょう}{見学|けんがく}と すいぞくかん","9:00〜16:30","5,000{円|えん}"],
        ["Ｃコース　{神社|じんじゃ}と たきの ハイキング","7:30〜18:00","4,800{円|えん}"]
      ] }
    ],
    fuss: [
      "{昼|ひる}ごはん：Ａコースと Ｂコースに ついて います。",
      "{小学生|しょうがくせい}は {半分|はんぶん}の ねだんです。",
      "{申|もう}しこみは ツアーの {三日前|みっかまえ}までに。"
    ]
  },
  saetze: [
    ["{駅前|えきまえ}の かんこうあんないじょで {申|もう}しこむ ことが できます。", "Anmelden kann man sich in der Touristeninformation vor dem Bahnhof."],
    ["{昼|ひる}ごはんは Ａコースと Ｂコースに ついて います。Ｃコースは おべんとうを {持|も}って きて ください。", "Mittagessen ist bei Kurs A und B dabei. Für Kurs C bringen Sie bitte eine Lunchbox mit."],
    ["{小学生|しょうがくせい}は {半分|はんぶん}の ねだんです。", "Grundschüler zahlen die Hälfte."],
    ["{申|もう}しこみは ツアーの {三日前|みっかまえ}までに おねがいします。", "Anmeldung bitte bis drei Tage vor der Tour."]
  ],
  woerter: [["ひがえり","Tagesausflug"],["〜に ついて います","ist bei … dabei"],["はんぶん","die Hälfte"],["もうしこみ","Anmeldung"],["〜までに","bis spätestens"]],
  fragen: [
    ["おとな {一人|ひとり}と {小学生|しょうがくせい} {一人|ひとり}で Ｂコースに さんかします。ぜんぶで いくらですか。",
     ["7,500{円|えん}","10,000{円|えん}","5,000{円|えん}","9,750{円|えん}"],
     "Erwachsener 5.000 Yen, Grundschüler die Hälfte: 2.500 Yen."],
    ["{昼|ひる}ごはんを {持|も}って {行|い}かなければ ならないのは どの コースですか。",
     ["Ｃコース","Ａコース","Ｂコース","ぜんぶの コース"],
     "Bei A und B ist das Mittagessen dabei, bei C nicht."],
    ["{土曜日|どようび}の ツアーに {行|い}きたいです。いつまでに {申|もう}しこみますか。",
     ["{水曜日|すいようび}まで","{金曜日|きんようび}まで","{土曜日|どようび}の あさまで","{日曜日|にちようび}まで"],
     "Drei Tage vor Samstag ist Mittwoch."]
  ]
},
{
  id: "t4-4", st: 4, art: "Text", bild: "🍜",
  titel: "アルバイト", titelDe: "Der Nebenjob",
  saetze: [
    ["わたしは {先月|せんげつ}から {駅前|えきまえ}の レストランで アルバイトを して います。", "Seit letztem Monat jobbe ich in einem Restaurant vor dem Bahnhof."],
    ["しごとは {料理|りょうり}を はこんだり、おさらを {洗|あら}ったり する ことです。", "Meine Arbeit ist, Essen zu servieren, Geschirr zu spülen und dergleichen."],
    ["はじめは メニューの {名前|なまえ}が おぼえられなくて、よく まちがえました。", "Anfangs konnte ich mir die Namen auf der Karte nicht merken und habe mich oft geirrt."],
    ["でも、{店長|てんちょう}や スタッフの みなさんが しんせつに {教|おし}えて くれました。", "Aber der Chef und die Kollegen haben es mir freundlich erklärt."],
    ["{今|いま}は おきゃくさんに「おすすめは {何|なん}ですか」と {聞|き}かれても、すぐ {答|こた}えられます。", "Jetzt kann ich sofort antworten, auch wenn ein Gast fragt: „Was empfehlen Sie?“"],
    ["{日本語|にほんご}で {話|はな}す チャンスが {多|おお}いので、とても いい {勉強|べんきょう}に なります。", "Es gibt viele Gelegenheiten, Japanisch zu sprechen, dabei lerne ich viel."],
    ["いそがしい {日|ひ}は つかれますが、この しごとが {好|す}きです。", "An vollen Tagen bin ich müde, aber ich mag diese Arbeit."]
  ],
  woerter: [["〜たり 〜たり します","mal dies, mal das tun"],["まちがえます","sich irren"],["〜て くれました","jemand hat es für mich getan"],["きかれても","auch wenn ich gefragt werde"],["つかれます","müde werden"]],
  fragen: [
    ["はじめ、この {人|ひと}は どうして よく まちがえましたか。",
     ["メニューの {名前|なまえ}が おぼえられなかったから","{日本語|にほんご}が ぜんぜん {話|はな}せなかったから","{店長|てんちょう}が {教|おし}えて くれなかったから","おきゃくさんが {多|おお}かったから"],
     "メニューの {名前|なまえ}が おぼえられなくて、よく まちがえました。"],
    ["この {人|ひと}は アルバイトを どう {思|おも}って いますか。",
     ["つかれる {日|ひ}も あるが、{好|す}きだ","つかれるから、やめたい","{勉強|べんきょう}に ならない","{日本語|にほんご}を {話|はな}さないから、つまらない"],
     "いそがしい {日|ひ}は つかれますが、この しごとが {好|す}きです。"]
  ]
}
];

/* Die Aufgaben als Liste mit Namen statt Stellen. */
const JLPT = [];
Object.keys(JLPT_ROH).forEach(function(st){
  Object.keys(JLPT_ROH[st]).forEach(function(typ){
    JLPT_ROH[st][typ].forEach(function(r){
      var a = { id: r[0], st: +st, typ: typ };
      if(typ === "stern"){
        a.vor = r[1]; a.teile = r[2]; a.stelle = r[3]; a.nach = r[4]; a.de = r[5]; a.tipp = r[6];
      }else if(typ === "ausdruck"){
        a.bild = r[1]; a.lage = r[2]; a.opt = r[3]; a.tipp = r[4];
      }else if(typ === "gebrauch"){
        a.wort = r[1]; a.opt = r[2]; a.de = r[3]; a.tipp = r[4];
      }else if(typ === "antwort"){
        a.hoer = r[1]; a.opt = r[2]; a.de = r[3]; a.tipp = r[4];
      }else{
        a.satz = r[1]; a.opt = r[2]; a.de = r[3]; a.tipp = r[4];
      }
      JLPT.push(a);
    });
  });
});

/* Zeichen, die hier als Bild gebraucht werden. werkzeug/bilder-bauen.js
   liest diese Liste, damit sie in bilder.svg landen. */
const DOJO_BILDER = JLPT.filter(function(a){ return a.bild; }).map(function(a){ return a.bild; })
  .concat(LESETEXTE.map(function(t){ return t.bild; }));
