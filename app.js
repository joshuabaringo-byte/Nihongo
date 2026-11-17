/* ==================================================================
   ことば - Vokabeltrainer
   Nutzt V und ABSCHNITTE aus vokabeln.js, dazu bildFuerKana und bildSvg
   aus bilder.js, wo es zu einem Wort ein Bild gibt.
   ================================================================== */
(function () {
"use strict";

/* Der Wiederholungsplan liegt in plan.js. Fehlt er, stammen index.html und
   app.js aus verschiedenen Ständen: einmal neu laden bringt sie zusammen. */
var PLAN = window.PLAN;
if(!PLAN){
  try{
    if(!sessionStorage.getItem("kotoba-neu-geladen")){
      sessionStorage.setItem("kotoba-neu-geladen", "plan");
      location.reload();
    }
  }catch(e){ /* dann bleibt es beim Hinweis unten */ }
  return;
}

/* ---------- Konstanten ---------- */
var TAG      = 86400000;
var MAXSTUFE = 6;                         // Punkte der Anzeige
var FEST     = 5;                         // ab dieser Stufe (Abstand ab 17 Tagen) gilt ein Wort als gefestigt
var K_STAND  = "kotoba-v2";
var K_EINST  = "kotoba-einst";
/* Frueher benutzte Namen, neueste zuerst. Sie werden einmalig uebernommen,
   damit ein bestehender Lernstand beim Umbenennen nicht verloren geht. */
var K_FRUEHER       = ["arc-kotoba-v2", "arc-kotoba-v1"];
var K_EINST_FRUEHER = ["arc-kotoba-einst"];

/* ---------- Kleine Helfer ---------- */
function $(s){ return document.querySelector(s); }
function $$(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); }
function esc(s){
  return String(s).replace(/[&<>"]/g, function(z){
    return { "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;" }[z];
  });
}
function tage(n){ return n === 1 ? "1 Tag" : n + " Tage"; }

/* ---------- Speicher ---------- */
var speicherOk = true;

/* Unlesbare Inhalte werden nie überschrieben. Sie kommen zuerst unverändert in
   eine Kopie unter eigenem Namen (etwa "kotoba-v2-unlesbar-1763..."). Gelingt
   das nicht, schreibt die App in dieser Sitzung nichts unter diesen Namen. */
var RETTUNG  = "-unlesbar-";
var gesperrt = {};            // Schlüssel -> unlesbarer Text, der nicht gesichert werden konnte

function hole(schluessel, ersatz){
  var roh;
  try{ roh = localStorage.getItem(schluessel); }
  catch(e){ speicherOk = false; return ersatz; }
  if(!roh) return ersatz;
  try{
    var d = JSON.parse(roh);
    if(d && typeof d === "object" && !Array.isArray(d)) return d;
  }catch(e){ /* unlesbar, siehe unten */ }
  retten(schluessel, roh);
  return ersatz;
}
function retten(schluessel, roh){
  try{
    // Liegt derselbe Text schon gesichert vor, genügt das.
    for(var i = 0; i < localStorage.length; i++){
      var n = localStorage.key(i);
      if(n.indexOf(schluessel + RETTUNG) === 0 && localStorage.getItem(n) === roh) return;
    }
    var kopie = schluessel + RETTUNG + Date.now();
    localStorage.setItem(kopie, roh);
    if(localStorage.getItem(kopie) === roh) return;
  }catch(e){ /* nicht gesichert, siehe unten */ }
  gesperrt[schluessel] = roh;
}
function lege(schluessel, wert){ return legeText(schluessel, JSON.stringify(wert)); }
var nichtGespeichert = {};    // Schlüssel, deren letzter Speicherversuch gescheitert ist
function legeText(schluessel, text){
  if(gesperrt[schluessel] !== undefined) return false;   // unlesbar und nicht gesichert: nicht überschreiben
  try{ localStorage.setItem(schluessel, text); }
  catch(e){
    speicherOk = false;
    nichtGespeichert[schluessel] = true;
    zeigeSpeicherWarnung();
    return false;
  }
  if(nichtGespeichert[schluessel]){ delete nichtGespeichert[schluessel]; zeigeSpeicherWarnung(); }
  return true;
}
/* Scheitert ein Speicherversuch (Speicher voll oder gesperrt), steht sofort ein
   Hinweis über der Karte. Die Antworten bleiben im Speicher der Seite; sobald
   das Speichern wieder klappt, kommen sie alle hinein und der Hinweis geht. */
function zeigeSpeicherWarnung(){
  var alt = document.getElementById("speicherWarnung");
  if(!Object.keys(nichtGespeichert).length){
    if(alt) alt.parentNode.removeChild(alt);
    return;
  }
  var ziel = document.getElementById("kartenbereich");
  if(alt || !ziel) return;
  ziel.insertAdjacentHTML("beforebegin",
      '<div class="info" id="speicherWarnung">Speichern geht gerade nicht (Speicher voll oder '
    + "gesperrt). Deine Antworten dieser Sitzung sind nur vorläufig da. Kopiere den Lernstand, "
    + "um sie zu sichern."
    + '<button class="knopf" id="speicherWarnungKopieren" style="margin:10px 0 0">Lernstand kopieren</button>'
    + "</div>");
  document.getElementById("speicherWarnungKopieren").addEventListener("click", function(){
    textKopieren(JSON.stringify(stand), "Lernstand kopiert");
  });
  melde("Nicht gespeichert – Speicher voll oder gesperrt");
}
function rohLesen(schluessel){
  try{ return localStorage.getItem(schluessel); }catch(e){ return null; }
}
function gefuellt(schluessel){
  try{ return !!localStorage.getItem(schluessel); }catch(e){ return false; }
}
function entferne(schluessel){
  try{ localStorage.removeItem(schluessel); }catch(e){ /* egal */ }
}

/* Liest den aktuellen Schluessel; ist er leer, wird der erste gefuellte
   frueher benutzte Schluessel uebernommen und danach aufgeraeumt. */
function holeMitUebernahme(schluessel, frueher){
  var d = hole(schluessel, null);
  if(d) return d;
  if(gefuellt(schluessel)) return {};   // vorhanden, aber unlesbar: nichts Älteres darüberlegen
  for(var i = 0; i < frueher.length; i++){
    var altD = hole(frueher[i], null);
    if(!altD || !Object.keys(altD).length) continue;
    lege(schluessel, altD);
    if(hole(schluessel, null)) entferne(frueher[i]);   // erst raeumen, wenn es sicher liegt
    return altD;
  }
  return {};
}

var stand = holeMitUebernahme(K_STAND, K_FRUEHER);
normalisiere(stand);
/* Mehrere Tabs: Text im Speicher, wie er zuletzt gelesen oder geschrieben wurde.
   Weicht er ab, hat ein anderer Tab geantwortet (siehe standAuffrischen). */
var standRoh = rohLesen(K_STAND);

var einst = holeMitUebernahme(K_EINST, K_EINST_FRUEHER);
if(einst.thema    === undefined) einst.thema    = "auto";
if(einst.romaji   === undefined) einst.romaji   = true;
if(einst.ton      === undefined) einst.ton      = false;
if(einst.mischen  === undefined) einst.mischen  = true;
if(einst.limit    === undefined) einst.limit    = 40;
if(einst.richtung === undefined) einst.richtung = "kana";
if(einst.filter   === undefined) einst.filter   = { art: "alle", wert: 0 };
if(einst.bilder   === undefined) einst.bilder   = true;
if(einst.kanji    === undefined) einst.kanji    = true;
if(einst.listeStufe === undefined) einst.listeStufe = 0;
if(einst.neuProTag  === undefined) einst.neuProTag  = 15;
if(["kana", "de", "kanji"].indexOf(einst.richtung) < 0) einst.richtung = "kana";

function standSichern(){
  var text = JSON.stringify(stand);
  if(!legeText(K_STAND, text)) return false;
  standRoh = text;
  return true;
}
/* Sind zwei Tabs offen, hält jeder seinen eigenen Lernstand. Damit keiner die
   Antworten des anderen überschreibt, liest die App vor jeder Antwort den
   gespeicherten Stand neu ein, sobald ein anderer Tab ihn geändert hat, und
   ändert dann nur das eine Wort. Rückgabe: true, wenn sich etwas geändert hat. */
function standAuffrischen(){
  var roh = rohLesen(K_STAND);
  if(roh === null || roh === standRoh) return false;
  var d;
  try{ d = JSON.parse(roh); }catch(e){ return false; }
  if(!d || typeof d !== "object" || Array.isArray(d)) return false;
  stand = normalisiere(d);
  standRoh = roh;
  return true;
}
function einstSichern(){ lege(K_EINST, einst); }

/* ---------- Kartenzustand ----------
   Gelesen wird über karte(): unbekannte Wörter liefern die Vorgabe zurück,
   ohne einen Eintrag anzulegen. Erst eine Bewertung schreibt wirklich etwas.
   So bleibt die Sicherungskopie klein genug zum Kopieren.            */
var VORGABE = { stufe: 0, faellig: 0, fehler: 0 };

/* Nimmt auch Stände aus früheren Fassungen und ergänzt, was fehlt;
   Einzelheiten in plan.js. */
function normalisiere(d){
  Object.keys(d).forEach(function(id){
    if(!PLAN.normalisieren(d[id])) delete d[id];
  });
  return d;
}

function karte(id){ return stand[id] || VORGABE; }

function karteSchreiben(id){
  var k = stand[id];
  if(!k) k = stand[id] = { stufe: 0, faellig: 0, fehler: 0 };
  return k;
}
/* Ein Problemwort wurde mindestens zweimal vergessen und sitzt noch nicht.
   Wer es wieder sicher kann, fällt von allein aus der Liste. */
function istProblem(v){ var k = karte(v.id); return k.fehler >= 2 && k.stufe < FEST; }

/* Bei über tausend Wörtern sagt "fällig" nichts mehr, wenn jedes nie gesehene
   Wort mitzählt. Deshalb getrennt: Wiederholung = schon gelernt und jetzt
   dran, neu = noch nie gesehen. Der Durchgang nimmt beides (erst die
   Wiederholungen, dann Neues), nur das Zählen unterscheidet. */
function istNeu(v){ return PLAN.istNeu(karte(v.id)); }
function istWiederholung(v){ return PLAN.istDran(karte(v.id), Date.now()); }
function zaehle(liste){
  var f = 0, n = 0;
  liste.forEach(function(v){ if(istNeu(v)) n++; else if(istWiederholung(v)) f++; });
  return { faellig: f, neu: n };
}

/* Neue Wörter pro Tag: ohne Grenze lernt man an einem Tag Hunderte, und alle
   kommen am selben Tag wieder. Gezählt wird ab dem Tageswechsel um vier Uhr. */
function neuHeute(){
  var t = PLAN.tagesbeginn(Date.now());
  if(!einst.neuHeute || einst.neuHeute.tag !== t) einst.neuHeute = { tag: t, n: 0 };
  return einst.neuHeute.n;
}
/* Tageszähler eines anderen Tabs übernehmen: Für heute gilt der größere Wert. */
function neuHeuteAuffrischen(){
  neuHeute();                                  // legt den Zähler für heute an, falls er fehlt
  var e = hole(K_EINST, null);
  if(e && e.neuHeute && e.neuHeute.tag === einst.neuHeute.tag
     && typeof e.neuHeute.n === "number" && e.neuHeute.n > einst.neuHeute.n) einst.neuHeute.n = e.neuHeute.n;
}
function neuFrei(){
  return einst.neuProTag > 0 ? Math.max(0, einst.neuProTag - neuHeute()) : Infinity;
}

/* ---------- Auswahl über den Filter ---------- */
function auswahl(f){
  f = f || einst.filter;
  if(f.art === "stufe")   return V.filter(function(v){ return v.n === f.wert; });
  if(f.art === "topic")   return V.filter(function(v){ return v.t === f.wert; });
  if(f.art === "ab")      return V.filter(function(v){ return v.ab === f.wert; });
  if(f.art === "problem") return V.filter(istProblem);
  return V;
}

function filterName(f, lang){
  if(f.art === "topic")   return "Alles aus " + topicName(f.wert).lang;
  if(f.art === "ab"){
    var a = ABSCHNITTE[f.wert], kurz = topicName(a.t).kurz + " " + a.nr;
    return lang ? kurz + " · " + a.titel : kurz;
  }
  if(f.art === "problem") return "Problemwörter";
  if(f.art === "stufe")   return "Alle N" + f.wert + "-Wörter";
  return "Alle Wörter";
}
function gleicherFilter(a, b){ return a.art === b.art && String(a.wert) === String(b.wert); }

/* ---------- Sitzung ---------- */
var schlange   = [];
var getan      = 0;
var umgedreht  = false;
var freiesUeben = false;

function mische(a){
  for(var i = a.length - 1; i > 0; i--){
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

function schlangeBauen(alleTrotzdem){
  freiesUeben = !!alleTrotzdem;
  var basis = auswahl();
  var jetzt = Date.now();
  var liste;

  if(alleTrotzdem){
    // Freies Üben: die ganze Auswahl, Gelerntes vor Neuem.
    liste = basis.slice();
    if(einst.mischen) mische(liste);
    else liste.sort(function(a, b){ return karte(a.id).faellig - karte(b.id).faellig; });
    liste.sort(function(a, b){ return (istNeu(a) ? 1 : 0) - (istNeu(b) ? 1 : 0); });
  }else{
    // Erst, was dran ist: Lernkarten, dann Wiederholungen, die am längsten
    // Überfälligen zuerst, innerhalb eines Tages gemischt.
    var wieder = basis.filter(function(v){ return PLAN.istBald(karte(v.id), jetzt); });
    if(einst.mischen) mische(wieder);
    var tag = {};
    wieder.forEach(function(v){
      var k = karte(v.id);
      tag[v.id] = (k.lern !== undefined ? 0 : 1) * 1e15 + PLAN.tagesbeginn(k.faellig);
    });
    wieder.sort(function(a, b){ return tag[a.id] - tag[b.id]; });

    // Dann Neues, aber nur so viel, wie das Limit für heute noch erlaubt.
    var neue = basis.filter(istNeu);
    if(einst.mischen) mische(neue);
    var frei = neuFrei();
    if(neue.length > frei) neue = neue.slice(0, frei);
    liste = wieder.concat(neue);
  }

  if(einst.limit > 0) liste = liste.slice(0, einst.limit);
  schlange  = liste;
  getan     = 0;
  umgedreht = false;
}

/* ---------- Aussprache ---------- */
var stimmen = [], jaStimme = null;
var spracheDa = typeof window.speechSynthesis !== "undefined";

function stimmenLaden(){
  if(!spracheDa) return;
  stimmen = window.speechSynthesis.getVoices() || [];
  jaStimme = null;
  for(var i = 0; i < stimmen.length; i++){
    if(/^ja/i.test(stimmen[i].lang)){ jaStimme = stimmen[i]; break; }
  }
}
if(spracheDa){
  stimmenLaden();
  window.speechSynthesis.onvoiceschanged = stimmenLaden;
}

/* Klammerzusätze wie （そんざい） sind Erklärungen, （お） und （を） gehören zum Wort. */
function sprechbar(kana){
  return String(kana)
    .replace(/／.*$/, "")
    .replace(/（(.{3,})）/g, "")
    .replace(/[（）()]/g, "")
    .replace(/[～~]/g, "")
    .trim();
}
/* roh: der Text ist schon ein ganzer Satz und wird unverändert gelesen. */
function sprich(kana, knopf, roh){
  if(!spracheDa) return;
  var text = roh ? String(kana).trim() : sprechbar(kana);
  if(!text) return;
  try{
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "ja-JP";
    if(jaStimme) u.voice = jaStimme;
    u.rate = 0.88;
    if(knopf){
      knopf.classList.add("laeuft");
      u.onend = u.onerror = function(){ knopf.classList.remove("laeuft"); };
    }
    window.speechSynthesis.speak(u);
  }catch(e){ /* stumm bleiben */ }
}

/* ---------- Meldung ---------- */
var meldungsUhr = null;
function melde(text){
  var m = $("#meldung");
  m.textContent = text;
  m.classList.add("auf");
  clearTimeout(meldungsUhr);
  meldungsUhr = setTimeout(function(){ m.classList.remove("auf"); }, 2200);
}

/* ---------- Bereiche umschalten ---------- */
var BEREICHE = ["lernen", "dojo", "stand", "problem", "liste"];
var aktiverBereich = "lernen";

function zeige(name){
  if(aktiverBereich === "dojo" && name !== "dojo" && window.DOJO) window.DOJO.verlassen();
  aktiverBereich = name;
  BEREICHE.forEach(function(n){
    var b = $("#" + n);
    if(b) b.hidden = (n !== name);      // fehlt nur, wenn das HTML älter ist als dieses Skript
  });
  $$(".leiste button").forEach(function(b){
    b.setAttribute("aria-selected", b.dataset.ziel === name ? "true" : "false");
  });
  if(name === "dojo" && window.DOJO) window.DOJO.zeige();
  if(name === "stand")   zeichneStand();
  if(name === "problem") zeichneProblem();
  if(name === "liste")   zeichneListe();
  window.scrollTo({ top: 0, behavior: "instant" in document.body.style ? "instant" : "auto" });
}

/* ---------- Kopfzeile ---------- */
function kopfAktualisieren(){
  var c = zaehle(V);                    // immer der Gesamtstand, unabhängig vom Filter
  var neuDa = Math.min(c.neu, neuFrei());   // neu: was das Limit für heute noch zulässt
  var z = $("#zaehler");
  var text = c.faellig > 0 ? c.faellig + " fällig" : (neuDa > 0 ? "keine fällig" : "alles fertig");
  if(neuDa > 0) text += " · " + neuDa + " neu";
  $("#zaehlerText").textContent = text;
  z.classList.toggle("fertig", c.faellig === 0);

  var problemZahl = V.filter(istProblem).length;
  var kringel = $("#problemKringel");
  kringel.hidden = problemZahl === 0;
  kringel.textContent = problemZahl > 99 ? "99+" : problemZahl;
}

/* ---------- Auswahl ---------- */
function filterListe(){
  var f = [{ art: "alle", wert: 0 }];
  if(V.filter(istProblem).length) f.push({ art: "problem", wert: 0 });
  [5, 4].forEach(function(n){
    if(V.some(function(v){ return v.n === n; })) f.push({ art: "stufe", wert: n });
  });
  TOPICS.forEach(function(t){ f.push({ art: "topic", wert: t }); });
  Object.keys(ABSCHNITTE).forEach(function(a){ f.push({ art: "ab", wert: a }); });
  return f;
}

function zeichneFilter(){
  var liste = filterListe();

  var cf = zaehle(auswahl());
  var cfNeu = Math.min(cf.neu, neuFrei());
  $("#filterName").textContent = filterName(einst.filter, true);
  $("#filterZahl").textContent = cf.faellig ? cf.faellig + " fällig"
                               : cfNeu ? cfNeu + " neu" : "fertig";

  function zeile(i, klasse, nr, titel){
    var f = liste[i];
    var c = zaehle(auswahl(f));
    var zahl = c.faellig ? c.faellig : (c.neu ? c.neu + " neu" : "–");
    return '<button class="fzeile' + (klasse ? " " + klasse : "") + '" data-i="' + i + '"'
      + ' aria-current="' + (gleicherFilter(f, einst.filter) ? "true" : "false") + '">'
      + (nr ? '<span class="fnr">' + esc(nr) + "</span>" : "")
      + '<span class="ftitel">' + esc(titel) + "</span>"
      + '<span class="fzahl' + (c.faellig ? " offen" : "") + '">' + zahl + "</span>"
      + "</button>";
  }

  var h = "";
  liste.forEach(function(f, i){
    if(f.art === "alle")    h += zeile(i, "", "", "Alle Wörter");
    if(f.art === "problem") h += zeile(i, "", "", "Problemwörter");
    if(f.art === "stufe")   h += zeile(i, "", "", filterName(f));
  });
  TOPICS.forEach(function(t){
    h += '<div class="fgruppe">' + esc(topicName(t).lang) + "</div>";
    liste.forEach(function(f, i){
      if(f.art === "topic" && f.wert === t)
        h += zeile(i, "", "", "Alles aus " + topicName(t).lang);
      if(f.art === "ab" && ABSCHNITTE[f.wert].t === t)
        h += zeile(i, "unter", ABSCHNITTE[f.wert].nr, ABSCHNITTE[f.wert].titel);
    });
  });
  $("#filterliste").innerHTML = h;
}

function setzeFilter(f){
  einst.filter = f;
  einstSichern();
  zeichneFilter();
  schlangeBauen(false);
  zeichneLernen();
  kopfAktualisieren();
}

/* ---------- Lernansicht ---------- */
function stufenPunkte(stufe, klasse){
  var h = '<div class="' + klasse + '">';
  for(var i = 1; i <= MAXSTUFE; i++) h += "<i" + (i <= stufe ? ' class="an"' : "") + "></i>";
  return h + "</div>";
}

/* Lange Wörter sollen in die Karte passen. Japanisch hat keine Leerzeichen, ein langes
   Wort läuft sonst seitlich heraus. Erst wird die Schrift kleiner (bis MIN_SCHRIFT),
   reicht das nicht, bricht das Wort in zwei Zeilen um. */
var MIN_SCHRIFT = 22;
function passeAn(knoten){
  Array.prototype.forEach.call(knoten || [], function(el){
    el.style.fontSize = ""; el.style.wordBreak = ""; el.style.overflowWrap = "";
    var seite = el.parentNode;
    var cs = getComputedStyle(seite);
    var platz = seite.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if(platz <= 0 || el.scrollWidth <= platz + 1) return;
    var g = parseFloat(getComputedStyle(el).fontSize);
    while(el.scrollWidth > platz + 1 && g > MIN_SCHRIFT){ g -= 1; el.style.fontSize = g + "px"; }
    if(el.scrollWidth > platz + 1){ el.style.wordBreak = "normal"; el.style.overflowWrap = "anywhere"; }
  });
}
function karteAnpassen(){ passeAn(document.querySelectorAll("#kartenbereich .wort.jp")); }

function zeichneLernen(){
  var bereich = $("#kartenbereich");
  var leiste  = $("#sitzungsleiste");

  if(!schlange.length){
    leiste.hidden = true;
    bereich.innerHTML = leerAnsicht();
    return;
  }

  var v = schlange[0], k = karte(v.id);
  var gesamt = getan + schlange.length;

  leiste.hidden = false;
  $("#sitzungText").textContent  = getan;
  $("#sitzungRest").textContent  = schlange.length;
  $("#sitzungBalken").style.width = (gesamt ? Math.round(getan / gesamt * 100) : 0) + "%";

  var marke   = topicName(v.t).kurz + " " + ABSCHNITTE[v.ab].nr + (k.stufe === 0 ? " · neu" : "");
  // Die Stufe steht als Chip nur bei Kurswörtern, die auch auf der Liste stehen;
  // bei den JLPT-Abschnitten sagt es schon die Marke links oben.
  var stufe   = (v.n && !STUFEN_GRUPPEN[v.t]) ? '<span class="stufe">N' + v.n + "</span>" : "";
  var wortart = (v.wa || stufe)
    ? '<span class="chips">' + stufe + (v.wa ? '<span class="wortart">' + esc(v.wa) + "</span>" : "") + "</span>"
    : "";
  var punkte  = stufenPunkte(k.stufe, "stufenpunkte");

  // Das Bild verrät die Bedeutung. Vorn steht es deshalb nur, wenn dort
  // ohnehin das Deutsche steht.
  var b = kartenBild(v);
  var bildHtml = b ? '<div class="kartenbild">' + bildSvg(b.z) + "</div>" : "";
  var mitBild  = b ? " mitbild" : "";

  var vorneKana = (einst.richtung === "kanji" && v.kanji) ? v.kanji : v.kana;   // ohne Kanji bleibt das Kana
  var vorneText = einst.richtung === "de"
    ? bildHtml + '<div class="wort de">' + esc(v.de) + "</div>"
    : '<div class="wort jp">' + esc(vorneKana) + "</div>";

  var hinten = bildHtml
    + '<div class="wort jp">' + esc(v.kana) + "</div>"
    + (einst.kanji && v.kanji ? '<div class="kanjizeile jp">' + esc(v.kanji) + "</div>" : "")
    + (einst.romaji ? '<div class="lesung">' + esc(v.romaji) + "</div>" : "")
    + '<div class="strich"></div>'
    + '<div class="bedeutung">' + esc(v.de) + "</div>"
    + (spracheDa
        ? '<button class="tonknopf" id="tonknopf" aria-label="Aussprache anhören">'
          + '<svg viewBox="0 0 24 24"><use href="#i-ton"/></svg></button>'
        : "");

  bereich.innerHTML =
      '<div class="buehne"><div class="flip" id="flip">'
    +   '<div class="seite vorder' + mitBild + '"><span class="marke">' + esc(marke) + "</span>" + wortart
    +     vorneText + '<div class="tipp">Tippen zum Umdrehen</div>' + punkte
    +   "</div>"
    +   '<div class="seite rueck' + mitBild + '"><span class="marke">' + esc(marke) + "</span>" + wortart
    +     hinten + punkte
    +   "</div>"
    + "</div></div>"
    + '<div id="steuerung"></div>';

  umgedreht = false;
  zeichneSteuerung();
  karteGesten();
  karteAnpassen();
}

/* Bild zu einem Wort, falls bilder.js geladen ist und Bilder erwünscht sind. */
function kartenBild(v){
  if(!einst.bilder || typeof bildFuerKana !== "function") return null;
  return bildFuerKana(v.kana);
}

/* Beispielsatz unter den Knöpfen: erst nach dem Umdrehen, sonst verriete
   er das Wort. Antippen liest ihn vor. */
function zeichneBeispiel(){
  var alt = $("#beispiel");
  if(alt) alt.parentNode.removeChild(alt);
  if(!umgedreht || !schlange.length) return;
  var b = kartenBild(schlange[0]);
  if(!b || !b.satz) return;
  $("#steuerung").insertAdjacentHTML("afterend",
      '<button class="dbeispiel" id="beispiel"><span class="jp">' + esc(b.satz) + "</span>"
    + '<span class="de">' + esc(b.satzDe) + "</span></button>");
  $("#beispiel").addEventListener("click", function(){
    sprich(b.satz.replace(/\s+/g, ""), this, true);
  });
}

function zeichneSteuerung(){
  var ziel = $("#steuerung");
  zeichneBeispiel();
  if(!umgedreht){
    ziel.innerHTML = '<button class="umdrehknopf" id="umdrehen">Antwort zeigen</button>';
    $("#umdrehen").addEventListener("click", umdrehen);
    return;
  }
  var k = karte(schlange[0].id);
  var vs;
  try{ vs = PLAN.vorschau(k, Date.now()); }
  catch(e){ zeichneUeberspringen(ziel); return; }
  var frueh = istFrueh(k);
  function knopf(note, name){
    // Zu früh geübt und gewusst ändert den Plan nicht.
    var text = (frueh && note !== "nochmal") ? "unverändert" : PLAN.dauer(vs[note]);
    return '<button class="tap ' + note + '" data-note="' + note + '">'
      + '<span class="gross">' + name + '</span><span class="klein">' + text + "</span></button>";
  }
  ziel.innerHTML =
      '<div class="knoepfe">'
    + knopf("nochmal", "nochmal") + knopf("schwer", "schwer")
    + knopf("gut", "sitzt") + knopf("leicht", "leicht")
    + "</div>";
  $$("#steuerung .tap").forEach(function(b){
    b.addEventListener("click", function(){ bewerte(b.dataset.note); });
  });
}

/* Lässt sich für ein Wort kein Termin berechnen, wird es nicht bewertet.
   Statt der Antwortknöpfe gibt es nur "Überspringen"; das Wort bleibt
   unverändert und kommt beim nächsten Durchgang wieder. */
function zeichneUeberspringen(ziel){
  ziel.innerHTML = '<div class="info">Für dieses Wort lässt sich gerade kein Termin berechnen. '
    + "Es bleibt unverändert.</div>"
    + '<button class="umdrehknopf" id="ueberspringen">Überspringen</button>';
  $("#ueberspringen").addEventListener("click", ueberspringen);
}
function ueberspringen(){
  if(!schlange.length) return;
  schlange.shift();
  zeichneLernen();
}

function umdrehen(){
  if(umgedreht || !schlange.length) return;
  umgedreht = true;
  $("#flip").classList.add("um");
  zeichneSteuerung();
  var tk = $("#tonknopf");
  if(tk){
    tk.addEventListener("click", function(e){
      e.stopPropagation();
      sprich(schlange[0].kana, tk);
    });
  }
  if(einst.ton) sprich(schlange[0].kana, tk);
}

/* Ein Wort, das noch in Minutenschritten lernt (1 oder 10 Minuten), wandert
   nicht ans Ende, sondern ein paar Karten weiter nach hinten - weit genug,
   dass die Antwort nicht mehr vor Augen steht, nah genug, um in derselben
   Runde wiederzukommen. Bleibt nur noch dieses eine Wort in der Schlange,
   kommt es sofort wieder; etwas anderes gibt es dann nicht zu zeigen. */
function nachruecken(v, minuten){
  var abstand = minuten <= 1 ? 3 : (minuten <= 6 ? 6 : 9);
  schlange.splice(Math.min(abstand, schlange.length), 0, v);
}

/* Geübt vor dem Termin: ein Fehler zählt, ein gewusstes Wort ändert den
   Plan nicht (sonst ließe sich ein Wort durch Üben "weiterschieben"). */
function istFrueh(k){
  return !PLAN.istNeu(k) && k.lern === undefined && k.faellig > Date.now();
}

/* Übernimmt alle Felder, die plan.js zurückgibt (Liste dort). */
function uebernehmen(k, n){
  Object.keys(n).forEach(function(f){ k[f] = n[f]; });
  if(n.lern === undefined) delete k.lern;
}

function bewerte(note){
  if(!schlange.length || !umgedreht) return;
  standAuffrischen();                          // hat ein anderer Tab inzwischen geantwortet?
  var v = schlange[0], vorher = karte(v.id);
  var warNeu = PLAN.istNeu(vorher);
  var frueh = istFrueh(vorher);
  var minuten = 0;
  var s = null;

  // Erst rechnen, dann die Karte weglegen: scheitert die Rechnung, bleibt
  // alles, wie es war, und kein anderes Wort wird an ihrer Stelle bewertet.
  if(!(frueh && note !== "nochmal")){
    try{ s = PLAN.schritt(vorher, note, Date.now()); }
    catch(e){
      zeichneSteuerung();
      melde("Termin ließ sich nicht berechnen – nichts geändert");
      return;
    }
  }
  schlange.shift();
  if(s){
    var k = karteSchreiben(v.id);
    uebernehmen(k, s.k);
    minuten = s.minuten;
    if(warNeu){ neuHeuteAuffrischen(); einst.neuHeute.n += 1; einstSichern(); }
  }
  if(minuten > 0) nachruecken(v, minuten);     // lernt noch: kommt in dieser Runde wieder
  else getan += 1;

  standSichern();
  kopfAktualisieren();
  zeichneFilter();
  if(!schlange.length && !freiesUeben) schlangeBauen(false);   // Nachschub, falls inzwischen fällig
  zeichneLernen();
}

function leerAnsicht(){
  var basis = auswahl();
  if(!basis.length){
    return '<div class="leer"><span class="zeichen jp">空</span>'
      + "In dieser Auswahl liegt noch kein Wort.</div>";
  }
  var termine = basis.map(function(v){ return karte(v.id).faellig; })
                     .filter(function(f){ return f > 0; });
  var wann = "";
  if(basis.some(istNeu) && neuFrei() === 0){
    wann = "Das Limit für neue Wörter ist für heute erreicht (" + einst.neuProTag + "). "
         + "Morgen geht es mit den nächsten weiter.";
  }else if(termine.length === basis.length){
    var warte = Math.min.apply(null, termine) - Date.now();
    if(warte < 3600000) wann = "Weiter geht es in " + Math.max(1, Math.ceil(warte / 60000)) + " Min.";
    else wann = "Weiter geht es in " + tage(Math.max(1, Math.ceil(warte / TAG))) + ".";
  }else{
    wann = "Alles für heute abgearbeitet.";
  }
  var geschafft = getan > 0
    ? "<b>" + getan + "</b> " + (getan === 1 ? "Karte" : "Karten") + " in diesem Durchgang. "
    : "";
  return '<div class="leer"><span class="zeichen jp">完</span>'
    + geschafft + wann + "</div>"
    + '<button class="knopf nichtdrucken" id="weiterUeben" style="margin-top:16px">'
    + "Trotzdem weiterüben</button>";
}

/* ---------- Wischgesten auf der Karte ---------- */
function karteGesten(){
  var flip = $("#flip");
  if(!flip) return;
  var x0 = 0, y0 = 0, aktiv = false;

  flip.addEventListener("click", function(){ if(!umgedreht) umdrehen(); });

  flip.addEventListener("touchstart", function(e){
    if(e.touches.length !== 1) return;
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; aktiv = true;
  }, { passive: true });

  flip.addEventListener("touchend", function(e){
    if(!aktiv) return;
    aktiv = false;
    var t = e.changedTouches[0];
    var dx = t.clientX - x0, dy = t.clientY - y0;
    if(Math.abs(dx) < 80 || Math.abs(dy) > 55) return;
    if(!umgedreht){ umdrehen(); return; }
    bewerte(dx < 0 ? "nochmal" : "gut");
  }, { passive: true });
}

/* ---------- Fortschritt ---------- */
/* Was in den nächsten sieben Tagen fällig wird. So sieht man eine Lawine, bevor
   sie kommt. "heute" enthält auch alles Überfällige. */
function prognoseHtml(){
  var b0 = PLAN.tagesbeginn(Date.now());
  var tage7 = [0, 0, 0, 0, 0, 0, 0], gelernt = 0;
  V.forEach(function(v){
    var k = karte(v.id);
    if(PLAN.istNeu(k)) return;
    gelernt++;
    var d = Math.round((PLAN.tagesbeginn(k.faellig) - b0) / TAG);
    if(d < 0) d = 0;
    if(d < 7) tage7[d]++;
  });
  if(!gelernt) return "";
  var max = Math.max.apply(null, tage7.concat([1]));
  var h = '<h3>Nächste 7 Tage</h3><div class="prognose">';
  for(var i = 0; i < 7; i++){
    var name = i === 0 ? "heute" : i === 1 ? "morgen"
      : new Date(b0 + i * TAG + 6 * 3600000).toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
    h += '<div class="pspalte"><span class="pzahl">' + tage7[i] + "</span>"
      + '<span class="pbalken"><i style="height:' + Math.round(tage7[i] / max * 100) + '%"></i></span>'
      + '<span class="ptag">' + name + "</span></div>";
  }
  return h + "</div>";
}

function zeichneStand(){
  var begonnen = 0, gefestigt = 0;
  V.forEach(function(v){
    var k = karte(v.id);
    if(k.stufe > 0)    begonnen++;
    if(k.stufe >= FEST) gefestigt++;
  });
  var offen = V.filter(istWiederholung).length;   // Wiederholungen; Neues zählt hier nicht

  $("#kacheln").innerHTML =
      '<div class="kachel n"><b>' + begonnen  + "</b><span>begonnen</span></div>"
    + '<div class="kachel g"><b>' + gefestigt + "</b><span>gefestigt</span></div>"
    + '<div class="kachel a"><b>' + offen     + "</b><span>fällig</span></div>";

  /* Eine Zeile mit Balken. attr sagt, was ein Tipp darauf übt. */
  function reihe(attr, titel, w){
    var fest = 0, lernt = 0;
    w.forEach(function(v){
      var s = karte(v.id).stufe;
      if(s >= FEST) fest++; else if(s > 0) lernt++;
    });
    var pF = w.length ? Math.round(fest  / w.length * 100) : 0;
    var pL = w.length ? Math.round(lernt / w.length * 100) : 0;
    return '<button class="reihe" ' + attr + ">"
      + '<span class="kopfzeile"><span class="titel">' + titel + "</span>"
      +   '<span class="zahl">' + fest + " / " + w.length + "</span></span>"
      + '<span class="balken"><i class="fest" style="width:' + pF + '%"></i>'
      +   '<i class="lernt" style="width:' + pL + '%"></i></span>'
      + '<span class="fuss">' + (w.length - fest - lernt) + " noch nie gesehen · "
      +   w.filter(istWiederholung).length + " fällig</span>"
      + "</button>";
  }

  var html = prognoseHtml();
  var stufen = [5, 4].filter(function(n){ return V.some(function(v){ return v.n === n; }); });
  if(stufen.length){
    html += "<h3>JLPT</h3>";
    stufen.forEach(function(n){
      html += reihe('data-stufe="' + n + '"', "Alle N" + n + "-Wörter",
                    V.filter(function(v){ return v.n === n; }));
    });
  }
  TOPICS.forEach(function(t){
    html += "<h3>" + esc(topicName(t).lang) + "</h3>";
    Object.keys(ABSCHNITTE).filter(function(a){ return ABSCHNITTE[a].t === t; }).forEach(function(a){
      html += reihe('data-ab="' + a + '"',
                    "<em>" + ABSCHNITTE[a].nr + "</em>" + esc(ABSCHNITTE[a].titel),
                    V.filter(function(v){ return v.ab === a; }));
    });
  });
  $("#standListe").innerHTML = html;
  $("#exportFeld").value = JSON.stringify(stand);
}

/* ---------- Wortlisten ---------- */
function wortZeile(v, mitFehler){
  var k = karte(v.id);
  return '<button class="wortzeile" data-kana="' + esc(v.kana) + '">'
    + '<span class="links">'
    +   '<span class="kana jp">' + esc(v.kana) + "</span> "
    +   (v.kanji ? '<span class="kanjiw jp">' + esc(v.kanji) + "</span> " : "")
    +   '<span class="romaji">' + esc(v.romaji) + "</span>"
    +   '<span class="de">' + esc(v.de) + "</span>"
    + "</span>"
    + '<span class="rechts">'
    +   (mitFehler && k.fehler ? '<span class="fehlerzahl">' + k.fehler + "×</span>" : "")
    +   (v.n ? '<span class="stufe">N' + v.n + "</span>" : "")
    +   stufenPunkte(k.stufe, "mini")
    + "</span></button>";
}
function wortListe(rows, mitFehler){
  return '<div class="wortliste">' + rows.map(function(v){ return wortZeile(v, mitFehler); }).join("") + "</div>";
}

function problemWoerter(){
  return V.filter(istProblem).sort(function(a, b){
    return karte(b.id).fehler - karte(a.id).fehler;
  });
}

function zeichneProblem(){
  var p = problemWoerter();
  $("#druckKnopf").hidden = !p.length;
  $("#problemListe").innerHTML = p.length
    ? wortListe(p, true)
    : '<div class="leer"><span class="zeichen jp">良</span>'
      + "Noch keine Problemwörter. Sie sammeln sich hier, sobald du ein Wort zweimal "
      + "auf <b>nochmal</b> gesetzt hast.</div>";
}

function zeichneListe(){
  var q = $("#sucheFeld").value.trim().toLowerCase();
  var stufe = einst.listeStufe;
  var basis = stufe ? V.filter(function(v){ return v.n === stufe; }) : V;
  var treffer = basis;
  if(q){
    treffer = basis.filter(function(v){
      return v.kana.indexOf(q) >= 0
        || v.romaji.toLowerCase().indexOf(q) >= 0
        || v.de.toLowerCase().indexOf(q) >= 0
        || (v.kanji && v.kanji.indexOf(q) >= 0)
        || (v.en && v.en.toLowerCase().indexOf(q) >= 0);
    });
  }
  if(!treffer.length){
    $("#vollListe").innerHTML = '<div class="leer"><span class="zeichen jp">無</span>'
      + "Nichts gefunden.</div>";
    return;
  }
  if(q){
    $("#vollListe").innerHTML = "<h3>" + treffer.length + " Treffer</h3>" + wortListe(treffer, false);
    return;
  }
  var html = "";
  TOPICS.forEach(function(t){
    var teil = "";
    Object.keys(ABSCHNITTE).filter(function(a){ return ABSCHNITTE[a].t === t; }).forEach(function(a){
      var w = basis.filter(function(v){ return v.ab === a; });
      if(!w.length) return;                       // Stufenfilter: leere Abschnitte weglassen
      teil += "<h2>" + ABSCHNITTE[a].nr + " " + esc(ABSCHNITTE[a].titel) + "</h2>" + wortListe(w, false);
    });
    if(teil) html += "<h3>" + esc(topicName(t).lang) + "</h3>" + teil;
  });
  $("#vollListe").innerHTML = html;
}

/* ---------- Thema ---------- */
function themaSetzen(t){
  einst.thema = t;
  einstSichern();
  document.documentElement.setAttribute("data-thema", t);
  $$('.blatt [data-thema]').forEach(function(b){
    b.setAttribute("aria-pressed", b.dataset.thema === t ? "true" : "false");
  });
}

/* ---------- Problemwörter als Blatt ----------
   Auf dem Home-Bildschirm läuft die App ohne Safari-Leiste; ein
   "Teilen → Drucken" gibt es dort nicht. Also malt die App die Liste
   selbst auf ein A4-Blatt. Das Bild lässt sich sichern oder weitergeben
   und im Laden über die Netprint-App ausdrucken. */
var A4_B = 1240, A4_H = 1754;        // A4 bei 150 dpi
var RAND = 70, LUECKE = 50, KOPF = 150, ZEILE = 66;
var SPALTE  = (A4_B - 2 * RAND - LUECKE) / 2;
var PRO_SPALTE = Math.floor((A4_H - RAND - RAND - KOPF) / ZEILE);
var PRO_SEITE  = PRO_SPALTE * 2;
var C_JP   = '"Hiragino Kaku Gothic ProN","Hiragino Sans","Noto Sans JP",system-ui,sans-serif';
var C_MONO = 'ui-monospace,SFMono-Regular,Menlo,monospace';
var druckDateien = [];

/* Größte Schrift, mit der der Text noch in die Spalte passt. */
function passendeGroesse(x, text, breite, gross, klein){
  for(var g = gross; g > klein; g--){
    x.font = "600 " + g + "px " + C_JP;
    if(x.measureText(text).width <= breite) return g;
  }
  return klein;
}

/* Notfalls kürzen - eine Bedeutung, die nicht passt, wird beschnitten,
   statt in die Nachbarspalte zu laufen. */
function kuerze(x, text, breite){
  if(x.measureText(text).width <= breite) return text;
  while(text.length > 1 && x.measureText(text + "…").width > breite) text = text.slice(0, -1);
  return text + "…";
}

function malSeite(woerter, nr, gesamt){
  var c = document.createElement("canvas");
  c.width = A4_B; c.height = A4_H;
  var x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, A4_B, A4_H);

  x.fillStyle = "#000";
  x.font = "700 42px " + C_JP;
  x.fillText("Problemwörter", RAND, RAND + 42);
  x.fillStyle = "#555";
  x.font = "24px " + C_JP;
  x.fillText(new Date().toLocaleDateString("de-DE")
    + (gesamt > 1 ? "   ·   Seite " + nr + " von " + gesamt : ""), RAND, RAND + 84);
  x.strokeStyle = "#000"; x.lineWidth = 2;
  x.beginPath(); x.moveTo(RAND, RAND + 108); x.lineTo(A4_B - RAND, RAND + 108); x.stroke();

  // Auf einer nur halb gefuellten Seite stehen die Woerter sonst alle links.
  var hoch = Math.min(PRO_SPALTE, Math.ceil(woerter.length / 2));
  woerter.forEach(function(v, i){
    var spalte = i < hoch ? 0 : 1;
    var sx = RAND + spalte * (SPALTE + LUECKE);
    var sy = RAND + KOPF + (i - spalte * hoch) * ZEILE;
    var zahl = karte(v.id).fehler + "×";

    x.font = "600 20px " + C_JP;
    var zb = x.measureText(zahl).width;
    x.fillStyle = "#000";
    x.fillText(zahl, sx + SPALTE - zb, sy);

    var g = passendeGroesse(x, v.kana, SPALTE - zb - 130, 30, 20);
    x.font = "600 " + g + "px " + C_JP;
    x.fillText(v.kana, sx, sy);
    var kb = x.measureText(v.kana).width;

    x.font = "19px " + C_MONO;
    x.fillStyle = "#666";
    x.fillText(kuerze(x, v.romaji, SPALTE - kb - zb - 24), sx + kb + 14, sy);

    x.font = "22px " + C_JP;
    x.fillStyle = "#222";
    x.fillText(kuerze(x, v.de, SPALTE), sx, sy + 30);

    x.strokeStyle = "#ddd"; x.lineWidth = 1;
    x.beginPath(); x.moveTo(sx, sy + 46.5); x.lineTo(sx + SPALTE, sy + 46.5); x.stroke();
  });
  return c;
}

function teilenAnbieten(){
  var d = druckDateien.filter(Boolean);
  var geht = d.length > 0 && d.length === druckDateien.length
    && !!navigator.canShare && navigator.canShare({ files: d });
  $("#druckTeilen").hidden = !geht;
  $("#druckHinweis").innerHTML = geht
    ? "<b>Blatt teilen</b> legt es in Fotos oder Dateien - von dort nimmt es "
      + "die Netprint-App zum Ausdrucken. Es geht auch ohne: lange auf das "
      + "Blatt tippen und <b>Bild sichern</b> wählen."
    : "Lange auf das Blatt tippen und <b>Bild sichern</b> wählen. Dann liegt es "
      + "in Fotos, und die Netprint-App druckt es im Laden aus.";
}

function druckblattOeffnen(){
  var w = problemWoerter();
  if(!w.length){ melde("Noch keine Problemwörter"); return; }

  var seiten = [];
  for(var i = 0; i < w.length; i += PRO_SEITE) seiten.push(w.slice(i, i + PRO_SEITE));

  var ziel = $("#druckSeiten");
  ziel.innerHTML = "";
  druckDateien = new Array(seiten.length);
  $("#druckTeilen").hidden = true;
  $("#druckHinweis").textContent = "Blatt wird gesetzt …";

  var offen = seiten.length;
  seiten.forEach(function(teil, i){
    var c = malSeite(teil, i + 1, seiten.length);
    var bild = new Image();
    bild.className = "druckseite";
    bild.alt = "Problemwörter, Seite " + (i + 1) + " von " + seiten.length;
    bild.src = c.toDataURL("image/png");
    ziel.appendChild(bild);
    // Die Datei fürs Teilen entsteht nebenher; das Bild steht schon.
    c.toBlob(function(b){
      if(b) druckDateien[i] = new File([b], "problemwoerter-" + (i + 1) + ".png",
                                       { type: "image/png" });
      if(--offen === 0) teilenAnbieten();
    }, "image/png");
  });
  blattAuf("#druckblatt");
}

/* ---------- Blätter von unten ---------- */
function blattAuf(sel){
  if(sel === "#blatt") zeichneStand();      // Sicherungsfeld frisch befüllen
  $("#blattgrund").classList.add("auf");
  $(sel).classList.add("auf");
}
function blattZu(){
  $("#blattgrund").classList.remove("auf");
  $$(".blatt").forEach(function(b){ b.classList.remove("auf"); });
}
function schalter(id, feld, danach){
  var b = $(id);
  b.setAttribute("aria-checked", einst[feld] ? "true" : "false");
  b.addEventListener("click", function(){
    einst[feld] = !einst[feld];
    b.setAttribute("aria-checked", einst[feld] ? "true" : "false");
    einstSichern();
    if(danach) danach();
  });
}

function richtungAnzeigen(){
  ["kana", "de", "kanji"].forEach(function(r){
    var b = $("#rtg" + r.charAt(0).toUpperCase() + r.slice(1));
    if(b) b.setAttribute("aria-pressed", einst.richtung === r ? "true" : "false");
  });
}
function listeStufeAnzeigen(){
  $$("#listeStufe button").forEach(function(b){
    b.setAttribute("aria-pressed", +b.dataset.stufe === einst.listeStufe ? "true" : "false");
  });
}

var NEU_LIMITS = [5, 10, 15, 20, 30, 50, 0];
function neuAnzeigen(){
  $("#neuKnopf").textContent = einst.neuProTag === 0 ? "alle" : einst.neuProTag;
  $("#neuText").textContent = einst.neuProTag === 0
    ? "Keine Begrenzung für neue Wörter"
    : "Höchstens " + einst.neuProTag + " neue Wörter pro Tag";
}

var LIMITS = [20, 40, 60, 100, 0];
function limitAnzeigen(){
  $("#limitKnopf").textContent = einst.limit === 0 ? "alle" : einst.limit;
  $("#limitText").textContent = einst.limit === 0
    ? "Alle fälligen Karten in einem Durchgang"
    : "Höchstens " + einst.limit + " Karten pro Durchgang";
}

/* ---------- Sichern und Laden ---------- */
function standKopieren(){
  var text = JSON.stringify(stand);
  $("#exportFeld").value = text;
  var fertig = function(){ melde("Lernstand kopiert"); };
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(fertig, altKopieren);
  }else altKopieren();

  function altKopieren(){
    var f = $("#exportFeld");
    f.focus(); f.setSelectionRange(0, f.value.length);
    try{ document.execCommand("copy") ? fertig() : melde("Bitte von Hand markieren und kopieren"); }
    catch(e){ melde("Bitte von Hand markieren und kopieren"); }
  }
}
/* Laden ersetzt den ganzen Lernstand. Deshalb: erst prüfen, ohne etwas
   anzufassen, dann mit Zahlen nachfragen, den jetzigen Stand aufbewahren
   und erst danach ersetzen. Der aufbewahrte Stand lässt sich mit
   "Vorherigen Stand zurückholen" wiederherstellen. */
var K_VORHER = "kotoba-v2-vorher";
var KENNUNGEN = null;
function istWortDerApp(id){
  if(!KENNUNGEN){ KENNUNGEN = {}; V.forEach(function(v){ KENNUNGEN[v.id] = true; }); }
  return KENNUNGEN[id] === true;
}
function woerterText(n){ return n === 1 ? "1 Wort" : n + " Wörter"; }
/* Gleicher Lernstand? Die Reihenfolge der Einträge und Felder spielt keine Rolle. */
function gleicherStand(a, b){
  var ka = Object.keys(a), kb = Object.keys(b);
  if(ka.length !== kb.length) return false;
  function sortiert(o){ return JSON.stringify(Object.keys(o).sort().map(function(f){ return [f, o[f]]; })); }
  return ka.every(function(id){ return b[id] && sortiert(a[id]) === sortiert(b[id]); });
}
function vorherAufbewahren(){
  try{
    var roh = JSON.stringify({ zeit: Date.now(), stand: stand });
    localStorage.setItem(K_VORHER, roh);
    return localStorage.getItem(K_VORHER) === roh;
  }catch(e){ return false; }
}
function holeVorher(){
  var v = hole(K_VORHER, null);
  return (v && v.stand && typeof v.stand === "object" && !Array.isArray(v.stand)) ? v : null;
}
function zurueckholenAnzeigen(){
  var b = $("#knopfZurueckholen");
  if(b) b.hidden = !holeVorher();
}
/* Ersetzt den Lernstand, nachdem der jetzige aufbewahrt ist. Scheitert
   eines von beiden, bleibt alles, wie es war. */
function standErsetzen(neu, fertig){
  if(!vorherAufbewahren()){ melde("Jetziger Stand ließ sich nicht aufbewahren – nichts geändert"); return; }
  var alt = stand;
  stand = neu;
  if(!standSichern()){ stand = alt; melde("Speichern ging nicht – nichts geändert"); return; }
  alleNeuZeichnen();
  zurueckholenAnzeigen();
  melde(fertig);
}
function standLaden(){
  standAuffrischen();                          // mit dem neuesten Stand vergleichen
  var neu;
  try{ neu = JSON.parse($("#exportFeld").value.trim()); }catch(e){ neu = null; }
  if(!neu || typeof neu !== "object" || Array.isArray(neu)){
    melde("Text nicht lesbar - bitte vollständig einfügen");
    return;
  }
  neu = normalisiere(neu);
  var inSicherung = Object.keys(neu).filter(istWortDerApp);
  if(!inSicherung.length){ melde("In diesem Text steht kein Lernstand dieser App"); return; }
  if(gleicherStand(neu, stand)){ melde("Das ist bereits dein aktueller Lernstand"); return; }

  var jetzt  = Object.keys(stand).filter(istWortDerApp);
  var fehlen = jetzt.filter(function(id){ return !neu[id]; }).length;
  var neuer  = jetzt.filter(function(id){
    return neu[id] && (stand[id].zuletzt || 0) > (neu[id].zuletzt || 0);
  }).length;
  var frage = "Lernstand ersetzen?\n\n"
    + "Jetzt: " + woerterText(jetzt.length) + " begonnen\n"
    + "In der Sicherung: " + woerterText(inSicherung.length) + "\n"
    + (fehlen ? (fehlen === 1 ? "1 gelerntes Wort fehlt" : fehlen + " gelernte Wörter fehlen") + " in der Sicherung.\n" : "")
    + (neuer ? "Bei " + (neuer === 1 ? "1 Wort" : neuer + " Wörtern") + " ist dein jetziger Stand neuer.\n" : "")
    + "\nDein jetziger Stand wird vorher aufbewahrt und lässt sich mit "
    + "„Vorherigen Stand zurückholen“ wiederherstellen.";
  if(!confirm(frage)) return;
  standErsetzen(neu, "Lernstand geladen");
}
function vorherZurueckholen(){
  var v = holeVorher();
  if(!v){ zurueckholenAnzeigen(); return; }
  var d = new Date(v.zeit);
  var wann = isFinite(d) ? d.toLocaleDateString("de-DE") + " "
    + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "unbekannt";
  var anzahl = Object.keys(v.stand).filter(istWortDerApp).length;
  if(!confirm("Den Stand von vor dem letzten Laden zurückholen?\n\n"
    + "Aufbewahrt am " + wann + ", " + woerterText(anzahl) + ".\n\n"
    + "Dein jetziger Stand wird dabei seinerseits aufbewahrt.")) return;
  standErsetzen(normalisiere(v.stand), "Vorheriger Stand zurückgeholt");
}
function standReset(){
  if(!confirm("Wirklich den kompletten Lernstand löschen? Das lässt sich nicht rückgängig machen.")) return;
  stand = {};
  standSichern();
  alleNeuZeichnen();
  melde("Lernstand zurückgesetzt");
}
function alleNeuZeichnen(){
  schlangeBauen(false);
  zeichneFilter();
  zeichneLernen();
  kopfAktualisieren();
  zeichneStand();
  if(aktiverBereich === "problem") zeichneProblem();
  if(aktiverBereich === "liste")   zeichneListe();
}

/* ---------- Ereignisse verdrahten ---------- */
function verdrahten(){
  $$(".leiste button").forEach(function(b){
    b.addEventListener("click", function(){ zeige(b.dataset.ziel); });
  });

  $("#filterKnopf").addEventListener("click", function(){ blattAuf("#filterblatt"); });
  $("#filterblattZu").addEventListener("click", blattZu);
  $("#filterliste").addEventListener("click", function(e){
    var z = e.target.closest(".fzeile");
    if(!z) return;
    setzeFilter(filterListe()[+z.dataset.i]);
    blattZu();
  });

  $$(".segment [data-rtg]").forEach(function(b){
    b.addEventListener("click", function(){
      einst.richtung = b.dataset.rtg;
      einstSichern();
      richtungAnzeigen();
      umgedreht = false;
      zeichneLernen();
    });
  });

  $("#kartenbereich").addEventListener("click", function(e){
    if(e.target.closest("#weiterUeben")){
      schlangeBauen(true);
      if(!schlange.length) melde("In dieser Auswahl liegt kein Wort");
      zeichneLernen();
    }
  });

  $("#standListe").addEventListener("click", function(e){
    var r = e.target.closest(".reihe");
    if(!r) return;
    if(r.dataset.stufe) setzeFilter({ art: "stufe", wert: +r.dataset.stufe });
    else                setzeFilter({ art: "ab", wert: r.dataset.ab });
    zeige("lernen");
  });

  $$("#listeStufe button").forEach(function(b){
    b.addEventListener("click", function(){
      einst.listeStufe = +b.dataset.stufe;
      einstSichern();
      listeStufeAnzeigen();
      zeichneListe();
    });
  });

  ["#problemListe", "#vollListe"].forEach(function(sel){
    $(sel).addEventListener("click", function(e){
      var z = e.target.closest(".wortzeile");
      if(z) sprich(z.dataset.kana, z);
    });
  });

  var suchUhr = null;
  $("#sucheFeld").addEventListener("input", function(){
    clearTimeout(suchUhr);
    suchUhr = setTimeout(zeichneListe, 120);
  });

  $("#druckKnopf").addEventListener("click", druckblattOeffnen);
  $("#druckblattZu").addEventListener("click", blattZu);
  $("#druckTeilen").addEventListener("click", function(){
    var d = druckDateien.filter(Boolean);
    if(!d.length) return;
    // Aus der Geste heraus teilen; die Dateien liegen schon fertig bereit.
    navigator.share({ files: d, title: "Problemwörter" }).catch(function(){});
  });

  $("#knopfEinstellungen").addEventListener("click", function(){ blattAuf("#blatt"); });
  $("#blattZu").addEventListener("click", blattZu);
  $("#blattgrund").addEventListener("click", blattZu);

  $$('.blatt [data-thema]').forEach(function(b){
    b.addEventListener("click", function(){ themaSetzen(b.dataset.thema); });
  });

  schalter("#schalterRomaji",  "romaji",  function(){ zeichneLernen(); });
  schalter("#schalterBilder",  "bilder",  function(){ zeichneLernen(); });
  schalter("#schalterKanji",   "kanji",   function(){ zeichneLernen(); });
  schalter("#schalterTon",     "ton");
  schalter("#schalterMischen", "mischen", function(){ schlangeBauen(false); zeichneLernen(); });

  $("#limitKnopf").addEventListener("click", function(){
    var i = LIMITS.indexOf(einst.limit);
    einst.limit = LIMITS[(i + 1) % LIMITS.length];
    einstSichern();
    limitAnzeigen();
    schlangeBauen(false);
    zeichneLernen();
  });

  $("#neuKnopf").addEventListener("click", function(){
    var i = NEU_LIMITS.indexOf(einst.neuProTag);
    einst.neuProTag = NEU_LIMITS[(i + 1) % NEU_LIMITS.length];
    einstSichern();
    neuAnzeigen();
    schlangeBauen(false);
    zeichneLernen();
    kopfAktualisieren();
    zeichneFilter();
  });

  $("#knopfKopieren").addEventListener("click", standKopieren);
  $("#knopfLaden").addEventListener("click", standLaden);
  var zurueck = $("#knopfZurueckholen");
  if(zurueck) zurueck.addEventListener("click", vorherZurueckholen);
  $("#knopfReset").addEventListener("click", standReset);

  document.addEventListener("keydown", function(e){
    if(e.target.matches("input, textarea")) return;
    if(e.key === "Escape"){ blattZu(); return; }
    if(aktiverBereich !== "lernen" || !schlange.length) return;
    if(e.key === " " || e.key === "Enter"){
      e.preventDefault();
      if(!umgedreht) umdrehen();
      else bewerte("gut");
    }
    if(umgedreht && e.key === "1") bewerte("nochmal");
    if(umgedreht && e.key === "2") bewerte("schwer");
    if(umgedreht && e.key === "3") bewerte("gut");
    if(umgedreht && e.key === "4") bewerte("leicht");
  });

  // Tageswechsel oder Rückkehr in die App: fällige Karten neu bestimmen
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState !== "visible") return;
    standAuffrischen();                        // ein anderer Tab hat vielleicht geantwortet
    neuHeuteAuffrischen();
    kopfAktualisieren();
    zeichneFilter();
    if(aktiverBereich === "lernen" && !schlange.length && !freiesUeben){
      schlangeBauen(false);
      zeichneLernen();
    }
  });

  // Ein anderer Tab hat gespeichert: Stand und Tageszähler übernehmen und die
  // Anzeige nachziehen. Die Knöpfe der offenen Karte zeigen danach, was eine
  // Antwort auf dem neuen Stand bewirkt.
  window.addEventListener("storage", function(e){
    var geaendert = false;
    if(e.key === K_STAND || e.key === null) geaendert = standAuffrischen() || geaendert;
    if(e.key === K_EINST || e.key === null){ neuHeuteAuffrischen(); geaendert = true; }
    if(!geaendert) return;
    kopfAktualisieren();
    zeichneFilter();
    if(aktiverBereich === "lernen" && umgedreht && schlange.length) zeichneSteuerung();
  });
}

/* ---------- Gesicherte unlesbare Daten ----------
   Solange es eine Kopie unlesbarer Daten gibt oder Daten nicht gesichert
   werden konnten, steht über der Karte ein Hinweis. Von dort lässt sich der
   alte Text kopieren und die Kopie, wenn sie nicht mehr gebraucht wird,
   verwerfen. */
function gerettete(){
  var aus = [];
  try{
    for(var i = 0; i < localStorage.length; i++){
      var n = localStorage.key(i);
      if(n.indexOf(RETTUNG) > 0) aus.push(n);
    }
  }catch(e){ /* dann eben keine */ }
  return aus.sort();
}
function textKopieren(text, fertig){
  function alt(){
    var f = document.createElement("textarea");
    f.value = text; f.setAttribute("readonly", "");
    f.style.position = "fixed"; f.style.opacity = "0";
    document.body.appendChild(f);
    f.focus(); f.setSelectionRange(0, text.length);
    var ok = false;
    try{ ok = document.execCommand("copy"); }catch(e){ /* unten */ }
    document.body.removeChild(f);
    melde(ok ? fertig : "Kopieren ging nicht");
  }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(function(){ melde(fertig); }, alt);
  }else alt();
}
function zeigeRettung(){
  var alt = $("#rettung");
  if(alt) alt.parentNode.removeChild(alt);
  var kopien = gerettete(), offen = Object.keys(gesperrt);
  if(!kopien.length && !offen.length) return;
  var text = offen.length
    ? "Gespeicherte Daten sind beschädigt und konnten nicht gesichert werden. Damit nichts "
      + "verloren geht, speichert die App in dieser Sitzung nichts darüber. Kopiere den alten "
      + "Text und bewahre ihn auf."
    : "Gespeicherte Daten waren beschädigt und ließen sich nicht lesen. Sie sind unverändert "
      + "gesichert, die App hat neu begonnen. Kopiere den gesicherten Text, um ihn aufzubewahren.";
  $("#kartenbereich").insertAdjacentHTML("beforebegin",
      '<div class="info" id="rettung">' + text
    + '<button class="knopf" id="rettungKopieren" style="margin:10px 0 0">Gesicherten Text kopieren</button>'
    + (offen.length ? "" : '<button class="knopf warn" id="rettungVerwerfen" style="margin:8px 0 0">Kopie verwerfen</button>')
    + "</div>");
  $("#rettungKopieren").addEventListener("click", function(){
    var texte = offen.map(function(s){ return gesperrt[s]; });
    kopien.forEach(function(n){ try{ texte.push(localStorage.getItem(n)); }catch(e){ /* weiter */ } });
    textKopieren(texte.join("\n\n"), "Gesicherter Text kopiert");
  });
  var weg = $("#rettungVerwerfen");
  if(weg) weg.addEventListener("click", function(){
    if(!confirm("Die gesicherte Kopie der beschädigten Daten endgültig löschen? "
      + "Kopiere sie vorher, falls du sie noch brauchst.")) return;
    kopien.forEach(entferne);
    zeigeRettung();
  });
}

/* ---------- Selbstheilung bei gemischten Fassungen ----------
   Der Service Worker holt jede Datei einzeln. Uebernimmt eine neue Fassung
   mitten in einer geladenen Seite, koennen index.html und app.js aus
   verschiedenen Staenden stammen; dann fehlen Elemente und der Start bricht
   ab. Einmal neu laden bringt beide wieder auf denselben Stand. Der Merker
   in sessionStorage verhindert eine Schleife. */
var MERKER = "kotoba-neu-geladen";

function einmalNeuLaden(grund){
  try{
    if(sessionStorage.getItem(MERKER)) return false;
    sessionStorage.setItem(MERKER, grund);
  }catch(e){ return false; }
  location.reload();
  return true;
}

function zeigeStartfehler(){
  var b = document.getElementById("kartenbereich");
  if(!b) return;
  b.innerHTML = '<div class="info">Die App konnte nicht starten. Schliess sie einmal ganz '
    + "und oeffne sie neu. Hilft das nicht, tippe unter Einstellungen auf "
    + "<b>Stand kopieren</b> und sichere ihn, bevor du weitermachst.</div>";
}

/* ---------- Start ---------- */
function start(){
  document.documentElement.setAttribute("data-thema", einst.thema);
  // Nummerierte Topics als Spanne, benannte Gruppen davor beim Namen nennen.
  var benannt = TOPICS.filter(function(t){ return TOPICNAMEN[t]; })
                      .map(function(t){ return topicName(t).lang; });
  var zahlen  = TOPICS.filter(function(t){ return !TOPICNAMEN[t]; });
  var teile   = benannt.slice();
  if(zahlen.length > 1) teile.push("Topic " + zahlen[0] + " bis " + zahlen[zahlen.length - 1]);
  else if(zahlen.length) teile.push("Topic " + zahlen[0]);
  var spanne = teile.join(" · ");
  $("#anzahlGesamt").textContent = V.length;
  $("#ueberZahl").textContent    = V.length;
  $("#topicSpanne").textContent  = spanne;
  $("#ueberSpanne").textContent  = spanne;
  richtungAnzeigen();
  listeStufeAnzeigen();
  // Die Schrift kann später geladen werden und das Telefon gedreht; dann neu anpassen.
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(karteAnpassen);
  var anpassUhr = null;
  window.addEventListener("resize", function(){
    clearTimeout(anpassUhr);
    anpassUhr = setTimeout(karteAnpassen, 120);
  });

  // Ein gespeicherter Filter gilt nur, wenn es ihn in der Auswahl gibt: Abschnitte
  // können umbenannt werden, und der Problemfilter kann inzwischen leer sein.
  var f0 = einst.filter;
  if(!f0 || typeof f0 !== "object" || !filterListe().some(function(f){ return gleicherFilter(f, f0); })){
    einst.filter = { art: "alle", wert: 0 };
  }

  verdrahten();
  limitAnzeigen();
  neuAnzeigen();
  zurueckholenAnzeigen();
  themaSetzen(einst.thema);
  zeichneFilter();
  schlangeBauen(false);
  zeichneLernen();
  kopfAktualisieren();

  if(!speicherOk && !$("#speicherWarnung")){
    $("#kartenbereich").insertAdjacentHTML("beforebegin",
      '<div class="info">Dieser Browser speichert gerade nichts dauerhaft. Der Fortschritt gilt '
      + "nur für diese Sitzung.</div>");
  }
  zeigeRettung();
  // dojo.js liest seinen Stand erst nach diesem Start; danach noch einmal nachsehen.
  window.addEventListener("load", zeigeRettung);

  if("serviceWorker" in navigator){
    // Uebernimmt ein neuer Service Worker, passt das geladene Skript
    // moeglicherweise nicht mehr zum geladenen HTML - also neu laden. Beim
    // allerersten Besuch gab es noch keinen Vorgaenger; diese Uebernahme ist
    // erwartbar und darf kein Neuladen ausloesen.
    var hatteVorgaenger = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function(){
      if(hatteVorgaenger) einmalNeuLaden("fassungswechsel");
    });
    window.addEventListener("load", function(){
      navigator.serviceWorker.register("sw.js").catch(function(){ /* offline nicht verfügbar */ });
    });
  }

  try{ sessionStorage.removeItem(MERKER); }catch(e){ /* egal */ }
}

/* Was der Zusatz in dojo.js vom Trainer braucht. */
window.KOTOBA = {
  esc: esc, einst: einst, hole: hole, lege: lege,
  sprich: sprich, spracheDa: spracheDa, melde: melde,
  blattAuf: blattAuf, blattZu: blattZu, passeAn: passeAn
};

try{
  start();
}catch(e){
  // Ein Neustart repariert eine gemischte Fassung. Scheitert es danach
  // wieder, bleibt es beim Hinweis statt bei einem leeren Bildschirm.
  if(!einmalNeuLaden("startfehler")) zeigeStartfehler();
}
})();
