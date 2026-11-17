/* Prüft, dass keine veröffentlichte Kennung verschwindet oder heimlich auf ein
   anderes Wort zeigt. Lernstände aller Benutzer hängen an diesen Kennungen.

   Aufruf:  node tests/kennungen.test.js     (braucht nur Node)
   Neue Wörter oder Aufgaben aufnehmen:  node werkzeug/kennungen.js        */
"use strict";
const K = require("../werkzeug/kennungen.js");

let fehler = 0;
function pruefe(name, ok, detail){
  if(!ok) fehler++;
  console.log((ok ? "  ok     " : "  FEHLER ") + name + (detail !== undefined && !ok ? "  [" + detail + "]" : ""));
}
const liste = (a, n) => a.slice(0, n || 5).join(", ") + (a.length > (n || 5) ? " … (" + a.length + ")" : "");

console.log("\nKennungen der globalen Inhalte");
let v = null;
try{ v = K.verzeichnisLaden(); }catch(e){ /* unten gemeldet */ }
pruefe("Verzeichnis tests/kennungen.json vorhanden", !!v, "fehlt – node werkzeug/kennungen.js ausführen");
v = v || { woerter: {}, aufgaben: [], texte: [], bilder: [], bildgruppen: [] };
const jetzt = K.aktuelleKennungen();
const um = jetzt.umleitungen;
pruefe("UMLEITUNGEN ist in vokabeln.js definiert", um && typeof um === "object" && !Array.isArray(um));
const umleitung = um || {};

// Wörter
const ids = Object.keys(jetzt.woerter);
pruefe("Wort-Kennungen sind eindeutig (" + jetzt.anzahlWoerter + " Wörter)", ids.length === jetzt.anzahlWoerter);
const weg = Object.keys(v.woerter).filter(id => !jetzt.woerter[id] && !(umleitung[id] && jetzt.woerter[umleitung[id]]));
pruefe("keine veröffentlichte Wort-Kennung ist verschwunden (sonst Eintrag in UMLEITUNGEN)", weg.length === 0, liste(weg));
const verschoben = ids.filter(id => jetzt.woerter[id].gleicheLesung && v.woerter[id] !== undefined && v.woerter[id] !== jetzt.woerter[id].de);
pruefe("Wörter mit gleicher Lesung im Abschnitt zeigen noch auf dasselbe Wort", verschoben.length === 0,
  verschoben.map(id => id + ": war \"" + v.woerter[id] + "\", jetzt \"" + jetzt.woerter[id].de + "\"").join("; "));
const neu = ids.filter(id => v.woerter[id] === undefined);
pruefe("alle Wort-Kennungen stehen im Verzeichnis", neu.length === 0, liste(neu) + " – node werkzeug/kennungen.js ausführen");

// Umleitungen
const quelleAktiv = Object.keys(umleitung).filter(a => jetzt.woerter[a]);
pruefe("Umleitungen: keine alte Kennung ist zugleich noch in Gebrauch", quelleAktiv.length === 0, liste(quelleAktiv));
const zielFehlt = Object.keys(umleitung).filter(a => !jetzt.woerter[umleitung[a]]);
pruefe("Umleitungen: jedes Ziel ist eine aktuelle Kennung (keine Ketten)", zielFehlt.length === 0, liste(zielFehlt));

// Dojo
[["aufgaben", "JLPT-Aufgaben"], ["texte", "Lesetexte"], ["bilder", "Bilder"], ["bildgruppen", "Bildgruppen"]].forEach(([art, name]) => {
  const reg = v[art] || [], akt = jetzt[art];
  const fehlend = reg.filter(k => akt.indexOf(k) < 0);
  const doppelt = akt.filter((k, i) => akt.indexOf(k) !== i);
  const unbekannt = akt.filter(k => reg.indexOf(k) < 0);
  pruefe(name + ": keine veröffentlichte Kennung verschwunden, keine doppelt (" + akt.length + ")", fehlend.length === 0 && doppelt.length === 0,
    "verschwunden: " + liste(fehlend) + " | doppelt: " + liste(doppelt));
  pruefe(name + ": alle stehen im Verzeichnis", unbekannt.length === 0, liste(unbekannt) + " – node werkzeug/kennungen.js ausführen");
});

console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
process.exit(fehler ? 1 : 0);
