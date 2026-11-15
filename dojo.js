/* ==================================================================
   道場 - Dojo
   Zusatz zum Vokabeltrainer: Bilderquiz, Paare, Zahlen und Zeit,
   Aufgaben im Format des JLPT und Lesetexte.

   Nutzt  BILDER aus bilder.js,  JLPT und LESETEXTE aus dojo-daten.js,
   V aus vokabeln.js  und die Helfer, die app.js unter window.KOTOBA
   bereitstellt. Fehlt eines davon, bleibt das Dojo einfach leer -
   der Trainer selbst läuft weiter.
   ================================================================== */
(function () {
"use strict";

var K = window.KOTOBA;
if(!K || typeof BILDER === "undefined" || typeof JLPT === "undefined") return;

var esc = K.esc, einst = K.einst;
function $(s){ return document.querySelector(s); }
function $$(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }

var RUNDE  = 10;                 // Fragen je Durchgang
var K_DOJO = "kotoba-dojo";

/* ---------- Stand ----------
   Getrennt vom Lernstand der Karteikarten: was hier passiert, verschiebt
   keine Wiederholung und macht kein Wort zum Problemwort. */
var d = K.hole(K_DOJO, {});
if(!d.b) d.b = {};               // Bilder:   Zeichen -> [richtig, falsch]
if(!d.f) d.f = {};               // Aufgaben: Kennung -> [richtig, falsch]
if(!d.z) d.z = {};               // Zahlen und Zeit: Art -> [richtig, falsch]
if(!d.t) d.t = {};               // Lesetexte: Kennung -> richtige Antworten
if(!d.best) d.best = {};         // Paare: Auswahl -> wenigste Züge
if(!d.tage) d.tage = { letzter: "", serie: 0 };
if(typeof d.blumen !== "number") d.blumen = 0;
if(!d.wahl) d.wahl = {};
var w = d.wahl;
if(!w.satz)     w.satz     = "";         // wird unten gesetzt, sobald MEINE feststeht
if(!w.richtung) w.richtung = "bw";       // bw Bild→Wort, wb Wort→Bild, hb Hören→Bild
if(!w.zart)     w.zart     = "mix";
if(w.zhoeren === undefined) w.zhoeren = false;
if(!w.kreis)    w.kreis    = { 5: "alle", 4: "alle" };
if(!w.schrift)  w.schrift  = "furi";     // furi, kana oder kanji

function sichern(){ K.lege(K_DOJO, d); }

/* ---------- Kleine Helfer ---------- */
function mische(a){
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function einer(a){ return a[Math.floor(Math.random() * a.length)]; }
function ganz(von, bis){ return von + Math.floor(Math.random() * (bis - von + 1)); }

/* Wie dringend etwas drankommen soll. s = [richtig, falsch] oder nichts. */
function gewicht(s){
  if(!s) return 6;               // noch nie gesehen
  if(s[1] > s[0]) return 5;      // öfter falsch als richtig
  if(s[0] < 2) return 2;
  return 1;
}
/* n Einträge ohne Zurücklegen, die dringenden häufiger. */
function ziehe(liste, n, gew){
  var rest = liste.slice(), aus = [];
  while(aus.length < n && rest.length){
    var summe = 0, i;
    var g = rest.map(function(x){ var v = gew ? gew(x) : 1; summe += v; return v; });
    var z = Math.random() * summe;
    for(i = 0; i < rest.length - 1; i++){ z -= g[i]; if(z <= 0) break; }
    aus.push(rest.splice(i, 1)[0]);
  }
  return aus;
}
function merke(tabelle, schluessel, ok){
  var s = tabelle[schluessel] || (tabelle[schluessel] = [0, 0]);
  s[ok ? 0 : 1] += 1;
  sichern();
}

/* ---------- Japanisch anzeigen und vorlesen ---------- */
var SCHRIFT = { furi: "ふりがな", kana: "かな", kanji: "漢字" };
var SCHRIFT_FOLGE = ["furi", "kana", "kanji"];

/* {漢字|かんじ} je nach Einstellung, [Ziel] unterstrichen, ⟦Lösung⟧ betont. */
function jp(text, modus){
  modus = modus || w.schrift;
  return esc(text)
    .replace(/\{([^|{}]+)\|([^{}]+)\}/g, function(_, oben, lesung){
      if(modus === "kana")  return lesung;
      if(modus === "kanji") return oben;
      return "<ruby>" + oben + "<rt>" + lesung + "</rt></ruby>";
    })
    .replace(/\[([^\]]+)\]/g, '<u class="ziel">$1</u>')
    .replace(/⟦([^⟧]*)⟧/g, '<b class="rein">$1</b>')
    .replace(/（　　）/g, '<span class="luecke">（　　）</span>');
}
/* Derselbe Text so, wie ihn die Stimme lesen soll. */
function klartext(text){
  return String(text)
    .replace(/\{([^|{}]+)\|[^{}]+\}/g, "$1")
    .replace(/[\[\]⟦⟧]/g, "")
    .replace(/[ＡＢ]「/g, "「")
    .replace(/\s+/g, "");
}
function sprich(text, knopf){ K.sprich(klartext(text), knopf || null, true); }

var TON_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-ton"/></svg>';

/* ---------- Tage in Folge ---------- */
var TAG = 86400000;
function tagName(t){
  var x = new Date(t);
  return x.getFullYear() + "-" + (x.getMonth() + 1) + "-" + x.getDate();
}
function tagZaehlen(){
  var h = tagName(Date.now());
  if(d.tage.letzter === h) return;
  d.tage.serie = d.tage.letzter === tagName(Date.now() - TAG) ? d.tage.serie + 1 : 1;
  d.tage.letzter = h;
}
function serie(){
  var l = d.tage.letzter;
  return (l === tagName(Date.now()) || l === tagName(Date.now() - TAG)) ? d.tage.serie : 0;
}

/* ==================================================================
   Stempel - die Zeichen, mit denen in japanischen Schulen Arbeiten
   bewertet werden: Blumenkreis, Doppelkreis, Kreis, Dreieck.
   ================================================================== */
function blumenPfad(){
  var p = "", i, t, r, x, y;
  for(i = 0; i <= 150; i++){               // Spirale, zweieinhalb Umdrehungen
    t = i / 150 * Math.PI * 5;
    r = 2 + 23 * i / 150;
    x = 50 + r * Math.cos(t - Math.PI / 2);
    y = 50 + r * Math.sin(t - Math.PI / 2);
    p += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1);
  }
  var n = 8, R = 25, a0 = Math.PI * 5 - Math.PI / 2;   // dort endet die Spirale
  for(i = 0; i < n; i++){                  // Blütenblätter ringsum
    var a1 = a0 + (i + 0.5) * 2 * Math.PI / n, a2 = a0 + (i + 1) * 2 * Math.PI / n;
    p += "Q" + (50 + 46 * Math.cos(a1)).toFixed(1) + " " + (50 + 46 * Math.sin(a1)).toFixed(1)
      + " " + (50 + R * Math.cos(a2)).toFixed(1) + " " + (50 + R * Math.sin(a2)).toFixed(1);
  }
  return p;
}
var BLUME = blumenPfad();
var STEMPEL = [
  { jp: "がんばりましょう",       de: "Weiter üben, das wird.",
    form: '<path pathLength="1" d="M50 18 84 78H16Z"/>' },
  { jp: "もう すこし",            de: "Fast, noch ein bisschen.",
    form: '<circle pathLength="1" cx="50" cy="50" r="33"/>' },
  { jp: "よく できました",        de: "Gut gemacht.",
    form: '<circle pathLength="1" cx="50" cy="50" r="36"/><circle pathLength="1" cx="50" cy="50" r="24"/>' },
  { jp: "たいへん よく できました", de: "Ausgezeichnet. Dafür gibt es einen Blumenkreis.",
    form: '<path pathLength="1" d="' + BLUME + '"/>' }
];
function stempel(stufe, klasse){
  return '<svg class="stempel' + (klasse ? " " + klasse : "") + '" viewBox="0 0 100 100" aria-hidden="true">'
    + STEMPEL[stufe].form + "</svg>";
}
function stufeNachAnteil(richtig, gesamt){
  var a = gesamt ? richtig / gesamt : 0;
  return a >= 0.9 ? 3 : a >= 0.7 ? 2 : a >= 0.4 ? 1 : 0;
}

/* ==================================================================
   Bilder: Auswahl
   ================================================================== */
/* Bildwörter, die auch im Vokabeltrainer vorkommen. */
var MEINE = (function(){
  var m = [];
  V.forEach(function(v){
    var b = bildFuerKana(v.kana);
    if(b && !b.nurKarte && m.indexOf(b) < 0) m.push(b);
  });
  return m;
})();
if(!w.satz || (w.satz === "meine" && MEINE.length < 6)) w.satz = MEINE.length >= 6 ? "meine" : "alle";

function bildPool(k){
  k = k || w.satz;
  if(k === "meine") return MEINE;
  if(k === "n5") return BILDER.filter(function(b){ return b.st === 5; });
  if(k === "n4") return BILDER.filter(function(b){ return b.st === 4; });
  if(k.indexOf("g:") === 0){
    var g = k.slice(2);
    return BILDER.filter(function(b){ return b.gr === g; });
  }
  return BILDER;
}
function satzListe(){
  var l = [{ k: "alle", name: "Alle Bilder" }];
  if(MEINE.length >= 6) l.push({ k: "meine", name: "Meine Wörter aus dem Trainer" });
  l.push({ k: "n5", name: "JLPT N5" }, { k: "n4", name: "JLPT N4" });
  Object.keys(BILDGRUPPEN).forEach(function(g){
    l.push({ k: "g:" + g, name: BILDGRUPPEN[g], gruppe: true });
  });
  return l;
}
function satzName(k){
  var l = satzListe();
  for(var i = 0; i < l.length; i++) if(l[i].k === k) return l[i].name;
  return "Alle Bilder";
}
function gewBild(b){ return gewicht(d.b[b.z]); }

/* Drei falsche Bilder: möglichst aus derselben Gruppe, nie mit gleichem
   Kana - はな ist Blume und Nase, beides wäre richtig. */
function ablenker(b, n){
  var andere  = BILDER.filter(function(x){ return x !== b && x.kana !== b.kana; });
  var gleiche = mische(andere.filter(function(x){ return x.gr === b.gr; }));
  var fremde  = mische(andere.filter(function(x){ return x.gr !== b.gr; }));
  var soll    = (b.gr === "farbe" || b.gr === "land") ? n : n - 1;
  var reihe   = gleiche.slice(0, soll).concat(fremde, gleiche.slice(soll));
  var aus = [], kana = {};
  kana[b.kana] = 1;
  for(var i = 0; i < reihe.length && aus.length < n; i++){
    if(kana[reihe[i].kana]) continue;
    kana[reihe[i].kana] = 1;
    aus.push(reihe[i]);
  }
  return aus;
}

/* Wort, Lesung, Bedeutung und Beispielsatz zu einem Bild. */
function bildInfo(b, gross){
  var h = '<div class="dwort' + (gross ? " gross" : "") + '">'
    + '<span class="dwbild">' + bildSvg(b.z) + "</span>"
    + '<span class="dwtext">'
    +   '<b class="jp">' + esc(b.kana) + "</b>"
    +   (b.kanji ? '<span class="dwkanji jp">' + esc(b.kanji) + "</span>" : "")
    +   (einst.romaji ? '<span class="dwromaji">' + esc(b.romaji) + "</span>" : "")
    +   '<span class="dwde">' + esc(b.de) + "</span>"
    + "</span>"
    + (K.spracheDa
        ? '<button class="tonknopf" data-akt="sprich" data-text="' + esc(b.kana) + '" aria-label="Aussprache anhören">' + TON_SVG + "</button>"
        : "")
    + "</div>";
  if(b.satz) h += satzKnopf(b.satz, b.satzDe, "kana");
  return h;
}
/* Ein Satz mit Übersetzung; Antippen liest ihn vor. */
function satzKnopf(satz, de, modus){
  return '<button class="dbeispiel" data-akt="sprich" data-text="' + esc(klartext(satz)) + '">'
    + '<span class="jp">' + jp(satz, modus) + "</span>"
    + (de ? '<span class="de">' + esc(de) + "</span>" : "")
    + "</button>";
}

/* ==================================================================
   Fragen bauen
   Jede Frage kennt ihre Antworten in fester, schon gemischter Folge und
   baut ihr HTML erst beim Zeichnen - so kann die Schreibweise mitten in
   einer Runde wechseln.
   ================================================================== */
function hoerKopf(text, mitText){
  if(!K.spracheDa) return '<div class="dsatz jp">' + jp(text) + "</div>";
  return '<div class="dhoerfeld">'
    + '<button class="dhoer" data-akt="hoer" aria-label="Noch einmal anhören">' + TON_SVG + "</button>"
    + '<span class="dhoertipp">Tippen zum Wiederholen</span>'
    + (mitText
        ? '<button class="dtextzeigen" data-akt="textZeigen">Text zeigen</button>'
          + '<div class="dsatz jp" id="dHoerText" hidden>' + jp(text) + "</div>"
        : "")
    + "</div>";
}

/* ---------- Bilderquiz ---------- */
function bildFrage(b){
  var rtg = w.richtung;
  if(rtg === "hb" && !K.spracheDa) rtg = "wb";
  var alle = mische([b].concat(ablenker(b, 3)));
  return {
    auftragJp: rtg === "bw" ? "これは なんですか。" : rtg === "wb" ? "どれですか。" : "",
    auftrag:   rtg === "bw" ? "Was ist das?" : rtg === "wb" ? "Welches Bild passt?" : "Hör zu. Welches Bild passt?",
    form: rtg === "bw" ? "wort" : "bild",
    ton: rtg === "hb" ? b.kana : null,
    nachTon: rtg === "hb" ? null : b.kana,
    bau: function(){
      return {
        kopf: rtg === "bw" ? '<div class="dgrossbild">' + bildSvg(b.z) + "</div>"
            : rtg === "wb" ? '<div class="wort jp">' + esc(b.kana) + "</div>"
            : hoerKopf(b.kana, false),
        opt: alle.map(function(x, i){
          return { ok: x === b,
                   label: rtg === "bw" ? "" : "Bild " + (i + 1),
                   html: rtg === "bw" ? '<span class="jp">' + esc(x.kana) + "</span>" : bildSvg(x.z) };
        }),
        loesung: bildInfo(b)
      };
    },
    kurz: function(){
      return bildSvg(b.z) + '<span><b class="jp">' + esc(b.kana) + "</b> " + esc(b.de) + "</span>";
    },
    merke: function(ok){ merke(d.b, b.z, ok); }
  };
}
function bildRunde(){
  var pool = bildPool();
  return ziehe(pool, RUNDE, gewBild).map(bildFrage);
}

/* ---------- Zahlen und Zeit: Wörter ---------- */
var STUNDEN = ["", "いちじ", "にじ", "さんじ", "よじ", "ごじ", "ろくじ", "しちじ", "はちじ",
               "くじ", "じゅうじ", "じゅういちじ", "じゅうにじ"];
var MINUTEN = { 0: "", 5: "ごふん", 10: "じゅっぷん", 15: "じゅうごふん", 20: "にじゅっぷん",
                25: "にじゅうごふん", 30: "はん", 35: "さんじゅうごふん", 40: "よんじゅっぷん",
                45: "よんじゅうごふん", 50: "ごじゅっぷん", 55: "ごじゅうごふん" };
var EINER   = ["", "いち", "に", "さん", "よん", "ご", "ろく", "なな", "はち", "きゅう"];
var ZEHNER  = ["", "じゅう", "にじゅう", "さんじゅう", "よんじゅう", "ごじゅう", "ろくじゅう",
               "ななじゅう", "はちじゅう", "きゅうじゅう"];
var HUNDERT = ["", "ひゃく", "にひゃく", "さんびゃく", "よんひゃく", "ごひゃく", "ろっぴゃく",
               "ななひゃく", "はっぴゃく", "きゅうひゃく"];
var TAUSEND = ["", "せん", "にせん", "さんぜん", "よんせん", "ごせん", "ろくせん", "ななせん",
               "はっせん", "きゅうせん"];
var STUECK  = ["", "ひとつ", "ふたつ", "みっつ", "よっつ", "いつつ", "むっつ", "ななつ", "やっつ",
               "ここのつ", "とお"];
var MONATE  = ["", "いちがつ", "にがつ", "さんがつ", "しがつ", "ごがつ", "ろくがつ", "しちがつ",
               "はちがつ", "くがつ", "じゅうがつ", "じゅういちがつ", "じゅうにがつ"];
var MONATE_DE = ["", "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August",
                 "September", "Oktober", "November", "Dezember"];
var TAGE_BESONDERS = { 1: "ついたち", 2: "ふつか", 3: "みっか", 4: "よっか", 5: "いつか", 6: "むいか",
                       7: "なのか", 8: "ようか", 9: "ここのか", 10: "とおか", 14: "じゅうよっか",
                       17: "じゅうしちにち", 19: "じゅうくにち", 20: "はつか", 24: "にじゅうよっか",
                       27: "にじゅうしちにち", 29: "にじゅうくにち" };
var WOCHENTAGE = [["日", "にちようび", "Sonntag"], ["月", "げつようび", "Montag"],
                  ["火", "かようび", "Dienstag"], ["水", "すいようび", "Mittwoch"],
                  ["木", "もくようび", "Donnerstag"], ["金", "きんようび", "Freitag"],
                  ["土", "どようび", "Samstag"]];

/* Zahl in Teilen, damit sich さんぜん ろっぴゃく lesen lässt. */
function zahlTeile(n){
  var t = [];
  if(n >= 10000){ t.push(EINER[Math.floor(n / 10000)] + "まん"); n %= 10000; }
  if(n >= 1000){ t.push(TAUSEND[Math.floor(n / 1000)]); n %= 1000; }
  if(n >= 100){ t.push(HUNDERT[Math.floor(n / 100)]); n %= 100; }
  if(n >= 10){ t.push(ZEHNER[Math.floor(n / 10)]); n %= 10; }
  if(n > 0) t.push(EINER[n]);
  return t;
}
function tagKana(t){ return TAGE_BESONDERS[t] || zahlTeile(t).join("") + "にち"; }
function tausender(n){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function zwei(n){ return n < 10 ? "0" + n : "" + n; }

/* Bis zu n andere Werte, die sich im Text vom Ziel und voneinander unterscheiden. */
function andereWerte(ziel, kandidaten, n, text){
  var aus = [], gesehen = {};
  gesehen[text(ziel)] = 1;
  for(var i = 0; i < kandidaten.length && aus.length < n; i++){
    var t = text(kandidaten[i]);
    if(gesehen[t]) continue;
    gesehen[t] = 1;
    aus.push(kandidaten[i]);
  }
  return aus;
}

/* ---------- Zahlen und Zeit: Bilder ---------- */
function uhrBild(h, m){
  var s = '<svg class="uhr" viewBox="0 0 100 100" aria-hidden="true">'
    + '<circle class="uhrrand" cx="50" cy="50" r="46"/>';
  for(var i = 1; i <= 12; i++){
    var a = i * Math.PI / 6;
    s += '<line class="uhrstrich" x1="50" y1="7.5" x2="50" y2="' + (i % 3 === 0 ? 13 : 11) + '" transform="rotate(' + (i * 30) + ' 50 50)"/>'
      + '<text class="uhrzahl" x="' + (50 + 32 * Math.sin(a)).toFixed(1) + '" y="' + (53.6 - 32 * Math.cos(a)).toFixed(1) + '">' + i + "</text>";
  }
  return s
    + '<line class="uhrstunde" x1="50" y1="50" x2="50" y2="29" transform="rotate(' + ((h % 12) * 30 + m / 2) + ' 50 50)"/>'
    + '<line class="uhrminute" x1="50" y1="50" x2="50" y2="14" transform="rotate(' + (m * 6) + ' 50 50)"/>'
    + '<circle class="uhrmitte" cx="50" cy="50" r="3"/></svg>';
}
function preisBild(ware, n){
  return '<div class="preis">' + bildSvg(ware) + '<span class="pschild"><i>¥</i>' + tausender(n) + "</span></div>";
}
function anzahlBild(zeichen, n){
  var h = '<div class="anzahl">';
  for(var i = 0; i < n; i++) h += bildSvg(zeichen);
  return h + "</div>";
}
function kalenderBild(monat, tag, wtag){
  return '<div class="kalender"><span class="kmonat jp">' + monat + "月</span>"
    + '<span class="ktag">' + tag + "</span>"
    + '<span class="kwtag jp">' + WOCHENTAGE[wtag][0] + "曜日</span></div>";
}

/* Szene mit Tisch und Schachtel. Alles selbst gezeichnet; nur der
   Gegenstand kommt aus bilder.svg. */
var BODEN = 74;
function szTisch(x, b){
  var y = BODEN - Math.round(b * 0.72);
  return '<rect x="' + x + '" y="' + y + '" width="' + b + '" height="5" rx="1.5" fill="#A9744F"/>'
    + '<rect x="' + (x + 4) + '" y="' + (y + 5) + '" width="4" height="' + (BODEN - y - 5) + '" fill="#8C5E3C"/>'
    + '<rect x="' + (x + b - 8) + '" y="' + (y + 5) + '" width="4" height="' + (BODEN - y - 5) + '" fill="#8C5E3C"/>';
}
function szKiste(x, b, inhalt){
  var h = Math.round(b * 0.62), y = BODEN - h;
  return '<path d="M' + x + " " + y + "l-7 -7M" + (x + b) + " " + y + 'l7 -7" stroke="#C4935A" stroke-width="3.2" stroke-linecap="round"/>'
    + '<rect x="' + x + '" y="' + (y - 5) + '" width="' + b + '" height="7" rx="1" fill="#8F6238"/>'
    + (inhalt || "")
    + '<rect x="' + x + '" y="' + y + '" width="' + b + '" height="' + h + '" rx="1.5" fill="#D7A86E"/>'
    + '<rect x="' + (x + b / 2 - 6) + '" y="' + (y + 6) + '" width="12" height="6" rx="1" fill="#F3E3C3"/>';
}
function szDing(z, x, y, s){
  return '<use href="bilder.svg#b-' + bildCode(z) + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '"/>';
}
var LAGEN = [
  { k: "tu", jp: "つくえの うえ",        de: "auf dem Tisch" },
  { k: "ts", jp: "つくえの した",        de: "unter dem Tisch" },
  { k: "tm", jp: "つくえの みぎ",        de: "rechts vom Tisch" },
  { k: "th", jp: "つくえの ひだり",      de: "links vom Tisch" },
  { k: "hn", jp: "はこの なか",          de: "in der Schachtel" },
  { k: "hm", jp: "はこの みぎ",          de: "rechts von der Schachtel" },
  { k: "hh", jp: "はこの ひだり",        de: "links von der Schachtel" },
  { k: "aa", jp: "つくえと はこの あいだ", de: "zwischen Tisch und Schachtel" }
];
function lageBild(z, k){
  var S = 24, unten = BODEN - S, innen;
  if(k === "tu") innen = szTisch(36, 48) + szDing(z, 48, BODEN - 35 - S, S);
  if(k === "ts") innen = szDing(z, 48, unten, S) + szTisch(36, 48);
  if(k === "tm") innen = szTisch(30, 48) + szDing(z, 88, unten, S);
  if(k === "th") innen = szTisch(42, 48) + szDing(z, 8, unten, S);
  if(k === "hn") innen = szKiste(40, 40, szDing(z, 48, BODEN - 25 - 16, S));
  if(k === "hm") innen = szKiste(32, 40) + szDing(z, 84, unten, S);
  if(k === "hh") innen = szKiste(48, 40) + szDing(z, 12, unten, S);
  if(k === "aa") innen = szTisch(4, 36) + szDing(z, 48, unten, S) + szKiste(82, 34);
  return '<svg class="szene" viewBox="0 0 120 84" aria-hidden="true">' + innen
    + '<line class="boden" x1="2" y1="' + (BODEN + 0.75) + '" x2="118" y2="' + (BODEN + 0.75) + '"/></svg>';
}

var WAREN = [["🍎", "りんご", 1], ["🍙", "おにぎり", 1], ["🍩", "ドーナツ", 1], ["☕", "コーヒー", 1],
             ["🧃", "ジュース", 1], ["🍰", "ケーキ", 1], ["📖", "ほん", 2], ["☂️", "かさ", 2],
             ["👕", "ティーシャツ", 2], ["🧢", "ぼうし", 2], ["🧣", "マフラー", 2], ["👟", "くつ", 3],
             ["👜", "かばん", 3], ["⌚", "うでどけい", 3], ["📷", "カメラ", 3]];
var ZAEHLBAR = [["🍎", "りんご", "Apfel", "Äpfel"], ["🍊", "みかん", "Mandarine", "Mandarinen"],
                ["🍙", "おにぎり", "Reisball", "Reisbälle"], ["🥚", "たまご", "Ei", "Eier"],
                ["🍩", "ドーナツ", "Donut", "Donuts"], ["🍪", "クッキー", "Keks", "Kekse"],
                ["🍅", "トマト", "Tomate", "Tomaten"], ["🍑", "もも", "Pfirsich", "Pfirsiche"]];
var ZAHLWORT_DE = ["", "ein", "zwei", "drei", "vier", "fünf", "sechs", "sieben", "acht", "neun", "zehn"];
var DINGE = [["🐈", "ねこ", "Die Katze", true], ["🐕", "いぬ", "Der Hund", true],
             ["📕", "ほん", "Das Buch", false], ["⚽", "ボール", "Der Ball", false],
             ["🍎", "りんご", "Der Apfel", false], ["👜", "かばん", "Die Tasche", false],
             ["🧸", "ぬいぐるみ", "Das Plüschtier", false]];

/* ---------- Zahlen und Zeit: Erzeuger ----------
   Jeder liefert das Ziel und drei falsche Fassungen, je mit Bild, Text
   zum Lesen und Satz zum Hören. */
var ZARTEN = {
  mix:   { name: "Gemischt" },
  uhr:   { name: "Uhrzeit",  zeichen: "時" },
  preis: { name: "Preise",   zeichen: "円" },
  zahl:  { name: "Zählen",   zeichen: "数" },
  datum: { name: "Datum",    zeichen: "日" },
  lage:  { name: "Lage",     zeichen: "上" }
};

var ERZEUGER = {
  uhr: function(){
    function wert(h, m){
      return { bild: uhrBild(h, m), text: STUNDEN[h] + (m ? " " + MINUTEN[m] : ""),
               satz: "いま、" + STUNDEN[h] + (m ? " " + MINUTEN[m] : "") + "です。", de: h + ":" + zwei(m) + " Uhr" };
    }
    var h = ganz(1, 12);
    var m = Math.random() < 0.55 ? einer([0, 0, 30]) : einer([5, 10, 15, 20, 25, 35, 40, 45, 50, 55]);
    var ziel = wert(h, m), k = [];
    k.push(wert(einer([4, 7, 9, 1, 6, 8].filter(function(x){ return x !== h; })), m));
    k.push(wert(h, m === 30 ? 0 : m === 0 ? 30 : einer([m === 15 ? 45 : 15, m === 10 ? 40 : 10])));
    for(var i = 0; i < 24; i++) k.push(wert(ganz(1, 12), einer([0, 30, m])));
    return { art: "uhr", frageJp: "いま なんじですか。", frage: "Wie spät ist es?",
             ziel: ziel, falsch: andereWerte(ziel, k, 3, function(x){ return x.text; }) };
  },

  preis: function(){
    var ware = einer(WAREN);
    function wert(n){
      return { bild: preisBild(ware[0], n), text: zahlTeile(n).join(" ") + "えん",
               satz: "この " + ware[1] + "は " + zahlTeile(n).join(" ") + "えんです。",
               de: tausender(n) + " Yen" };
    }
    var n;
    if(ware[2] === 1)      n = einer([ganz(1, 9) * 100, ganz(1, 9) * 100 + ganz(1, 9) * 10]);
    else if(ware[2] === 2) n = einer([ganz(1, 4) * 1000, ganz(1, 4) * 1000 + ganz(1, 9) * 100]);
    else                   n = einer([ganz(5, 9) * 1000, ganz(5, 9) * 1000 + ganz(1, 9) * 100, 10000, ganz(1, 3) * 10000]);
    var ziel = wert(n), k = [];
    /* Verwechselbares zuerst: 300, 600 und 800 sowie 3000 und 8000 klingen anders als erwartet. */
    var h = Math.floor(n % 1000 / 100), t = Math.floor(n % 10000 / 1000);
    if(h) k.push(n + (einer([3, 6, 8].filter(function(x){ return x !== h; })) - h) * 100);
    if(t) k.push(n + (einer([3, 8, 4, 7].filter(function(x){ return x !== t; })) - t) * 1000);
    if(n < 1000) k.push(n * 10); else if(n % 1000 === 0 && n <= 10000) k.push(n / 10);
    for(var i = 0; i < 10; i++){
      var faktor = n >= 1000 ? 1000 : 100;
      k.push(Math.max(faktor, n + ganz(-4, 4) * faktor));
      k.push(Math.max(100, n + ganz(-4, 4) * 100));
    }
    k = k.filter(function(x){ return x > 0 && x <= 99900; }).map(wert);
    return { art: "preis", frageJp: "いくらですか。", frage: "Was kostet das?",
             ziel: ziel, falsch: andereWerte(ziel, k, 3, function(x){ return x.text; }) };
  },

  zahl: function(){
    var ding = einer(ZAEHLBAR);
    function wert(n){
      return { bild: anzahlBild(ding[0], n), text: STUECK[n],
               satz: ding[1] + "が " + STUECK[n] + " あります。",
               de: ZAHLWORT_DE[n] + " " + (n === 1 ? ding[2] : ding[3]) };
    }
    var n = ganz(1, 10), ziel = wert(n);
    var nah = { 4: [8, 6], 8: [4, 6], 6: [8, 4], 9: [10, 5], 10: [9, 7], 2: [3, 1], 3: [2, 6], 1: [2, 5], 5: [9, 7], 7: [9, 5] };
    var k = nah[n].concat(mische([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])).map(wert);
    return { art: "zahl", frageJp: "いくつ ありますか。", frage: "Wie viele sind es?",
             ziel: ziel, falsch: andereWerte(ziel, k, 3, function(x){ return x.text; }) };
  },

  datum: function(){
    var was = einer(["tag", "tag", "monat", "wtag"]);
    var monat = ganz(1, 12), wtag = ganz(0, 6);
    var tag = Math.random() < 0.8 ? einer([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 20, 24]) : ganz(11, 28);
    function wert(mo, t, wt){
      var text = was === "tag" ? tagKana(t) : was === "monat" ? MONATE[mo] : WOCHENTAGE[wt][1];
      return { bild: kalenderBild(mo, t, wt), text: text,
               satz: "きょうは " + MONATE[mo] + " " + tagKana(t) + "、" + WOCHENTAGE[wt][1] + "です。",
               de: t + ". " + MONATE_DE[mo] + ", " + WOCHENTAGE[wt][2] };
    }
    var ziel = wert(monat, tag, wtag), k = [], i;
    if(was === "tag"){
      var nah = { 2: [20, 3], 20: [2, 10], 4: [8, 14], 8: [4, 9], 5: [6, 9], 6: [7, 5], 7: [6, 9],
                  9: [10, 5], 10: [9, 20], 1: [2, 7], 3: [6, 2], 14: [4, 24], 24: [14, 4] };
      (nah[tag] || []).concat(mische([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 14, 20, 24])).forEach(function(t){
        k.push(wert(monat, t, wtag));
      });
    }else if(was === "monat"){
      var nahM = { 4: [7, 9], 7: [4, 1], 9: [4, 6] };
      (nahM[monat] || []).concat(mische([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).forEach(function(mo){
        k.push(wert(mo, tag, wtag));
      });
    }else{
      for(i = 1; i < 7; i++) k.push(wert(monat, tag, (wtag + i) % 7));
      mische(k);
    }
    var fragen = { tag: ["なんにちですか。", "Der Wievielte ist es?"],
                   monat: ["なんがつですか。", "Welcher Monat ist es?"],
                   wtag: ["なんようびですか。", "Welcher Wochentag ist es?"] };
    return { art: "datum", frageJp: fragen[was][0], frage: fragen[was][1],
             ziel: ziel, falsch: andereWerte(ziel, k, 3, function(x){ return x.text; }) };
  },

  lage: function(){
    var ding = einer(DINGE), verb = ding[3] ? "います" : "あります";
    function wert(l){
      return { bild: lageBild(ding[0], l.k), text: l.jp,
               satz: ding[1] + "は " + l.jp + "に " + verb + "。",
               de: ding[2] + " ist " + l.de + "." };
    }
    var l = einer(LAGEN), ziel = wert(l);
    var selber = mische(LAGEN.filter(function(x){ return x !== l && x.k.charAt(0) === l.k.charAt(0); }));
    var rest   = mische(LAGEN.filter(function(x){ return x !== l && x.k.charAt(0) !== l.k.charAt(0); }));
    var artikel = ding[2].charAt(0).toLowerCase() + ding[2].slice(1);
    return { art: "lage", frageJp: ding[1] + "は どこに " + verb + "か。", frage: "Wo ist " + artikel + "?",
             ziel: ziel, falsch: selber.concat(rest).slice(0, 3).map(wert) };
  }
};

function zahlFrage(){
  var art = w.zart === "mix" ? einer(["uhr", "preis", "zahl", "datum", "lage"]) : w.zart;
  var g = ERZEUGER[art]();
  var hoeren = w.zhoeren && K.spracheDa;
  var alle = mische([g.ziel].concat(g.falsch));
  var lang = alle.some(function(x){ return x.text.length > 9; });
  return {
    auftragJp: hoeren ? "" : g.frageJp,
    auftrag: hoeren ? "Hör zu. Welches Bild passt?" : g.frage,
    form: hoeren ? "bild szenen" : (lang ? "satz" : "wort"),
    ton: hoeren ? g.ziel.satz : null,
    nachTon: hoeren ? null : g.ziel.satz,
    bau: function(){
      return {
        kopf: hoeren ? hoerKopf(g.ziel.satz, false) : '<div class="dszene">' + g.ziel.bild + "</div>",
        opt: alle.map(function(x, i){
          return { ok: x === g.ziel, label: hoeren ? "Bild " + (i + 1) : "",
                   html: hoeren ? x.bild : '<span class="jp">' + esc(x.text) + "</span>" };
        }),
        loesung: satzKnopf(g.ziel.satz, g.ziel.de, "kana")
      };
    },
    kurz: function(){
      return '<span class="dkurzzeichen jp">' + ZARTEN[g.art].zeichen + "</span>"
        + '<span><b class="jp">' + esc(g.ziel.text) + "</b> " + esc(g.ziel.de) + "</span>";
    },
    merke: function(ok){ merke(d.z, g.art, ok); }
  };
}
function zahlRunde(){
  var f = [];
  for(var i = 0; i < RUNDE; i++) f.push(zahlFrage());
  return f;
}

/* ---------- JLPT ---------- */
function jlptPool(st, kreis){
  return JLPT.filter(function(a){
    return a.st === st && (kreis === "alle" || JLPT_TYPEN[a.typ].kreis === kreis);
  });
}
function optForm(texte){
  var laengste = 0;
  texte.forEach(function(t){ laengste = Math.max(laengste, klartext(t).length); });
  return laengste > 8 ? "satz" : "wort";
}

function jlptFrage(a){
  var typ = JLPT_TYPEN[a.typ];
  var richtig = a.typ === "stern" ? a.teile[a.stelle] : a.opt[0];
  var alle = mische((a.typ === "stern" ? a.teile : a.opt).slice());
  var q = {
    auftragJp: "", auftrag: typ.auftrag, marke: typ.name,
    form: optForm(alle),
    ton: null, nachTon: null,
    merke: function(ok){ merke(d.f, a.id, ok); }
  };
  var ganzerSatz, vorlesen;            // Lösung als Satz, einmal zum Zeigen, einmal zum Hören

  if(a.typ === "lesung"){
    ganzerSatz = a.satz.replace(/\[([^\]]+)\]/, "[{$1|" + richtig + "}]");
    vorlesen   = a.satz;
  }else if(a.typ === "schrift"){
    ganzerSatz = a.satz.replace(/\[([^\]]+)\]/, "[{" + richtig + "|$1}]");
    vorlesen   = a.satz.replace(/\[[^\]]+\]/, richtig);
  }else if(a.typ === "kontext" || a.typ === "grammatik"){
    ganzerSatz = a.satz.replace("（　　）", "⟦" + richtig + "⟧");
    vorlesen   = ganzerSatz;
  }else if(a.typ === "stern"){
    ganzerSatz = a.vor + " " + a.teile.map(function(t, i){ return i === a.stelle ? "⟦" + t + "⟧" : t; }).join(" ") + " " + a.nach;
    vorlesen   = ganzerSatz;
  }else if(a.typ === "antwort"){
    q.ton = a.hoer;
    ganzerSatz = "「" + a.hoer + "」 「" + richtig + "」";
    vorlesen   = a.hoer + "　" + richtig;
  }else{
    ganzerSatz = richtig;
    vorlesen   = richtig;
  }
  if(a.typ === "ausdruck") q.auftrag = a.lage;

  q.bau = function(){
    var kopf;
    if(a.typ === "stern"){
      kopf = '<div class="dsatz jp">' + jp(a.vor) + " "
        + a.teile.map(function(_, i){
            return i === a.stelle ? '<span class="lz st">★</span>' : '<span class="lz"></span>';
          }).join("")
        + " " + jp(a.nach) + "</div>";
    }else if(a.typ === "ausdruck"){
      kopf = '<div class="dgrossbild klein">' + bildSvg(a.bild) + "</div>";
    }else if(a.typ === "gebrauch"){
      kopf = '<div class="wort jp">' + jp(a.wort) + "</div>";
    }else if(a.typ === "antwort"){
      kopf = hoerKopf(a.hoer, true);
    }else{
      kopf = '<div class="dsatz jp">' + jp(a.satz) + "</div>";
    }
    /* Bei "Kanji lesen" und "Schreibung" sind die Antworten selbst die Sache. */
    var roh = a.typ === "lesung" || a.typ === "schrift";
    var zeigModus = a.typ === "lesung" || a.typ === "schrift" ? "furi" : null;
    return {
      kopf: kopf,
      opt: alle.map(function(o){
        return { ok: o === richtig, label: "",
                 html: '<span class="jp">' + (roh ? esc(o) : jp(o)) + "</span>" };
      }),
      loesung:
          (a.typ === "gebrauch"
            ? '<p class="dtipp"><b class="jp">' + jp(a.wort) + "</b> = " + esc(a.de) + "</p>" : "")
        + satzKnopf(ganzerSatz, a.typ === "gebrauch" || a.typ === "ausdruck" ? "" : a.de, zeigModus)
        + '<p class="dtipp">' + jp(a.tipp, "kanji") + "</p>"
    };
  };
  q.kurz = function(){
    return '<span class="dkurzzeichen">' + esc(typ.name) + "</span>"
      + '<span class="jp">' + jp(ganzerSatz, a.typ === "lesung" || a.typ === "schrift" ? "furi" : null) + "</span>";
  };
  q.vorlesen = vorlesen;
  q.nachTon = a.typ === "antwort" ? null : vorlesen;
  return q;
}
function jlptRunde(st){
  var pool = jlptPool(st, w.kreis[st] || "alle");
  return ziehe(pool, RUNDE, function(a){ return gewicht(d.f[a.id]); }).map(jlptFrage);
}

/* ==================================================================
   Ansichten
   ================================================================== */
var ansicht = "hub";
var stufe   = 5;             // gewählte JLPT-Stufe
var runde   = null;          // laufendes Quiz
var paare   = null;          // laufendes Paarspiel
var textNr  = -1;            // geöffneter Lesetext
var textAntworten = [];      // je Frage die gewählte Antwort oder -1

function inhalt(){ return $("#dojoInhalt"); }
function nachOben(){
  window.scrollTo({ top: 0, behavior: "instant" in document.body.style ? "instant" : "auto" });
}

function kopfHtml(titel, ziel, rechts){
  return '<div class="dkopf">'
    + '<button class="dzurueck" data-akt="geh" data-ziel="' + (ziel || "hub") + '" aria-label="Zurück">'
    +   '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    + "</button>"
    + "<h2>" + titel + "</h2>" + (rechts || "") + "</div>";
}
function schriftPille(){
  return '<button class="dpille jp" data-akt="schrift" aria-label="Schreibweise wechseln: '
    + SCHRIFT[w.schrift] + '">' + SCHRIFT[w.schrift] + "</button>";
}
function segment(akt, wert, eintraege){
  return '<div class="segment" role="group">' + eintraege.map(function(e){
    return '<button data-akt="' + akt + '" data-wert="' + e[0] + '" aria-pressed="'
      + (String(e[0]) === String(wert) ? "true" : "false") + '">' + e[1] + "</button>";
  }).join("") + "</div>";
}
function wahlKnopf(akt, name, zahl){
  return '<button class="filterknopf" data-akt="' + akt + '" aria-haspopup="dialog">'
    + '<span class="fname">' + esc(name) + "</span>"
    + '<span class="fzahl">' + esc(zahl) + "</span>"
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-pfeil"/></svg></button>';
}

/* ---------- Übersicht ---------- */
function geloest(st){
  return JLPT.filter(function(a){ return a.st === st && d.f[a.id] && d.f[a.id][0] > 0; }).length;
}
function hubKachel(zeichen, titel, text, zahl, daten){
  return '<button class="dkachel" data-akt="geh" ' + daten + ">"
    + '<span class="dzeichen jp">' + zeichen + "</span>"
    + '<span class="dtext"><b>' + titel + "</b><span>" + text + "</span></span>"
    + (zahl ? '<span class="dzahl">' + zahl + "</span>" : "")
    + "</button>";
}
function zeichneHub(){
  var gesehen = BILDER.filter(function(b){ return d.b[b.z] && d.b[b.z][0] > 0; }).length;
  var n5 = JLPT.filter(function(a){ return a.st === 5; }).length;
  var n4 = JLPT.filter(function(a){ return a.st === 4; }).length;
  var gelesen = LESETEXTE.filter(function(t){ return d.t[t.id] !== undefined; }).length;
  var s = serie();

  inhalt().innerHTML =
      '<div class="dhubkopf">'
    +   '<div class="dname"><b class="jp">道場</b><span>Dojo</span></div>'
    +   '<div class="dmarken">'
    +     (s > 1 ? '<span class="dmarke">' + s + " Tage in Folge</span>" : "")
    +     '<span class="dmarke" aria-label="' + d.blumen + ' Blumenkreise">' + stempel(3, "mini") + d.blumen + "</span>"
    +   "</div>"
    + "</div>"
    + "<h3>Bilder</h3>"
    + hubKachel("絵", "Bilderquiz", "Bild und Wort zuordnen, auch nach Gehör", gesehen + " / " + BILDER.length, 'data-ziel="bild"')
    + hubKachel("組", "Paare finden", "Memory mit Bild und Wort", "", 'data-ziel="paare"')
    + hubKachel("数", "Zahlen und Zeit", "Uhr, Preise, Zählen, Datum und Lage", "", 'data-ziel="zahl"')
    + hubKachel("図", "Bilderbuch", "Alle Bilder mit Wort und Beispielsatz", "", 'data-ziel="buch"')
    + "<h3>Wie in der Prüfung</h3>"
    + hubKachel("五", "JLPT N5", "Schrift, Wortschatz, Grammatik, Hören", geloest(5) + " / " + n5, 'data-ziel="jlpt" data-stufe="5"')
    + hubKachel("四", "JLPT N4", "Dasselbe eine Stufe höher", geloest(4) + " / " + n4, 'data-ziel="jlpt" data-stufe="4"')
    + hubKachel("読", "Lesetexte", "Kurze Texte und Aushänge mit Fragen", gelesen + " / " + LESETEXTE.length, 'data-ziel="texte"')
    + '<p class="dquelle">Alle Aufgaben und Texte sind eigens für diese App geschrieben. '
    +   "Die echten Beispielaufgaben stellt die Prüfungsstelle kostenlos bereit: "
    +   '<a href="https://www.jlpt.jp/e/samples/forlearners.html" target="_blank" rel="noopener">jlpt.jp</a>. '
    +   "Bilder: Twemoji, CC-BY 4.0.</p>";
}

/* ---------- Quiz: Rahmen ---------- */
var QUIZ = {
  bild: {
    titel: function(){ return "Bilderquiz"; },
    wahl: function(){
      return wahlKnopf("satzBlatt", satzName(w.satz), bildPool().length + " Bilder")
        + segment("richtung", w.richtung,
            [["bw", "Bild → Wort"], ["wb", "Wort → Bild"]].concat(K.spracheDa ? [["hb", "Hören"]] : []));
    },
    runde: bildRunde
  },
  zahl: {
    titel: function(){ return "Zahlen und Zeit"; },
    wahl: function(){
      return wahlKnopf("zartBlatt", ZARTEN[w.zart].name, "")
        + (K.spracheDa ? segment("zhoeren", w.zhoeren ? 1 : 0, [[0, "Lesen"], [1, "Hören"]]) : "");
    },
    runde: zahlRunde
  },
  jlpt: {
    titel: function(){ return "JLPT N" + stufe; },
    rechts: schriftPille,
    wahl: function(){
      return segment("kreis", w.kreis[stufe] || "alle",
        [["alle", "Gemischt"], ["wort", "Wörter"], ["gram", "Grammatik"], ["hoer", "Hören"]]);
    },
    runde: function(){ return jlptRunde(stufe); }
  }
};

function zeichneQuiz(){
  var q = QUIZ[ansicht];
  inhalt().innerHTML = kopfHtml(q.titel(), "hub", q.rechts ? q.rechts() : "")
    + '<div class="dwahl">' + q.wahl() + "</div>"
    + '<div id="dSpiel"></div>';
  if(!runde) rundeNeu(); else zeichneFrage();
}
function rundeNeu(){
  var fragen = QUIZ[ansicht].runde();
  runde = { fragen: fragen, i: 0, richtig: 0, falsch: [], wahl: -1, ende: false };
  if(!fragen.length){
    $("#dSpiel").innerHTML = '<div class="leer"><span class="zeichen jp">空</span>In dieser Auswahl liegt noch nichts.</div>';
    return;
  }
  zeichneFrage(true);
}

function zeichneFrage(neu){
  var r = runde;
  if(r.ende){ zeichneErgebnis(); return; }
  var q = r.fragen[r.i], b = q.bau();
  r.anzahl = b.opt.length;

  var h = '<div class="sitzung"><span>' + (r.i + 1) + '</span><span class="spur"><i style="width:'
    + Math.round(r.i / r.fragen.length * 100) + '%"></i></span><span>' + r.fragen.length + "</span></div>"
    + '<p class="dauftrag">'
    +   (q.marke ? '<span class="dtyp">' + esc(q.marke) + "</span>" : "")
    +   (q.auftragJp ? '<span class="jp">' + esc(q.auftragJp) + "</span> " : "")
    +   esc(q.auftrag) + "</p>"
    + '<div class="dkarte">' + b.kopf + "</div>"
    + '<div class="dopts ' + q.form + '">'
    + b.opt.map(function(o, i){
        var klasse = "dopt";
        if(r.wahl >= 0){
          if(o.ok) klasse += " ok";
          else if(i === r.wahl) klasse += " falsch";
          else klasse += " blass";
        }
        return '<button class="' + klasse + '" data-akt="antwort" data-i="' + i + '"'
          + (o.label ? ' aria-label="' + esc(o.label) + '"' : "")
          + (r.wahl >= 0 ? " disabled" : "") + ">" + o.html + "</button>";
      }).join("")
    + "</div>"
    + '<div id="dNach">' + (r.wahl >= 0 ? nachHtml(q, b, b.opt[r.wahl].ok) : "") + "</div>";
  $("#dSpiel").innerHTML = h;
  if(r.wahl >= 0) hoerTextZeigen();

  if(neu){
    nachOben();
    if(q.ton) sprich(q.ton, $("#dSpiel .dhoer"));
  }
}
function hoerTextZeigen(){
  var text = $("#dHoerText"), knopf = $("#dSpiel .dtextzeigen");
  if(text) text.hidden = false;
  if(knopf) knopf.hidden = true;
}
function nachHtml(q, b, ok){
  return '<div class="durteil ' + (ok ? "gut" : "schlecht") + '">'
    + (ok ? '<b class="jp">せいかい！</b> Richtig' : '<b class="jp">ざんねん…</b> Leider nicht')
    + "</div>"
    + '<div class="dloes">' + b.loesung + "</div>"
    + '<button class="knopf voll" id="dWeiter" data-akt="weiter">'
    + (runde.i + 1 < runde.fragen.length ? "Weiter" : "Zum Ergebnis") + "</button>";
}
function antworte(i){
  var r = runde;
  if(!r || r.ende || r.wahl >= 0 || i >= r.anzahl) return;
  var q = r.fragen[r.i], b = q.bau(), ok = !!b.opt[i].ok;
  r.wahl = i;
  if(ok) r.richtig += 1; else r.falsch.push(q);
  q.merke(ok);

  $$("#dSpiel .dopt").forEach(function(knopf, n){
    knopf.disabled = true;
    knopf.classList.add(b.opt[n].ok ? "ok" : n === i ? "falsch" : "blass");
  });
  $("#dNach").innerHTML = nachHtml(q, b, ok);
  hoerTextZeigen();

  if(einst.ton && q.nachTon) sprich(q.nachTon);
  var weiter = $("#dWeiter");
  if(weiter && weiter.scrollIntoView) weiter.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function weiter(){
  var r = runde;
  if(!r || r.wahl < 0) return;
  r.wahl = -1;
  r.i += 1;
  if(r.i >= r.fragen.length){
    r.ende = true;
    rundeFertig(stufeNachAnteil(r.richtig, r.fragen.length));
    zeichneErgebnis();
    nachOben();
    return;
  }
  zeichneFrage(true);
}
function rundeFertig(st){
  tagZaehlen();
  if(st === 3) d.blumen += 1;
  sichern();
}
function zeichneErgebnis(){
  var r = runde, st = stufeNachAnteil(r.richtig, r.fragen.length);
  var h = '<div class="dergebnis">' + stempel(st, "gross")
    + '<div class="dspruch jp">' + STEMPEL[st].jp + "</div>"
    + '<div class="dpunkte"><b>' + r.richtig + "</b> von " + r.fragen.length + " richtig</div>"
    + "<p>" + STEMPEL[st].de + "</p></div>";
  if(r.falsch.length){
    h += "<h3>Noch einmal ansehen</h3><div class=\"dkurzliste\">"
      + r.falsch.map(function(q){ return '<div class="dkurz">' + q.kurz() + "</div>"; }).join("")
      + "</div>";
  }
  h += '<button class="knopf voll" data-akt="nochmal">Noch eine Runde</button>'
    + '<button class="knopf" data-akt="geh" data-ziel="hub">Zurück zum Dojo</button>';
  $("#dSpiel").innerHTML = h;
}

/* ---------- Paare finden ---------- */
var PAARE = 6;
function paareNeu(){
  var ziele = [], kana = {};
  ziehe(bildPool(), 60, gewBild).some(function(b){
    if(!kana[b.kana]){ kana[b.kana] = 1; ziele.push(b); }
    return ziele.length === PAARE;
  });
  var karten = [];
  ziele.forEach(function(b){ karten.push({ b: b, art: "bild" }, { b: b, art: "wort" }); });
  paare = { karten: mische(karten), ziele: ziele, offen: [], gefunden: 0, zuege: 0, sperre: false, ende: false };
}
function zeichnePaare(){
  if(!paare) paareNeu();
  var p = paare;
  var h = kopfHtml("Paare finden", "hub")
    + '<div class="dwahl">' + wahlKnopf("satzBlatt", satzName(w.satz), bildPool().length + " Bilder") + "</div>";
  if(p.ende){
    var st = p.zuege <= PAARE + 2 ? 3 : p.zuege <= PAARE + 5 ? 2 : p.zuege <= PAARE + 9 ? 1 : 0;
    var best = d.best[w.satz];
    h += '<div class="dergebnis">' + stempel(st, "gross")
      + '<div class="dspruch jp">' + STEMPEL[st].jp + "</div>"
      + '<div class="dpunkte"><b>' + p.zuege + "</b> Züge</div>"
      + "<p>Alle " + PAARE + " Paare gefunden." + (best ? " Bestwert in dieser Auswahl: " + best + " Züge." : "") + "</p></div>"
      + "<h3>Die Wörter dieser Runde</h3>"
      + p.ziele.map(function(b){ return bildInfo(b); }).join("")
      + '<button class="knopf voll" data-akt="nochmal">Noch eine Runde</button>'
      + '<button class="knopf" data-akt="geh" data-ziel="hub">Zurück zum Dojo</button>';
  }else{
    h += '<div class="sitzung"><span id="pZuege">' + p.zuege + ' Züge</span><span class="spur"><i id="pBalken" style="width:'
      + Math.round(p.gefunden / PAARE * 100) + '%"></i></span><span>' + PAARE + " Paare</span></div>"
      + '<div class="pgitter">'
      + p.karten.map(function(k, i){
          return '<button class="pkarte' + (k.fertig ? " auf paar" : k.auf ? " auf" : "") + '" data-akt="pkarte" data-i="' + i
            + '" aria-label="Karte ' + (i + 1) + '">'
            + '<span class="pinnen"><span class="prueck jp" aria-hidden="true">言</span>'
            + '<span class="pvorn">' + (k.art === "bild" ? bildSvg(k.b.z) : '<span class="jp">' + esc(k.b.kana) + "</span>")
            + "</span></span></button>";
        }).join("")
      + "</div>";
  }
  inhalt().innerHTML = h;
}
function paarKarte(i){
  var p = paare, k = p && p.karten[i];
  if(!k || p.sperre || p.ende || k.auf || k.fertig) return;
  var knoepfe = $$("#dojoInhalt .pkarte");
  k.auf = true;
  knoepfe[i].classList.add("auf");
  p.offen.push(i);
  if(p.offen.length < 2) return;

  p.zuege += 1;
  $("#pZuege").textContent = p.zuege + (p.zuege === 1 ? " Zug" : " Züge");
  var a = p.offen[0], b = p.offen[1];
  p.offen = [];
  if(p.karten[a].b === p.karten[b].b && p.karten[a].art !== p.karten[b].art){
    p.karten[a].fertig = p.karten[b].fertig = true;
    knoepfe[a].classList.add("paar");
    knoepfe[b].classList.add("paar");
    p.gefunden += 1;
    $("#pBalken").style.width = Math.round(p.gefunden / PAARE * 100) + "%";
    if(einst.ton) sprich(k.b.kana);
    if(p.gefunden === PAARE){
      p.sperre = true;
      setTimeout(function(){
        if(paare !== p) return;
        p.ende = true;
        if(!d.best[w.satz] || p.zuege < d.best[w.satz]) d.best[w.satz] = p.zuege;
        rundeFertig(p.zuege <= PAARE + 2 ? 3 : 0);
        if(ansicht === "paare"){ zeichnePaare(); nachOben(); }
      }, 750);
    }
    return;
  }
  p.sperre = true;
  setTimeout(function(){
    if(paare !== p) return;
    p.karten[a].auf = p.karten[b].auf = false;
    p.sperre = false;
    if(ansicht !== "paare") return;
    var jetzt = $$("#dojoInhalt .pkarte");
    if(jetzt[a]) jetzt[a].classList.remove("auf");
    if(jetzt[b]) jetzt[b].classList.remove("auf");
  }, 950);
}

/* ---------- Bilderbuch ---------- */
function zeichneBuch(){
  var h = kopfHtml("Bilderbuch", "hub")
    + '<p class="dhinweis">' + BILDER.length + " Bilder. Antippen zeigt Wort, Aussprache und einen Beispielsatz.</p>";
  Object.keys(BILDGRUPPEN).forEach(function(g){
    h += "<h3>" + esc(BILDGRUPPEN[g]) + '</h3><div class="bgitter">';
    BILDER.forEach(function(b, i){
      if(b.gr !== g) return;
      h += '<button class="bfeld" data-akt="bildBlatt" data-i="' + i + '">' + bildSvg(b.z)
        + '<span class="jp">' + esc(b.kana) + "</span></button>";
    });
    h += "</div>";
  });
  inhalt().innerHTML = h;
}

/* ---------- Lesetexte ---------- */
function zeichneTexte(){
  var h = kopfHtml("Lesetexte", "hub", schriftPille());
  [5, 4].forEach(function(st){
    h += "<h3>JLPT N" + st + "</h3>";
    LESETEXTE.forEach(function(t, i){
      if(t.st !== st) return;
      var fertig = d.t[t.id] !== undefined;
      h += '<button class="dkachel" data-akt="text" data-i="' + i + '">'
        + '<span class="dzeichen bildzeichen">' + bildSvg(t.bild) + "</span>"
        + '<span class="dtext"><b class="jp">' + jp(t.titel) + "</b><span>" + esc(t.titelDe) + " · " + esc(t.art) + "</span></span>"
        + (fertig ? '<span class="dzahl fertig">' + d.t[t.id] + " / " + t.fragen.length + "</span>" : "")
        + "</button>";
    });
  });
  inhalt().innerHTML = h;
}
function tafelHtml(t){
  var h = '<div class="tafel"><div class="ttitel jp">' + jp(t.titel) + "</div>";
  t.gruppen.forEach(function(g){
    if(g.name) h += '<div class="tgruppe jp">' + jp(g.name) + "</div>";
    h += g.zeilen.map(function(z){
      return '<div class="tzeile' + (z.length > 2 ? " drei" : "") + '">' + z.map(function(zelle, i){
        return '<span class="jp ' + (i ? "twert" : "tname") + '">' + jp(zelle) + "</span>";
      }).join("") + "</div>";
    }).join("");
  });
  (t.fuss || []).forEach(function(f){ h += '<div class="tfuss jp">' + jp(f) + "</div>"; });
  return h + "</div>";
}
function textFrageHtml(t, n){
  var f = t.fragen[n], wahl = textAntworten[n];
  var folge = f.folge || (f.folge = mische(f[1].map(function(_, i){ return i; })));
  var h = '<div class="lfrage"><p class="jp">' + (n + 1) + "　" + jp(f[0]) + '</p><div class="dopts satz">';
  folge.forEach(function(quelle, i){
    var klasse = "dopt";
    if(wahl >= 0) klasse += quelle === 0 ? " ok" : i === wahl ? " falsch" : " blass";
    h += '<button class="' + klasse + '" data-akt="textAntwort" data-f="' + n + '" data-i="' + i + '"'
      + (wahl >= 0 ? " disabled" : "") + '><span class="jp">' + jp(f[1][quelle]) + "</span></button>";
  });
  h += "</div>";
  if(wahl >= 0) h += '<p class="dtipp">' + jp(f[2]) + "</p>";
  return h + "</div>";
}
function zeichneText(){
  var t = LESETEXTE[textNr];
  var h = kopfHtml("N" + t.st + " · " + esc(t.art), "texte", schriftPille())
    + '<div class="lkopf"><span class="lbild">' + bildSvg(t.bild) + "</span>"
    +   '<div><h2 class="jp">' + jp(t.titel) + "</h2><p>" + esc(t.titelDe) + "</p></div></div>";
  if(t.tafel) h += tafelHtml(t.tafel);
  h += '<div class="lsaetze">' + t.saetze.map(function(s, i){
    return '<div class="lsatz"><button class="lsatztext" data-akt="satzDe" data-i="' + i + '" aria-expanded="false">'
      + '<span class="jp">' + jp(s[0]) + "</span>"
      + '<span class="de" hidden>' + esc(s[1]) + "</span></button>"
      + (K.spracheDa
          ? '<button class="tonknopf" data-akt="sprich" data-text="' + esc(klartext(s[0])) + '" aria-label="Satz anhören">' + TON_SVG + "</button>"
          : "")
      + "</div>";
  }).join("") + "</div>"
    + '<div class="lknoepfe">'
    + (K.spracheDa ? '<button class="knopf" data-akt="textVorlesen">Alles vorlesen</button>' : "")
    + '<button class="knopf" data-akt="alleDe">Übersetzung zeigen</button></div>';
  if(t.woerter && t.woerter.length){
    h += "<h3>Wörter</h3><div class=\"wortliste\">" + t.woerter.map(function(x){
      return '<div class="wortzeile"><span class="links"><span class="kana jp">' + esc(x[0])
        + '</span><span class="de">' + esc(x[1]) + "</span></span></div>";
    }).join("") + "</div>";
  }
  h += "<h3>Fragen</h3><div id=\"lFragen\">"
    + t.fragen.map(function(_, n){ return textFrageHtml(t, n); }).join("") + "</div>"
    + '<div id="lEnde"></div>';
  inhalt().innerHTML = h;
  textEnde();
}
function textEnde(){
  var t = LESETEXTE[textNr], ziel = $("#lEnde");
  if(!ziel) return;
  if(textAntworten.some(function(a){ return a < 0; })){ ziel.innerHTML = ""; return; }
  var richtig = 0;
  t.fragen.forEach(function(f, n){ if(f.folge[textAntworten[n]] === 0) richtig += 1; });
  var st = stufeNachAnteil(richtig, t.fragen.length);
  ziel.innerHTML = '<div class="dergebnis">' + stempel(st, "gross")
    + '<div class="dspruch jp">' + STEMPEL[st].jp + "</div>"
    + '<div class="dpunkte"><b>' + richtig + "</b> von " + t.fragen.length + " richtig</div></div>"
    + '<button class="knopf voll" data-akt="geh" data-ziel="texte">Zu den Lesetexten</button>';
}
function textAntwort(n, i){
  var t = LESETEXTE[textNr];
  if(textAntworten[n] >= 0) return;
  textAntworten[n] = i;
  var fragen = $$("#lFragen .lfrage");
  var neu = document.createElement("div");
  neu.innerHTML = textFrageHtml(t, n);
  fragen[n].parentNode.replaceChild(neu.firstChild, fragen[n]);

  if(textAntworten.every(function(a){ return a >= 0; })){
    var richtig = 0;
    t.fragen.forEach(function(f, m){ if(f.folge[textAntworten[m]] === 0) richtig += 1; });
    if(d.t[t.id] === undefined || richtig > d.t[t.id]) d.t[t.id] = richtig;
    rundeFertig(stufeNachAnteil(richtig, t.fragen.length));
    textEnde();
  }
}

/* ---------- Blätter ---------- */
function blatt(titel, html){
  $("#dojoblattTitel").textContent = titel;
  $("#dojoblattInhalt").innerHTML = html;
  $("#dojoblattInhalt").scrollTop = 0;
  K.blattAuf("#dojoblatt");
}
function blattZeile(akt, wert, aktiv, titel, zahl, unter){
  return '<button class="fzeile' + (unter ? " unter" : "") + '" data-akt="' + akt + '" data-wert="' + wert + '"'
    + ' aria-current="' + (aktiv ? "true" : "false") + '">'
    + '<span class="ftitel">' + esc(titel) + "</span>"
    + '<span class="fzahl">' + zahl + "</span></button>";
}
function satzBlatt(){
  var h = "", gruppenKopf = false;
  satzListe().forEach(function(s){
    if(s.gruppe && !gruppenKopf){ h += '<div class="fgruppe">Nach Thema</div>'; gruppenKopf = true; }
    h += blattZeile("satz", s.k, s.k === w.satz, s.name, bildPool(s.k).length, false);
  });
  blatt("Welche Bilder?", h);
}
function zartBlatt(){
  var h = "";
  Object.keys(ZARTEN).forEach(function(k){
    var s = d.z[k];
    h += blattZeile("zart", k, k === w.zart, ZARTEN[k].name, s ? s[0] + " richtig" : "", false);
  });
  blatt("Was üben?", h);
}
function bildBlatt(i){
  var b = BILDER[i], s = d.b[b.z];
  var imTrainer = MEINE.indexOf(b) >= 0;
  blatt(b.de,
      bildInfo(b, true)
    + '<p class="dhinweis">' + esc(BILDGRUPPEN[b.gr]) + " · JLPT N" + b.st
    + (imTrainer ? " · steht auch in deinem Trainer" : "")
    + (s ? " · " + s[0] + "-mal richtig, " + s[1] + "-mal falsch" : "") + "</p>");
}

/* ---------- Umschalten ---------- */
function zeichne(){
  if(ansicht === "hub")        zeichneHub();
  else if(QUIZ[ansicht])       zeichneQuiz();
  else if(ansicht === "paare") zeichnePaare();
  else if(ansicht === "buch")  zeichneBuch();
  else if(ansicht === "texte") zeichneTexte();
  else if(ansicht === "text")  zeichneText();
}
function geh(ziel, el){
  if(K.spracheDa) window.speechSynthesis.cancel();
  if(ziel === "jlpt" && el && el.dataset.stufe) stufe = +el.dataset.stufe;
  ansicht = ziel;
  runde = null;
  paare = null;
  zeichne();
  nachOben();
}

var AKTION = {
  geh: function(el){ geh(el.dataset.ziel, el); },

  antwort: function(el){ antworte(+el.dataset.i); },
  weiter: weiter,
  nochmal: function(){
    if(ansicht === "paare"){ paare = null; zeichnePaare(); }
    else rundeNeu();
    nachOben();
  },
  hoer: function(el){
    var q = runde && runde.fragen[runde.i];
    if(q && q.ton) sprich(q.ton, el);
  },
  textZeigen: hoerTextZeigen,
  sprich: function(el){ K.sprich(el.dataset.text, el, true); },

  richtung: function(el){ w.richtung = el.dataset.wert; sichern(); runde = null; zeichneQuiz(); },
  zhoeren:  function(el){ w.zhoeren = el.dataset.wert === "1"; sichern(); runde = null; zeichneQuiz(); },
  kreis:    function(el){ w.kreis[stufe] = el.dataset.wert; sichern(); runde = null; zeichneQuiz(); },
  schrift: function(){
    w.schrift = SCHRIFT_FOLGE[(SCHRIFT_FOLGE.indexOf(w.schrift) + 1) % SCHRIFT_FOLGE.length];
    sichern();
    var y = window.scrollY;
    zeichne();
    window.scrollTo(0, y);
    K.melde("Schreibweise: " + SCHRIFT[w.schrift]);
  },

  satzBlatt: satzBlatt,
  zartBlatt: zartBlatt,
  bildBlatt: function(el){ bildBlatt(+el.dataset.i); },
  satz: function(el){
    w.satz = el.dataset.wert; sichern();
    K.blattZu();
    runde = null; paare = null;
    zeichne();
  },
  zart: function(el){
    w.zart = el.dataset.wert; sichern();
    K.blattZu();
    runde = null;
    zeichne();
  },

  pkarte: function(el){ paarKarte(+el.dataset.i); },

  text: function(el){
    textNr = +el.dataset.i;
    textAntworten = LESETEXTE[textNr].fragen.map(function(f){ f.folge = null; return -1; });
    ansicht = "text";
    zeichne();
    nachOben();
  },
  satzDe: function(el){
    var de = el.querySelector(".de");
    de.hidden = !de.hidden;
    el.setAttribute("aria-expanded", de.hidden ? "false" : "true");
  },
  alleDe: function(el){
    var alle = $$("#dojoInhalt .lsatztext .de");
    var zeigen = alle.some(function(x){ return x.hidden; });
    alle.forEach(function(x){
      x.hidden = !zeigen;
      x.parentNode.setAttribute("aria-expanded", zeigen ? "true" : "false");
    });
    el.textContent = zeigen ? "Übersetzung verbergen" : "Übersetzung zeigen";
  },
  textVorlesen: function(el){
    var t = LESETEXTE[textNr];
    sprich(t.saetze.map(function(s){ return s[0]; }).join("　"), el);
  },
  textAntwort: function(el){ textAntwort(+el.dataset.f, +el.dataset.i); }
};

function klick(e){
  var el = e.target.closest("[data-akt]");
  if(!el || el.disabled) return;
  var f = AKTION[el.dataset.akt];
  if(f) f(el, e);
}

/* ---------- Start ---------- */
var bereich = $("#dojo");
if(!bereich || !$("#dojoInhalt") || !$("#dojoblatt")) return;   // HTML aus einer älteren Fassung

inhalt().addEventListener("click", klick);
$("#dojoblattInhalt").addEventListener("click", klick);
$("#dojoblattZu").addEventListener("click", K.blattZu);

document.addEventListener("keydown", function(e){
  if(bereich.hidden || !runde || runde.ende || !QUIZ[ansicht]) return;
  if(e.target.matches("input, textarea")) return;
  if(runde.wahl >= 0){
    if(e.key === "Enter" || e.key === " "){ e.preventDefault(); weiter(); }
    return;
  }
  var n = "1234".indexOf(e.key);
  if(n >= 0) antworte(n);
});

/* app.js ruft das auf, sobald der Reiter gewählt wird. */
window.DOJO = {
  zeige: function(){ zeichne(); },
  verlassen: function(){ if(K.spracheDa) window.speechSynthesis.cancel(); }
};
})();
