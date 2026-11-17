/* ==================================================================
   Lernereignisse: die Antwort-Historie

   Nur Rechenfunktionen, kein Zugriff auf Speicher oder Seite. app.js
   speichert die Ereignisse, tests/verlauf.test.js prüft diese Datei.
   Aufbau und Regeln stehen in ARCHITEKTUR.md.

   Ein Ereignis:
     id        zufällige UUID vom Gerät
     art       "antwort", "uebernahme" (fester Stand eines Wortes) oder "widerruf"
     wort      Kennung des Wortes
     bewertung 1 bis 4 (nochmal, schwer, sitzt, leicht), nur bei "antwort"
     zeit      Zeitpunkt auf dem Gerät in Millisekunden
     tag       Lerntag auf dem Gerät (PLAN.lerntag)
     geraet    Gerätekennung
     plan      Version des Wiederholungsplans (PLAN.VERSION)
     daten     bei "uebernahme" der Stand (null: Wort wieder neu),
               bei "widerruf" die Kennung der widerrufenen Antwort

   Nachrechnen eines Wortes: letzte Übernahme, dann alle späteren Antworten
   in der Reihenfolge (zeit, id), ohne widerrufene. Ereignisse mehrerer Geräte
   werden über ihre Kennung vereinigt; doppelte zählen einmal.
   ================================================================== */
(function (wurzel) {
"use strict";

var PLAN = wurzel.PLAN || (typeof require === "function" ? require("./plan.js") : null);
if(!PLAN) return;               // plan.js fehlt: app.js lädt dann einmal neu

var BEWERTUNG = { nochmal: 1, schwer: 2, gut: 3, leicht: 4 };
var KURZ = { antwort: "a", uebernahme: "u", widerruf: "w" };
var LANG = { a: "antwort", u: "uebernahme", w: "widerruf" };
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/* ---------- Ereignisse anlegen ---------- */
function antwort(id, wort, note, zeit, tag, geraet, plan){
  return { id: id, art: "antwort", wort: wort, bewertung: BEWERTUNG[note], zeit: zeit, tag: tag, geraet: geraet, plan: plan };
}
function uebernahme(id, wort, zustand, zeit, tag, geraet, plan){
  return { id: id, art: "uebernahme", wort: wort, zeit: zeit, tag: tag, geraet: geraet, plan: plan,
           daten: zustand ? JSON.parse(JSON.stringify(zustand)) : null };
}
function widerruf(id, bezug, wort, zeit, tag, geraet, plan){
  return { id: id, art: "widerruf", wort: wort, zeit: zeit, tag: tag, geraet: geraet, plan: plan, daten: bezug };
}

function gueltig(e){
  if(!e || typeof e !== "object") return false;
  if(typeof e.id !== "string" || !UUID.test(e.id) || !KURZ[e.art]) return false;
  if(typeof e.wort !== "string" || !e.wort || e.wort.length > 200) return false;
  if(!(typeof e.zeit === "number" && isFinite(e.zeit) && e.zeit >= 0)) return false;
  if(!(typeof e.tag === "number" && isFinite(e.tag) && e.tag % 1 === 0)) return false;
  if(typeof e.geraet !== "string" || e.geraet.length > 64 || typeof e.plan !== "string") return false;
  if(e.art === "antwort") return e.bewertung >= 1 && e.bewertung <= 4 && e.bewertung % 1 === 0;
  if(e.art === "widerruf") return typeof e.daten === "string";
  return e.daten === null || (typeof e.daten === "object" && !Array.isArray(e.daten));
}

/* ---------- Vereinigen ---------- */
function vergleich(a, b){ return a.zeit - b.zeit || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); }
/* Beliebig viele Listen; jede Kennung einmal, nach (zeit, id) geordnet. */
function vereinigen(){
  var gesehen = {}, aus = [];
  for(var i = 0; i < arguments.length; i++){
    (arguments[i] || []).forEach(function(e){
      if(e && typeof e.id === "string" && !gesehen[e.id]){ gesehen[e.id] = true; aus.push(e); }
    });
  }
  return aus.sort(vergleich);
}

/* ---------- Nachrechnen ---------- */
function neu(){ return { stufe: 0, faellig: 0, fehler: 0 }; }
/* Wie die App den Stand speichert und wieder einliest */
function sauber(k){
  var x = JSON.parse(JSON.stringify(k));
  return PLAN.normalisieren(x) ? x : undefined;
}
function widerrufene(ereignisse){
  var w = {};
  ereignisse.forEach(function(e){ if(e.art === "widerruf") w[e.daten] = true; });
  return w;
}
/* Ereignisse eines Wortes, geordnet; widerrufen: Kennungen widerrufener Antworten */
function nachrechnenWort(liste, widerrufen){
  var start = 0, zustand;
  for(var i = liste.length - 1; i >= 0; i--){
    if(liste[i].art === "uebernahme"){
      start = i + 1;
      zustand = liste[i].daten ? sauber(liste[i].daten) : undefined;
      break;
    }
  }
  for(var j = start; j < liste.length; j++){
    var e = liste[j];
    if(e.art !== "antwort" || widerrufen[e.id]) continue;
    zustand = sauber(PLAN.schritt(zustand || neu(), PLAN.NOTEN[e.bewertung - 1], e.zeit, e.tag).k);
  }
  return zustand;
}
function nachWort(ereignisse, umleitungen){
  var um = umleitungen || {}, jeWort = {};
  ereignisse.forEach(function(e){
    var w = um[e.wort] || e.wort;
    (jeWort[w] = jeWort[w] || []).push(e);
  });
  return jeWort;
}
/* Stand aller Wörter aus ihren Ereignissen. umleitungen: alte Kennung -> neue */
function nachrechnen(ereignisse, umleitungen){
  var alle = vereinigen(ereignisse || []);
  var widerrufen = widerrufene(alle), jeWort = nachWort(alle, umleitungen), aus = {};
  Object.keys(jeWort).forEach(function(w){
    var z = nachrechnenWort(jeWort[w], widerrufen);
    if(z) aus[w] = z;
  });
  return aus;
}

/* ---------- Zusammenfassen ----------
   Alle Ereignisse vor der Grenze werden durch eine Übernahme je Wort ersetzt,
   die genau den Stand nach diesen Ereignissen festhält. Spätere Ereignisse
   bleiben, ebenso Widerrufe, deren Antwort bleibt. Nachrechnen ergibt danach
   denselben Stand. */
function zusammenfassen(ereignisse, grenze, neueId, geraet, plan, umleitungen){
  var alle = vereinigen(ereignisse || []);
  var alt = alle.filter(function(e){ return e.zeit < grenze; });
  if(!alt.length) return alle;
  var bleibt = alle.filter(function(e){ return e.zeit >= grenze; });
  var widerrufen = widerrufene(alle), bleibtId = {};
  bleibt.forEach(function(e){ bleibtId[e.id] = true; });
  var widerrufeDazu = alt.filter(function(e){ return e.art === "widerruf" && bleibtId[e.daten]; });
  var jeWort = nachWort(alt, umleitungen), neu = [];
  Object.keys(jeWort).forEach(function(w){
    var liste = jeWort[w], z = nachrechnenWort(liste, widerrufen);
    // Ohne Stand nach den alten Ereignissen braucht es keine Übernahme: Die alten
    // Ereignisse fallen ganz weg, nichts davon kann wieder aufleben.
    if(z) neu.push(uebernahme(neueId(), w, z, grenze - 1, liste[liste.length - 1].tag, geraet, plan));
  });
  return vereinigen(neu, widerrufeDazu, bleibt);
}

/* ---------- Packen fürs Speichern ----------
   { geraete: [...], plaene: [...], liste: [[id, art, wort, bewertung, zeit, tag, gerät, plan, daten?], ...] }
   Gerät und Plan stehen nur einmal je Teil, in der Liste ihre Nummer. */
function packen(liste){
  var geraete = [], plaene = [], aus = [];
  (liste || []).forEach(function(e){
    var g = geraete.indexOf(e.geraet), p = plaene.indexOf(e.plan);
    if(g < 0){ g = geraete.length; geraete.push(e.geraet); }
    if(p < 0){ p = plaene.length; plaene.push(e.plan); }
    var z = [e.id, KURZ[e.art], e.wort, e.art === "antwort" ? e.bewertung : 0, e.zeit, e.tag, g, p];
    if(e.art !== "antwort") z.push(e.daten === undefined ? null : e.daten);
    aus.push(z);
  });
  return { geraete: geraete, plaene: plaene, liste: aus };
}
/* Ungültige Einträge werden verworfen. */
function auspacken(teil){
  var aus = [];
  if(!teil || typeof teil !== "object" || !Array.isArray(teil.liste)) return aus;
  var g = Array.isArray(teil.geraete) ? teil.geraete : [], p = Array.isArray(teil.plaene) ? teil.plaene : [];
  teil.liste.forEach(function(z){
    if(!Array.isArray(z) || !LANG[z[1]]) return;
    var e = { id: z[0], art: LANG[z[1]], wort: z[2], zeit: z[4], tag: z[5], geraet: g[z[6]], plan: p[z[7]] };
    if(e.art === "antwort") e.bewertung = z[3]; else e.daten = z.length > 8 ? z[8] : null;
    if(gueltig(e)) aus.push(e);
  });
  return aus;
}

var VERLAUF = {
  BEWERTUNG: BEWERTUNG,
  antwort: antwort, uebernahme: uebernahme, widerruf: widerruf, gueltig: gueltig,
  vereinigen: vereinigen, nachrechnen: nachrechnen, zusammenfassen: zusammenfassen,
  packen: packen, auspacken: auspacken
};

if(typeof module !== "undefined" && module.exports) module.exports = VERLAUF;
else wurzel.VERLAUF = VERLAUF;

})(typeof window !== "undefined" ? window : this);
