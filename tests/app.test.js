/* Tests der App im Browser (Audit C1, C2, C6, C7)

   Aufruf:  node tests/app.test.js [c1] [c2] [c6] [c7]     (ohne Angabe: alle)
   Braucht Node (ab Version 18) und Playwright mit Chromium:
     npm install --no-save playwright && npx playwright install chromium
   Der Test startet selbst einen kleinen Webserver für den Ordner des Repos.
   Jeder Abschnitt läuft in einem frischen, leeren Browserprofil; echte
   Lernstände werden nicht berührt. Fremde Adressen (Google Fonts) werden
   blockiert, der Service Worker ist abgeschaltet.

   C1  Wiederherstellen überschreibt nie ohne Prüfung und Bestätigung
   C2  Ein Rechenfehler bewertet kein Wort, das nicht angezeigt wurde
   C6  Unlesbare Speicherdaten werden gesichert und nicht überschrieben
   C7  Zwei offene Tabs verlieren keine Antworten                         */
"use strict";
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const WURZEL = path.join(__dirname, "..");
const TAG = 86400000;
const nur = process.argv.slice(2).map(a => a.toLowerCase());
const will = n => !nur.length || nur.includes(n);
let fehler = 0;
function pruefe(name, ok, detail){
  if(!ok) fehler++;
  console.log((ok ? "  ok     " : "  FEHLER ") + name + (detail !== undefined && !ok ? "  [" + detail + "]" : ""));
}

/* ---------- Webserver für den Repo-Ordner ---------- */
const TYPEN = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
function server(){
  return new Promise(fertig => {
    const s = http.createServer((anfrage, antwort) => {
      let p = decodeURIComponent(new URL(anfrage.url, "http://x").pathname);
      if(p.endsWith("/")) p += "index.html";
      const datei = path.normalize(path.join(WURZEL, p));
      if(!datei.startsWith(WURZEL + path.sep)){ antwort.writeHead(403); antwort.end(); return; }
      fs.readFile(datei, (e, inhalt) => {
        if(e){ antwort.writeHead(404); antwort.end(); return; }
        antwort.writeHead(200, { "Content-Type": TYPEN[path.extname(datei)] || "application/octet-stream" });
        antwort.end(inhalt);
      });
    });
    s.listen(0, "127.0.0.1", () => fertig(s));
  });
}

(async () => {
  const srv = await server();
  const BASIS = "http://127.0.0.1:" + srv.address().port + "/";
  const URL_APP = BASIS + "index.html";
  const browser = await chromium.launch();

  async function profil(){
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: "Europe/Berlin",
      serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"] });
    await ctx.route("**/*", r => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
    return ctx;
  }
  async function seite(ctx){
    const page = await ctx.newPage();
    page.setDefaultTimeout(3000);
    page.fehler = []; page.dialoge = [];
    page.antwort = "ablehnen";                       // was auf die nächste Rückfrage geantwortet wird
    page.on("pageerror", e => page.fehler.push(e.message));
    page.on("dialog", d => { page.dialoge.push(d.message()); (page.antwort === "ok" ? d.accept() : d.dismiss()).catch(() => {}); });
    await page.goto(URL_APP);
    return page;
  }
  /* Speicher setzen und neu laden. Werte als Text werden unverändert abgelegt. */
  async function setze(page, daten){
    await page.evaluate(d => { localStorage.clear(); Object.keys(d).forEach(k => localStorage.setItem(k, typeof d[k] === "string" ? d[k] : JSON.stringify(d[k]))); }, daten);
    await page.reload(); await page.waitForTimeout(250);
    page.fehler.length = 0; page.dialoge.length = 0;
  }
  const roh = (page, k) => page.evaluate(k => localStorage.getItem(k), k);
  const stand = async page => { const r = await roh(page, "kotoba-v2"); try{ return JSON.parse(r || "{}"); }catch(e){ return null; } };
  const gezeigt = page => page.evaluate(() => { const w = document.querySelector("#kartenbereich .seite.rueck .wort.jp"); return w ? w.textContent : null; });
  const meldung = page => page.evaluate(() => document.querySelector("#meldung").textContent);
  const woerter = (page, n) => page.evaluate(n => V.filter(v => v.ab === "8-1").slice(0, n).map(v => ({ id: v.id, kana: v.kana })), n);
  /* Ein gelernter Stand für die ersten n Wörter, gerechnet von der App selbst */
  const gelernt = (page, n, tageZurueck) => page.evaluate(([n, z]) => {
    const st = {}, t = Date.now() - z * 86400000;
    V.filter(v => v.ab === "8-1").slice(0, n).forEach(v => {
      let k = PLAN.schritt({ stufe: 0, faellig: 0, fehler: 0 }, "gut", t).k;
      st[v.id] = PLAN.schritt(k, "gut", t + 600000).k;
    });
    return st;
  }, [n, tageZurueck || 0]);
  /* Ein Abschnitt, der unerwartet abbricht, zählt als Fehler; die übrigen laufen weiter. */
  async function abschnitt(name, fn){
    try{ await fn(); }
    catch(e){ fehler++; console.log("  FEHLER Abschnitt " + name.toUpperCase() + " abgebrochen: " + e.message.split("\n")[0]); }
  }
  const EINST = { filter: { art: "ab", wert: "8-1" }, mischen: false, limit: 40, neuProTag: 5 };
  async function laden(page, text){
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    await page.fill("#exportFeld", text);
    await page.click("#knopfLaden"); await page.waitForTimeout(200);
    const m = await meldung(page);
    await page.click("#blattZu"); await page.waitForTimeout(100);
    return m;
  }

  /* ================================================================ C1 */
  if(will("c1")) await abschnitt("c1", async () => {
    console.log("\nC1 Wiederherstellen");
    const ctx = await profil(), page = await seite(ctx);
    const vorher = await gelernt(page, 6, 3);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": vorher });
    const unveraendert = async () => JSON.stringify(await stand(page)) === JSON.stringify(vorher);
    pruefe("Knopf zum Zurückholen ist anfangs verborgen", await page.evaluate(() => { const b = document.querySelector("#knopfZurueckholen"); return !!b && b.hidden; }));

    // Ursprüngliche Reproduktion: {} löscht alles
    for(const [name, text] of [["{} (leeres Objekt)", "{}"], ["fremdes JSON", '{"a":1,"b":{"x":2}}'],
                               ["unbekannte Kennungen", '{"9-9|ほげ":{"stufe":2,"faellig":1,"fehler":0}}'],
                               ["abgeschnittene Sicherung", JSON.stringify(vorher).slice(0, 200)], ["Liste []", "[]"], ["leeres Feld", ""]]){
      page.dialoge.length = 0;
      const m = await laden(page, text);
      pruefe("abgelehnt ohne Rückfrage: " + name + " (Meldung: " + m + ")", await unveraendert() && page.dialoge.length === 0 && m !== "Lernstand geladen", m);
    }
    page.dialoge.length = 0;
    let m = await laden(page, JSON.stringify(vorher));
    pruefe("gleicher Stand wie jetzt: nichts zu tun (Meldung: " + m + ")", await unveraendert() && page.dialoge.length === 0 && /bereits/.test(m), m);

    // kleinere, ältere Sicherung: 2 der 6 Wörter
    const ids = Object.keys(vorher);
    const sicherung = {}; ids.slice(0, 2).forEach(id => { sicherung[id] = Object.assign({}, vorher[id], { zuletzt: vorher[id].zuletzt - 2 * TAG }); });
    page.dialoge.length = 0; page.antwort = "ablehnen";
    m = await laden(page, JSON.stringify(sicherung));
    const frage = page.dialoge[0] || "";
    pruefe("kleinere Sicherung: Rückfrage erscheint", page.dialoge.length === 1, page.dialoge.length);
    pruefe("Rückfrage nennt jetzt 6, Sicherung 2, 4 fehlen, 2 jetzt neuer", /6 Wörter/.test(frage) && /2 Wörter/.test(frage) && /4 gelernte Wörter fehlen/.test(frage) && /2 Wörtern ist dein jetziger Stand neuer/.test(frage), frage.replace(/\n/g, " | "));
    pruefe("abgelehnt: Lernstand unverändert", await unveraendert());

    page.dialoge.length = 0; page.antwort = "ok";
    m = await laden(page, JSON.stringify(sicherung));
    const nachher = await stand(page);
    pruefe("bestätigt: Sicherung ist geladen (2 Wörter)", nachher && Object.keys(nachher).length === 2 && m === "Lernstand geladen", m);
    pruefe("bestätigt: alter Stand ist aufbewahrt", await page.evaluate(() => { try{ return Object.keys(JSON.parse(localStorage.getItem("kotoba-v2-vorher")).stand).length; }catch(e){ return -1; } }) === 6);
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    pruefe("Knopf \"Vorherigen Stand zurückholen\" ist sichtbar", await page.isVisible("#knopfZurueckholen"));
    page.dialoge.length = 0; page.antwort = "ablehnen";
    await page.click("#knopfZurueckholen"); await page.waitForTimeout(150);
    pruefe("Zurückholen fragt nach; abgelehnt bleibt die Sicherung", page.dialoge.length === 1 && Object.keys(await stand(page)).length === 2);
    page.dialoge.length = 0; page.antwort = "ok";
    await page.click("#knopfZurueckholen"); await page.waitForTimeout(150);
    pruefe("Zurückholen bestätigt: ursprünglicher Stand wieder da", await unveraendert(), Object.keys(await stand(page)).length);
    pruefe("und der ersetzte Stand ist seinerseits aufbewahrt (Tausch)", await page.evaluate(() => { try{ return Object.keys(JSON.parse(localStorage.getItem("kotoba-v2-vorher")).stand).length; }catch(e){ return -1; } }) === 2);
    await page.click("#blattZu");
    await page.reload(); await page.waitForTimeout(250);
    pruefe("nach Neustart: App zeigt den zurückgeholten Stand", (await page.locator("#zaehlerText").innerText()).length > 0 && await unveraendert());
    pruefe("C1 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();
  });

  /* ================================================================ C2 */
  if(will("c2")) await abschnitt("c2", async () => {
    console.log("\nC2 Rechenfehler");
    // a) ursprüngliche Reproduktion: letzte Antwort 2 Tage in der Zukunft
    let ctx = await profil(), page = await seite(ctx);
    let w = await woerter(page, 2), jetzt = Date.now();
    const st0 = {};
    st0[w[0].id] = { stufe: 2, faellig: jetzt - 3600000, fehler: 0, ivl: 2, s: 3.1, d: 5, st: 2, wdh: 2, zuletzt: jetzt + 2 * TAG };
    st0[w[1].id] = { stufe: 2, faellig: jetzt - 3600000, fehler: 0, ivl: 2, s: 3.1, d: 5, st: 2, wdh: 2, zuletzt: jetzt - 2 * TAG };
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": st0 });
    await page.click("#umdrehen"); await page.waitForTimeout(100);
    pruefe("Reproduktion: Karte " + w[0].kana + " zeigt nach dem Umdrehen vier Antwortknöpfe", await page.locator("#steuerung .tap").count() === 4);
    await page.keyboard.press("3"); await page.waitForTimeout(100);
    let st = await stand(page);
    pruefe("Reproduktion: Taste 3 bewertet das gezeigte Wort " + w[0].kana, st[w[0].id].wdh === 3 && st[w[0].id].zuletzt <= Date.now(), JSON.stringify(st[w[0].id]));
    pruefe("Reproduktion: das nicht gezeigte Wort " + w[1].kana + " bleibt unverändert", JSON.stringify(st[w[1].id]) === JSON.stringify(st0[w[1].id]));
    pruefe("Reproduktion ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // b) erzwungener Rechenfehler bei einem Wort
    ctx = await profil(); page = await seite(ctx);
    w = await woerter(page, 3); jetzt = Date.now();
    const st1 = {};
    w.forEach((x, i) => { st1[x.id] = { stufe: 2, faellig: jetzt - 3600000 + i, fehler: 0, ivl: 2, s: 3.1, d: 5, st: 2, wdh: 2, zuletzt: jetzt - 2 * TAG }; });
    st1[w[0].id].testFehler = 1;
    await ctx.addInitScript(() => {
      // Sobald plan.js da ist: Rechnung für das markierte Wort scheitern lassen
      let p; Object.defineProperty(window, "PLAN", { configurable: true, get(){ return p; }, set(v){
        p = v; const s = v.schritt, vs = v.vorschau;
        v.schritt  = function(k){ if(k && k.testFehler) throw new Error("Testfehler"); return s.apply(this, arguments); };
        v.vorschau = function(k){ if(k && k.testFehler) throw new Error("Testfehler"); return vs.apply(this, arguments); };
      } });
    });
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": st1 });
    pruefe("erzwungener Fehler: gezeigt wird " + w[0].kana, await gezeigt(page) === w[0].kana);
    await page.click("#umdrehen"); await page.waitForTimeout(100);
    pruefe("statt der Antwortknöpfe: Hinweis und \"Überspringen\"", await page.locator("#steuerung .tap").count() === 0 && await page.isVisible("#ueberspringen"));
    for(const taste of ["1", "2", "3", "4", "Space", "Enter"]){ await page.keyboard.press(taste); await page.waitForTimeout(40); }
    await page.click("#flip").catch(() => {});
    await page.dispatchEvent("#flip", "touchstart", { touches: [{ clientX: 300, clientY: 300 }] }).catch(() => {});
    await page.waitForTimeout(100);
    st = await stand(page);
    pruefe("Tasten 1-4, Leertaste, Enter, Tippen: kein Wort bewertet", JSON.stringify(st) === JSON.stringify(st1));
    pruefe("das Wort bleibt angezeigt", await gezeigt(page) === w[0].kana, await gezeigt(page));
    await page.click("#ueberspringen"); await page.waitForTimeout(100);
    st = await stand(page);
    pruefe("Überspringen: nächstes Wort " + w[1].kana + " erscheint, nichts bewertet", JSON.stringify(st) === JSON.stringify(st1) && await page.evaluate(() => !document.querySelector("#flip.um")) && (await page.locator("#umdrehen").count()) === 1);
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    st = await stand(page);
    pruefe("danach wird " + w[1].kana + " normal bewertet, " + w[0].kana + " bleibt unverändert", st[w[1].id].wdh === 3 && JSON.stringify(st[w[0].id]) === JSON.stringify(st1[w[0].id]));
    await ctx.close();
  });

  /* ================================================================ C6 */
  if(will("c6")) await abschnitt("c6", async () => {
    console.log("\nC6 Unlesbarer Speicher");
    let ctx = await profil(), page = await seite(ctx);
    const voll = JSON.stringify(await gelernt(page, 6, 3));
    const kaputt = voll.slice(0, 300);
    const kopien = (page, k) => page.evaluate(k => Object.keys(localStorage).filter(x => x.indexOf(k + "-unlesbar-") === 0).map(x => localStorage.getItem(x)), k);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": kaputt });
    let hinweis = await page.evaluate(() => { const r = document.querySelector("#rettung"); return r ? r.innerText : ""; });
    pruefe("Hinweis auf gesicherte Daten erscheint", /gesichert/.test(hinweis), hinweis);
    pruefe("kein irreführender Hinweis \"speichert gerade nichts\"", !(await page.evaluate(() => /speichert gerade nichts/.test(document.body.innerText))));
    let k = await kopien(page, "kotoba-v2");
    pruefe("Kopie des unlesbaren Texts liegt im Speicher, Zeichen für Zeichen gleich", k.length === 1 && k[0] === kaputt, k.length);
    // Ursprüngliche Reproduktion: eine Antwort überschreibt den alten Inhalt
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    k = await kopien(page, "kotoba-v2");
    const neu = await stand(page);
    pruefe("nach einer Antwort: alter Inhalt weiter vollständig gesichert", k.length === 1 && k[0] === kaputt);
    pruefe("nach einer Antwort: neue Antwort ist gespeichert", neu && Object.keys(neu).length === 1);
    await page.reload(); await page.waitForTimeout(200); await page.reload(); await page.waitForTimeout(200);
    pruefe("nach zwei Neustarts: keine doppelten Kopien, Hinweis bleibt", (await kopien(page, "kotoba-v2")).length === 1 && await page.isVisible("#rettung"));
    await page.click("#rettungKopieren"); await page.waitForTimeout(150);
    const ablage = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    pruefe("\"Gesicherten Text kopieren\" legt genau den alten Text in die Zwischenablage", ablage === kaputt, ablage.length + " Zeichen");
    page.antwort = "ablehnen"; await page.click("#rettungVerwerfen"); await page.waitForTimeout(100);
    pruefe("Verwerfen fragt nach; abgelehnt bleibt die Kopie", page.dialoge.length === 1 && (await kopien(page, "kotoba-v2")).length === 1);
    page.antwort = "ok"; await page.click("#rettungVerwerfen"); await page.waitForTimeout(100);
    pruefe("Verwerfen bestätigt: Kopie entfernt, Hinweis weg", (await kopien(page, "kotoba-v2")).length === 0 && !(await page.isVisible("#rettung").catch(() => false)));
    pruefe("C6 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // Kopie nicht möglich (Speicher voll): Original darf nicht überschrieben werden
    ctx = await profil(); page = await seite(ctx);
    await page.evaluate(([e, s]) => { localStorage.clear(); localStorage.setItem("kotoba-einst", JSON.stringify(e)); localStorage.setItem("kotoba-v2", s); }, [EINST, kaputt]);
    await ctx.addInitScript(() => { const s = Storage.prototype.setItem; Storage.prototype.setItem = function(k){ if(String(k).indexOf("-unlesbar-") >= 0) throw new DOMException("voll", "QuotaExceededError"); return s.apply(this, arguments); }; });
    await page.reload(); await page.waitForTimeout(250);
    hinweis = await page.evaluate(() => { const r = document.querySelector("#rettung"); return r ? r.innerText : ""; });
    pruefe("Kopie scheitert: Hinweis, dass nichts gespeichert wird", /nicht gesichert/.test(hinweis), hinweis);
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    pruefe("Kopie scheitert: nach einer Antwort ist der alte Inhalt unverändert", await roh(page, "kotoba-v2") === kaputt);
    await page.click("#rettungKopieren"); await page.waitForTimeout(150);
    pruefe("Kopie scheitert: alter Text lässt sich trotzdem kopieren", await page.evaluate(() => navigator.clipboard.readText().catch(() => "")) === kaputt);
    await ctx.close();

    // Einstellungen, Dojo und ein Wert, der kein Objekt ist
    ctx = await profil(); page = await seite(ctx);
    await setze(page, { "kotoba-einst": '{"filter":', "kotoba-dojo": '{"b":{"x', "kotoba-v2": "[1,2,3]" });
    const alle = await page.evaluate(() => Object.keys(localStorage).filter(x => /-unlesbar-/.test(x)).map(x => x.replace(/-unlesbar-.*/, "") + "=" + localStorage.getItem(x)).sort());
    pruefe("auch Einstellungen, Dojo und [1,2,3] werden gesichert", JSON.stringify(alle) === JSON.stringify(['kotoba-dojo={"b":{"x', 'kotoba-einst={"filter":', "kotoba-v2=[1,2,3]"]), JSON.stringify(alle));
    pruefe("App startet trotzdem normal", await page.locator("#umdrehen").count() === 1 && page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();
  });

  /* ================================================================ C7 */
  if(will("c7")) await abschnitt("c7", async () => {
    console.log("\nC7 Zwei Tabs");
    // Ursprüngliche Reproduktion: A bewertet 2 Wörter, dann B 1 Wort. Tab B übt
    // einen anderen Abschnitt, damit es wirklich drei verschiedene Wörter sind.
    let ctx = await profil(), a = await seite(ctx);
    await setze(a, { "kotoba-einst": EINST });
    await a.evaluate(e => localStorage.setItem("kotoba-einst", JSON.stringify(Object.assign({}, e, { filter: { art: "ab", wert: "8-2" } }))), EINST);
    let b = await seite(ctx); await b.waitForTimeout(250);
    const kopfB = await b.locator("#zaehlerText").innerText();
    const gezeigtA = [];
    for(let i = 0; i < 2; i++){ await a.click("#umdrehen"); gezeigtA.push(await gezeigt(a)); await a.click(".tap.leicht"); }
    await a.waitForTimeout(150);
    const kopfB2 = await b.locator("#zaehlerText").innerText();
    pruefe("Tab B zeigt die Antworten aus Tab A an (" + kopfB + " -> " + kopfB2 + ")", kopfB === "keine fällig · 5 neu" && kopfB2 === "keine fällig · 3 neu", kopfB + " / " + kopfB2);
    await b.click("#umdrehen"); const gezeigtB = await gezeigt(b); await b.click(".tap.leicht"); await b.waitForTimeout(150);
    let st = await stand(a);
    pruefe("A 2 Wörter (" + gezeigtA.join(", ") + "), B 1 Wort (" + gezeigtB + "): alle 3 gespeichert", Object.keys(st).length === 3 && Object.values(st).every(k => k.wdh === 1 && k.st === 2), Object.keys(st).length);
    let einst = JSON.parse(await roh(a, "kotoba-einst"));
    pruefe("Tageszähler neue Wörter = 3", einst.neuHeute && einst.neuHeute.n === 3, JSON.stringify(einst.neuHeute));
    for(let i = 0; i < 2; i++){ await b.click("#umdrehen"); await b.click(".tap.leicht"); }
    await b.waitForTimeout(150);
    st = await stand(a); einst = JSON.parse(await roh(a, "kotoba-einst"));
    pruefe("danach B noch 2: 5 Wörter gespeichert, Tageszähler 5", Object.keys(st).length === 5 && einst.neuHeute.n === 5, Object.keys(st).length + " / " + JSON.stringify(einst.neuHeute));
    pruefe("C7 ohne Fehler der Seiten", a.fehler.length + b.fehler.length === 0, a.fehler.concat(b.fehler).join(" | "));
    await ctx.close();

    // Ohne Begrenzung für neue Wörter ("alle"): Der Tageszähler ist dann vorher
    // nie angelegt worden. Antworten müssen trotzdem gespeichert und gezählt werden.
    ctx = await profil(); a = await seite(ctx);
    await setze(a, { "kotoba-einst": Object.assign({}, EINST, { neuProTag: 0 }) });
    for(let i = 0; i < 3; i++){ await a.keyboard.press("Space"); await a.keyboard.press("4"); }
    await a.waitForTimeout(150);
    st = await stand(a); einst = JSON.parse(await roh(a, "kotoba-einst"));
    pruefe("ohne Begrenzung (alle): 3 Antworten gespeichert, Tageszähler 3", Object.keys(st).length === 3 && einst.neuHeute && einst.neuHeute.n === 3, Object.keys(st).length + " / " + JSON.stringify(einst.neuHeute));
    pruefe("ohne Begrenzung: keine Fehler der Seite", a.fehler.length === 0, a.fehler.join(" | "));
    await ctx.close();

    // Dasselbe Wort, in A schon fertig (leicht -> Wiederholung in Tagen), in B noch offen
    ctx = await profil(); a = await seite(ctx);
    await setze(a, { "kotoba-einst": EINST });
    b = await seite(ctx); await b.waitForTimeout(250);
    await a.click("#umdrehen"); await b.click("#umdrehen");
    const x = await gezeigt(a), xb = await gezeigt(b);
    await a.click(".tap.leicht"); await a.waitForTimeout(150);
    const nachA = await stand(a);
    const knopfB = await b.evaluate(() => document.querySelector("#steuerung .tap.leicht .klein").textContent);
    pruefe("Tab B: Knopf \"leicht\" zeigt nach der Antwort in A \"unverändert\"", knopfB === "unverändert", knopfB);
    await b.click(".tap.leicht"); await b.waitForTimeout(150);
    st = await stand(a); einst = JSON.parse(await roh(a, "kotoba-einst"));
    pruefe("dasselbe Wort " + x + ", in A schon fertig: Antwort in B ändert den Plan nicht", x === xb && JSON.stringify(st) === JSON.stringify(nachA), JSON.stringify(st));
    pruefe("und zählt nicht doppelt als neues Wort", einst.neuHeute && einst.neuHeute.n === 1, JSON.stringify(einst.neuHeute));
    await ctx.close();

    // Dasselbe Wort, in A erst im Lernschritt: beide Antworten zählen nacheinander
    ctx = await profil(); a = await seite(ctx);
    await setze(a, { "kotoba-einst": EINST });
    b = await seite(ctx); await b.waitForTimeout(250);
    const wa = await (async () => { await a.click("#umdrehen"); return gezeigt(a); })();
    const wb = await (async () => { await b.click("#umdrehen"); return gezeigt(b); })();
    await a.click(".tap.gut"); await a.waitForTimeout(100);
    await b.click(".tap.leicht"); await b.waitForTimeout(100);
    st = await stand(a); einst = JSON.parse(await roh(a, "kotoba-einst"));
    const k = Object.values(st)[0] || {};
    pruefe("dasselbe Wort " + wa + " in A (sitzt) und B (leicht): beide Antworten nacheinander gerechnet", wa === wb && Object.keys(st).length === 1 && k.wdh === 2, JSON.stringify(k));
    pruefe("dasselbe Wort: zählt einmal als neues Wort", einst.neuHeute && einst.neuHeute.n === 1, JSON.stringify(einst.neuHeute));
    await ctx.close();
  });

  /* ================================================================ C4 */
  if(will("c4")) await abschnitt("c4", async () => {
    console.log("\nC4 Veraltete gespeicherte Auswahl");
    const ctx = await profil(), page = await seite(ctx);
    const lage = () => page.evaluate(() => ({
      gestartet: !/konnte nicht starten/.test(document.body.innerText),
      auswahl: document.querySelector("#filterName").textContent,
      karte: !!document.querySelector("#umdrehen") }));
    for(const [name, filter] of [["Abschnitt 99-9", { art: "ab", wert: "99-9" }], ["Topic 99", { art: "topic", wert: 99 }],
                                 ["Stufe 3", { art: "stufe", wert: 3 }], ["unbekannte Art", { art: "xyz", wert: 1 }],
                                 ["Text statt Objekt", "ab"], ["null", null]]){
      await setze(page, { "kotoba-einst": { filter: filter } });
      const l = await lage();
      pruefe("Filter " + name + ": App startet mit \"Alle Wörter\"", l.gestartet && l.auswahl === "Alle Wörter" && l.karte && page.fehler.length === 0,
        JSON.stringify(l) + " " + page.fehler.join(" | "));
    }
    await setze(page, { "kotoba-einst": { filter: { art: "ab", wert: "8-2" } } });
    let l = await lage();
    pruefe("gültiger Filter bleibt erhalten (" + l.auswahl + ")", l.gestartet && /^N5 2/.test(l.auswahl), l.auswahl);

    // Dojo: ungültige gespeicherte Auswahl, dann jede Kachel öffnen
    await setze(page, { "kotoba-einst": EINST, "kotoba-dojo": { wahl: { satz: "g:gibtsnicht", richtung: "xy", zart: "xyz", schrift: "abc", kreis: { 5: "zzz", 4: 7 } } } });
    await page.click('.leiste button[data-ziel="dojo"]'); await page.waitForTimeout(150);
    const offen = [];
    for(const [ziel, st] of [["bild"], ["paare"], ["zahl"], ["buch"], ["jlpt", 5], ["jlpt", 4], ["texte"]]){
      const sel = '#dojoInhalt .dkachel[data-ziel="' + ziel + '"]' + (st ? '[data-stufe="' + st + '"]' : "");
      if(!(await page.locator(sel).count())){ await page.click('.leiste button[data-ziel="dojo"]'); await page.waitForTimeout(100); }
      await page.click(sel); await page.waitForTimeout(150);
      const inhalt = await page.evaluate(() => document.querySelector("#dojoInhalt").innerText.trim().length);
      offen.push(ziel + (st || "") + (inhalt ? "" : " (leer)"));
      const z = page.locator("#dojoInhalt .dzurueck").first();
      if(await z.count()) await z.click(); else await page.click('.leiste button[data-ziel="dojo"]');
      await page.waitForTimeout(100);
    }
    pruefe("Dojo mit ungültiger Auswahl: alle 7 Kacheln öffnen ohne Fehler (" + offen.join(", ") + ")",
      page.fehler.length === 0 && !offen.some(o => /leer/.test(o)), page.fehler.join(" | "));
    const wahl = await page.evaluate(() => JSON.parse(localStorage.getItem("kotoba-dojo") || "{}").wahl || null);
    pruefe("Dojo nutzt die Vorgaben statt der ungültigen Werte", !wahl || (wahl.zart === "mix" && wahl.richtung === "bw" && wahl.schrift === "furi"), JSON.stringify(wahl));
    await ctx.close();
  });

  /* ================================================================ C5 */
  if(will("c5")) await abschnitt("c5", async () => {
    console.log("\nC5 Speichern scheitert mitten in der Sitzung");
    const ctx = await profil(), page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST });
    await page.evaluate(() => {
      const s = Storage.prototype.setItem; window.__sperre = true;
      Storage.prototype.setItem = function(){ if(window.__sperre) throw new DOMException("voll", "QuotaExceededError"); return s.apply(this, arguments); };
    });
    const warnung = () => page.evaluate(() => { const w = document.querySelector("#speicherWarnung"); return w && w.offsetParent ? w.innerText : ""; });
    await page.click("#umdrehen"); await page.click(".tap.leicht"); await page.waitForTimeout(80);
    pruefe("nach der ersten gescheiterten Antwort: Warnung sofort sichtbar", /Speichern geht gerade nicht/.test(await warnung()), await warnung());
    for(let i = 0; i < 2; i++){ await page.click("#umdrehen"); await page.click(".tap.leicht"); }
    await page.waitForTimeout(80);
    pruefe("gespeichert ist tatsächlich nichts", Object.keys(await stand(page)).length === 0);
    await page.click("#speicherWarnungKopieren"); await page.waitForTimeout(150);
    let kopie = {}; try{ kopie = JSON.parse(await page.evaluate(() => navigator.clipboard.readText())); }catch(e){ /* bleibt leer */ }
    pruefe("\"Lernstand kopieren\" enthält alle 3 Antworten", Object.keys(kopie).length === 3, Object.keys(kopie).length);
    await page.evaluate(() => { window.__sperre = false; });
    await page.click("#umdrehen"); await page.click(".tap.leicht"); await page.waitForTimeout(100);
    pruefe("Speichern geht wieder: alle 4 Antworten gespeichert", Object.keys(await stand(page)).length === 4, Object.keys(await stand(page)).length);
    pruefe("und die Warnung ist verschwunden", (await warnung()) === "");
    pruefe("C5 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();
  });

  await browser.close(); srv.close();
  console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.log("TESTABBRUCH: " + e.message); process.exit(2); });
