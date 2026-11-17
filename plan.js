/* ==================================================================
   Wiederholungsplan mit FSRS über die offizielle Bibliothek ts-fsrs

   Gerechnet wird nicht hier, sondern in ts-fsrs 5.4.2 von Open Spaced
   Repetition (MIT-Lizenz, unverändert in ts-fsrs/index.umd.js). Die Bibliothek
   rechnet mit FSRS-6 (Free Spaced Repetition Scheduler). Diese Datei
   übersetzt nur zwischen dem Lernstand der App und den Karten der Bibliothek;
   app.js ruft sie auf wie bisher.

   Ein Wort durchläuft drei Zustände:
     neu        noch nie gesehen
     lernt      in Minutenschritten (1 und 10 Minuten, nach einem Fehler 10)
     wiederholt Abstand in Tagen, aus Stabilität und Schwierigkeit des Wortes

   Gespeichert wird je Wort (Feldnamen sind Teil des Lernstands, nicht umbenennen;
   in Klammern das Feld der Bibliothek):
     stufe   1 bis 6, nur zur Anzeige und für den Filter "gefestigt" (aus ivl abgeleitet)
     faellig Zeitpunkt in Millisekunden                         (due)
     fehler  wie oft ein gelerntes Wort vergessen wurde         (lapses)
     ivl     geplanter Abstand in Tagen, 0 solange es lernt     (scheduled_days)
     lern    Nummer des Lernschritts, nur solange es lernt      (learning_steps)
     s       Stabilität in Tagen                                (stability)
     d       Schwierigkeit von 1 bis 10                         (difficulty)
     st      1 lernt, 2 wiederholt, 3 lernt nach einem Fehler   (state)
     wdh     Zahl der Antworten                                 (reps)
     zuletzt Zeitpunkt der letzten Antwort                      (last_review)
     tag     Lerntag der letzten Antwort (siehe lerntag)
     erst    Lerntag der ersten Antwort; zählt die neuen Wörter des Tages
   Wörter aus der Zeit vor FSRS haben noch kein s und d. Die Bibliothek setzt
   beides bei der nächsten Antwort selbst, als wäre es die erste. Ihr Termin
   bleibt bis dahin, wie er war; ein altes Feld faktor bleibt stehen, wird
   aber nicht mehr benutzt.
   ================================================================== */
(function (wurzel) {
"use strict";

var L = wurzel.FSRS || (typeof require === "function" ? require("./ts-fsrs/index.umd.js") : null);
if(!L) return;              // Bibliothek fehlt: app.js lädt dann einmal neu

var MIN = 60000, TAG = 86400000;

/* Einstellungen der Bibliothek. Alle Werte sind ihre Vorgaben,
   nur die Streuung ist eingeschaltet, damit Wörter, die am selben Tag gelernt
   wurden, nicht alle am selben Tag wiederkommen. */
var EINSTELLUNG = {
  request_retention: 0.9,          // Ziel: 90 % der fälligen Wörter noch wissen
  maximum_interval: 36500,         // Tage
  enable_fuzz: true,
  enable_short_term: true,
  learning_steps: ["1m", "10m"],
  relearning_steps: ["10m"]
};
var planer = L.fsrs(L.generatorParameters(EINSTELLUNG));
/* Für die Beschriftung der Knöpfe ohne Streuung, wie bisher. */
var planerOhneStreuung = L.fsrs(L.generatorParameters(
  Object.assign({}, EINSTELLUNG, { enable_fuzz: false })));

var TAGESWECHSEL = 4;        // Uhr: davor gehört der Zeitpunkt noch zum Vortag
var VORAUS       = 20;       // Minuten: so weit im Voraus zeigt ein Durchgang Lernkarten

/* Treppe für die Punkte der Anzeige und für die Übernahme alter Lernstände. */
var TREPPE   = [1, 2, 4, 8, 17, 35];
var MAXSTUFE = TREPPE.length;

var NOTEN = ["nochmal", "schwer", "gut", "leicht"];
var BEWERTUNG = { nochmal: L.Rating.Again, schwer: L.Rating.Hard, gut: L.Rating.Good, leicht: L.Rating.Easy };

/* ---------- Tage ----------
   Fällig wird zum Tageswechsel, nicht auf die Minute: was heute um 19:35 gelernt
   wird und morgen dran ist, liegt morgen ab vier Uhr früh bereit. Den Abstand
   in Tagen bestimmt die Bibliothek, hier wird nur der Termin auf den Tagesbeginn
   gelegt. */
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

/* ---------- Übersetzung ---------- */
function zustandVon(k){
  if(k.st === L.State.Learning || k.st === L.State.Review || k.st === L.State.Relearning) return k.st;
  // Wort aus der Zeit vor FSRS
  if(k.lern === undefined) return L.State.Review;
  return k.ivl > 0 ? L.State.Relearning : L.State.Learning;
}

/* Lerntag: der Tag nach dem 4-Uhr-Wechsel als ganze Zahl (Tage seit dem
   1.1.1970 im Kalender des Geräts). Er wird mit jeder Antwort festgehalten
   (Feld tag), ebenso der Tag der ersten Antwort (Feld erst). Die Tage zwischen
   zwei Antworten zählen danach, nicht nach der Zeitzone des Geräts, das sie
   später nachrechnet (verlauf.js). */
function lerntag(zeit){
  var d = new Date(tagesbeginn(zeit));
  return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / TAG);
}

/* Tage seit der letzten Antwort: nach dem festgehaltenen Lerntag, bei Ständen
   ohne Lerntag nach dem Tageswechsel um vier Uhr Ortszeit. Liegt die letzte
   Antwort in der Zukunft (Uhr verstellt), zählt das als 0 Tage; ebenso ein
   unbrauchbarer Wert. */
function tageSeit(k, jetzt, heute){
  if(k.zuletzt > jetzt) return 0;
  var t = (typeof k.tag === "number" && isFinite(k.tag)) ? heute - k.tag
        : Math.round((tagesbeginn(jetzt) - tagesbeginn(k.zuletzt)) / TAG);
  return t > 0 ? t : 0;
}

/* Lernstand eines Wortes -> Karte der Bibliothek.
   Die Bibliothek zählt vergangene Tage nach dem UTC-Datum. Damit sie auf die
   Tage der App kommt, bekommt sie als letzte Antwort einen Zeitpunkt genau so
   viele volle Tage vor jetzt; gespeichert bleibt der echte Zeitpunkt. */
function zuKarte(k, jetzt, heute){
  if(istNeu(k)) return L.createEmptyCard(new Date(jetzt));
  if(heute === undefined) heute = lerntag(jetzt);
  return {
    due:            new Date(k.faellig || 0),
    stability:      k.s || 0,
    difficulty:     k.d || 0,
    elapsed_days:   0,               // rechnet die Bibliothek aus last_review selbst aus
    scheduled_days: k.ivl || 0,
    reps:           k.wdh || 0,
    lapses:         k.fehler || 0,
    learning_steps: k.lern || 0,
    state:          zustandVon(k),
    last_review:    (k.zuletzt || typeof k.tag === "number") ? new Date(jetzt - tageSeit(k, jetzt, heute) * TAG) : undefined
  };
}

/* Karte der Bibliothek -> Lernstand. k bleibt unberührt; Felder, die die
   Bibliothek nicht kennt (etwa ein alter faktor), werden mitgenommen. */
function vonKarte(k, c, jetzt, heute){
  var n = {};
  Object.keys(k || {}).forEach(function(f){ n[f] = k[f]; });
  var m = 0, t = 0;
  n.tag = heute;
  if(istNeu(k)) n.erst = heute;     // bei Ständen aus der Zeit davor bleibt erst unbekannt
  n.s       = c.stability;
  n.d       = c.difficulty;
  n.st      = c.state;
  n.wdh     = c.reps;
  n.fehler  = c.lapses;
  n.ivl     = c.scheduled_days;
  n.zuletzt = jetzt;
  if(c.state === L.State.Review){
    t = c.scheduled_days;
    n.faellig = faelligNach(jetzt, t);
    delete n.lern;
  }else{
    m = Math.max(1, Math.round((c.due.getTime() - jetzt) / MIN));
    n.faellig = c.due.getTime();
    n.lern = c.learning_steps;
  }
  n.stufe = stufeVon(n);
  return { k: n, minuten: m, tage: t };
}

/* ---------- Ein Schritt ----------
   Rechnet aus, was eine Antwort bewirkt, ohne das Wort selbst zu ändern.
   Rückgabe: k (neuer Zustand), minuten (lernt noch, kommt nach so vielen
   Minuten wieder) oder tage (kommt nach so vielen Tagen wieder). */
function schritt(k, note, jetzt, heute){
  if(heute === undefined) heute = lerntag(jetzt);
  var c = planer.next(zuKarte(k, jetzt, heute), new Date(jetzt), BEWERTUNG[note]).card;
  return vonKarte(k, c, jetzt, heute);
}

/* Was jede Antwort bewirken würde, für die Beschriftung der Knöpfe. */
function vorschau(k, jetzt){
  var heute = lerntag(jetzt);
  var alle = planerOhneStreuung.repeat(zuKarte(k, jetzt, heute), new Date(jetzt));
  var aus = {};
  NOTEN.forEach(function(note){
    var e = vonKarte(k, alle[BEWERTUNG[note]].card, jetzt, heute);
    aus[note] = { minuten: e.minuten, tage: e.tage };
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
   Nimmt auch Stände aus früheren Fassungen (Treppe: nur stufe, faellig, fehler;
   Plan vor FSRS: dazu ivl, faktor, lern) und ergänzt, was fehlt.
   Rückgabe false: der Eintrag sagt nichts aus. */
function zahl(x){ return typeof x === "number" && isFinite(x) && x >= 0; }
function normalisieren(k){
  if(!k || typeof k !== "object") return false;
  if(!zahl(k.stufe))   k.stufe   = 0;
  if(!zahl(k.faellig)) k.faellig = 0;
  if(!zahl(k.fehler))  k.fehler  = 0;
  if(k.stufe > MAXSTUFE) k.stufe = MAXSTUFE;
  if(k.stufe === 0 && k.fehler === 0) return false;

  if(typeof k.lern !== "number") delete k.lern;
  if(!zahl(k.ivl)){
    // Wort aus der früheren Treppe: der Abstand der Stufe wird übernommen,
    // der Termin bleibt wie er war.
    k.ivl = k.stufe > 0 ? TREPPE[Math.min(k.stufe, MAXSTUFE) - 1] : 0;
    // Das frühere "nochmal" setzte auf Stufe 1 und "sofort fällig": jetzt ein Lernschritt.
    if(k.stufe === 1 && k.faellig === 0 && k.fehler > 0) k.lern = 0;
  }
  ["wdh", "zuletzt"].forEach(function(f){ if(!zahl(k[f])) delete k[f]; });
  ["tag", "erst"].forEach(function(f){ if(!(zahl(k[f]) && k[f] % 1 === 0)) delete k[f]; });
  // Stabilität und Schwierigkeit nur zusammen und nur in dem Bereich, den die
  // Bibliothek annimmt; sonst setzt sie beides bei der nächsten Antwort neu.
  if(!(zahl(k.s) && k.s >= L.S_MIN && zahl(k.d) && k.d >= 1 && k.d <= 10)){ delete k.s; delete k.d; }
  if(k.st !== L.State.Learning && k.st !== L.State.Review && k.st !== L.State.Relearning) delete k.st;
  // Zustand und Lernschritt passen zusammen
  if(k.st === L.State.Review) delete k.lern;
  else if(k.st !== undefined && k.lern === undefined) k.lern = 0;
  if(k.stufe === 0) k.stufe = 1;
  return true;
}

/* Version des Plans: Bibliothek und Einstellungen. Steht bei jedem
   Lernereignis, damit sich später nachvollziehen lässt, womit gerechnet wurde. */
var VERSION = "ts-fsrs " + L.FSRSVersion + " | Ziel " + EINSTELLUNG.request_retention
  + " | Lernen " + EINSTELLUNG.learning_steps.join(",") + " | nach Fehler " + EINSTELLUNG.relearning_steps.join(",")
  + " | höchstens " + EINSTELLUNG.maximum_interval + " Tage" + (EINSTELLUNG.enable_fuzz ? " | Streuung" : "");

var PLAN = {
  MIN: MIN, TAG: TAG, NOTEN: NOTEN, TREPPE: TREPPE, MAXSTUFE: MAXSTUFE,
  BIBLIOTHEK: "ts-fsrs " + L.FSRSVersion, EINSTELLUNG: EINSTELLUNG, VERSION: VERSION,
  tagesbeginn: tagesbeginn, faelligNach: faelligNach, lerntag: lerntag, stufeVon: stufeVon,
  istNeu: istNeu, istDran: istDran, istBald: istBald,
  zuKarte: zuKarte, schritt: schritt, vorschau: vorschau, dauer: dauer, normalisieren: normalisieren
};

if(typeof module !== "undefined" && module.exports) module.exports = PLAN;
else wurzel.PLAN = PLAN;

})(typeof window !== "undefined" ? window : this);
