/* Prüft, dass die sichtbare Version (unter "Über" in index.html) und die
   Version des Service Workers (sw.js, Name des Offline-Speichers) zusammenpassen.

   Aufruf:  node tests/version.test.js     (braucht nur Node)
   Bei jeder Änderung beide hochzählen, etwa auf 0.32 Beta und kotoba-0.32-beta. */
"use strict";
const fs = require("fs");
const path = require("path");
const WURZEL = path.join(__dirname, "..");

let fehler = 0;
function pruefe(name, ok, detail){
  if(!ok) fehler++;
  console.log((ok ? "  ok     " : "  FEHLER ") + name + (detail !== undefined && !ok ? "  [" + detail + "]" : ""));
}

console.log("\nVersion");
const html = fs.readFileSync(path.join(WURZEL, "index.html"), "utf8");
const sw = fs.readFileSync(path.join(WURZEL, "sw.js"), "utf8");
const sichtbar = (html.match(/<span id="appVersion">([^<]*)<\/span>/) || [])[1];
const cache = (sw.match(/var VERSION = "([^"]*)";/) || [])[1];
pruefe("sichtbare Version unter \"Über\" vorhanden (" + sichtbar + ")", !!sichtbar && /^\d+\.\d+( Beta)?$/.test(sichtbar), sichtbar);
const erwartet = sichtbar ? "kotoba-" + sichtbar.toLowerCase().replace(/\s+/g, "-") : "";
pruefe("Service Worker hat dieselbe Version (" + cache + ")", cache === erwartet, cache + " statt " + erwartet);

console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
process.exit(fehler ? 1 : 0);
