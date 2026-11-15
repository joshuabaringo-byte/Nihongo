/* ==================================================================
   Wiederholungsplan nach dem Vorbild von Anki

   Nur Rechenfunktionen, kein Zugriff auf die Seite. So lässt sich der Plan
   einzeln prüfen; app.js ruft ihn auf.

   Ein Wort durchläuft drei Zustände:
     neu        noch nie gesehen
     lernt      in Minutenschritten (1 und 10 Minuten), auch nach einem Fehler
     wiederholt Abstand in Tagen, der mit jeder richtigen Antwort wächst

   Vier Antworten: nochmal, schwer, sitzt (gut), leicht. Jedes Wort hat einen
   eigenen Wachstumsfaktor: wer oft "schwer" oder "nochmal" drückt, dessen
   Abstände wachsen langsamer, wer "leicht" drückt, schneller.

   Gespeichert wird je Wort (Feldnamen sind Teil des Lernstands, nicht umbenennen):
     stufe   0 bis 6, nur zur Anzeige und für den Filter "gefestigt" (aus ivl abgeleitet)
     faellig Zeitpunkt in Millisekunden
     fehler  wie oft ein gelerntes Wort vergessen wurde
     ivl     Abstand in Tagen
     faktor  Wachstumsfaktor in Prozent, Start 250
     lern    Nummer des Lernschritts, nur solange das Wort in Minutenschritten lernt
   ================================================================== */
(function (wurzel) {
"use strict";

var MIN = 60000, TAG = 86400000;

/* Stellschrauben */
var LERNSCHRITTE  = [1, 10];   // Minuten, neues Wort
var FEHLSCHRITTE  = [10];      // Minuten, Wort nach einem Fehler
var ERSTER_ABSTAND = 1;        // Tage, wenn der letzte Lernschritt gelingt
var LEICHT_START  = 4;         // Tage, wenn ein neues Wort gleich "leicht" ist
var FAKTOR_START  = 250;       // Prozent
var FAKTOR_MIN    = 130;
var FAKTOR_MAX    = 350;
var FEHLER_REST   = 0.3;       // so viel vom Abstand bleibt nach einem Fehler
var SCHWER_FAKTOR = 1.2;
var LEICHT_BONUS  = 1.3;
var MAX_ABSTAND   = 365;       // Tage
var TAGESWECHSEL  = 4;         // Uhr: davor gehört der Zeitpunkt noch zum Vortag
var VORAUS        = 20;        // Minuten: so weit im Voraus zeigt ein Durchgang Lernkarten

/* Die frühere Treppe. Sie bleibt für die Punkte der Anzeige und für die
   Übernahme alter Lernstände. */
var TREPPE    = [1, 2, 4, 8, 17, 35];
var MAXSTUFE  = TREPPE.length;

var NOTEN = ["nochmal", "schwer", "gut", "leicht"];

/* ---------- Tage ----------
   Fällig wird zum Tageswechsel, nicht auf die Minute: was heute um 19:35 gelernt
   wird und morgen dran ist, liegt morgen ab vier Uhr früh bereit. */
function tagesbeginn(zeit){
  var d = new Date(zeit);
  d.setHours(TAGESWECHSEL, 0, 0, 0);
  if(d.getTime() > zeit) d.setDate(d.getDate() - 1);
  return d.getTime();
}
function faelligNach(jetzt, tage){
  var d = new Date(tagesbeginn(jetzt));
  d.setDate(d.getDate() + tage);
  return d.getTime();
}

/* ---------- Stufe für die Anzeige ---------- */
function stufeVon(k){
  var s = 0;
  for(var i = 0; i < TREPPE.length; i++){
    if((k.ivl || 0) >= TREPPE[i]) s = i + 1;
  }
  return Math.max(1, s);
}

function istNeu(k){ return !k || !k.stufe; }

/* Jetzt dran: eine Wiederholung oder ein Lernschritt, dessen Zeit gekommen ist. */
function istDran(k, jetzt){
  return !istNeu(k) && k.faellig <= jetzt;
}
/* Für einen Durchgang: wie istDran, Lernkarten aber schon VORAUS Minuten früher. */
function istBald(k, jetzt){
  return !istNeu(k) && k.faellig <= jetzt + (k.lern !== undefined ? VORAUS * MIN : 0);
}

/* Streuung: Wörter, die am selben Tag gelernt wurden, sollen nicht alle am selben
   Tag wiederkommen. Ab drei Tagen wird der Abstand um ein paar Tage gestreut
   (wie bei Anki). zufall liefert eine Zahl von 0 bis unter 1; 0,5 ergibt keine
   Streuung, so rechnet die Vorschau der Knöpfe. */
function streuen(abstand, zufall){
  if(abstand < 3) return abstand;
  var r = abstand < 7 ? 1 : abstand < 20 ? 2 : Math.max(2, Math.round(abstand * 0.05));
  return Math.max(1, abstand - r + Math.floor(zufall() * (2 * r + 1)));
}
var MITTE = function(){ return 0.5; };

function zustand(k){
  return {
    stufe:  (k && k.stufe)  || 0,
    faellig:(k && k.faellig)|| 0,
    fehler: (k && k.fehler) || 0,
    ivl:    (k && k.ivl)    || 0,
    faktor: (k && k.faktor) || FAKTOR_START,
    lern:   k ? k.lern : undefined
  };
}

/* ---------- Ein Schritt ----------
   Rechnet aus, was eine Antwort bewirkt, ohne das Wort selbst zu ändern.
   Rückgabe: k (neuer Zustand), minuten (bleibt in Minutenschritten, kommt nach
   so vielen Minuten wieder) oder tage (kommt nach so vielen Tagen wieder).
   zufall ist freiwillig und nur für Prüfungen gedacht. */
function schritt(k, note, jetzt, zufall){
  zufall = zufall || Math.random;
  var n = zustand(k);
  var neu = !n.stufe;
  var lernt = n.lern !== undefined;
  var m = 0, t = 0;

  if(neu || lernt){
    var nachFehler = n.ivl > 0;                  // schon einmal gelernt, dann vergessen
    var schritte = nachFehler ? FEHLSCHRITTE : LERNSCHRITTE;
    var i = neu ? 0 : Math.min(n.lern, schritte.length - 1);

    if(note === "nochmal"){
      n.lern = 0; m = schritte[0];
    }else if(note === "schwer"){
      n.lern = i;
      m = (i === 0 && schritte.length > 1) ? Math.round((schritte[0] + schritte[1]) / 2) : schritte[i];
    }else if(note === "gut" && i + 1 < schritte.length){
      n.lern = i + 1; m = schritte[i + 1];
    }else{                                       // letzter Schritt geschafft, oder gleich "leicht"
      if(nachFehler) t = note === "leicht" ? n.ivl + 1 : n.ivl;
      else           t = note === "leicht" ? LEICHT_START : ERSTER_ABSTAND;
      n.ivl = Math.min(MAX_ABSTAND, t);
      t = n.ivl;
      delete n.lern;
      n.faellig = faelligNach(jetzt, t);
    }
    if(m) n.faellig = jetzt + m * MIN;
    n.stufe = Math.max(1, stufeVon(n));
    return { k: n, minuten: m, tage: t };
  }

  /* Wiederholung */
  var ivl = Math.max(1, n.ivl);
  var zuspaet = Math.max(0, Math.floor((jetzt - n.faellig) / TAG));   // Tage über die Zeit
  var f = n.faktor / 100;
  var schwer = Math.max(ivl + 1, Math.round((ivl + zuspaet / 4) * SCHWER_FAKTOR));
  var gut    = Math.max(schwer + 1, Math.round((ivl + zuspaet / 2) * f));
  var leicht = Math.max(gut + 1, Math.round((ivl + zuspaet) * f * LEICHT_BONUS));

  if(note === "nochmal"){
    n.fehler += 1;
    n.faktor = Math.max(FAKTOR_MIN, n.faktor - 20);
    n.ivl = Math.max(1, Math.round(ivl * FEHLER_REST));
    n.lern = 0; m = FEHLSCHRITTE[0];
    n.faellig = jetzt + m * MIN;
  }else{
    var abstand;
    if(note === "schwer"){ n.faktor = Math.max(FAKTOR_MIN, n.faktor - 15); abstand = schwer; }
    else if(note === "gut"){ abstand = gut; }
    else{ n.faktor = Math.min(FAKTOR_MAX, n.faktor + 15); abstand = leicht; }
    n.ivl = Math.min(MAX_ABSTAND, streuen(abstand, zufall));
    t = n.ivl;
    n.faellig = faelligNach(jetzt, t);
  }
  n.stufe = Math.max(1, stufeVon(n));
  return { k: n, minuten: m, tage: t };
}

/* Was jede Antwort bewirken würde, für die Beschriftung der Knöpfe. */
function vorschau(k, jetzt){
  var aus = {};
  NOTEN.forEach(function(note){
    var s = schritt(k, note, jetzt, MITTE);
    aus[note] = { minuten: s.minuten, tage: s.tage };
  });
  return aus;
}

function dauer(e){
  if(e.minuten){
    return e.minuten < 60 ? e.minuten + " Min" : Math.round(e.minuten / 60) + " Std";
  }
  var t = e.tage;
  if(t < 30) return t === 1 ? "1 Tag" : t + " Tage";
  var z = t < 365 ? t / 30 : t / 365;
  return (Math.round(z * 10) / 10).toString().replace(".", ",") + (t < 365 ? " Mon." : " J.");
}

/* ---------- Lernstand einlesen ----------
   Nimmt auch Stände aus früheren Fassungen (nur stufe, faellig, fehler) und
   ergänzt, was fehlt. Rückgabe false: der Eintrag sagt nichts aus. */
function normalisieren(k){
  if(!k || typeof k !== "object") return false;
  if(typeof k.stufe   !== "number" || k.stufe < 0)  k.stufe   = 0;
  if(typeof k.faellig !== "number")                 k.faellig = 0;
  if(typeof k.fehler  !== "number" || k.fehler < 0) k.fehler  = 0;
  if(k.stufe > MAXSTUFE) k.stufe = MAXSTUFE;
  if(k.stufe === 0 && k.fehler === 0) return false;

  if(typeof k.faktor !== "number" || k.faktor < FAKTOR_MIN) k.faktor = FAKTOR_START;
  if(k.faktor > FAKTOR_MAX) k.faktor = FAKTOR_MAX;
  if(typeof k.lern !== "number") delete k.lern;
  if(typeof k.ivl !== "number" || k.ivl < 0){
    // Wort aus der früheren Treppe: der Abstand der Stufe wird übernommen,
    // der Termin bleibt wie er war.
    k.ivl = k.stufe > 0 ? TREPPE[Math.min(k.stufe, MAXSTUFE) - 1] : 0;
    // Das frühere "nochmal" setzte auf Stufe 1 und "sofort fällig": jetzt ein Lernschritt.
    if(k.stufe === 1 && k.faellig === 0 && k.fehler > 0) k.lern = 0;
  }
  if(k.stufe === 0) k.stufe = 1;
  return true;
}

var PLAN = {
  MIN: MIN, TAG: TAG, NOTEN: NOTEN, TREPPE: TREPPE, MAXSTUFE: MAXSTUFE,
  tagesbeginn: tagesbeginn, faelligNach: faelligNach, stufeVon: stufeVon,
  istNeu: istNeu, istDran: istDran, istBald: istBald,
  schritt: schritt, streuen: streuen, vorschau: vorschau, dauer: dauer, normalisieren: normalisieren
};

if(typeof module !== "undefined" && module.exports) module.exports = PLAN;
else wurzel.PLAN = PLAN;

})(typeof window !== "undefined" ? window : this);
