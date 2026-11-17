/* Tests für plan.js (Wiederholungsplan mit ts-fsrs)

   Aufruf:  node tests/plan.test.js
   Braucht nur Node (ab Version 18), keine weiteren Pakete. Läuft in drei
   Zeitzonen nacheinander, weil sich die Tageszählung je Zone unterscheidet.

   Geprüft wird:
   - Referenzwerte der offiziellen FSRS-6-Tests von ts-fsrs, gerechnet über plan.js
   - Audit C3: Die Bibliothek zählt die Tage seit der letzten Antwort genauso
     wie die App (Tageswechsel 4 Uhr Ortszeit), nicht nach UTC
   - Audit C2 (Ursache): Liegt die letzte Antwort in der Zukunft (Uhr
     zurückgestellt), rechnet plan.js trotzdem, als wären 0 Tage vergangen   */
"use strict";
const path = require("path");
const cp = require("child_process");
const ZONEN = ["Europe/Berlin", "Asia/Tokyo", "America/New_York"];

if(!process.env.TEST_ZONE){
  let fehlgeschlagen = 0;
  for(const z of ZONEN){
    const r = cp.spawnSync(process.execPath, [__filename],
      { env: Object.assign({}, process.env, { TZ: z, TEST_ZONE: z }), encoding: "utf8" });
    process.stdout.write(r.stdout); process.stderr.write(r.stderr);
    if(r.status !== 0) fehlgeschlagen++;
  }
  console.log(fehlgeschlagen ? "\nFEHLGESCHLAGEN in " + fehlgeschlagen + " Zeitzone(n)" : "\nalle Prüfungen bestanden");
  process.exit(fehlgeschlagen ? 1 : 0);
}

const PLAN = require(path.join(__dirname, "..", "plan.js"));
const L = require(path.join(__dirname, "..", "ts-fsrs", "index.umd.js"));
const MIN = 60000, STD = 3600000, TAG = 86400000;
let fehler = 0;
function pruefe(name, ok, detail){
  if(!ok) fehler++;
  console.log((ok ? "  ok     " : "  FEHLER ") + name + (detail !== undefined && !ok ? "  [" + detail + "]" : ""));
}
const nah = (a, b, stellen) => Math.abs(a - b) < Math.pow(10, -stellen) / 2;
const NEU = () => ({ stufe: 0, faellig: 0, fehler: 0 });
const NOTE = { 1: "nochmal", 2: "schwer", 3: "gut", 4: "leicht" };
/* Wie die App speichert und wieder einliest */
const speichernLaden = k => { const x = JSON.parse(JSON.stringify(k)); PLAN.normalisieren(x); return x; };
/* Tage nach der Zählung der App (Tageswechsel 4 Uhr Ortszeit) */
const appTage = (von, bis) => Math.round((PLAN.tagesbeginn(bis) - PLAN.tagesbeginn(von)) / TAG);
/* Erwartete Gedächtniswerte: reine Rechenfunktion der Bibliothek mit den Tagen der App */
const f = L.fsrs(L.generatorParameters(PLAN.EINSTELLUNG));
const erwartet = (k, tage, note) => f.next_state({ difficulty: k.d, stability: k.s }, tage, { nochmal: 1, schwer: 2, gut: 3, leicht: 4 }[note]);

console.log("\n" + process.env.TEST_ZONE + " (" + L.FSRSVersion + ")");

/* ---------- Referenzwerte (FSRS-6.test.ts der offiziellen Bibliothek) ---------- */
{
  const t = new Date(2022, 11, 29, 12, 30).getTime();
  const s = PLAN.NOTEN.map(n => PLAN.schritt(NEU(), n, t).k.s);
  pruefe("Referenz erste Antwort: Stabilität je Knopf 0.212 / 1.2931 / 2.3065 / 8.2956",
    JSON.stringify(s) === "[0.212,1.2931,2.3065,8.2956]", s.join(","));

  let k = NEU(), jetzt = t;
  [1, 3, 3, 3, 3, 3].forEach((g, i) => {
    const d = new Date(jetzt); d.setDate(d.getDate() + [0, 0, 1, 3, 8, 21][i]); jetzt = d.getTime();
    k = speichernLaden(PLAN.schritt(k, NOTE[g], jetzt).k);
  });
  pruefe("Referenz Gedächtniswert nach 6 Antworten: S 53.62691, D 6.3574867",
    nah(k.s, 53.62691, 4) && nah(k.d, 6.3574867, 4), k.s + " / " + k.d);

  k = NEU(); jetzt = t;
  const hist = [];
  for(const g of [3, 3, 3, 3, 3, 3, 1, 1, 3, 3, 3, 3, 3]){
    const v = PLAN.vorschau(k, jetzt)[NOTE[g]];
    hist.push(v.tage);
    k = speichernLaden(PLAN.schritt(k, NOTE[g], jetzt).k);
    if(v.tage){ const d = new Date(jetzt); d.setDate(d.getDate() + v.tage); jetzt = d.getTime(); }
    else jetzt += v.minuten * MIN;
  }
  pruefe("Referenz Abstände (Knopfbeschriftung): 0,2,11,46,163,498,0,0,2,4,7,12,21",
    hist.join(",") === "0,2,11,46,163,498,0,0,2,4,7,12,21", hist.join(","));
}

/* ---------- C3: Tageszählung ----------
   Ein Wort wird zu jeder Stunde gelernt und zu jeder Stunde des Fälligkeitstags
   wiederholt. Die Gedächtniswerte müssen denen entsprechen, die die Bibliothek
   mit den Tagen der App ausrechnet. */
for(const [jahr, monat, name] of [[2026, 0, "Winter"], [2026, 6, "Sommer"]]){
  let faelle = 0, falsch = [];
  for(let h1 = 0; h1 < 24; h1++) for(let h2 = 0; h2 < 24; h2++){
    const lern = new Date(jahr, monat, 10, h1, 20).getTime();
    // a) Wiederholung: zwei Mal "sitzt", dann am Fälligkeitstag "sitzt"
    let k = speichernLaden(PLAN.schritt(NEU(), "gut", lern).k);
    k = speichernLaden(PLAN.schritt(k, "gut", lern + 10 * MIN).k);
    const wann = k.faellig + h2 * STD + 10 * MIN;
    const tage = appTage(k.zuletzt, wann);
    const ist = PLAN.schritt(k, "gut", wann).k, soll = erwartet(k, tage, "gut");
    faelle++;
    if(ist.s !== soll.stability || ist.d !== soll.difficulty)
      falsch.push("Wiederholung: gelernt " + h1 + " Uhr, wiederholt " + new Date(wann).getHours() + " Uhr, App " + tage + " Tage: S " + ist.s + " statt " + soll.stability);
    // b) Lernkarte: einmal "sitzt", dann erst nach h2 Stunden wieder
    const k2 = speichernLaden(PLAN.schritt(NEU(), "gut", lern).k);
    const wann2 = lern + (h2 + 1) * STD;
    const tage2 = appTage(k2.zuletzt, wann2);
    const ist2 = PLAN.schritt(k2, "gut", wann2).k, soll2 = erwartet(k2, tage2, "gut");
    faelle++;
    if(ist2.s !== soll2.stability || ist2.d !== soll2.difficulty)
      falsch.push("Lernkarte: gelernt " + h1 + " Uhr, wieder " + new Date(wann2).getHours() + " Uhr, App " + tage2 + " Tage: S " + ist2.s + " statt " + soll2.stability);
  }
  pruefe("C3 Tageszählung " + name + ": " + faelle + " Fälle, Gedächtniswerte nach den Tagen der App (4 Uhr Ortszeit)",
    falsch.length === 0, falsch.length + " abweichend, z. B. " + falsch[0]);
}
{ // Die ursprüngliche Reproduktion aus dem Audit: abends lernen, morgens wiederholen
  let k = speichernLaden(PLAN.schritt(NEU(), "gut", new Date(2026, 4, 4, 21, 0).getTime()).k);
  k = speichernLaden(PLAN.schritt(k, "gut", new Date(2026, 4, 4, 21, 10).getTime()).k);
  let t = new Date(2026, 4, 6, 21, 0).getTime();
  k = speichernLaden(PLAN.schritt(k, "nochmal", t).k);
  k = speichernLaden(PLAN.schritt(k, "gut", t + 10 * MIN).k);       // jetzt 1 Tag Abstand
  const morgen = new Date(2026, 4, 7, 7, 30).getTime();
  const tage = appTage(k.zuletzt, morgen);
  const ist = PLAN.schritt(k, "gut", morgen).k, soll = erwartet(k, tage, "gut");
  pruefe("C3 Reproduktion: um 21 Uhr gelernt, Abstand " + k.ivl + " Tag, um 7:30 wiederholt -> zählt als " + tage + " Tag",
    k.ivl === 1 && tage === 1 && ist.s === soll.stability, "S " + ist.s + " statt " + soll.stability);
}

/* ---------- C2: Uhr zurückgestellt ---------- */
{
  const jetzt = new Date(2026, 10, 16, 18, 0).getTime();
  let k = speichernLaden(PLAN.schritt(NEU(), "gut", jetzt - 5 * TAG).k);
  k = speichernLaden(PLAN.schritt(k, "gut", jetzt - 5 * TAG + 10 * MIN).k);
  for(const [name, zuletzt] of [["2 Tage", jetzt + 2 * TAG], ["30 Tage", jetzt + 30 * TAG], ["2 Stunden", jetzt + 2 * STD]]){
    const x = Object.assign({}, k, { zuletzt: zuletzt });
    let fehlerText = "";
    try{
      PLAN.vorschau(x, jetzt);
      PLAN.NOTEN.forEach(n => {
        const s = PLAN.schritt(x, n, jetzt), soll = erwartet(x, 0, n);
        if(s.k.s !== soll.stability || s.k.d !== soll.difficulty) fehlerText += n + ": S " + s.k.s + " statt " + soll.stability + "; ";
        if(!(s.k.faellig > jetzt && s.k.zuletzt === jetzt)) fehlerText += n + ": Termin " + s.k.faellig + "; ";
      });
    }catch(e){ fehlerText = "Ausnahme: " + e.message; }
    pruefe("C2 letzte Antwort " + name + " in der Zukunft: Knöpfe und alle vier Antworten rechnen wie nach 0 Tagen", !fehlerText, fehlerText);
  }
}

console.log(fehler ? "  " + fehler + " Prüfung(en) fehlgeschlagen" : "  alle bestanden");
process.exit(fehler ? 1 : 0);
