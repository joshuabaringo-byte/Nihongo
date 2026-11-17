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
    let ctx = await profil(), a = await seite(ctx);
    await setze(a, { "kotoba-einst": EINST });
    let b = await seite(ctx); await b.waitForTimeout(250);
    const kopfB = await b.locator("#zaehlerText").innerText();
    // Ursprüngliche Reproduktion: A bewertet 2 Wörter, dann B 1 Wort
    for(let i = 0; i < 2; i++){ await a.click("#umdrehen"); await a.click(".tap.leicht"); }
    await a.waitForTimeout(150);
    const kopfB2 = await b.locator("#zaehlerText").innerText();
    pruefe("Tab B zeigt die Antworten aus Tab A an (" + kopfB + " -> " + kopfB2 + ")", kopfB === "keine fällig · 5 neu" && kopfB2 === "keine fällig · 3 neu", kopfB + " / " + kopfB2);
    await b.click("#umdrehen"); await b.click(".tap.leicht"); await b.waitForTimeout(150);
    let st = await stand(a);
    pruefe("A 2 Wörter, B 1 Wort: alle 3 Antworten gespeichert", Object.keys(st).length === 3, Object.keys(st).length);
    let einst = JSON.parse(await roh(a, "kotoba-einst"));
    pruefe("Tageszähler neue Wörter = 3", einst.neuHeute && einst.neuHeute.n === 3, JSON.stringify(einst.neuHeute));
    // B weiter: noch 2 Wörter aus seiner Schlange
    for(let i = 0; i < 2; i++){ await b.click("#umdrehen"); await b.click(".tap.leicht"); }
    await b.waitForTimeout(150);
    st = await stand(a); einst = JSON.parse(await roh(a, "kotoba-einst"));
    pruefe("danach B noch 2: 5 Wörter gespeichert, Tageszähler 5", Object.keys(st).length === 5 && einst.neuHeute.n === 5, Object.keys(st).length + " / " + JSON.stringify(einst.neuHeute));
    pruefe("C7 ohne Fehler der Seiten", a.fehler.length + b.fehler.length === 0, a.fehler.concat(b.fehler).join(" | "));
    await ctx.close();

    // dasselbe Wort in beiden Tabs
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

  await browser.close(); srv.close();
  console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.log("TESTABBRUCH: " + e.message); process.exit(2); });
