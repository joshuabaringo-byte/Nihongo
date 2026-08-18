/* ==================================================================
   ことば - Vokabeltrainer
   Nutzt V und ABSCHNITTE aus vokabeln.js
   ================================================================== */
(function () {
"use strict";

/* ---------- Konstanten ---------- */
var TAG      = 86400000;
var STUFEN   = [0, 1, 2, 4, 8, 17, 35];   // Tage bis zur nächsten Abfrage
var MAXSTUFE = STUFEN.length - 1;         // 6
var FEST     = 5;                         // ab dieser Stufe gilt ein Wort als gefestigt
var K_STAND  = "kotoba-v2";
var K_EINST  = "kotoba-einst";
/* Frueher benutzte Namen, neueste zuerst. Sie werden einmalig uebernommen,
   damit ein bestehender Lernstand beim Umbenennen nicht verloren geht. */
var K_FRUEHER       = ["arc-kotoba-v2", "arc-kotoba-v1"];
var K_EINST_FRUEHER = ["arc-kotoba-einst"];
var NACHRUECK = 4;                        // nach wie vielen Karten ein "nochmal" wiederkommt

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

function hole(schluessel, ersatz){
  try{
    var roh = localStorage.getItem(schluessel);
    if(!roh) return ersatz;
    var d = JSON.parse(roh);
    return (d && typeof d === "object" && !Array.isArray(d)) ? d : ersatz;
  }catch(e){ speicherOk = false; return ersatz; }
}
function lege(schluessel, wert){
  try{ localStorage.setItem(schluessel, JSON.stringify(wert)); }
  catch(e){ speicherOk = false; }
}
function entferne(schluessel){
  try{ localStorage.removeItem(schluessel); }catch(e){ /* egal */ }
}

/* Liest den aktuellen Schluessel; ist er leer, wird der erste gefuellte
   frueher benutzte Schluessel uebernommen und danach aufgeraeumt. */
function holeMitUebernahme(schluessel, frueher){
  var d = hole(schluessel, null);
  if(d) return d;
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

var einst = holeMitUebernahme(K_EINST, K_EINST_FRUEHER);
if(einst.thema    === undefined) einst.thema    = "auto";
if(einst.romaji   === undefined) einst.romaji   = true;
if(einst.ton      === undefined) einst.ton      = false;
if(einst.mischen  === undefined) einst.mischen  = true;
if(einst.limit    === undefined) einst.limit    = 40;
if(einst.richtung === undefined) einst.richtung = "kana";
if(einst.filter   === undefined) einst.filter   = { art: "alle", wert: 0 };

function standSichern(){ lege(K_STAND, stand); }
function einstSichern(){ lege(K_EINST, einst); }

/* ---------- Kartenzustand ----------
   Gelesen wird über karte(): unbekannte Wörter liefern die Vorgabe zurück,
   ohne einen Eintrag anzulegen. Erst eine Bewertung schreibt wirklich etwas.
   So bleibt die Sicherungskopie klein genug zum Kopieren.            */
var VORGABE = { stufe: 0, faellig: 0, fehler: 0 };

function normalisiere(d){
  Object.keys(d).forEach(function(id){
    var k = d[id];
    if(!k || typeof k !== "object"){ delete d[id]; return; }
    if(typeof k.stufe   !== "number" || k.stufe < 0)  k.stufe   = 0;
    if(typeof k.faellig !== "number")                 k.faellig = 0;
    if(typeof k.fehler  !== "number" || k.fehler < 0) k.fehler  = 0;
    if(k.stufe > MAXSTUFE) k.stufe = MAXSTUFE;
    if(k.stufe === 0 && k.fehler === 0) delete d[id];   // sagt nichts aus
  });
  return d;
}

function karte(id){ return stand[id] || VORGABE; }

function karteSchreiben(id){
  var k = stand[id];
  if(!k) k = stand[id] = { stufe: 0, faellig: 0, fehler: 0 };
  return k;
}
function istFaellig(v){
  var k = karte(v.id);
  return k.stufe === 0 || k.faellig <= Date.now();
}
function istProblem(v){ return karte(v.id).fehler >= 2; }

/* ---------- Auswahl über den Filter ---------- */
function auswahl(f){
  f = f || einst.filter;
  if(f.art === "topic")   return V.filter(function(v){ return v.t === f.wert; });
  if(f.art === "ab")      return V.filter(function(v){ return v.ab === f.wert; });
  if(f.art === "problem") return V.filter(istProblem);
  return V;
}
function faelligeAus(liste){ return liste.filter(istFaellig); }

function filterName(f, lang){
  if(f.art === "topic")   return "Ganzes Topic " + f.wert;
  if(f.art === "ab"){
    var a = ABSCHNITTE[f.wert], kurz = "T" + a.t + " " + a.nr;
    return lang ? kurz + " · " + a.titel : kurz;
  }
  if(f.art === "problem") return "Problemwörter";
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
  var liste = alleTrotzdem ? basis.slice() : faelligeAus(basis);

  if(einst.mischen) mische(liste);
  else liste.sort(function(a, b){ return karte(a.id).faellig - karte(b.id).faellig; });

  // Wiederholungen zuerst, neue Wörter danach - sonst verdrängt der Nachschub
  // an Unbekanntem die Wörter, die gerade festgehalten werden wollen.
  if(einst.mischen){
    liste.sort(function(a, b){ return (karte(a.id).stufe === 0) - (karte(b.id).stufe === 0); });
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
function sprich(kana, knopf){
  if(!spracheDa) return;
  var text = sprechbar(kana);
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
var BEREICHE = ["lernen", "stand", "problem", "liste"];
var aktiverBereich = "lernen";

function zeige(name){
  aktiverBereich = name;
  BEREICHE.forEach(function(n){ $("#" + n).hidden = (n !== name); });
  $$(".leiste button").forEach(function(b){
    b.setAttribute("aria-selected", b.dataset.ziel === name ? "true" : "false");
  });
  if(name === "stand")   zeichneStand();
  if(name === "problem") zeichneProblem();
  if(name === "liste")   zeichneListe();
  window.scrollTo({ top: 0, behavior: "instant" in document.body.style ? "instant" : "auto" });
}

/* ---------- Kopfzeile ---------- */
function kopfAktualisieren(){
  var offen = faelligeAus(V).length;   // immer der Gesamtstand, unabhängig vom Filter
  var z = $("#zaehler");
  $("#zaehlerText").textContent = offen > 0 ? offen + " fällig" : "alles fertig";
  z.classList.toggle("fertig", offen === 0);

  var problemZahl = V.filter(istProblem).length;
  var kringel = $("#problemKringel");
  kringel.hidden = problemZahl === 0;
  kringel.textContent = problemZahl > 99 ? "99+" : problemZahl;
}

/* ---------- Auswahl ---------- */
function filterListe(){
  var f = [{ art: "alle", wert: 0 }];
  if(V.filter(istProblem).length) f.push({ art: "problem", wert: 0 });
  TOPICS.forEach(function(t){ f.push({ art: "topic", wert: t }); });
  Object.keys(ABSCHNITTE).forEach(function(a){ f.push({ art: "ab", wert: a }); });
  return f;
}

function zeichneFilter(){
  var liste = filterListe();

  var offen = faelligeAus(auswahl()).length;
  $("#filterName").textContent = filterName(einst.filter, true);
  $("#filterZahl").textContent = offen ? offen + " fällig" : "fertig";

  function zeile(i, klasse, nr, titel){
    var f = liste[i];
    var n = faelligeAus(auswahl(f)).length;
    return '<button class="fzeile' + (klasse ? " " + klasse : "") + '" data-i="' + i + '"'
      + ' aria-current="' + (gleicherFilter(f, einst.filter) ? "true" : "false") + '">'
      + (nr ? '<span class="fnr">' + esc(nr) + "</span>" : "")
      + '<span class="ftitel">' + esc(titel) + "</span>"
      + '<span class="fzahl' + (n ? " offen" : "") + '">' + (n ? n : "–") + "</span>"
      + "</button>";
  }

  var h = "";
  liste.forEach(function(f, i){
    if(f.art === "alle")    h += zeile(i, "", "", "Alle Wörter");
    if(f.art === "problem") h += zeile(i, "", "", "Problemwörter");
  });
  TOPICS.forEach(function(t){
    h += '<div class="fgruppe">Topic ' + t + "</div>";
    liste.forEach(function(f, i){
      if(f.art === "topic" && f.wert === t)
        h += zeile(i, "", "", "Ganzes Topic " + t);
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

  var marke   = "T" + v.t + " " + ABSCHNITTE[v.ab].nr + (k.stufe === 0 ? " · neu" : "");
  var wortart = v.wa ? '<span class="wortart">' + esc(v.wa) + "</span>" : "";
  var punkte  = stufenPunkte(k.stufe, "stufenpunkte");

  var vorneText = einst.richtung === "kana"
    ? '<div class="wort jp">' + esc(v.kana) + "</div>"
    : '<div class="wort de">' + esc(v.de) + "</div>";

  var hinten =
      '<div class="wort jp">' + esc(v.kana) + "</div>"
    + (einst.romaji ? '<div class="lesung">' + esc(v.romaji) + "</div>" : "")
    + '<div class="strich"></div>'
    + '<div class="bedeutung">' + esc(v.de) + "</div>"
    + (spracheDa
        ? '<button class="tonknopf" id="tonknopf" aria-label="Aussprache anhören">'
          + '<svg viewBox="0 0 24 24"><use href="#i-ton"/></svg></button>'
        : "");

  bereich.innerHTML =
      '<div class="buehne"><div class="flip" id="flip">'
    +   '<div class="seite vorder"><span class="marke">' + esc(marke) + "</span>" + wortart
    +     vorneText + '<div class="tipp">Tippen zum Umdrehen</div>' + punkte
    +   "</div>"
    +   '<div class="seite rueck"><span class="marke">' + esc(marke) + "</span>" + wortart
    +     hinten + punkte
    +   "</div>"
    + "</div></div>"
    + '<div id="steuerung"></div>';

  umgedreht = false;
  zeichneSteuerung();
  karteGesten();
}

function zeichneSteuerung(){
  var ziel = $("#steuerung");
  if(!umgedreht){
    ziel.innerHTML = '<button class="umdrehknopf" id="umdrehen">Antwort zeigen</button>';
    $("#umdrehen").addEventListener("click", umdrehen);
    return;
  }
  var k = karte(schlange[0].id);
  var sGut    = Math.min(k.stufe + 1, MAXSTUFE);
  var sLeicht = Math.min(k.stufe + 2, MAXSTUFE);
  ziel.innerHTML =
      '<div class="knoepfe">'
    + '<button class="tap nochmal" data-note="nochmal"><span class="gross">nochmal</span><span class="klein">gleich</span></button>'
    + '<button class="tap gut" data-note="gut"><span class="gross">sitzt</span><span class="klein">' + tage(STUFEN[sGut]) + "</span></button>"
    + '<button class="tap leicht" data-note="leicht"><span class="gross">leicht</span><span class="klein">' + tage(STUFEN[sLeicht]) + "</span></button>"
    + "</div>";
  $$("#steuerung .tap").forEach(function(b){
    b.addEventListener("click", function(){ bewerte(b.dataset.note); });
  });
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

/* Ein "nochmal" soll erst nach einigen anderen Karten wiederkommen. Ist die
   Schlange dafuer zu kurz, wird sie aus den uebrigen faelligen Woertern
   aufgefuellt. Sonst stand dasselbe Wort am Ende eines Durchgangs sofort
   wieder da - mit der Antwort noch auf dem Bildschirm davor. */
function nachruecken(v){
  if(schlange.length < NACHRUECK){
    var drin = {};
    drin[v.id] = true;
    schlange.forEach(function(x){ drin[x.id] = true; });
    var pool = freiesUeben ? auswahl() : faelligeAus(auswahl());
    var nachschub = pool.filter(function(x){ return !drin[x.id]; });
    if(einst.mischen) mische(nachschub);
    else nachschub.sort(function(a, b){ return karte(a.id).faellig - karte(b.id).faellig; });
    while(schlange.length < NACHRUECK && nachschub.length) schlange.push(nachschub.shift());
  }
  if(!schlange.length) return;   // nichts anderes mehr da, der Durchgang endet
  schlange.splice(Math.min(NACHRUECK, schlange.length), 0, v);
}

function bewerte(note){
  if(!schlange.length || !umgedreht) return;
  var v = schlange[0], k = karteSchreiben(v.id);

  if(note === "nochmal"){
    k.fehler += 1;
    k.stufe   = 1;
    k.faellig = Date.now() + STUFEN[1] * TAG;
    schlange.shift();
    nachruecken(v);
  }else{
    k.stufe   = Math.min(k.stufe + (note === "leicht" ? 2 : 1), MAXSTUFE);
    k.faellig = Date.now() + STUFEN[k.stufe] * TAG;
    schlange.shift();
    getan += 1;
  }

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
  if(termine.length === basis.length){
    var d = Math.max(1, Math.ceil((Math.min.apply(null, termine) - Date.now()) / TAG));
    wann = "Weiter geht es in " + tage(d) + ".";
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
function zeichneStand(){
  var begonnen = 0, gefestigt = 0;
  V.forEach(function(v){
    var k = karte(v.id);
    if(k.stufe > 0)    begonnen++;
    if(k.stufe >= FEST) gefestigt++;
  });
  var offen = faelligeAus(V).length;

  $("#kacheln").innerHTML =
      '<div class="kachel n"><b>' + begonnen  + "</b><span>begonnen</span></div>"
    + '<div class="kachel g"><b>' + gefestigt + "</b><span>gefestigt</span></div>"
    + '<div class="kachel a"><b>' + offen     + "</b><span>fällig</span></div>";

  var html = "";
  TOPICS.forEach(function(t){
    html += "<h3>Topic " + t + "</h3>";
    Object.keys(ABSCHNITTE).filter(function(a){ return ABSCHNITTE[a].t === t; }).forEach(function(a){
      var w = V.filter(function(v){ return v.ab === a; });
      var fest = 0, lernt = 0;
      w.forEach(function(v){
        var s = karte(v.id).stufe;
        if(s >= FEST) fest++; else if(s > 0) lernt++;
      });
      var pF = w.length ? Math.round(fest  / w.length * 100) : 0;
      var pL = w.length ? Math.round(lernt / w.length * 100) : 0;
      html +=
          '<button class="reihe" data-ab="' + a + '">'
        +   '<span class="kopfzeile"><span class="titel"><em>' + ABSCHNITTE[a].nr + "</em>"
        +     esc(ABSCHNITTE[a].titel) + "</span>"
        +     '<span class="zahl">' + fest + " / " + w.length + "</span></span>"
        +   '<span class="balken"><i class="fest" style="width:' + pF + '%"></i>'
        +     '<i class="lernt" style="width:' + pL + '%"></i></span>'
        +   '<span class="fuss">' + (w.length - fest - lernt) + " noch nie gesehen · "
        +     faelligeAus(w).length + " fällig</span>"
        + "</button>";
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
    +   '<span class="romaji">' + esc(v.romaji) + "</span>"
    +   '<span class="de">' + esc(v.de) + "</span>"
    + "</span>"
    + '<span class="rechts">'
    +   (mitFehler && k.fehler ? '<span class="fehlerzahl">' + k.fehler + "×</span>" : "")
    +   stufenPunkte(k.stufe, "mini")
    + "</span></button>";
}
function wortListe(rows, mitFehler){
  return '<div class="wortliste">' + rows.map(function(v){ return wortZeile(v, mitFehler); }).join("") + "</div>";
}

function zeichneProblem(){
  var p = V.filter(istProblem).sort(function(a, b){
    return karte(b.id).fehler - karte(a.id).fehler;
  });
  $("#problemListe").innerHTML = p.length
    ? wortListe(p, true)
    : '<div class="leer"><span class="zeichen jp">良</span>'
      + "Noch keine Problemwörter. Sie sammeln sich hier, sobald du ein Wort zweimal "
      + "auf <b>nochmal</b> gesetzt hast.</div>";
}

function zeichneListe(){
  var q = $("#sucheFeld").value.trim().toLowerCase();
  var treffer = V;
  if(q){
    treffer = V.filter(function(v){
      return v.kana.indexOf(q) >= 0
        || v.romaji.toLowerCase().indexOf(q) >= 0
        || v.de.toLowerCase().indexOf(q) >= 0;
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
    html += "<h3>Topic " + t + "</h3>";
    Object.keys(ABSCHNITTE).filter(function(a){ return ABSCHNITTE[a].t === t; }).forEach(function(a){
      html += "<h2>" + ABSCHNITTE[a].nr + " " + esc(ABSCHNITTE[a].titel) + "</h2>"
        + wortListe(V.filter(function(v){ return v.ab === a; }), false);
    });
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
function standLaden(){
  var roh = $("#exportFeld").value.trim();
  try{
    var neu = JSON.parse(roh);
    if(!neu || typeof neu !== "object" || Array.isArray(neu)) throw new Error("Form");
    stand = normalisiere(neu);
    standSichern();
    alleNeuZeichnen();
    melde("Lernstand geladen");
  }catch(e){
    melde("Text nicht lesbar - bitte vollständig einfügen");
  }
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
      $("#rtgKana").setAttribute("aria-pressed", einst.richtung === "kana" ? "true" : "false");
      $("#rtgDe").setAttribute("aria-pressed",   einst.richtung === "de"   ? "true" : "false");
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
    setzeFilter({ art: "ab", wert: r.dataset.ab });
    zeige("lernen");
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

  $("#knopfEinstellungen").addEventListener("click", function(){ blattAuf("#blatt"); });
  $("#blattZu").addEventListener("click", blattZu);
  $("#blattgrund").addEventListener("click", blattZu);

  $$('.blatt [data-thema]').forEach(function(b){
    b.addEventListener("click", function(){ themaSetzen(b.dataset.thema); });
  });

  schalter("#schalterRomaji",  "romaji",  function(){ zeichneLernen(); });
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

  $("#knopfKopieren").addEventListener("click", standKopieren);
  $("#knopfLaden").addEventListener("click", standLaden);
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
    if(umgedreht && e.key === "2") bewerte("gut");
    if(umgedreht && e.key === "3") bewerte("leicht");
  });

  // Tageswechsel oder Rückkehr in die App: fällige Karten neu bestimmen
  document.addEventListener("visibilitychange", function(){
    if(document.visibilityState !== "visible") return;
    kopfAktualisieren();
    zeichneFilter();
    if(aktiverBereich === "lernen" && !schlange.length && !freiesUeben){
      schlangeBauen(false);
      zeichneLernen();
    }
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
  var spanne = TOPICS.length > 1
    ? "Topic " + TOPICS[0] + " bis " + TOPICS[TOPICS.length - 1]
    : "Topic " + TOPICS[0];
  $("#anzahlGesamt").textContent = V.length;
  $("#ueberZahl").textContent    = V.length;
  $("#topicSpanne").textContent  = spanne;
  $("#ueberSpanne").textContent  = spanne;
  $("#rtgKana").setAttribute("aria-pressed", einst.richtung === "kana" ? "true" : "false");
  $("#rtgDe").setAttribute("aria-pressed",   einst.richtung === "de"   ? "true" : "false");

  // gespeicherter Filter kann auf einen leeren Problemfilter zeigen
  if(einst.filter.art === "problem" && !V.filter(istProblem).length){
    einst.filter = { art: "alle", wert: 0 };
  }

  verdrahten();
  limitAnzeigen();
  themaSetzen(einst.thema);
  zeichneFilter();
  schlangeBauen(false);
  zeichneLernen();
  kopfAktualisieren();

  if(!speicherOk){
    $("#kartenbereich").insertAdjacentHTML("beforebegin",
      '<div class="info">Dieser Browser speichert gerade nichts dauerhaft. Der Fortschritt gilt '
      + "nur für diese Sitzung.</div>");
  }

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

try{
  start();
}catch(e){
  // Ein Neustart repariert eine gemischte Fassung. Scheitert es danach
  // wieder, bleibt es beim Hinweis statt bei einem leeren Bildschirm.
  if(!einmalNeuLaden("startfehler")) zeigeStartfehler();
}
})();
