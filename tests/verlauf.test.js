/* Tests für verlauf.js: Lernereignisse, Nachrechnen, Vereinigen, Zusammenfassen

   Aufruf:  node tests/verlauf.test.js     (braucht nur Node)

   Geprüft wird:
   - Nachrechnen aus den Ereignissen ergibt genau den Stand, den die App beim
     Antworten speichert (zufällige Lernverläufe)
   - Ereignisse zweier Geräte ergeben vereinigt in jeder Reihenfolge dasselbe;
     doppelte zählen einmal
   - In Tokio aufgezeichnete Ereignisse ergeben in Berlin und New York dieselben
     Gedächtniswerte und Abstände
   - Übernahme, Widerruf, Umleitungen, Packen fürs Speichern, Zusammenfassen
   - Tag der ersten Antwort (erst) für den Tageszähler neuer Wörter          */
"use strict";
const path = require("path");
const cp = require("child_process");
const PLAN = require(path.join(__dirname, "..", "plan.js"));
let VERLAUF = null;
try{ VERLAUF = require(path.join(__dirname, "..", "verlauf.js")); }catch(e){ /* unten gemeldet */ }

const MIN = 60000, TAG = 86400000;
const NEU = () => ({ stufe: 0, faellig: 0, fehler: 0 });
const speichernLaden = k => { const x = JSON.parse(JSON.stringify(k)); PLAN.normalisieren(x); return x; };
/* Vergleich unabhängig von der Reihenfolge der Felder */
function sortiert(x){
  if(Array.isArray(x)) return "[" + x.map(sortiert).join(",") + "]";
  if(x && typeof x === "object") return "{" + Object.keys(x).sort().map(k => JSON.stringify(k) + ":" + sortiert(x[k])).join(",") + "}";
  return String(JSON.stringify(x));
}
function zufallsquelle(saat){ let s = saat; return () => (s = (s * 16807) % 2147483647) / 2147483647; }
/* Kennungen im UUID-Format (nur Hex-Ziffern), je Erzeuger eindeutig */
function kennungen(praefix){
  let n = 0;
  const p = Buffer.from(String(praefix)).toString("hex");
  return () => "00000000-0000-4000-8000-" + (p + (++n).toString(16)).padStart(12, "0").slice(-12);
}

/* Lernt wie die App: früh geübt und gewusst ändert nichts und wird nicht
   festgehalten; sonst neuer Stand und ein Ereignis "antwort". */
function antworte(stand, ereignisse, wort, note, zeit, id, geraet){
  const k = stand[wort] || NEU();
  const frueh = !PLAN.istNeu(k) && k.lern === undefined && k.faellig > zeit;
  if(frueh && note !== "nochmal") return null;
  const heute = PLAN.lerntag(zeit);
  const r = PLAN.schritt(k, note, zeit, heute);
  const vorher = stand[wort];
  stand[wort] = speichernLaden(r.k);
  const e = VERLAUF.antwort(id(), wort, note, zeit, heute, geraet, PLAN.VERSION);
  ereignisse.push(e);
  return { ereignis: e, vorher: vorher };
}
function verlauf(zufall, anzahl, woerter, start, id, geraet, mitWiderruf){
  const stand = {}, ereignisse = [];
  let zeit = start, letzte = null;
  for(let i = 0; i < anzahl; i++){
    if(mitWiderruf && letzte && zufall() < 0.1){
      // letzte Antwort rückgängig: Stand davor, Ereignis "widerruf"
      const w = letzte.ereignis.wort;
      if(letzte.vorher === undefined) delete stand[w]; else stand[w] = letzte.vorher;
      ereignisse.push(VERLAUF.widerruf(id(), letzte.ereignis.id, w, zeit, PLAN.lerntag(zeit), geraet, PLAN.VERSION));
      letzte = null;
    }else{
      const r = antworte(stand, ereignisse, woerter[Math.floor(zufall() * woerter.length)], PLAN.NOTEN[Math.floor(zufall() * 4)], zeit, id, geraet);
      if(r) letzte = r;
    }
    zeit += zufall() < 0.6 ? (1 + Math.floor(zufall() * 30)) * MIN : Math.floor(zufall() * 9 * TAG);
  }
  return { stand, ereignisse };
}
const WOERTER = ["8-1|あに", "8-1|あね", "8-1|いもうと", "8-2|いちにち", "9-11|くれます", "9-11|くれます|暮れます"];

/* ---------- Kindprozess: in anderer Zeitzone aufzeichnen oder nachrechnen ---------- */
if(process.env.VERLAUF_AUFGABE === "aufzeichnen"){
  const z = zufallsquelle(77), id = kennungen("7");
  const aus = [];
  for(let n = 0; n < 40; n++) aus.push(verlauf(z, 60, WOERTER, Date.UTC(2026, 0, 3 + n * 7, 2 + n % 20, 13), id, "geraet-tokio", false));
  process.stdout.write(JSON.stringify(aus), () => process.exit(0));   // erst nach dem Schreiben beenden
  return;
}
if(process.env.VERLAUF_AUFGABE === "nachrechnen"){
  const laeufe = JSON.parse(require("fs").readFileSync(0, "utf8"));
  process.stdout.write(JSON.stringify(laeufe.map(l => VERLAUF.nachrechnen(l.ereignisse))), () => process.exit(0));
  return;
}

/* ---------- Prüfungen ---------- */
let fehler = 0;
function pruefe(name, ok, detail){
  if(!ok) fehler++;
  console.log((ok ? "  ok     " : "  FEHLER ") + name + (detail !== undefined && !ok ? "  [" + detail + "]" : ""));
}
console.log("\nverlauf.js (Zeitzone " + Intl.DateTimeFormat().resolvedOptions().timeZone + ")");
pruefe("verlauf.js ist vorhanden", !!VERLAUF);
pruefe("plan.js kennt Lerntag und Plan-Version", typeof PLAN.lerntag === "function" && typeof PLAN.VERSION === "string" && PLAN.VERSION.length > 0);
if(!VERLAUF || typeof PLAN.lerntag !== "function"){
  console.log("\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN");
  process.exit(1);
}

/* 1. Nachrechnen = gespeicherter Stand */
{
  const z = zufallsquelle(4711), id = kennungen("1");
  let laeufe = 0, abw = [];
  for(let l = 0; l < 400 && abw.length < 3; l++){
    const v = verlauf(z, 40, WOERTER, Date.UTC(2026, 0, 1 + Math.floor(z() * 300), Math.floor(z() * 24), Math.floor(z() * 60)), id, "g1", l % 2 === 1);
    const r = VERLAUF.nachrechnen(v.ereignisse);
    const a = sortiert(v.stand), b = sortiert(r);
    if(a !== b) abw.push("Lauf " + l + ": " + a.slice(0, 160) + " / " + b.slice(0, 160));
    laeufe++;
  }
  pruefe("Nachrechnen ergibt genau den gespeicherten Stand (" + laeufe + " Lernverläufe, mit und ohne Rückgängig)", abw.length === 0, abw[0]);
}

/* 2. Vereinigen zweier Geräte */
{
  const z = zufallsquelle(99), idA = kennungen("a"), idB = kennungen("b");
  let abw = 0, faelle = 0;
  for(let l = 0; l < 150; l++){
    const t0 = Date.UTC(2026, 2, 1 + l, 8, 0);
    const a = verlauf(z, 25, WOERTER, t0, idA, "geraet-a", true).ereignisse;
    const b = verlauf(z, 25, WOERTER, t0 + 7 * MIN, idB, "geraet-b", true).ereignisse;
    const ab = VERLAUF.nachrechnen(VERLAUF.vereinigen(a, b));
    const ba = VERLAUF.nachrechnen(VERLAUF.vereinigen(b, a));
    const gemischt = a.concat(b, a.slice(0, 5)).sort(() => z() - 0.5);
    const doppelt = VERLAUF.nachrechnen(VERLAUF.vereinigen(gemischt));
    faelle++;
    if(sortiert(ab) !== sortiert(ba) || sortiert(ab) !== sortiert(doppelt)) abw++;
  }
  pruefe("zwei Geräte: vereinigt in jeder Reihenfolge, mit doppelten Ereignissen, derselbe Stand (" + faelle + " Fälle)", abw === 0, abw + " abweichend");
  const a = verlauf(zufallsquelle(5), 30, WOERTER, Date.UTC(2026, 4, 1), kennungen("c"), "g", false).ereignisse;
  const u = VERLAUF.vereinigen(a, a.slice(3, 9));
  pruefe("vereinigen: jede Kennung einmal, nach Zeit geordnet", u.length === a.length && u.every((e, i) => i === 0 || u[i - 1].zeit <= e.zeit), u.length + " / " + a.length);
}

/* 3. Andere Zeitzone rechnet dasselbe */
{
  const lauf = (tz, aufgabe, eingabe) => {
    const r = cp.spawnSync(process.execPath, [__filename], { env: Object.assign({}, process.env, { TZ: tz, VERLAUF_AUFGABE: aufgabe }), input: eingabe, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if(r.status !== 0) throw new Error(tz + ": " + r.stderr.slice(0, 300));
    return JSON.parse(r.stdout);
  };
  const ohneTermin = m => { const x = {}; Object.keys(m).forEach(w => { x[w] = Object.assign({}, m[w]); delete x[w].faellig; }); return sortiert(x); };
  try{
    const tokio = lauf("Asia/Tokyo", "aufzeichnen");
    const eingabe = JSON.stringify(tokio);
    for(const tz of ["Europe/Berlin", "America/New_York"]){
      const dort = lauf(tz, "nachrechnen", eingabe);
      const abw = tokio.filter((l, i) => ohneTermin(l.stand) !== ohneTermin(dort[i])).length;
      pruefe("in Tokio aufgezeichnet, in " + tz + " nachgerechnet: gleiche Gedächtniswerte und Abstände (" + tokio.length + " Verläufe)", abw === 0, abw + " abweichend");
    }
  }catch(e){ pruefe("Zeitzonen-Prüfung lief durch", false, e.message); }
}

/* 4. Übernahme */
{
  const id = kennungen("u"), t = Date.UTC(2026, 5, 1, 9);
  const stand = {}, ev = [];
  antworte(stand, ev, "8-1|あに", "gut", t, id, "g");
  antworte(stand, ev, "8-1|あに", "gut", t + 10 * MIN, id, "g");
  const fest = Object.assign({}, stand["8-1|あに"], { fehler: 7 });          // ein anderer, fester Stand
  ev.push(VERLAUF.uebernahme(id(), "8-1|あに", fest, t + 3 * TAG, PLAN.lerntag(t + 3 * TAG), "g", PLAN.VERSION));
  const erwartet = { "8-1|あに": fest };
  antworte(erwartet, [], "8-1|あに", "leicht", t + 4 * TAG, id, "g");
  ev.push(VERLAUF.antwort(id(), "8-1|あに", "leicht", t + 4 * TAG, PLAN.lerntag(t + 4 * TAG), "g", PLAN.VERSION));
  pruefe("Übernahme: Antworten davor zählen nicht, Antworten danach setzen auf", sortiert(VERLAUF.nachrechnen(ev)) === sortiert(erwartet));
  ev.push(VERLAUF.uebernahme(id(), "8-1|あに", null, t + 5 * TAG, PLAN.lerntag(t + 5 * TAG), "g", PLAN.VERSION));
  pruefe("Übernahme ohne Stand (zurückgesetzt): Wort ist wieder neu", VERLAUF.nachrechnen(ev)["8-1|あに"] === undefined);
}

/* 5. Widerruf */
{
  const id = kennungen("w"), t = Date.UTC(2026, 6, 1, 9), stand = {}, ev = [];
  antworte(stand, ev, "8-1|あね", "gut", t, id, "g");
  const davor = JSON.parse(JSON.stringify(stand));
  const r = antworte(stand, ev, "8-1|あね", "nochmal", t + 10 * MIN, id, "g");
  ev.push(VERLAUF.widerruf(id(), r.ereignis.id, "8-1|あね", t + 11 * MIN, PLAN.lerntag(t + 11 * MIN), "g", PLAN.VERSION));
  pruefe("Widerruf: Stand wie vor der widerrufenen Antwort", sortiert(VERLAUF.nachrechnen(ev)) === sortiert(davor));
  ev.push(VERLAUF.widerruf(id(), "unbekannt", "8-1|あね", t + 12 * MIN, PLAN.lerntag(t + 12 * MIN), "g", PLAN.VERSION));
  pruefe("Widerruf einer unbekannten Kennung ändert nichts", sortiert(VERLAUF.nachrechnen(ev)) === sortiert(davor));
}

/* 6. Umleitungen */
{
  const id = kennungen("m"), t = Date.UTC(2026, 7, 1, 9), stand = {}, ev = [];
  antworte(stand, ev, "8-1|alt", "gut", t, id, "g");
  const r = VERLAUF.nachrechnen(ev, { "8-1|alt": "8-1|あに" });
  pruefe("Umleitung: Ereignisse unter alter Kennung rechnen unter der neuen", !!r["8-1|あに"] && r["8-1|alt"] === undefined && sortiert(r["8-1|あに"]) === sortiert(stand["8-1|alt"]));
}

/* 7. Packen fürs Speichern */
{
  const v = verlauf(zufallsquelle(3), 80, WOERTER, Date.UTC(2026, 8, 1, 9), kennungen("p"), "geraet-p", true).ereignisse;
  v.push(VERLAUF.uebernahme("00000000-0000-4000-8000-0000000000aa", "8-1|あに", { stufe: 2, faellig: 5, fehler: 0, s: 3 }, Date.UTC(2026, 9, 1), 20727, "geraet-q", "anderer-plan"));
  const zurueck = VERLAUF.auspacken(JSON.parse(JSON.stringify(VERLAUF.packen(v))));
  pruefe("Packen und Auspacken verlieren nichts (" + v.length + " Ereignisse, zwei Geräte, zwei Pläne)", sortiert(zurueck) === sortiert(JSON.parse(JSON.stringify(v))));
  const kaputt = { geraete: ["g"], plaene: ["p"], liste: [["kein-uuid", "a", "w", 3, 5, 1, 0, 0], ["00000000-0000-4000-8000-000000000001", "x", "w", 3, 5, 1, 0, 0], ["00000000-0000-4000-8000-000000000002", "a", "w", 9, 5, 1, 0, 0], null, 7] };
  pruefe("Auspacken verwirft ungültige Einträge", VERLAUF.auspacken(kaputt).length === 0, JSON.stringify(VERLAUF.auspacken(kaputt)));
}

/* 8. Zusammenfassen */
{
  const z = zufallsquelle(31);
  let abw = [], faelle = 0;
  for(let l = 0; l < 150 && abw.length < 3; l++){
    const id = kennungen("z" + l);
    const v = verlauf(z, 50, WOERTER, Date.UTC(2026, 0, 1 + l, 7), id, "g", true).ereignisse;
    if(l % 3 === 0) v.push(VERLAUF.uebernahme(id(), WOERTER[l % WOERTER.length], null, v[20].zeit + 1, v[20].tag, "g", PLAN.VERSION));
    const grenze = v[Math.floor(v.length / 2)].zeit;
    const neu = VERLAUF.zusammenfassen(v, grenze, id, "g", PLAN.VERSION);
    faelle++;
    const vorher = sortiert(VERLAUF.nachrechnen(v)), nachher = sortiert(VERLAUF.nachrechnen(neu));
    const behalten = v.filter(e => e.zeit >= grenze).every(e => neu.some(n => n.id === e.id));
    if(vorher !== nachher || !behalten || neu.length >= v.length) abw.push("Lauf " + l + ": " + (vorher !== nachher ? "Stand weicht ab" : !behalten ? "spätere Ereignisse fehlen" : "nicht kleiner"));
  }
  pruefe("Zusammenfassen: gleicher Stand, spätere Ereignisse bleiben, weniger Ereignisse (" + faelle + " Fälle, mit Widerruf über die Grenze)", abw.length === 0, abw.join("; "));
}

/* 9. Tag der ersten Antwort */
{
  const id = kennungen("e"), t = Date.UTC(2026, 9, 5, 1), stand = {}, ev = [];
  antworte(stand, ev, "8-1|あに", "gut", t, id, "g");
  antworte(stand, ev, "8-1|あに", "gut", t + 2 * TAG, id, "g");
  pruefe("erst: Lerntag der ersten Antwort bleibt", stand["8-1|あに"].erst === PLAN.lerntag(t) && stand["8-1|あに"].tag === PLAN.lerntag(t + 2 * TAG),
    JSON.stringify(stand["8-1|あに"]));
  const alt = { stufe: 3, faellig: t, fehler: 0, ivl: 4, zuletzt: t - 4 * TAG };   // Stand aus der Zeit vor der Historie
  const r = PLAN.schritt(alt, "gut", t + TAG, PLAN.lerntag(t + TAG)).k;
  pruefe("erst: bei Wörtern aus der Zeit davor unbekannt (zählen nicht als neu)", r.erst === undefined && r.tag === PLAN.lerntag(t + TAG), JSON.stringify(r));
}

console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
process.exit(fehler ? 1 : 0);
