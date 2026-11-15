/* ------------------------------------------------------------------
   Bildwörter für das Dojo und für die Karteikarten
   Aufbau je Zeile: [Bild, Kana, Romaji, Bedeutung, JLPT-Stufe, Gruppe,
                     Kanji, Beispielsatz, Übersetzung]

   Das Bild ist ein Emoji-Zeichen. Gezeichnet wird es nicht mit der
   Schrift des Geräts, sondern aus bilder.svg - dort liegt zu jedem
   Zeichen die Grafik aus Twemoji (CC-BY 4.0). Nach einer Änderung an
   dieser Datei deshalb einmal  node werkzeug/bilder-bauen.js  laufen
   lassen, sonst fehlt das neue Bild.

   Die Stufe folgt den üblichen inoffiziellen Listen; eine amtliche
   Wortliste gibt es seit 2010 nicht mehr.
   ------------------------------------------------------------------ */

const BILDGRUPPEN = {
  essen:   "Essen und Trinken",
  tier:    "Tiere",
  ort:     "Orte und Gebäude",
  fahr:    "Verkehr",
  ding:    "Dinge",
  kleid:   "Kleidung",
  natur:   "Natur und Wetter",
  mensch:  "Menschen und Körper",
  tun:     "Tätigkeiten",
  frei:    "Freizeit und Sport",
  gefuehl: "Gefühle und Eigenschaften",
  farbe:   "Farben",
  land:    "Länder"
};

const BILDER_ROH = [
/* ===== Essen und Trinken ===== */
["🍎","りんご","ringo","Apfel",5,"essen","","りんごを ひとつ ください。","Einen Apfel, bitte."],
["🍌","バナナ","banana","Banane",5,"essen","","まいあさ バナナを たべます。","Ich esse jeden Morgen eine Banane."],
["🍊","みかん","mikan","Mandarine",5,"essen","","ふゆは みかんが おいしいです。","Im Winter schmecken Mandarinen gut."],
["🍓","いちご","ichigo","Erdbeere",4,"essen","","いちごの ケーキが すきです。","Ich mag Erdbeerkuchen."],
["🍇","ぶどう","budoo","Weintraube",4,"essen","","この ぶどうは あまいです。","Diese Trauben sind süß."],
["🍉","すいか","suika","Wassermelone",4,"essen","","なつは すいかを たべます。","Im Sommer isst man Wassermelone."],
["🍈","メロン","meron","Melone",4,"essen","","メロンは たかいです。","Melonen sind teuer."],
["🍋","レモン","remon","Zitrone",4,"essen","","レモンは すっぱいです。","Zitronen sind sauer."],
["🍑","もも","momo","Pfirsich",4,"essen","桃","ももを ふたつ かいました。","Ich habe zwei Pfirsiche gekauft."],
["🍅","トマト","tomato","Tomate",4,"essen","","サラダに トマトを いれます。","Ich gebe Tomaten in den Salat."],
["🥕","にんじん","ninjin","Karotte",4,"essen","","うさぎは にんじんが すきです。","Hasen mögen Karotten."],
["🧅","たまねぎ","tamanegi","Zwiebel",4,"essen","玉ねぎ","カレーに たまねぎを いれます。","Ich gebe Zwiebeln ins Curry."],
["🍞","パン","pan","Brot",5,"essen","","あさは パンを たべます。","Morgens esse ich Brot."],
["🍚","ごはん","gohan","Reis, Mahlzeit",5,"essen","ご飯","ごはんを たべましょう。","Lass uns essen."],
["🍙","おにぎり","onigiri","Reisball",5,"essen","","コンビニで おにぎりを かいます。","Ich kaufe im Konbini einen Reisball."],
["🍣","すし","sushi","Sushi",5,"essen","寿司","にほんの すしは おいしいです。","Japanisches Sushi ist lecker."],
["🍜","ラーメン","raamen","Ramen",5,"essen","","ひるごはんは ラーメンです。","Zum Mittag gibt es Ramen."],
["🍛","カレー","karee","Curry",5,"essen","","この カレーは からいです。","Dieses Curry ist scharf."],
["🥚","たまご","tamago","Ei",5,"essen","卵","たまごを みっつ ください。","Drei Eier, bitte."],
["🍖","にく","niku","Fleisch",5,"essen","肉","にくと やさいを かいます。","Ich kaufe Fleisch und Gemüse."],
["🍰","ケーキ","keeki","Kuchen",5,"essen","","たんじょうびに ケーキを たべます。","Am Geburtstag essen wir Kuchen."],
["🍦","アイスクリーム","aisukuriimu","Eiscreme",5,"essen","","あついですから、アイスクリームを たべます。","Weil es heiß ist, esse ich ein Eis."],
["🍫","チョコレート","chokoreeto","Schokolade",5,"essen","","ともだちに チョコレートを あげます。","Ich schenke einer Freundin Schokolade."],
["🍪","クッキー","kukkii","Keks",4,"essen","","ははと クッキーを つくりました。","Ich habe mit meiner Mutter Kekse gebacken."],
["🍩","ドーナツ","doonatsu","Donut",4,"essen","","ドーナツを ふたつ ください。","Zwei Donuts, bitte."],
["🍵","おちゃ","ocha","Tee",5,"essen","お茶","おちゃを どうぞ。","Bitte sehr, Ihr Tee."],
["☕","コーヒー","koohii","Kaffee",5,"essen","","まいあさ コーヒーを のみます。","Ich trinke jeden Morgen Kaffee."],
["🥛","ぎゅうにゅう","gyuunyuu","Milch",5,"essen","牛乳","こどもは ぎゅうにゅうを のみます。","Das Kind trinkt Milch."],
["🍺","ビール","biiru","Bier",5,"essen","","ビールを いっぽん ください。","Eine Flasche Bier, bitte."],
["🍷","ワイン","wain","Wein",5,"essen","","フランスの ワインは ゆうめいです。","Französischer Wein ist berühmt."],
["🍶","おさけ","osake","Sake, Alkohol",5,"essen","お酒","ちちは おさけが すきです。","Mein Vater mag Sake."],
["💧","みず","mizu","Wasser",5,"essen","水","みずを ください。","Wasser, bitte."],
["🧃","ジュース","juusu","Saft",5,"essen","","りんごの ジュースを のみます。","Ich trinke Apfelsaft."],
["🥤","コーラ","koora","Cola",4,"essen","","えいがかんで コーラを のみました。","Ich habe im Kino Cola getrunken."],
["🍱","おべんとう","obentoo","Lunchbox",5,"essen","お弁当","こうえんで おべんとうを たべます。","Ich esse im Park meine Lunchbox."],
["🥐","クロワッサン","kurowassan","Croissant",4,"essen","","パリで クロワッサンを たべたいです。","Ich möchte in Paris ein Croissant essen."],
["🍘","おせんべい","osenbee","Reiscracker",4,"essen","お煎餅","おちゃと おせんべいを どうぞ。","Tee und Reiscracker, bitte sehr."],
["🍕","ピザ","piza","Pizza",4,"essen","","ともだちと ピザを たべました。","Ich habe mit Freunden Pizza gegessen."],
["🥪","サンドイッチ","sandoitchi","Sandwich",4,"essen","","ひるは サンドイッチに します。","Mittags nehme ich ein Sandwich."],
["🍝","パスタ","pasuta","Pasta",4,"essen","","イタリアの パスタは おいしいです。","Italienische Pasta ist lecker."],
["🥗","サラダ","sarada","Salat",4,"essen","","サラダは ヘルシーです。","Salat ist gesund."],
["🥩","ステーキ","suteeki","Steak",4,"essen","","レストランで ステーキを たべました。","Ich habe im Restaurant Steak gegessen."],
["🍿","ポップコーン","poppukoon","Popcorn",4,"essen","","えいがを みながら ポップコーンを たべます。","Beim Film esse ich Popcorn."],
["🧂","しお","shio","Salz",5,"essen","塩","しおを とって ください。","Reich mir bitte das Salz."],
["🍤","てんぷら","tenpura","Tempura",4,"essen","天ぷら","えびの てんぷらが すきです。","Ich mag Garnelen-Tempura."],
["🥟","ぎょうざ","gyooza","Gyoza, Teigtaschen",4,"essen","餃子","ぎょうざを つくりましょう。","Lass uns Gyoza machen."],
["🍧","かきごおり","kakigoori","Raspeleis",4,"essen","かき氷","なつまつりで かきごおりを たべます。","Auf dem Sommerfest esse ich Raspeleis."],
["🥢","はし","hashi","Essstäbchen",5,"essen","箸","はしで ごはんを たべます。","Ich esse Reis mit Stäbchen."],
["🥄","スプーン","supuun","Löffel",5,"essen","","カレーは スプーンで たべます。","Curry isst man mit dem Löffel."],
["🍽️","おさら","osara","Teller",5,"essen","お皿","おさらを あらいます。","Ich spüle die Teller."],

/* ===== Tiere ===== */
["🐶","いぬ","inu","Hund",5,"tier","犬","いぬと さんぽします。","Ich gehe mit dem Hund spazieren."],
["🐱","ねこ","neko","Katze",5,"tier","猫","いすの うえに ねこが います。","Auf dem Stuhl ist eine Katze."],
["🐦","とり","tori","Vogel",5,"tier","鳥","きの うえに とりが います。","Auf dem Baum ist ein Vogel."],
["🐟","さかな","sakana","Fisch",5,"tier","魚","いけに さかなが います。","Im Teich gibt es Fische."],
["🐴","うま","uma","Pferd",4,"tier","馬","うまは はやいです。","Pferde sind schnell."],
["🐮","うし","ushi","Kuh",4,"tier","牛","うしが くさを たべて います。","Die Kuh frisst Gras."],
["🐷","ぶた","buta","Schwein",4,"tier","豚","ぶたは ピンクです。","Schweine sind rosa."],
["🐵","さる","saru","Affe",4,"tier","猿","さるは バナナが すきです。","Affen mögen Bananen."],
["🐘","ぞう","zoo","Elefant",4,"tier","象","ぞうは おおきいです。","Elefanten sind groß."],
["🐰","うさぎ","usagi","Hase",4,"tier","","うさぎは みみが ながいです。","Hasen haben lange Ohren."],
["🐻","くま","kuma","Bär",4,"tier","熊","やまに くまが います。","In den Bergen gibt es Bären."],
["🐢","かめ","kame","Schildkröte",4,"tier","亀","かめは ゆっくり あるきます。","Schildkröten gehen langsam."],
["🦍","ゴリラ","gorira","Gorilla",4,"tier","","どうぶつえんで ゴリラを みました。","Ich habe im Zoo einen Gorilla gesehen."],
["🐼","パンダ","panda","Panda",4,"tier","","パンダは しろと くろです。","Pandas sind weiß und schwarz."],
["🦁","ライオン","raion","Löwe",4,"tier","","ライオンは つよいです。","Löwen sind stark."],
["🐧","ペンギン","pengin","Pinguin",4,"tier","","すいぞくかんに ペンギンが います。","Im Aquarium gibt es Pinguine."],
["🐸","かえる","kaeru","Frosch",4,"tier","","いけに かえるが います。","Im Teich ist ein Frosch."],
["🐍","へび","hebi","Schlange",4,"tier","蛇","へびは こわいです。","Schlangen sind unheimlich."],
["🐭","ねずみ","nezumi","Maus",4,"tier","","ねこは ねずみが すきです。","Katzen mögen Mäuse."],
["🦊","きつね","kitsune","Fuchs",4,"tier","狐","じんじゃに きつねが います。","Am Schrein gibt es einen Fuchs."],
["🐙","たこ","tako","Krake",4,"tier","","たこやきに たこを いれます。","In Takoyaki kommt Krake."],
["🐝","はち","hachi","Biene",4,"tier","蜂","はなに はちが います。","An der Blume ist eine Biene."],
["🐛","むし","mushi","Insekt",4,"tier","虫","わたしは むしが にがてです。","Ich mag keine Insekten."],

/* ===== Verkehr ===== */
["🚗","くるま","kuruma","Auto",5,"fahr","車","ちちの くるまは あたらしいです。","Das Auto meines Vaters ist neu."],
["🚃","でんしゃ","densha","Zug, Bahn",5,"fahr","電車","でんしゃで かいしゃへ いきます。","Ich fahre mit der Bahn zur Firma."],
["🚄","しんかんせん","shinkansen","Shinkansen",4,"fahr","新幹線","しんかんせんで きょうとへ いきます。","Ich fahre mit dem Shinkansen nach Kyoto."],
["🚌","バス","basu","Bus",5,"fahr","","バスは ８じに きます。","Der Bus kommt um 8 Uhr."],
["🚕","タクシー","takushii","Taxi",5,"fahr","","タクシーを よびましょうか。","Soll ich ein Taxi rufen?"],
["🚲","じてんしゃ","jitensha","Fahrrad",5,"fahr","自転車","じてんしゃで がっこうへ いきます。","Ich fahre mit dem Rad zur Schule."],
["✈️","ひこうき","hikooki","Flugzeug",5,"fahr","飛行機","ひこうきで おきなわへ いきます。","Ich fliege nach Okinawa."],
["🚢","ふね","fune","Schiff",4,"fahr","船","ふねで しまへ いきます。","Ich fahre mit dem Schiff zur Insel."],
["🚇","ちかてつ","chikatetsu","U-Bahn",5,"fahr","地下鉄","ちかてつは べんりです。","Die U-Bahn ist praktisch."],
["🏍️","バイク","baiku","Motorrad",4,"fahr","","あには バイクが すきです。","Mein großer Bruder mag Motorräder."],
["🚑","きゅうきゅうしゃ","kyuukyuusha","Krankenwagen",4,"fahr","救急車","きゅうきゅうしゃを よんで ください。","Rufen Sie bitte einen Krankenwagen."],
["🚒","しょうぼうしゃ","shooboosha","Feuerwehrauto",4,"fahr","消防車","しょうぼうしゃは あかいです。","Feuerwehrautos sind rot."],
["🚚","トラック","torakku","Lastwagen",4,"fahr","","おおきい トラックが きました。","Ein großer Lastwagen ist gekommen."],
["🚁","ヘリコプター","herikoputaa","Hubschrauber",4,"fahr","","ヘリコプターが とんで います。","Ein Hubschrauber fliegt."],
["🚀","ロケット","roketto","Rakete",4,"fahr","","ロケットは とても はやいです。","Raketen sind sehr schnell."],

/* ===== Orte und Gebäude ===== */
["🏠","いえ","ie","Haus",5,"ort","家","わたしの いえは えきの ちかくです。","Mein Haus ist in der Nähe des Bahnhofs."],
["🏫","がっこう","gakkoo","Schule",5,"ort","学校","がっこうは ９じに はじまります。","Die Schule beginnt um 9 Uhr."],
["🏥","びょういん","byooin","Krankenhaus",5,"ort","病院","ははは びょういんで はたらいて います。","Meine Mutter arbeitet im Krankenhaus."],
["🏦","ぎんこう","ginkoo","Bank",5,"ort","銀行","ぎんこうは ３じに おわります。","Die Bank schließt um 3 Uhr."],
["🏣","ゆうびんきょく","yuubinkyoku","Postamt",5,"ort","郵便局","ゆうびんきょくで きってを かいます。","Ich kaufe bei der Post Briefmarken."],
["🏨","ホテル","hoteru","Hotel",5,"ort","","この ホテルは あたらしいです。","Dieses Hotel ist neu."],
["🏪","コンビニ","konbini","Convenience Store",5,"ort","","コンビニは とても べんりです。","Der Konbini ist sehr praktisch."],
["🏬","デパート","depaato","Kaufhaus",5,"ort","","デパートで くつを かいました。","Ich habe im Kaufhaus Schuhe gekauft."],
["🛒","スーパー","suupaa","Supermarkt",5,"ort","","スーパーで やさいを かいます。","Ich kaufe im Supermarkt Gemüse."],
["🍴","レストラン","resutoran","Restaurant",5,"ort","","えきの まえに レストランが あります。","Vor dem Bahnhof gibt es ein Restaurant."],
["🚉","えき","eki","Bahnhof",5,"ort","駅","えきで ともだちに あいます。","Ich treffe Freunde am Bahnhof."],
["🚏","バスてい","basutee","Bushaltestelle",4,"ort","バス停","バスていで バスを まちます。","Ich warte an der Haltestelle auf den Bus."],
["🛫","くうこう","kuukoo","Flughafen",4,"ort","空港","くうこうまで バスで いきます。","Ich fahre mit dem Bus zum Flughafen."],
["🏞️","こうえん","kooen","Park",5,"ort","公園","こうえんを さんぽします。","Ich gehe im Park spazieren."],
["⛩️","じんじゃ","jinja","Schrein",4,"ort","神社","おしょうがつに じんじゃへ いきます。","An Neujahr geht man zum Schrein."],
["⛪","きょうかい","kyookai","Kirche",4,"ort","教会","まちに ふるい きょうかいが あります。","In der Stadt gibt es eine alte Kirche."],
["🏭","こうじょう","koojoo","Fabrik",4,"ort","工場","くるまの こうじょうを けんがくします。","Wir besichtigen eine Autofabrik."],
["🗼","タワー","tawaa","Turm",4,"ort","","とうきょうタワーは あかいです。","Der Tokyo Tower ist rot."],
["🏛️","はくぶつかん","hakubutsukan","Museum",4,"ort","博物館","はくぶつかんは げつようびが やすみです。","Das Museum hat montags geschlossen."],
["🏢","かいしゃ","kaisha","Firma",5,"ort","会社","かいしゃは とうきょうに あります。","Die Firma ist in Tokyo."],
["🚻","トイレ","toire","Toilette",5,"ort","","すみません、トイレは どこですか。","Entschuldigung, wo ist die Toilette?"],
["♨️","おんせん","onsen","heiße Quelle",4,"ort","温泉","にほんの おんせんに はいりたいです。","Ich möchte in ein japanisches Onsen."],
["🛁","おふろ","ofuro","Bad",5,"ort","お風呂","まいばん おふろに はいります。","Ich bade jeden Abend."],
["⛲","ふんすい","funsui","Springbrunnen",4,"ort","噴水","こうえんの まんなかに ふんすいが あります。","In der Mitte des Parks ist ein Springbrunnen."],

/* ===== Dinge ===== */
["📖","ほん","hon","Buch",5,"ding","本","としょかんで ほんを かります。","Ich leihe in der Bibliothek ein Buch aus."],
["☂️","かさ","kasa","Regenschirm",5,"ding","傘","あめですから、かさを もって いきます。","Es regnet, also nehme ich einen Schirm mit."],
["👜","かばん","kaban","Tasche",5,"ding","","かばんの なかに さいふが あります。","In der Tasche ist ein Portemonnaie."],
["⏰","とけい","tokee","Uhr",5,"ding","時計","とけいを みて ください。","Schau bitte auf die Uhr."],
["⌚","うでどけい","udedokee","Armbanduhr",4,"ding","腕時計","たんじょうびに うでどけいを もらいました。","Zum Geburtstag habe ich eine Armbanduhr bekommen."],
["☎️","でんわ","denwa","Telefon",5,"ding","電話","あとで でんわを かけます。","Ich rufe später an."],
["📱","スマホ","sumaho","Smartphone",5,"ding","","スマホで しゃしんを とります。","Ich mache mit dem Smartphone Fotos."],
["💻","パソコン","pasokon","Computer",5,"ding","","パソコンで しごとを します。","Ich arbeite am Computer."],
["📺","テレビ","terebi","Fernseher",5,"ding","","ばんごはんの あとで テレビを みます。","Nach dem Abendessen sehe ich fern."],
["📷","カメラ","kamera","Kamera",5,"ding","","あたらしい カメラが ほしいです。","Ich hätte gern eine neue Kamera."],
["✏️","えんぴつ","enpitsu","Bleistift",5,"ding","鉛筆","えんぴつで かいて ください。","Schreiben Sie bitte mit Bleistift."],
["🖊️","ペン","pen","Stift",5,"ding","","ペンを かして ください。","Leih mir bitte einen Stift."],
["📓","ノート","nooto","Heft",5,"ding","","ノートに かんじを かきます。","Ich schreibe Kanji ins Heft."],
["✉️","てがみ","tegami","Brief",5,"ding","手紙","ははに てがみを かきます。","Ich schreibe meiner Mutter einen Brief."],
["✂️","はさみ","hasami","Schere",4,"ding","","はさみで かみを きります。","Ich schneide Papier mit der Schere."],
["🔑","かぎ","kagi","Schlüssel",5,"ding","鍵","へやの かぎを わすれました。","Ich habe den Zimmerschlüssel vergessen."],
["👛","さいふ","saifu","Geldbörse",5,"ding","財布","さいふを おとしました。","Ich habe mein Portemonnaie verloren."],
["💴","おかね","okane","Geld",5,"ding","お金","おかねが ありません。","Ich habe kein Geld."],
["💳","カード","kaado","Kreditkarte",4,"ding","","カードで はらいます。","Ich zahle mit Karte."],
["🪑","いす","isu","Stuhl",5,"ding","椅子","いすに すわって ください。","Setzen Sie sich bitte auf den Stuhl."],
["🛏️","ベッド","beddo","Bett",5,"ding","","へやに ベッドと つくえが あります。","Im Zimmer stehen ein Bett und ein Schreibtisch."],
["🚪","ドア","doa","Tür",5,"ding","","ドアを しめて ください。","Schließen Sie bitte die Tür."],
["🪟","まど","mado","Fenster",5,"ding","窓","まどを あけましょうか。","Soll ich das Fenster öffnen?"],
["💡","でんき","denki","Licht, Strom",5,"ding","電気","でんきを けして ください。","Machen Sie bitte das Licht aus."],
["📰","しんぶん","shinbun","Zeitung",5,"ding","新聞","ちちは まいあさ しんぶんを よみます。","Mein Vater liest jeden Morgen Zeitung."],
["🗺️","ちず","chizu","Landkarte",5,"ding","地図","ちずを みせて ください。","Zeigen Sie mir bitte die Karte."],
["🎫","きっぷ","kippu","Fahrkarte",5,"ding","切符","えきで きっぷを かいます。","Ich kaufe am Bahnhof eine Fahrkarte."],
["💊","くすり","kusuri","Medikament",5,"ding","薬","ごはんの あとで くすりを のみます。","Nach dem Essen nehme ich die Medizin."],
["🧼","せっけん","sekken","Seife",5,"ding","石鹸","せっけんで てを あらいます。","Ich wasche die Hände mit Seife."],
["📅","カレンダー","karendaa","Kalender",5,"ding","","カレンダーに よていを かきます。","Ich schreibe Termine in den Kalender."],
["🧸","ぬいぐるみ","nuigurumi","Plüschtier",4,"ding","","いもうとに ぬいぐるみを あげました。","Ich habe meiner kleinen Schwester ein Plüschtier geschenkt."],
["🎎","にんぎょう","ningyoo","Puppe",4,"ding","人形","にほんの にんぎょうは きれいです。","Japanische Puppen sind schön."],
["🧲","マグネット","magunetto","Magnet",4,"ding","","おみやげに マグネットを かいました。","Als Souvenir habe ich einen Magneten gekauft."],
["📦","はこ","hako","Schachtel",5,"ding","箱","はこの なかに なにが ありますか。","Was ist in der Schachtel?"],
["📎","クリップ","kurippu","Büroklammer",4,"ding","","クリップを とって ください。","Reich mir bitte die Büroklammer."],
["📏","じょうぎ","joogi","Lineal",4,"ding","定規","じょうぎを かして ください。","Leih mir bitte das Lineal."],
["🧳","にもつ","nimotsu","Gepäck",5,"ding","荷物","にもつを もちましょうか。","Soll ich das Gepäck tragen?"],
["🖼️","え","e","Bild",5,"ding","絵","びじゅつかんで えを みます。","Ich schaue mir im Kunstmuseum Bilder an."],
["📸","しゃしん","shashin","Foto",5,"ding","写真","ここで しゃしんを とりましょう。","Lass uns hier ein Foto machen."],
["🎁","プレゼント","purezento","Geschenk",5,"ding","","ともだちに プレゼントを もらいました。","Ich habe von einem Freund ein Geschenk bekommen."],
["🗑️","ごみばこ","gomibako","Mülleimer",4,"ding","ごみ箱","ごみは ごみばこに いれて ください。","Werfen Sie Müll bitte in den Mülleimer."],
["📮","ポスト","posuto","Briefkasten",5,"ding","","てがみを ポストに いれます。","Ich werfe den Brief in den Briefkasten."],
["🚬","たばこ","tabako","Zigarette",5,"ding","","ここで たばこを すわないで ください。","Rauchen Sie hier bitte nicht."],
["🚿","シャワー","shawaa","Dusche",5,"ding","","あさ シャワーを あびます。","Morgens dusche ich."],
["🧊","こおり","koori","Eis (gefroren)",4,"ding","氷","ジュースに こおりを いれます。","Ich gebe Eis in den Saft."],

/* ===== Kleidung ===== */
["👟","くつ","kutsu","Schuhe",5,"kleid","靴","げんかんで くつを ぬぎます。","Im Eingang zieht man die Schuhe aus."],
["🧢","ぼうし","booshi","Mütze, Hut",5,"kleid","帽子","ぼうしを かぶります。","Ich setze eine Mütze auf."],
["👓","めがね","megane","Brille",5,"kleid","眼鏡","めがねを かけます。","Ich setze die Brille auf."],
["👕","ティーシャツ","tiishatsu","T-Shirt",5,"kleid","","しろい ティーシャツを かいました。","Ich habe ein weißes T-Shirt gekauft."],
["👖","ズボン","zubon","Hose",5,"kleid","","あたらしい ズボンを はきます。","Ich ziehe die neue Hose an."],
["👗","ワンピース","wanpiisu","Kleid",4,"kleid","","この ワンピースは かわいいです。","Dieses Kleid ist süß."],
["👘","きもの","kimono","Kimono",4,"kleid","着物","きものを きた ことが ありますか。","Hast du schon einmal einen Kimono getragen?"],
["🧦","くつした","kutsushita","Socken",5,"kleid","靴下","くつしたを はきます。","Ich ziehe Socken an."],
["🧤","てぶくろ","tebukuro","Handschuhe",4,"kleid","手袋","さむいですから、てぶくろを します。","Weil es kalt ist, trage ich Handschuhe."],
["🧣","マフラー","mafuraa","Schal",4,"kleid","","ははに マフラーを もらいました。","Ich habe von meiner Mutter einen Schal bekommen."],
["👔","ネクタイ","nekutai","Krawatte",5,"kleid","","ちちの ひに ネクタイを あげます。","Zum Vatertag schenke ich eine Krawatte."],
["🧥","コート","kooto","Mantel",5,"kleid","","ふゆは コートを きます。","Im Winter trage ich einen Mantel."],
["💍","ゆびわ","yubiwa","Ring",4,"kleid","指輪","かれに ゆびわを もらいました。","Ich habe von meinem Freund einen Ring bekommen."],

/* ===== Natur und Wetter ===== */
["☀️","はれ","hare","sonnig",5,"natur","晴れ","きょうは はれです。","Heute ist es sonnig."],
["☁️","くもり","kumori","bewölkt",5,"natur","曇り","あしたは くもりでしょう。","Morgen wird es wohl bewölkt."],
["🌧️","あめ","ame","Regen",5,"natur","雨","あめが ふって います。","Es regnet."],
["❄️","ゆき","yuki","Schnee",5,"natur","雪","ほっかいどうは ゆきが おおいです。","In Hokkaido gibt es viel Schnee."],
["🌬️","かぜ","kaze","Wind",5,"natur","風","きょうは かぜが つよいです。","Heute ist der Wind stark."],
["⚡","かみなり","kaminari","Blitz und Donner",4,"natur","雷","かみなりは こわいです。","Gewitter ist unheimlich."],
["🌈","にじ","niji","Regenbogen",4,"natur","虹","あめの あとで にじが でました。","Nach dem Regen kam ein Regenbogen."],
["🌀","たいふう","taifuu","Taifun",4,"natur","台風","あした たいふうが きます。","Morgen kommt ein Taifun."],
["🌙","つき","tsuki","Mond",4,"natur","月","こんばんは つきが きれいです。","Heute Abend ist der Mond schön."],
["⭐","ほし","hoshi","Stern",4,"natur","星","よるは ほしが みえます。","Nachts kann man Sterne sehen."],
["🌅","あさ","asa","Morgen",5,"natur","朝","あさ ６じに おきます。","Ich stehe morgens um 6 Uhr auf."],
["🌃","よる","yoru","Nacht",5,"natur","夜","よるは しずかです。","Nachts ist es ruhig."],
["🌳","き","ki","Baum",5,"natur","木","こうえんに おおきい きが あります。","Im Park steht ein großer Baum."],
["🌷","はな","hana","Blume",5,"natur","花","ははに はなを あげます。","Ich schenke meiner Mutter Blumen."],
["🌸","さくら","sakura","Kirschblüte",4,"natur","桜","はるは さくらが きれいです。","Im Frühling sind die Kirschblüten schön."],
["🌹","バラ","bara","Rose",4,"natur","","あかい バラを かいました。","Ich habe rote Rosen gekauft."],
["💐","はなたば","hanataba","Blumenstrauß",4,"natur","花束","せんせいに はなたばを あげました。","Wir haben der Lehrerin einen Blumenstrauß geschenkt."],
["🍁","こうよう","kooyoo","Herbstlaub",4,"natur","紅葉","あきは こうようが きれいです。","Im Herbst ist das Laub schön."],
["⛰️","やま","yama","Berg",5,"natur","山","にちようびに やまへ いきます。","Am Sonntag gehe ich in die Berge."],
["🗻","ふじさん","fujisan","Berg Fuji",4,"natur","富士山","ふじさんに のぼった ことが あります。","Ich bin schon einmal auf den Fuji gestiegen."],
["🌊","うみ","umi","Meer",5,"natur","海","なつやすみに うみで およぎます。","In den Sommerferien schwimme ich im Meer."],
["🏝️","しま","shima","Insel",4,"natur","島","おきなわは きれいな しまです。","Okinawa ist eine schöne Insel."],
["🔥","ひ","hi","Feuer",4,"natur","火","ひを けして ください。","Machen Sie bitte das Feuer aus."],
["🌍","せかい","sekai","Welt",4,"natur","世界","せかいを りょこうしたいです。","Ich möchte die Welt bereisen."],

/* ===== Menschen und Körper ===== */
["👁️","め","me","Auge",5,"mensch","目","めが いたいです。","Mein Auge tut weh."],
["👂","みみ","mimi","Ohr",5,"mensch","耳","うさぎの みみは ながいです。","Hasenohren sind lang."],
["👃","はな","hana","Nase",5,"mensch","鼻","ぞうの はなは ながいです。","Die Nase des Elefanten ist lang."],
["👄","くち","kuchi","Mund",5,"mensch","口","くちを あけて ください。","Öffnen Sie bitte den Mund."],
["🦷","は","ha","Zahn",5,"mensch","歯","ねる まえに はを みがきます。","Vor dem Schlafen putze ich die Zähne."],
["✋","て","te","Hand",5,"mensch","手","てを あらいましょう。","Lass uns die Hände waschen."],
["🦶","あし","ashi","Fuß, Bein",5,"mensch","足","たくさん あるきましたから、あしが いたいです。","Ich bin viel gelaufen, deshalb tun mir die Füße weh."],
["👶","あかちゃん","akachan","Baby",4,"mensch","赤ちゃん","あかちゃんが ねて います。","Das Baby schläft."],
["👦","おとこのこ","otoko no ko","Junge",5,"mensch","男の子","あの おとこのこは だれですか。","Wer ist der Junge dort?"],
["👧","おんなのこ","onna no ko","Mädchen",5,"mensch","女の子","おんなのこが うたって います。","Das Mädchen singt."],
["👨","おとこのひと","otoko no hito","Mann",5,"mensch","男の人","あの おとこのひとは せんせいです。","Der Mann dort ist Lehrer."],
["👩","おんなのひと","onna no hito","Frau",5,"mensch","女の人","あの おんなのひとは だれですか。","Wer ist die Frau dort?"],
["👪","かぞく","kazoku","Familie",5,"mensch","家族","かぞくは ３にんです。","Wir sind eine dreiköpfige Familie."],
["🧑‍🏫","せんせい","sensee","Lehrer, Lehrerin",5,"mensch","先生","せんせいに しつもんします。","Ich stelle der Lehrerin eine Frage."],
["🧑‍⚕️","いしゃ","isha","Arzt, Ärztin",5,"mensch","医者","あには いしゃです。","Mein großer Bruder ist Arzt."],
["🧑‍🎓","がくせい","gakusee","Student, Schüler",5,"mensch","学生","わたしは がくせいです。","Ich bin Student."],
["👮","けいさつかん","keesatsukan","Polizist",4,"mensch","警察官","こうばんに けいさつかんが います。","Im Polizeiposten ist ein Polizist."],

/* ===== Tätigkeiten ===== */
["🏃","はしります","hashirimasu","rennen",5,"tun","走ります","まいあさ こうえんを はしります。","Ich laufe jeden Morgen im Park."],
["🚶","あるきます","arukimasu","zu Fuß gehen",5,"tun","歩きます","えきまで あるきます。","Ich gehe zu Fuß zum Bahnhof."],
["🏊","およぎます","oyogimasu","schwimmen",5,"tun","泳ぎます","うみで およぎます。","Ich schwimme im Meer."],
["😴","ねます","nemasu","schlafen",5,"tun","寝ます","まいばん 11じに ねます。","Ich gehe jeden Abend um 11 Uhr schlafen."],
["✍️","かきます","kakimasu","schreiben",5,"tun","書きます","なまえを かきます。","Ich schreibe meinen Namen."],
["💃","おどります","odorimasu","tanzen",4,"tun","踊ります","まつりで おどります。","Auf dem Fest wird getanzt."],
["🍳","りょうり","ryoori","Kochen",5,"tun","料理","ちちは りょうりが じょうずです。","Mein Vater kann gut kochen."],
["🧹","そうじ","sooji","Putzen",5,"tun","掃除","にちようびに へやの そうじを します。","Am Sonntag putze ich mein Zimmer."],
["🧺","せんたく","sentaku","Wäschewaschen",5,"tun","洗濯","てんきが いいですから、せんたくを します。","Weil das Wetter gut ist, wasche ich Wäsche."],
["🛍️","かいもの","kaimono","Einkaufen",5,"tun","買い物","デパートで かいものを します。","Ich gehe im Kaufhaus einkaufen."],

/* ===== Freizeit und Sport ===== */
["🎣","つり","tsuri","Angeln",4,"frei","釣り","かわへ つりに いきます。","Ich gehe zum Fluss angeln."],
["🏄","サーフィン","saafin","Surfen",4,"frei","","うみで サーフィンを します。","Ich surfe im Meer."],
["⛷️","スキー","sukii","Skifahren",4,"frei","","ふゆやすみに スキーに いきます。","In den Winterferien fahre ich Ski."],
["🎾","テニス","tenisu","Tennis",4,"frei","","どようびに テニスを します。","Am Samstag spiele ich Tennis."],
["⚽","サッカー","sakkaa","Fußball",4,"frei","","ともだちと サッカーを します。","Ich spiele mit Freunden Fußball."],
["⚾","やきゅう","yakyuu","Baseball",4,"frei","野球","にほんは やきゅうが にんきです。","In Japan ist Baseball beliebt."],
["🏐","バレーボール","bareebooru","Volleyball",4,"frei","","たいいくかんで バレーボールを します。","Wir spielen in der Sporthalle Volleyball."],
["🎳","ボーリング","booringu","Bowling",4,"frei","","しゅうまつ ボーリングに いきませんか。","Wollen wir am Wochenende bowlen gehen?"],
["🏕️","キャンプ","kyanpu","Camping",4,"frei","","なつやすみに キャンプを しました。","In den Sommerferien waren wir campen."],
["🤿","ダイビング","daibingu","Tauchen",4,"frei","","おきなわで ダイビングを して みたいです。","Ich möchte in Okinawa einmal tauchen."],
["🎡","かんらんしゃ","kanransha","Riesenrad",4,"frei","観覧車","かんらんしゃに のりたいです。","Ich möchte Riesenrad fahren."],
["🎆","はなび","hanabi","Feuerwerk",4,"frei","花火","なつは はなびを みます。","Im Sommer schaut man Feuerwerk."],
["🎸","ギター","gitaa","Gitarre",5,"frei","","あには ギターを ひきます。","Mein großer Bruder spielt Gitarre."],
["🎹","ピアノ","piano","Klavier",4,"frei","","いもうとは ピアノが じょうずです。","Meine kleine Schwester spielt gut Klavier."],
["🎬","えいが","eega","Film",5,"frei","映画","にちようびに えいがを みます。","Am Sonntag schaue ich einen Film."],
["🎵","おんがく","ongaku","Musik",5,"frei","音楽","でんしゃで おんがくを ききます。","Im Zug höre ich Musik."],
["🎤","カラオケ","karaoke","Karaoke",4,"frei","","ともだちと カラオケへ いきます。","Ich gehe mit Freunden zum Karaoke."],
["🎮","ゲーム","geemu","Videospiel",4,"frei","","おとうとは まいにち ゲームを します。","Mein kleiner Bruder spielt jeden Tag Videospiele."],

/* ===== Gefühle und Eigenschaften ===== */
["🥵","あつい","atsui","heiß",5,"gefuehl","暑い","きょうは とても あついです。","Heute ist es sehr heiß."],
["🥶","さむい","samui","kalt",5,"gefuehl","寒い","ふゆは さむいです。","Im Winter ist es kalt."],
["😋","おいしい","oishii","lecker",5,"gefuehl","","この ラーメンは おいしいです。","Diese Ramen sind lecker."],
["🍬","あまい","amai","süß",5,"gefuehl","甘い","この おかしは あまいです。","Diese Süßigkeit ist süß."],
["🌶️","からい","karai","scharf",5,"gefuehl","辛い","この りょうりは からいです。","Dieses Gericht ist scharf."],
["😊","うれしい","ureshii","froh",4,"gefuehl","嬉しい","プレゼントを もらって、うれしいです。","Ich freue mich über das Geschenk."],
["😢","かなしい","kanashii","traurig",4,"gefuehl","悲しい","えいがを みて、かなしく なりました。","Der Film hat mich traurig gemacht."],
["😠","おこります","okorimasu","wütend werden",4,"gefuehl","怒ります","ははは ときどき おこります。","Meine Mutter wird manchmal wütend."],
["😱","こわい","kowai","unheimlich, Angst haben",4,"gefuehl","怖い","ホラーえいがは こわいです。","Horrorfilme sind unheimlich."],
["😪","ねむい","nemui","müde",4,"gefuehl","眠い","きょうは とても ねむいです。","Heute bin ich sehr müde."],
["🤒","びょうき","byooki","krank, Krankheit",5,"gefuehl","病気","びょうきですから、がっこうを やすみます。","Weil ich krank bin, bleibe ich der Schule fern."],
["🤕","いたい","itai","weh tun",5,"gefuehl","痛い","あたまが いたいです。","Ich habe Kopfschmerzen."],
["❤️","すき","suki","gern mögen",5,"gefuehl","好き","わたしは ねこが すきです。","Ich mag Katzen."],
["💪","つよい","tsuyoi","stark",4,"gefuehl","強い","あには とても つよいです。","Mein großer Bruder ist sehr stark."],

/* ===== Farben ===== */
["🔴","あか","aka","Rot",5,"farbe","赤","しんごうが あかです。","Die Ampel ist rot."],
["🔵","あお","ao","Blau",5,"farbe","青","そらの いろは あおです。","Die Farbe des Himmels ist Blau."],
["🟡","きいろ","kiiro","Gelb",5,"farbe","黄色","バナナは きいろです。","Bananen sind gelb."],
["🟢","みどり","midori","Grün",5,"farbe","緑","みどりの おちゃを のみます。","Ich trinke grünen Tee."],
["⚫","くろ","kuro","Schwarz",5,"farbe","黒","くろの ペンで かいて ください。","Schreiben Sie bitte mit einem schwarzen Stift."],
["⚪","しろ","shiro","Weiß",5,"farbe","白","ゆきの いろは しろです。","Die Farbe des Schnees ist Weiß."],
["🟤","ちゃいろ","chairo","Braun",5,"farbe","茶色","ちゃいろの くつを はきます。","Ich trage braune Schuhe."],
["🟣","むらさき","murasaki","Violett",4,"farbe","紫","むらさきの はなが さいて います。","Es blühen violette Blumen."],
["🟠","オレンジ","orenji","Orange",4,"farbe","","みかんの いろは オレンジです。","Die Farbe der Mandarine ist Orange."],

/* ===== Länder ===== */
["🇯🇵","にほん","nihon","Japan",5,"land","日本","にほんへ いきたいです。","Ich möchte nach Japan."],
["🇩🇪","ドイツ","doitsu","Deutschland",5,"land","","わたしは ドイツから きました。","Ich komme aus Deutschland."],
["🇨🇳","ちゅうごく","chuugoku","China",5,"land","中国","ちゅうごくは おおきい くにです。","China ist ein großes Land."],
["🇰🇷","かんこく","kankoku","Südkorea",5,"land","韓国","かんこくの りょうりは からいです。","Koreanisches Essen ist scharf."],
["🇺🇸","アメリカ","amerika","USA",5,"land","","あねは アメリカに すんで います。","Meine große Schwester lebt in den USA."],
["🇫🇷","フランス","furansu","Frankreich",5,"land","","フランスの パンは おいしいです。","Französisches Brot ist lecker."],
["🇮🇹","イタリア","itaria","Italien",5,"land","","イタリアで ピザを たべたいです。","Ich möchte in Italien Pizza essen."],
["🇪🇸","スペイン","supein","Spanien",4,"land","","スペインは あついです。","In Spanien ist es heiß."],
["🇷🇺","ロシア","roshia","Russland",4,"land","","ロシアの ふゆは さむいです。","Der russische Winter ist kalt."],
["🇨🇦","カナダ","kanada","Kanada",4,"land","","カナダは しぜんが きれいです。","In Kanada ist die Natur schön."],
["🇧🇷","ブラジル","burajiru","Brasilien",4,"land","","ブラジルは サッカーが つよいです。","Brasilien ist stark im Fußball."],
["🇹🇭","タイ","tai","Thailand",4,"land","","タイの りょうりが すきです。","Ich mag thailändisches Essen."],
["🇻🇳","ベトナム","betonamu","Vietnam",4,"land","","ベトナムの コーヒーは あまいです。","Vietnamesischer Kaffee ist süß."],
["🇦🇺","オーストラリア","oosutoraria","Australien",4,"land","","オーストラリアは とても ひろいです。","Australien ist sehr weitläufig."],
["🇮🇩","インドネシア","indoneshia","Indonesien",4,"land","","インドネシアは しまが おおいです。","Indonesien hat viele Inseln."],
["🇹🇷","トルコ","toruko","Türkei",4,"land","","トルコの おちゃは おいしいです。","Türkischer Tee ist lecker."]
];

/* Bilder, die nur die Karteikarte schmücken. Für ein Quiz taugen sie
   nicht: Oberbegriffe wie やさい oder Wörter, deren Bild auch etwas
   anderes heißen könnte. Aufbau: [Bild, Kana wie im Vokabeltrainer] */
const BILDER_NUR_KARTE = [
  ["🥦","やさい"], ["🍒","くだもの"], ["🥘","たべもの"], ["🧋","のみもの"],
  ["🚋","のりもの"], ["🦓","どうぶつえん"], ["🏅","スポーツ"], ["📚","としょかん"],
  ["🎂","たんじょうび"], ["🎟️","チケット"], ["🛂","パスポート"], ["🏧","エーティーエム"],
  ["👕","Tシャツ"], ["🖊️","ボールペン"], ["👀","みます"], ["📖","よみます"],
  ["🎧","ききます"], ["🗣️","はなします"], ["💃","ダンス"], ["🏮","いざかや"],
  ["🥾","ハイキング"], ["🌸","はる"], ["🌻","なつ"], ["🍂","あき"], ["⛄","ふゆ"],
  ["🧹","そうじします"], ["🧺","せんたくします"], ["🍳","りょうりします"],
  ["🛍️","かいものします"], ["🗼","とうきょうタワー"], ["🏖️","なつやすみ"],
  ["🎄","クリスマス"], ["🎍","おしょうがつ"], ["💝","バレンタインデー"],
  ["🎆","はなびたいかい"], ["🍰","チーズケーキ"], ["🛋️","リビング"],
  ["📝","さくぶん"], ["📔","じしょ"], ["📕","きょうかしょ"], ["🧴","せんざい"],
  ["🌐","インターネット"], ["🕰️","じかん"], ["🏙️","まち"], ["🌇","ゆうがた"],
  ["🛣️","みち"], ["🎪","おまつり"], ["🎤","うた"], ["🏔️","エベレスト"],
  ["🌲","しぜん"], ["🏯","しゅりじょう"], ["🎓","だいがく"], ["🤝","あいます"],
  ["🧑‍💻","エンジニア"], ["🧑‍🎤","かしゅ"]
];

/* Zeichen für die Szenen unter "Zahlen und Zeit". Sie tauchen in
   keiner Liste auf, müssen aber trotzdem in bilder.svg liegen. */
const BILDER_SZENE = ["🐈","🐕","📕","⚽","🍎","🍊","👜","🧸","🔑","🍙"];

const BILDER = BILDER_ROH.map(function(r){
  return { z: r[0], kana: r[1], romaji: r[2], de: r[3], st: r[4], gr: r[5],
           kanji: r[6] || "", satz: r[7] || "", satzDe: r[8] || "" };
});

/* Name der Grafik in bilder.svg. Dieselbe Regel wie bei Twemoji: das
   Auswahlzeichen U+FE0F fällt weg, solange kein Verbinder im Spiel ist. */
function bildCode(z){
  var s = z.indexOf("‍") < 0 ? z.replace(/️/g, "") : z;
  var teile = [];
  for(var i = 0; i < s.length; i++){
    var cp = s.codePointAt(i);
    teile.push(cp.toString(16));
    if(cp > 0xffff) i++;
  }
  return teile.join("-");
}

function bildSvg(z, klasse){
  return '<svg class="bild' + (klasse ? " " + klasse : "") + '" viewBox="0 0 36 36" '
    + 'aria-hidden="true" focusable="false"><use href="bilder.svg#b-' + bildCode(z) + '"/></svg>';
}

/* Schreibweisen eines Trainerworts, unter denen ein Bild liegen kann:
   （お）ちゃ wird zu おちゃ und ちゃ, うち／いえ zu うち und いえ. */
function bildFormen(kana){
  var formen = [];
  String(kana).split("／").forEach(function(teil){
    teil = teil.replace(/[～~〜]/g, "").trim();
    [teil.replace(/[（(][^）)]*[）)]/g, ""), teil.replace(/[（）()]/g, "")].forEach(function(f){
      f = f.replace(/\s+/g, "");
      if(f && formen.indexOf(f) < 0) formen.push(f);
    });
  });
  return formen;
}

var BILD_NACH_KANA = {};
BILDER.forEach(function(b){
  var k = b.kana.replace(/\s+/g, "");
  if(!BILD_NACH_KANA[k]) BILD_NACH_KANA[k] = b;      // bei gleichem Kana gilt das erste
});
BILDER_NUR_KARTE.forEach(function(r){
  bildFormen(r[1]).forEach(function(k){
    if(!BILD_NACH_KANA[k]) BILD_NACH_KANA[k] = { z: r[0], kana: r[1], nurKarte: true };
  });
});

/* Bild zu einem Wort aus dem Vokabeltrainer, oder null. */
function bildFuerKana(kana){
  var f = bildFormen(kana);
  for(var i = 0; i < f.length; i++){
    if(BILD_NACH_KANA[f[i]]) return BILD_NACH_KANA[f[i]];
  }
  return null;
}
