/* ------------------------------------------------------------------
   Baut bilder.svg aus den Zeichen in bilder.js.

   Aufruf im Hauptordner:   node werkzeug/bilder-bauen.js

   Holt zu jedem Emoji die Grafik aus Twemoji und legt alle als
   <symbol> in eine einzige Datei. Die App zeigt sie dann mit
   <use href="bilder.svg#b-...">. Braucht Node 18 oder neuer und Netz.

   Twemoji: Copyright Twitter, Inc und Mitwirkende,
   Grafiken unter CC-BY 4.0, https://github.com/jdecked/twemoji
   ------------------------------------------------------------------ */
"use strict";
const fs   = require("fs");
const path = require("path");
const vm   = require("vm");

const WURZEL = path.join(__dirname, "..");
const FASSUNG = "v15.1.0";
const QUELLE = "https://raw.githubusercontent.com/jdecked/twemoji/" + FASSUNG + "/assets/svg/";

/* bilder.js ist ein gewöhnliches Skript für den Browser. Hier wird es in
   einer leeren Umgebung ausgeführt, um an seine Listen zu kommen. */
function listenLesen(){
  const quelltext = fs.readFileSync(path.join(WURZEL, "bilder.js"), "utf8")
    + "\n;({ BILDER: BILDER, NUR: BILDER_NUR_KARTE, SZENE: BILDER_SZENE, bildCode: bildCode });";
  return vm.runInNewContext(quelltext, {});
}

/* Zusätzliche Zeichen aus dojo-daten.js: alles, was dort als bild:"…"
   oder in ZUSATZBILDER steht. */
function zusatzLesen(){
  const datei = path.join(WURZEL, "dojo-daten.js");
  if(!fs.existsSync(datei)) return [];
  const quelltext = fs.readFileSync(datei, "utf8")
    + "\n;(typeof DOJO_BILDER === 'undefined' ? [] : DOJO_BILDER);";
  return Array.from(vm.runInNewContext(quelltext, {}));
}

/* Dateinamen, unter denen Twemoji ein Zeichen führen kann. */
function kandidaten(code){
  const ohne = code.split("-").filter(function(t){ return t !== "fe0f"; }).join("-");
  const liste = [code];
  if(liste.indexOf(ohne) < 0) liste.push(ohne);
  return liste;
}

async function hole(code){
  for(const name of kandidaten(code)){
    for(let versuch = 0; versuch < 4; versuch++){
      try{
        const antwort = await fetch(QUELLE + name + ".svg");
        if(antwort.status === 404) break;
        if(antwort.ok) return await antwort.text();
      }catch(e){ /* gleich noch einmal */ }
      await new Promise(function(r){ setTimeout(r, 600 * (versuch + 1)); });
    }
  }
  return null;
}

/* Aus <svg ...>Inhalt</svg> wird <symbol id viewBox>Inhalt</symbol>.
   Eigene ids im Inhalt bekommen den Namen des Zeichens vorangestellt,
   damit sich zwei Grafiken in der Sammeldatei nicht in die Quere kommen. */
function alsSymbol(code, svg){
  const m = svg.match(/<svg[^>]*viewBox="([^"]+)"[^>]*>([\s\S]*)<\/svg>/);
  if(!m) return null;
  let inhalt = m[2].trim();
  if(/\sid="/.test(inhalt)){
    inhalt = inhalt
      .replace(/\sid="([^"]+)"/g, ' id="' + code + '-$1"')
      .replace(/url\(#([^)]+)\)/g, "url(#" + code + "-$1)")
      .replace(/href="#([^"]+)"/g, 'href="#' + code + '-$1"');
  }
  return '<symbol id="b-' + code + '" viewBox="' + m[1] + '">' + inhalt + "</symbol>";
}

(async function(){
  const L = listenLesen();
  const zeichen = [];
  function merke(z){ if(z && zeichen.indexOf(z) < 0) zeichen.push(z); }
  L.BILDER.forEach(function(b){ merke(b.z); });
  L.NUR.forEach(function(r){ merke(r[0]); });
  L.SZENE.forEach(merke);
  zusatzLesen().forEach(merke);

  const symbole = [], fehlt = [];
  let i = 0;
  async function arbeiter(){
    while(i < zeichen.length){
      const z = zeichen[i++];
      const code = L.bildCode(z);
      const svg = await hole(code);
      const sym = svg && alsSymbol(code, svg);
      if(sym) symbole.push([code, sym]); else fehlt.push(z + " (" + code + ")");
    }
  }
  await Promise.all([arbeiter(), arbeiter(), arbeiter(), arbeiter(), arbeiter(), arbeiter()]);

  symbole.sort(function(a, b){ return a[0] < b[0] ? -1 : 1; });
  const kopf = "<!-- Grafiken: Twemoji " + FASSUNG + ", Copyright Twitter, Inc und Mitwirkende, "
    + "CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/), "
    + "https://github.com/jdecked/twemoji - erzeugt von werkzeug/bilder-bauen.js -->\n";
  const datei = kopf + '<svg xmlns="http://www.w3.org/2000/svg">\n'
    + symbole.map(function(s){ return s[1]; }).join("\n") + "\n</svg>\n";
  fs.writeFileSync(path.join(WURZEL, "bilder.svg"), datei);

  console.log(symbole.length + " Bilder, " + Math.round(datei.length / 1024) + " KB");
  if(fehlt.length){
    console.log("Nicht gefunden: " + fehlt.join(", "));
    process.exitCode = 1;
  }
})();
