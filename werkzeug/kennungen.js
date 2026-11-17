/* Kennungen der globalen Inhalte: Wörter, JLPT-Aufgaben, Lesetexte, Bilder.

   Lernstände (heute im Speicher des Geräts, später in Supabase) verweisen nur
   über diese Kennungen auf die Inhalte. Eine einmal veröffentlichte Kennung
   darf sich deshalb nie ändern. Wird ein Wort verschoben oder seine Lesung
   korrigiert, bekommt die alte Kennung einen Eintrag in UMLEITUNGEN
   (vokabeln.js); die App zieht Lernstände dann von selbst um.

   tests/kennungen.json ist das Verzeichnis aller je veröffentlichten
   Kennungen. Es wächst nur, nichts wird daraus entfernt.

     node werkzeug/kennungen.js     nimmt neue Kennungen ins Verzeichnis auf

   tests/kennungen.test.js prüft, dass keine Kennung verschwindet.        */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const WURZEL = path.join(__dirname, "..");
const VERZEICHNIS = path.join(WURZEL, "tests", "kennungen.json");
const DATEIEN = ["vokabeln-jlpt.js", "vokabeln.js", "bilder.js", "dojo-daten.js"];   // wie in index.html

/* Lädt die Inhaltsdateien so, wie der Browser sie lädt: nacheinander in einem
   gemeinsamen Bereich, ohne Seite drumherum. */
function inhalte(){
  const quelle = DATEIEN.map(f => fs.readFileSync(path.join(WURZEL, f), "utf8")).join("\n;\n")
    + "\n;({ V: V, JLPT: JLPT, LESETEXTE: LESETEXTE, BILDER: BILDER, BILDGRUPPEN: BILDGRUPPEN,"
    + "     UMLEITUNGEN: typeof UMLEITUNGEN === 'undefined' ? null : UMLEITUNGEN })";
  return vm.runInNewContext(quelle, {});
}

/* Die Kennungen, wie die App sie jetzt bildet. Bei Wörtern mit gleicher Lesung
   im selben Abschnitt hängt die Kennung von der Reihenfolge ab; für sie wird
   die Bedeutung als Fingerabdruck mitgegeben. */
function aktuelleKennungen(){
  const x = inhalte();
  const gruppen = {};
  x.V.forEach(v => { const g = v.ab + "|" + v.kana; (gruppen[g] = gruppen[g] || []).push(v.id); });
  const woerter = {};
  x.V.forEach(v => { woerter[v.id] = { de: v.de, gleicheLesung: gruppen[v.ab + "|" + v.kana].length > 1 }; });
  return {
    anzahlWoerter: x.V.length,
    woerter: woerter,
    umleitungen: x.UMLEITUNGEN,
    aufgaben: x.JLPT.map(a => a.id),
    texte: x.LESETEXTE.map(t => t.id),
    bilder: x.BILDER.map(b => b.z),
    bildgruppen: Object.keys(x.BILDGRUPPEN)
  };
}

function verzeichnisLaden(){
  return JSON.parse(fs.readFileSync(VERZEICHNIS, "utf8"));
}

/* Nimmt neue Kennungen auf, entfernt nie etwas. Rückgabe: Zahl der neuen. */
function aufnehmen(){
  let v;
  try{ v = verzeichnisLaden(); }catch(e){ v = {}; }
  const jetzt = aktuelleKennungen();
  let neu = 0;
  v.hinweis = "Alle je veröffentlichten Kennungen. Nur wachsen lassen: node werkzeug/kennungen.js";
  v.woerter = v.woerter || {};
  Object.keys(jetzt.woerter).forEach(id => {
    if(v.woerter[id] === undefined){ v.woerter[id] = jetzt.woerter[id].de; neu++; }
  });
  ["aufgaben", "texte", "bilder", "bildgruppen"].forEach(art => {
    v[art] = v[art] || [];
    jetzt[art].forEach(k => { if(v[art].indexOf(k) < 0){ v[art].push(k); neu++; } });
  });
  fs.writeFileSync(VERZEICHNIS, JSON.stringify(v, null, 1) + "\n");
  return neu;
}

module.exports = { inhalte, aktuelleKennungen, verzeichnisLaden, aufnehmen, VERZEICHNIS };

if(require.main === module){
  const neu = aufnehmen();
  console.log(neu ? neu + " neue Kennungen aufgenommen in " + path.relative(WURZEL, VERZEICHNIS)
                  : "keine neuen Kennungen");
}
