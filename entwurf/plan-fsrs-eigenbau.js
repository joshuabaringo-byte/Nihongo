/* ==================================================================
   Wiederholungsplan: FSRS (Free Spaced Repetition Scheduler)

   Derselbe Algorithmus, den Anki verwendet, in der Fassung FSRS-6.
   Rechenweg, Formeln und Parameter folgen der offiziellen Implementierung
   ts-fsrs 5.4.2 (https://github.com/open-spaced-repetition/ts-fsrs),
   Copyright (c) Open Spaced Repetition, MIT License - Lizenztext in
   FSRS-LIZENZ.txt. Diese Datei ist ein eigener Nachbau in der Art der App;
   werkzeug/ gibt es dafür nicht, geprüft wird sie gegen die Bibliothek.

   Nur Rechenfunktionen, kein Zugriff auf die Seite; app.js ruft sie auf.

   FSRS führt zu jedem Wort ein kleines Gedächtnismodell:
     s  Stabilität: nach so vielen Tagen weißt du das Wort noch mit 90 %
     d  Schwierigkeit, 1 (leicht) bis 10 (schwer)
   Daraus und aus den Tagen seit der letzten Abfrage ergibt sich, wie
   wahrscheinlich du das Wort gerade weißt, und daraus der nächste Abstand:
   so lang, dass du es beim Wiedersehen noch mit BEHALTEN (90 %) weißt.

   Ein Wort durchläuft:
     neu        noch nie gesehen
     lernt      Minutenschritte (1 und 10 Minuten), nach einem Fehler 10 Minuten
     wiederholt Abstand in Tagen aus der Stabilität

   Gespeichert wird je Wort (Feldnamen sind Teil des Lernstands, nicht umbenennen):
     stufe   0 bis 6, nur zur Anzeige und für "gefestigt" (aus ivl abgeleitet)
     faellig Zeitpunkt in Millisekunden
     fehler  wie oft ein gelerntes Wort vergessen wurde
     ivl     Abstand in Tagen; 0, solange ein neues Wort noch lernt
     s, d    Stabilität und Schwierigkeit
     lr      Zeitpunkt der letzten Abfrage
     lern    Nummer des Lernschritts, nur solange das Wort in Minutenschritten lernt
   ================================================================== */
(function (wurzel) {
"use strict";

var MIN = 60000, TAG = 86400000;

/* ---------- Stellschrauben ---------- */
var BEHALTEN      = 0.9;       // gewünschte Wahrscheinlichkeit, ein fälliges Wort zu wissen
var MAX_ABSTAND   = 365;       // Tage; Anki erlaubt mehr, hier soll nichts länger als ein Jahr ruhen
var LERNSCHRITTE  = [1, 10];   // Minuten, neues Wort
var FEHLSCHRITTE  = [10];      // Minuten, Wort nach einem Fehler
var TAGESWECHSEL  = 4;         // Uhr: davor gehört der Zeitpunkt noch zum Vortag
var VORAUS        = 20;        // Minuten: so weit im Voraus zeigt ein Durchgang Lernkarten

/* Parameter von FSRS-6, die Vorgabe aus ts-fsrs (default_w). Sie sind aus den
   Lernverläufen sehr vieler Anki-Nutzer bestimmt. */
var W = [0.212, 1.2931, 2.3065, 8.2956, 6.4133, 0.8334, 3.0194, 0.001, 1.8722, 0.1666,
         0.796, 1.4835, 0.0614, 0.2629, 1.6483, 0.6014, 1.8729, 0.5425, 0.0912, 0.0658, 0.1542];
var S_MIN = 0.001, S_MAX = 36500;

/* Die frühere Treppe. Sie bleibt für die Punkte der Anzeige und für die
   Übernahme alter Lernstände. */
var TREPPE   = [1, 2, 4, 8, 17, 35];
var MAXSTUFE = TREPPE.length;

var NOTEN = ["nochmal", "schwer", "gut", "leicht"];      // FSRS: 1 Again, 2 Hard, 3 Good, 4 Easy

function begrenze(x, von, bis){ return Math.min(Math.max(x, von), bis); }
function runde8(x){ return Math.round(x * 1e8) / 1e8; }

/* ==================================================================
   Gedächtnismodell
   ================================================================== */
var ABFALL = -W[20];
var FAKTOR = runde8(Math.exp(Math.pow(ABFALL, -1) * Math.log(0.9)) - 1);

/* Vergessenskurve: Wahrscheinlichkeit, ein Wort mit Stabilität s nach t Tagen zu wissen. */
function abrufbar(t, s){
  return runde8(Math.pow(1 + FAKTOR * t / s, ABFALL));
}
/* Mit diesem Wert mal s ergibt sich der Abstand, nach dem BEHALTEN erreicht ist. */
var MODIFIKATOR = runde8((Math.pow(BEHALTEN, 1 / ABFALL) - 1) / FAKTOR);

function startS(g){ return Math.max(W[g - 1], 0.1); }
function startD(g){ return runde8(W[4] - Math.exp((g - 1) * W[5]) + 1); }

function naechsteD(d, g){
  var delta = -W[6] * (g - 3);
  var nd = d + runde8(delta * (10 - d) / 9);                      // nahe 10 ändert sich weniger
  return begrenze(runde8(W[7] * startD(4) + (1 - W[7]) * nd), 1, 10);
}
/* Gewusst: die Stabilität wächst - stärker bei leichten Wörtern, bei kleiner
   Stabilität und wenn das Wort schon fast vergessen war. */
function sGewusst(d, s, r, g){
  var schwer = g === 2 ? W[15] : 1, leicht = g === 4 ? W[16] : 1;
  return runde8(begrenze(
    s * (1 + Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp((1 - r) * W[10]) - 1) * schwer * leicht),
    S_MIN, S_MAX));
}
function sVergessen(d, s, r){
  return runde8(begrenze(
    W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp((1 - r) * W[14]),
    S_MIN, S_MAX));
}
/* Noch einmal am selben Tag gesehen. */
function sSelberTag(s, g){
  var zuwachs = Math.pow(s, -W[19]) * Math.exp(W[17] * (g - 3 + W[18]));
  if(g >= 2) zuwachs = Math.max(zuwachs, 1);
  return runde8(begrenze(s * zuwachs, S_MIN, S_MAX));
}

/* Neues Gedächtnis nach einer Antwort g (1 bis 4), t Tage nach der letzten.
   d und s gleich 0 heißt: das Wort wird zum ersten Mal gesehen. */
function gedaechtnis(d, s, t, g, r){
  if(d === 0 && s === 0) return { d: begrenze(startD(g), 1, 10), s: startS(g) };
  r = typeof r === "number" ? r : abrufbar(t, s);
  var ns;
  if(t === 0){
    ns = sSelberTag(s, g);
  }else if(g === 1){
    var nachFehler = sVergessen(d, s, r);
    ns = begrenze(runde8(s / Math.exp(W[17] * W[18])), S_MIN, nachFehler);
  }else{
    ns = sGewusst(d, s, r, g);
  }
  return { d: naechsteD(d, g), s: ns };
}

/* ---------- Abstand aus der Stabilität ---------- */
function abstandRoh(s){
  return Math.min(Math.max(1, Math.round(s * MODIFIKATOR)), MAX_ABSTAND);
}
/* Streuung wie bei Anki: ab drei Tagen wird der Abstand um einige Tage gestreut,
   damit Wörter, die zusammen gelernt wurden, nicht zusammen wiederkommen. */
function streubereich(abstand, t){
  var delta = 1;
  [[2.5, 7, 0.15], [7, 20, 0.1], [20, Infinity, 0.05]].forEach(function(b){
    delta += b[2] * Math.max(Math.min(abstand, b[1]) - b[0], 0);
  });
  abstand = Math.min(abstand, MAX_ABSTAND);
  var von = Math.max(2, Math.round(abstand - delta));
  var bis = Math.min(Math.round(abstand + delta), MAX_ABSTAND);
  if(abstand > t) von = Math.max(von, t + 1);
  von = Math.min(von, bis);
  return { von: von, bis: bis };
}
/* u: Zahl von 0 bis unter 1 für die Streuung; null heißt ohne Streuung. */
function abstand(s, t, u){
  var a = abstandRoh(s);
  if(u === null || u === undefined || a < 2.5) return a;
  var b = streubereich(a, t);
  return Math.floor(u * (b.bis - b.von + 1) + b.von);
}

/* Aus dem Wort und seinem Stand wird eine feste Zahl von 0 bis unter 1. Fest, damit
   die Zeit unter dem Knopf genau die ist, die danach gilt; je Wort verschieden,
   damit gemeinsam gelernte Wörter verschieden gestreut werden. */
function streuzahl(saat, k){
  if(typeof saat === "function") return saat();
  if(saat === null) return null;
  var text = String(saat === undefined ? "" : saat) + "|" + (k.lr || 0) + "|" + (k.fehler || 0)
           + "|" + (k.ivl || 0) + "|" + (k.s || 0);
  var h = 2166136261;
  for(var i = 0; i < text.length; i++){ h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
  h = (h + 0x6D2B79F5) | 0;
  var x = Math.imul(h ^ (h >>> 15), 1 | h);
  x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
  return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
}

/* ==================================================================
   Tage
   Fällig wird zum Tageswechsel, nicht auf die Minute: was heute um 19:35
   gelernt wird und in zwei Tagen dran ist, liegt dann ab vier Uhr früh bereit.
   ================================================================== */
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
/* Ganze Tage zwischen zwei Zeitpunkten, gezählt in Tageswechseln. */
function tageZwischen(vorher, jetzt){
  return Math.max(0, Math.round((tagesbeginn(jetzt) - tagesbeginn(vorher)) / TAG));
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
/* Wie wahrscheinlich du das Wort gerade weißt (0 bis 1); bei neuen Wörtern 0. */
function abrufbarJetzt(k, jetzt){
  if(istNeu(k) || !(k.s > 0)) return 0;
  return abrufbar(tageZwischen(k.lr || jetzt, jetzt), k.s);
}

function zustand(k){
  return {
    stufe:  (k && k.stufe)  || 0,
    faellig:(k && k.faellig)|| 0,
    fehler: (k && k.fehler) || 0,
    ivl:    (k && k.ivl)    || 0,
    s:      (k && k.s)      || 0,
    d:      (k && k.d)      || 0,
    lr:     (k && k.lr)     || 0,
    lern:   k ? k.lern : undefined
  };
}

/* ---------- Lernschritte ----------
   Was die Antwort g auf dem Schritt nr bewirkt: Minuten und nächster Schritt,
   oder nichts - dann ist das Wort mit den Minutenschritten fertig. */
function lernschritt(schritte, nr, g, ausWiederholung){
  if(!schritte.length || nr >= schritte.length) return null;
  if(ausWiederholung) return g === 1 ? { minuten: schritte[Math.max(0, nr)], nr: 0 } : null;
  if(g === 1) return { minuten: schritte[0], nr: 0 };
  if(g === 2){
    return { minuten: schritte.length === 1 ? Math.round(schritte[0] * 1.5)
                                            : Math.round((schritte[0] + schritte[1]) / 2), nr: nr };
  }
  if(g === 3 && nr + 1 < schritte.length) return { minuten: Math.round(schritte[nr + 1]), nr: nr + 1 };
  return null;
}

/* ---------- Ein Schritt ----------
   Rechnet aus, was eine Antwort bewirkt, ohne das Wort selbst zu ändern.
   saat: Kennung des Wortes für die Streuung (oder eine Funktion, oder null für
   keine Streuung). Rückgabe: k (neuer Zustand), minuten (lernt noch, kommt nach
   so vielen Minuten wieder) oder tage (kommt nach so vielen Tagen wieder). */
function schritt(k, note, jetzt, saat){
  var g = NOTEN.indexOf(note) + 1;
  var n = zustand(k);
  var neu = !n.stufe;
  var lernt = !neu && n.lern !== undefined;
  var nachFehler = lernt && n.ivl > 0;                 // war schon gelernt, dann vergessen
  var t = neu ? 0 : tageZwischen(n.lr || jetzt, jetzt);
  var u = streuzahl(saat, n);
  var m = 0, tage = 0, g2, lern;

  if(neu || lernt){
    g2 = neu ? gedaechtnis(0, 0, 0, g) : gedaechtnis(n.d, n.s, t, g);
    lern = lernschritt(nachFehler ? FEHLSCHRITTE : LERNSCHRITTE, neu ? 0 : n.lern, g, false);
    if(lern && lern.minuten > 0){
      n.lern = lern.nr;
      m = lern.minuten;
      n.faellig = jetzt + m * MIN;
      if(nachFehler) n.ivl = abstandRoh(g2.s);         // vorläufig, für die Anzeige
    }else{
      delete n.lern;
      n.ivl = tage = abstand(g2.s, t, u);
      n.faellig = faelligNach(jetzt, tage);
    }
  }else{
    /* Wiederholung */
    var r = abrufbar(t, n.s);
    if(g === 1){
      g2 = gedaechtnis(n.d, n.s, t, 1, r);
      n.fehler += 1;
      lern = lernschritt(FEHLSCHRITTE, 0, 1, true);
      if(lern && lern.minuten > 0){
        n.lern = lern.nr;
        m = lern.minuten;
        n.faellig = jetzt + m * MIN;
        n.ivl = abstandRoh(g2.s);                      // vorläufig; markiert "nach Fehler"
      }else{
        n.ivl = tage = abstand(g2.s, t, u);
        n.faellig = faelligNach(jetzt, tage);
      }
    }else{
      var schwer = gedaechtnis(n.d, n.s, t, 2, r);
      var gut    = gedaechtnis(n.d, n.s, t, 3, r);
      var leicht = gedaechtnis(n.d, n.s, t, 4, r);
      var aSchwer = abstand(schwer.s, t, u), aGut = abstand(gut.s, t, u);
      aSchwer = Math.min(aSchwer, aGut);
      aGut = Math.max(aGut, aSchwer + 1);
      var aLeicht = Math.max(abstand(leicht.s, t, u), aGut + 1);
      g2 = g === 2 ? schwer : g === 3 ? gut : leicht;
      n.ivl = tage = g === 2 ? aSchwer : g === 3 ? aGut : aLeicht;
      n.faellig = faelligNach(jetzt, tage);
    }
  }
  n.s = g2.s;
  n.d = g2.d;
  n.lr = jetzt;
  n.stufe = Math.max(1, stufeVon(n));
  return { k: n, minuten: m, tage: tage };
}

/* Was jede Antwort bewirken würde, für die Beschriftung der Knöpfe. */
function vorschau(k, jetzt, saat){
  var aus = {};
  NOTEN.forEach(function(note){
    var s = schritt(k, note, jetzt, saat);
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
   Nimmt auch Stände aus früheren Fassungen und ergänzt, was fehlt:
   - ganz früher nur stufe, faellig, fehler (feste Treppe 1, 2, 4, 8, 17, 35 Tage)
   - danach ivl und faktor (Anki-Plan mit Faktor je Wort)
   Für FSRS wird daraus geschätzt: die Stabilität ist der bisherige Abstand (so ist
   sie definiert: der Abstand, bei dem man das Wort noch mit 90 % weiß), die
   Schwierigkeit ergibt sich aus der Zahl der Fehler.
   Rückgabe false: der Eintrag sagt nichts aus. */
function normalisieren(k, jetzt){
  jetzt = jetzt || Date.now();
  if(!k || typeof k !== "object") return false;
  if(typeof k.stufe   !== "number" || k.stufe < 0)  k.stufe   = 0;
  if(typeof k.faellig !== "number")                 k.faellig = 0;
  if(typeof k.fehler  !== "number" || k.fehler < 0) k.fehler  = 0;
  if(k.stufe > MAXSTUFE) k.stufe = MAXSTUFE;
  if(k.stufe === 0 && k.fehler === 0) return false;

  if(typeof k.lern !== "number") delete k.lern;
  if(typeof k.ivl !== "number" || k.ivl < 0){
    // Wort aus der früheren Treppe: der Abstand der Stufe wird übernommen,
    // der Termin bleibt wie er war.
    k.ivl = k.stufe > 0 ? TREPPE[Math.min(k.stufe, MAXSTUFE) - 1] : 0;
    // Das frühere "nochmal" setzte auf Stufe 1 und "sofort fällig": jetzt ein Lernschritt.
    if(k.stufe === 1 && k.faellig === 0 && k.fehler > 0) k.lern = 0;
  }
  delete k.faktor;                                   // gehörte zum Plan vor FSRS
  if(k.stufe === 0) k.stufe = 1;

  var lernt = k.lern !== undefined;
  if(!(k.s > 0) || !(k.d >= 1)){
    if(lernt && !(k.ivl > 0)){
      k.s = startS(3);                               // mitten in den ersten Lernschritten
    }else{
      k.s = begrenze(Math.max(k.ivl, 1), S_MIN, S_MAX);
    }
    var d = begrenze(startD(3), 1, 10);
    for(var i = 0; i < Math.min(k.fehler, 3); i++) d = naechsteD(d, 1);
    k.d = d;
  }
  k.s = begrenze(k.s, S_MIN, S_MAX);
  k.d = begrenze(k.d, 1, 10);
  if(typeof k.lr !== "number" || !(k.lr > 0)){
    // Wann zuletzt abgefragt wurde, steht in alten Ständen nicht: bei Wiederholungen
    // war es der Abstand vor dem Termin, bei Lernkarten gilt "eben erst".
    k.lr = (!lernt && k.faellig > 0) ? Math.min(jetzt, k.faellig - k.ivl * TAG) : jetzt;
  }
  return true;
}

var PLAN = {
  MIN: MIN, TAG: TAG, NOTEN: NOTEN, TREPPE: TREPPE, MAXSTUFE: MAXSTUFE,
  BEHALTEN: BEHALTEN, MAX_ABSTAND: MAX_ABSTAND, W: W,
  tagesbeginn: tagesbeginn, faelligNach: faelligNach, tageZwischen: tageZwischen, stufeVon: stufeVon,
  istNeu: istNeu, istDran: istDran, istBald: istBald, abrufbarJetzt: abrufbarJetzt,
  gedaechtnis: gedaechtnis, abrufbar: abrufbar, abstand: abstand, streubereich: streubereich,
  schritt: schritt, vorschau: vorschau, dauer: dauer, normalisieren: normalisieren
};

if(typeof module !== "undefined" && module.exports) module.exports = PLAN;
else wurzel.PLAN = PLAN;

})(typeof window !== "undefined" ? window : this);
