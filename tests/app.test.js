/* Tests der App im Browser

   Aufruf:  node tests/app.test.js [c1] [c2] [c4] [c5] [c6] [c7] [p2] [p3a] [p3b] [konto]   (ohne Angabe: alle)
   Braucht Node (ab Version 18) und Playwright mit Chromium:
     npm install --no-save playwright && npx playwright install chromium
   Der Test startet selbst einen kleinen Webserver für den Ordner des Repos.
   Jeder Abschnitt läuft in einem frischen, leeren Browserprofil; echte
   Lernstände werden nicht berührt. Fremde Adressen (Google Fonts) werden
   blockiert, der Service Worker ist abgeschaltet. Der Browser läuft in
   japanischer Zeit; eine andere Zeitzone mit TEST_ZEITZONE=Europe/Berlin.

   C1  Wiederherstellen überschreibt nie ohne Prüfung und Bestätigung
   C2  Ein Rechenfehler bewertet kein Wort, das nicht angezeigt wurde
   C6  Unlesbare Speicherdaten werden gesichert und nicht überschrieben
   C7  Zwei offene Tabs verlieren keine Antworten
   KONTO  Anmeldung, Profile, Supabase-Bibliothek nur bei Bedarf. Der Teil
          gegen ein lokales Supabase läuft nur mit SUPABASE_URL,
          SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY und
          SUPABASE_MAILPIT_URL (auf GitHub im Job "supabase").             */
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
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: process.env.TEST_ZEITZONE || "Asia/Tokyo",
      serviceWorkers: "block", permissions: ["clipboard-read", "clipboard-write"] });
    await ctx.route("**/*", r => r.request().url().startsWith(BASIS) ? r.continue() : r.abort());
    return ctx;
  }
  async function seite(ctx, zeit){
    const page = await ctx.newPage();
    if(zeit) await page.clock.setFixedTime(new Date(zeit));     // feste Uhrzeit, gilt auch nach Neuladen
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
  /* Neue Wörter heute: Einträge im Lernstand, deren erste Antwort auf den heutigen Lerntag fällt */
  const neuHeute = (page, k) => page.evaluate(k => {
    const h = PLAN.lerntag(Date.now()), st = JSON.parse(localStorage.getItem(k || "kotoba-v2") || "{}");
    return Object.keys(st).filter(id => st[id].erst === h).length;
  }, k);
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
    let n = await neuHeute(a);
    pruefe("Tageszähler neue Wörter = 3", n === 3, n);
    for(let i = 0; i < 2; i++){ await b.click("#umdrehen"); await b.click(".tap.leicht"); }
    await b.waitForTimeout(150);
    st = await stand(a); n = await neuHeute(a);
    pruefe("danach B noch 2: 5 Wörter gespeichert, Tageszähler 5", Object.keys(st).length === 5 && n === 5, Object.keys(st).length + " / " + n);
    pruefe("C7 ohne Fehler der Seiten", a.fehler.length + b.fehler.length === 0, a.fehler.concat(b.fehler).join(" | "));
    await ctx.close();

    // Ohne Begrenzung für neue Wörter ("alle"): Der Tageszähler ist dann vorher
    // nie angelegt worden. Antworten müssen trotzdem gespeichert und gezählt werden.
    ctx = await profil(); a = await seite(ctx);
    await setze(a, { "kotoba-einst": Object.assign({}, EINST, { neuProTag: 0 }) });
    for(let i = 0; i < 3; i++){ await a.keyboard.press("Space"); await a.keyboard.press("4"); }
    await a.waitForTimeout(150);
    st = await stand(a); n = await neuHeute(a);
    pruefe("ohne Begrenzung (alle): 3 Antworten gespeichert, Tageszähler 3", Object.keys(st).length === 3 && n === 3, Object.keys(st).length + " / " + n);
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
    st = await stand(a); n = await neuHeute(a);
    pruefe("dasselbe Wort " + x + ", in A schon fertig: Antwort in B ändert den Plan nicht", x === xb && JSON.stringify(st) === JSON.stringify(nachA), JSON.stringify(st));
    pruefe("und zählt nicht doppelt als neues Wort", n === 1, n);
    await ctx.close();

    // Dasselbe Wort, in A erst im Lernschritt: beide Antworten zählen nacheinander
    ctx = await profil(); a = await seite(ctx);
    await setze(a, { "kotoba-einst": EINST });
    b = await seite(ctx); await b.waitForTimeout(250);
    const wa = await (async () => { await a.click("#umdrehen"); return gezeigt(a); })();
    const wb = await (async () => { await b.click("#umdrehen"); return gezeigt(b); })();
    await a.click(".tap.gut"); await a.waitForTimeout(100);
    await b.click(".tap.leicht"); await b.waitForTimeout(100);
    st = await stand(a); n = await neuHeute(a);
    const k = Object.values(st)[0] || {};
    pruefe("dasselbe Wort " + wa + " in A (sitzt) und B (leicht): beide Antworten nacheinander gerechnet", wa === wb && Object.keys(st).length === 1 && k.wdh === 2, JSON.stringify(k));
    pruefe("dasselbe Wort: zählt einmal als neues Wort", n === 1, n);
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

  /* ================================================================ P2 */
  if(will("p2")) await abschnitt("p2", async () => {
    console.log("\nP2 Sicherung als Datei, vollständige Sicherung, Erinnerung");
    /* n gelernte Wörter der Gruppe N5, zuletzt vor alterTage Tagen beantwortet */
    const viele = (page, n, alterTage) => page.evaluate(([n, z]) => {
      const st = {}, t = Date.now() - z * 86400000;
      V.filter(v => v.t === 8).slice(0, n).forEach(v => {
        const k = PLAN.schritt({ stufe: 0, faellig: 0, fehler: 0 }, "gut", t).k;
        st[v.id] = PLAN.schritt(k, "gut", t + 600000).k;
      });
      return st;
    }, [n, alterTage]);
    const einstLesen = page => page.evaluate(() => JSON.parse(localStorage.getItem("kotoba-einst") || "{}"));
    const dojoLesen  = page => page.evaluate(() => JSON.parse(localStorage.getItem("kotoba-dojo") || "null") || {});
    const sichtbar   = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!(e && e.offsetParent); }, sel);
    const text       = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent : ""; }, sel);
    const ohneTeilen = () => { delete Navigator.prototype.share; delete Navigator.prototype.canShare; };
    const neuLaden   = async (page, fn) => { const nav = page.waitForNavigation({ timeout: 5000 }).catch(() => null); await fn(); await nav; await page.waitForTimeout(250); };
    const dateiWaehlen = async (page, name, inhalt) => {
      await page.evaluate(() => { document.querySelector("#dateiFeld").value = ""; });
      await page.setInputFiles("#dateiFeld", { name: name, mimeType: "application/json", buffer: Buffer.from(inhalt) });
    };
    const E20 = Object.assign({}, EINST, { neuProTag: 20 });

    // 1. Als Datei sichern: Download, wo Teilen fehlt
    let ctx = await profil(); await ctx.addInitScript(ohneTeilen);
    let page = await seite(ctx);
    const st12 = await viele(page, 12, 2);
    await setze(page, { "kotoba-einst": E20, "kotoba-v2": st12, "kotoba-dojo": { blumen: 7 } });
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    pruefe("\"Als Datei sichern\" ist der grüne Hauptknopf", await page.evaluate(() => document.querySelector("#knopfDatei").classList.contains("voll")));
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#knopfDatei")]);
    const name = dl.suggestedFilename();
    let inhalt = {}; try{ inhalt = JSON.parse(fs.readFileSync(await dl.path(), "utf8")); }catch(e){ /* bleibt leer */ }
    pruefe("Datei " + name + ": Name mit Datum", /^kotoba-sicherung-\d{4}-\d{2}-\d{2}\.json$/.test(name), name);
    pruefe("Datei enthält Lernstand (12 Wörter), Einstellungen und Dojo", inhalt.app === "kotoba" && inhalt.format === 3
      && JSON.stringify(inhalt.stand) === JSON.stringify(st12) && inhalt.einst && inhalt.einst.neuProTag === 20 && inhalt.dojo && inhalt.dojo.blumen === 7,
      JSON.stringify(Object.keys(inhalt)));
    let e = await einstLesen(page);
    pruefe("Sicherung ist vermerkt", e.sicherung && Math.abs(e.sicherung.zuletzt - Date.now()) < 60000, JSON.stringify(e.sicherung));
    pruefe("Einstellungen zeigen \"Zuletzt gesichert\" mit Datum", /Zuletzt gesichert: \d{1,2}\.\d{1,2}\.\d{4}/.test(await text(page, "#sicherungZeile")), await text(page, "#sicherungZeile"));
    await ctx.close();

    // 2. Teilen-Menü (iPhone): geteilt zählt, abgebrochen nicht
    ctx = await profil();
    await ctx.addInitScript(() => {
      Navigator.prototype.canShare = function(){ return true; };
      Navigator.prototype.share = function(d){ window.__geteilt = d; return window.__abbruch ? Promise.reject(new DOMException("abgebrochen", "AbortError")) : Promise.resolve(); };
    });
    page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": st12, "kotoba-dojo": { blumen: 7 } });
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    await page.evaluate(() => { window.__abbruch = true; });
    await page.click("#knopfDatei"); await page.waitForTimeout(150);
    e = await einstLesen(page);
    pruefe("Teilen abgebrochen: zählt nicht als Sicherung", !(e.sicherung && e.sicherung.zuletzt), JSON.stringify(e.sicherung));
    await page.evaluate(() => { window.__abbruch = false; window.__geteilt = null; });
    await page.click("#knopfDatei"); await page.waitForTimeout(150);
    const geteilt = await page.evaluate(async () => {
      const f = window.__geteilt && window.__geteilt.files && window.__geteilt.files[0];
      return f ? { name: f.name, text: await f.text() } : null;
    });
    let g = {}; try{ g = JSON.parse(geteilt.text); }catch(err){ /* bleibt leer */ }
    e = await einstLesen(page);
    pruefe("Teilen: Datei mit vollständiger Sicherung, zählt als Sicherung", g.app === "kotoba" && Object.keys(g.stand || {}).length === 12 && g.dojo && g.dojo.blumen === 7
      && e.sicherung && e.sicherung.zuletzt > 0, geteilt && geteilt.name);
    await ctx.close();

    // 3. Aus Datei laden: vollständige Sicherung, Rückfrage, Neustart, Zurückholen
    ctx = await profil(); page = await seite(ctx);
    const st3 = await viele(page, 3, 5);
    const sicherung = JSON.stringify({ app: "kotoba", format: 2, erstellt: Date.now() - 5 * TAG, stand: st3,
      einst: Object.assign({}, EINST, { neuProTag: 30, thema: "dunkel" }), dojo: { blumen: 42 } });
    await setze(page, { "kotoba-einst": E20, "kotoba-v2": st12, "kotoba-dojo": { blumen: 7 } });
    page.dialoge.length = 0; page.antwort = "ablehnen";
    await dateiWaehlen(page, "kotoba-sicherung.json", sicherung); await page.waitForTimeout(300);
    const frage = page.dialoge[0] || "";
    pruefe("Rückfrage nennt 12 jetzt, 3 in der Sicherung, Einstellungen und Dojo", /12 Wörter/.test(frage) && /3 Wörter/.test(frage) && /Einstellungen/.test(frage) && /Dojo/.test(frage), frage.replace(/\n/g, " | "));
    pruefe("abgelehnt: nichts geändert", Object.keys(await stand(page)).length === 12 && (await einstLesen(page)).neuProTag === 20 && (await dojoLesen(page)).blumen === 7);
    page.dialoge.length = 0; page.antwort = "ok";
    await neuLaden(page, () => dateiWaehlen(page, "kotoba-sicherung.json", sicherung));
    e = await einstLesen(page);
    pruefe("bestätigt: nach dem Neustart Lernstand (3), Einstellungen (30, dunkel) und Dojo (42) aus der Sicherung",
      Object.keys(await stand(page)).length === 3 && e.neuProTag === 30 && e.thema === "dunkel" && (await dojoLesen(page)).blumen === 42,
      Object.keys(await stand(page)).length + " / " + e.neuProTag + " / " + e.thema + " / " + (await dojoLesen(page)).blumen);
    pruefe("nach dem Neustart: Meldung \"Sicherung geladen\", Knopf zeigt 30", (await text(page, "#meldung")) === "Sicherung geladen" && (await text(page, "#neuKnopf")) === "30",
      (await text(page, "#meldung")) + " / " + (await text(page, "#neuKnopf")));
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    pruefe("\"Vorherigen Stand zurückholen\" ist sichtbar", await page.isVisible("#knopfZurueckholen"));
    page.dialoge.length = 0; page.antwort = "ok";
    await neuLaden(page, () => page.click("#knopfZurueckholen"));
    e = await einstLesen(page);
    pruefe("Zurückholen: Lernstand (12), Einstellungen (20) und Dojo (7) wieder da",
      Object.keys(await stand(page)).length === 12 && e.neuProTag === 20 && (await dojoLesen(page)).blumen === 7,
      Object.keys(await stand(page)).length + " / " + e.neuProTag + " / " + (await dojoLesen(page)).blumen);

    // 4. alte Sicherung (nur Lernstand) und ungültige Dateien
    const alt2 = {}; Object.keys(st12).slice(0, 2).forEach(id => { alt2[id] = st12[id]; });
    page.dialoge.length = 0; page.antwort = "ok";
    await dateiWaehlen(page, "alt.json", JSON.stringify(alt2)); await page.waitForTimeout(300);
    e = await einstLesen(page);
    pruefe("alte Sicherung (nur Lernstand): Rückfrage ohne Einstellungen, nur der Lernstand ersetzt",
      page.dialoge.length === 1 && !/Einstellungen/.test(page.dialoge[0]) && Object.keys(await stand(page)).length === 2
      && e.neuProTag === 20 && (await dojoLesen(page)).blumen === 7 && (await text(page, "#meldung")) === "Lernstand geladen",
      (page.dialoge[0] || "").replace(/\n/g, " | ") + " / " + (await text(page, "#meldung")));
    for(const [art, datei, muster] of [["kein JSON", "hallo", /nicht lesbar/], ["fremdes JSON", '{"a":1}', /kein Lernstand/]]){
      page.dialoge.length = 0;
      await dateiWaehlen(page, "x.json", datei); await page.waitForTimeout(250);
      const m = await text(page, "#meldung");
      pruefe("ungültige Datei (" + art + "): abgelehnt ohne Rückfrage (" + m + ")", page.dialoge.length === 0 && muster.test(m) && Object.keys(await stand(page)).length === 2, m);
    }
    pruefe("P2 Teil 1-4 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // 5. Text: kopierter Text ist vollständig und stellt alles wieder her
    ctx = await profil(); page = await seite(ctx);
    await setze(page, { "kotoba-einst": E20, "kotoba-v2": st12, "kotoba-dojo": { blumen: 7 } });
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    pruefe("\"Stand kopieren\" ist jetzt ein normaler Knopf", await page.evaluate(() => !document.querySelector("#knopfKopieren").classList.contains("voll")));
    await page.click("#knopfKopieren"); await page.waitForTimeout(150);
    const kopiert = await page.evaluate(() => navigator.clipboard.readText().catch(() => ""));
    let t = {}; try{ t = JSON.parse(kopiert); }catch(err){ /* bleibt leer */ }
    pruefe("kopierter Text enthält Lernstand, Einstellungen und Dojo", t.app === "kotoba" && Object.keys(t.stand || {}).length === 12 && t.einst && t.einst.neuProTag === 20 && t.dojo && t.dojo.blumen === 7);
    pruefe("Kopieren zählt als Sicherung", ((await einstLesen(page)).sicherung || {}).zuletzt > 0);
    await page.evaluate(() => { localStorage.setItem("kotoba-dojo", JSON.stringify({ blumen: 99 })); });
    await page.reload(); await page.waitForTimeout(250);
    page.dialoge.length = 0; page.antwort = "ok";
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    await page.fill("#exportFeld", kopiert);
    await neuLaden(page, () => page.click("#knopfLaden"));
    pruefe("Text laden stellt auch das Dojo wieder her (99 -> 7)", page.dialoge.length === 1 && (await dojoLesen(page)).blumen === 7, (await dojoLesen(page)).blumen);
    await ctx.close();

    // 6. Zurücksetzen lässt sich rückgängig machen
    ctx = await profil(); page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": st12 });
    page.antwort = "ok"; page.dialoge.length = 0;
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    await page.click("#knopfReset"); await page.waitForTimeout(150);
    pruefe("Zurücksetzen: Rückfrage sagt, dass es sich zurückholen lässt; Lernstand leer", /zurückholen/i.test(page.dialoge[0] || "") && Object.keys(await stand(page)).length === 0, page.dialoge[0]);
    await page.click("#knopfZurueckholen"); await page.waitForTimeout(300);
    pruefe("Zurückholen nach dem Zurücksetzen: 12 Wörter wieder da", Object.keys(await stand(page)).length === 12, Object.keys(await stand(page)).length);
    pruefe("Teil 5-6 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // 7. Erinnerung, mit fester Uhrzeit
    const T0 = new Date("2026-11-17T10:00:00+01:00").getTime();
    const EIN = { mischen: false, limit: 40, neuProTag: 5 };
    const uhr = async (page, zeit) => { await page.clock.setFixedTime(new Date(zeit)); await page.reload(); await page.waitForTimeout(250); };
    const erinnerung = page => page.evaluate(() => { const e = document.querySelector("#erinnerung"); return e && e.offsetParent ? e.textContent : ""; });
    ctx = await profil(); await ctx.addInitScript(ohneTeilen);
    page = await seite(ctx, T0);
    const st9 = await viele(page, 9, 1), st12b = await viele(page, 12, 1);
    await setze(page, { "kotoba-einst": EIN, "kotoba-v2": st9 });
    pruefe("9 Wörter: keine Erinnerung", !(await erinnerung(page)));
    await setze(page, { "kotoba-einst": EIN, "kotoba-v2": st12b });
    let er = await erinnerung(page);
    pruefe("12 Wörter, noch nie gesichert: Erinnerung erscheint", /Noch nie gesichert/.test(er), er);
    await page.click("#erinnerungSpaeter"); await page.waitForTimeout(100);
    pruefe("\"Später\": Erinnerung ist weg", !(await erinnerung(page)));
    await uhr(page, T0 + 2 * TAG);
    pruefe("2 Tage danach: weiter ausgeblendet", !(await erinnerung(page)));
    await uhr(page, T0 + 4 * TAG);
    pruefe("4 Tage danach: Erinnerung wieder da", !!(await erinnerung(page)));
    await Promise.all([page.waitForEvent("download"), page.click("#erinnerungSichern")]);
    await page.waitForTimeout(100);
    pruefe("\"Jetzt sichern\": Datei kommt, Erinnerung ist weg", !(await erinnerung(page)));
    await uhr(page, T0 + 12 * TAG);
    pruefe("8 Tage nach der Sicherung, aber ohne neue Antworten: keine Erinnerung", !(await erinnerung(page)));
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    await page.reload(); await page.waitForTimeout(250);
    er = await erinnerung(page);
    pruefe("nach einer neuen Antwort: \"Letzte Sicherung vor 8 Tagen\"", /vor 8 Tagen/.test(er), er);
    pruefe("Teil 7 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();
  });

  /* ================================================================ P3A */
  if(will("p3a")) await abschnitt("p3a", async () => {
    console.log("\nP3a Gerätekennung, Profile, Umleitungen");
    const schluessel = page => page.evaluate(() => Object.keys(localStorage).sort());
    const lies = (page, k) => page.evaluate(k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return "UNLESBAR"; } }, k);
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const GERAET = "11111111-2222-4333-8444-555555555555";
    const profilSetzen = (page, p) => page.evaluate(([id, p]) => localStorage.setItem("kotoba-geraet", JSON.stringify({ id: id, profil: p })), [GERAET, p]);
    const rettungSichtbar = page => page.evaluate(() => { const r = document.querySelector("#rettung"); return !!(r && r.offsetParent); });

    // 1. Gerätekennung
    let ctx = await profil(), page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST });
    let g = await lies(page, "kotoba-geraet");
    pruefe("Gerätekennung angelegt (zufällige UUID), Profil \"gast\"", !!g && UUID.test(g.id) && g.profil === "gast", JSON.stringify(g));
    await page.reload(); await page.waitForTimeout(200);
    pruefe("Gerätekennung bleibt nach Neustart gleich", !!g && (await lies(page, "kotoba-geraet") || {}).id === g.id);

    // 2. Gast-Profil nutzt die bisherigen Speichernamen
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    let k = await schluessel(page);
    pruefe("Gast-Profil: Antwort unter dem bisherigen Namen kotoba-v2, keine Profil-Namen",
      k.indexOf("kotoba-v2") >= 0 && !k.some(x => x.indexOf("kotoba:") === 0), k.join(", "));
    await ctx.close();

    // 3. Zweites Profil: eigene Speichernamen, Gast-Daten bleiben unberührt
    ctx = await profil(); page = await seite(ctx);
    const gastStand = await gelernt(page, 6, 2);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": gastStand, "kotoba-dojo": { blumen: 3 },
                        "kotoba-geraet": { id: GERAET, profil: "test-a" } });
    const kopfA = await page.locator("#zaehlerText").innerText();
    pruefe("Profil test-a sieht die Gast-Daten nicht (" + kopfA + ")", kopfA === "keine fällig · 15 neu", kopfA);
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    await page.click('.leiste button[data-ziel="dojo"]'); await page.waitForTimeout(150);
    await page.click('#dojoInhalt .dkachel[data-ziel="bild"]'); await page.waitForTimeout(150);
    await page.locator("#dSpiel .dopt").first().click(); await page.waitForTimeout(200);
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    await page.click("#schalterRomaji"); await page.click("#blattZu"); await page.waitForTimeout(100);
    const stA = await lies(page, "kotoba:test-a:stand"), eiA = await lies(page, "kotoba:test-a:einst"), djA = await lies(page, "kotoba:test-a:dojo");
    pruefe("Profil test-a: Lernstand, Einstellungen und Dojo unter eigenen Namen",
      !!stA && Object.keys(stA).length === 1 && !!eiA && eiA.romaji === false && !!djA && !!djA.b && Object.keys(djA.b).length === 1,
      JSON.stringify({ stand: stA && Object.keys(stA).length, einst: !!eiA, dojo: djA && djA.b && Object.keys(djA.b).length }));
    pruefe("Gast-Daten unverändert (Lernstand, Einstellungen, Dojo)",
      JSON.stringify(await lies(page, "kotoba-v2")) === JSON.stringify(gastStand)
      && JSON.stringify(await lies(page, "kotoba-einst")) === JSON.stringify(EINST)
      && JSON.stringify(await lies(page, "kotoba-dojo")) === JSON.stringify({ blumen: 3 }));
    page.antwort = "ok";
    await page.click('.leiste button[data-ziel="lernen"]'); await page.waitForTimeout(100);
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    await page.click("#knopfReset"); await page.waitForTimeout(200);
    pruefe("Zurücksetzen im Profil: aufbewahrt unter kotoba:test-a:vorher, beim Gast nichts",
      !!(await lies(page, "kotoba:test-a:vorher")) && (await lies(page, "kotoba-v2-vorher")) === null
      && Object.keys(await lies(page, "kotoba:test-a:stand") || { x: 1 }).length === 0);
    await profilSetzen(page, "gast"); await page.reload(); await page.waitForTimeout(250);
    pruefe("zurück im Gast-Profil: Gast-Daten unverändert, Daten von test-a bleiben erhalten",
      JSON.stringify(await lies(page, "kotoba-v2")) === JSON.stringify(gastStand) && !!(await lies(page, "kotoba:test-a:vorher")) && page.fehler.length === 0,
      page.fehler.join(" | "));

    // 4. Ungültige Gerätedaten
    await page.evaluate(() => localStorage.setItem("kotoba-geraet", JSON.stringify({ id: "kaputt", profil: "../böse" })));
    await page.reload(); await page.waitForTimeout(200);
    g = await lies(page, "kotoba-geraet");
    pruefe("ungültige Gerätedaten: neue UUID, Profil \"gast\"", !!g && UUID.test(g.id) && g.profil === "gast", JSON.stringify(g));
    k = await schluessel(page);
    pruefe("kein Speichername aus dem ungültigen Profil", !k.some(x => x.indexOf("böse") >= 0), k.join(", "));
    await ctx.close();

    // 5. Gesicherte unlesbare Daten bleiben im eigenen Profil
    ctx = await profil(); page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST, "kotoba-geraet": { id: GERAET, profil: "test-b" }, "kotoba:test-b:stand": '{"8-1|あに":{"stufe"' });
    k = await schluessel(page);
    pruefe("Profil test-b: unlesbarer Stand unter eigenem Namen gesichert, Hinweis sichtbar",
      k.some(x => x.indexOf("kotoba:test-b:stand-unlesbar-") === 0) && await rettungSichtbar(page), k.join(", "));
    await profilSetzen(page, "gast"); await page.reload(); await page.waitForTimeout(200);
    pruefe("Gast-Profil zeigt den Hinweis von test-b nicht", !(await rettungSichtbar(page)));
    await profilSetzen(page, "test-b"); await page.reload(); await page.waitForTimeout(200);
    pruefe("zurück in test-b: Hinweis wieder da", await rettungSichtbar(page));
    await ctx.close();

    // 6. Umleitungen: Lernstand einer alten Kennung zieht zur neuen um
    ctx = await profil();
    await ctx.route("**/vokabeln.js", async r => {
      const antwort = await r.fetch();
      const text = (await antwort.text()).replace("const UMLEITUNGEN = {};", 'const UMLEITUNGEN = { "8-1|alt-test": "8-1|あに" };');
      await r.fulfill({ response: antwort, body: text });
    });
    page = await seite(ctx);
    const alt = (await gelernt(page, 1, 5))["8-1|あに"];
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": { "8-1|alt-test": alt } });
    const kopfU = await page.locator("#zaehlerText").innerText();
    await page.click("#umdrehen");
    pruefe("alter Lernstand unter umgeleiteter Kennung: Wort ist fällig und wird gezeigt (" + kopfU + ")",
      /^1 fällig/.test(kopfU) && (await gezeigt(page)) === "あに", kopfU + " / " + (await gezeigt(page)));
    await page.click(".tap.gut"); await page.waitForTimeout(100);
    let st = await stand(page);
    pruefe("nach der Antwort: gespeichert unter der neuen Kennung, alte ist weg",
      !!st["8-1|あに"] && st["8-1|あに"].wdh === alt.wdh + 1 && st["8-1|alt-test"] === undefined, JSON.stringify(Object.keys(st)));
    const neuStand = (await gelernt(page, 1, 5))["8-1|あに"];
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": { "8-1|alt-test": alt, "8-1|あに": neuStand } });
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    st = await stand(page);
    pruefe("gibt es beide Kennungen schon, bleibt die alte unangetastet erhalten",
      JSON.stringify(st["8-1|alt-test"]) === JSON.stringify(alt) && st["8-1|あに"].wdh === neuStand.wdh + 1);
    pruefe("P3a ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();
  });

  /* ================================================================ P3B */
  if(will("p3b")) await abschnitt("p3b", async () => {
    console.log("\nP3b Antwort-Historie");
    /* Alle Ereignisse eines Profils (Gast: kotoba-ereignisse, Teile kotoba-ereignisse-<n>) */
    const verlaufLesen = (page, name) => page.evaluate(name => {
      const meta = JSON.parse(localStorage.getItem(name) || "null");
      let alle = [];
      ((meta && meta.teile) || []).forEach(n => { const t = JSON.parse(localStorage.getItem(name + "-" + n) || "null"); if(t) alle = alle.concat(VERLAUF.auspacken(t)); });
      return { meta: meta, ereignisse: alle };
    }, name || "kotoba-ereignisse");
    /* Ergibt Nachrechnen aus der Historie genau den gespeicherten Stand? */
    const passt = page => page.evaluate(() => {
      const sort = x => Array.isArray(x) ? "[" + x.map(sort).join(",") + "]"
        : (x && typeof x === "object") ? "{" + Object.keys(x).sort().map(k => JSON.stringify(k) + ":" + sort(x[k])).join(",") + "}" : String(JSON.stringify(x));
      const meta = JSON.parse(localStorage.getItem("kotoba-ereignisse") || "null");
      let alle = [];
      ((meta && meta.teile) || []).forEach(n => { const t = JSON.parse(localStorage.getItem("kotoba-ereignisse-" + n) || "null"); if(t) alle = alle.concat(VERLAUF.auspacken(t)); });
      const st = JSON.parse(localStorage.getItem("kotoba-v2") || "{}");
      const r = JSON.parse(JSON.stringify(VERLAUF.nachrechnen(alle, UMLEITUNGEN)));
      return { gleich: sort(st) === sort(r), stand: Object.keys(st).length, nachgerechnet: Object.keys(r).length, ereignisse: alle.length };
    });
    const ohneTeilen = () => { delete Navigator.prototype.share; delete Navigator.prototype.canShare; };
    const neuLaden = async (page, fn) => { const nav = page.waitForNavigation({ timeout: 5000 }).catch(() => null); await fn(); await nav; await page.waitForTimeout(250); };
    const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
    const knopfDa = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!(e && e.offsetParent); }, sel);

    // 1. Antworten erzeugen Ereignisse
    let ctx = await profil(), page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST });
    let v = await verlaufLesen(page);
    pruefe("leerer Start: Historie angelegt, keine Ereignisse", !!v.meta && v.meta.uebernommen > 0 && v.ereignisse.length === 0, JSON.stringify(v.meta));
    const woerter = [];
    for(const taste of ["3", "3", "4"]){ await page.keyboard.press("Space"); woerter.push(await gezeigt(page)); await page.keyboard.press(taste); }
    await page.waitForTimeout(100);
    v = await verlaufLesen(page);
    const geraetId = (await page.evaluate(() => JSON.parse(localStorage.getItem("kotoba-geraet")))).id;
    const plan = await page.evaluate(() => PLAN.VERSION);
    const ok1 = v.ereignisse.length === 3 && v.ereignisse.every(e => e.art === "antwort" && UUID.test(e.id) && e.geraet === geraetId && e.plan === plan)
      && JSON.stringify(v.ereignisse.map(e => e.bewertung)) === "[3,3,4]"
      && await page.evaluate(ev => ev.every(e => e.tag === PLAN.lerntag(e.zeit)), v.ereignisse);
    pruefe("drei Antworten: drei Ereignisse mit Kennung, Bewertung, Lerntag, Gerät und Plan-Version", ok1, JSON.stringify(v.ereignisse.map(e => [e.art, e.bewertung, e.wort])));
    let p = await passt(page);
    pruefe("Nachrechnen aus der Historie = gespeicherter Stand", p.gleich, JSON.stringify(p));
    pruefe("Tageszähler: 3 neue Wörter heute", (await neuHeute(page)) === 3, await neuHeute(page));
    await ctx.close();

    // 2. Übernahme beim ersten Start, genau einmal
    ctx = await profil(); page = await seite(ctx);
    const st12 = await gelernt(page, 12, 2);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": st12 });
    v = await verlaufLesen(page);
    const ok2 = v.ereignisse.length === 12 && v.ereignisse.every(e => e.art === "uebernahme" && JSON.stringify(e.daten) === JSON.stringify(st12[e.wort]));
    pruefe("vorhandener Stand: je Wort eine Übernahme mit genau diesem Stand", ok2, v.ereignisse.length);
    await page.reload(); await page.waitForTimeout(200); await page.reload(); await page.waitForTimeout(200);
    pruefe("nach zwei Neustarts keine weiteren Übernahmen", (await verlaufLesen(page)).ereignisse.length === 12);
    p = await passt(page);
    pruefe("Nachrechnen = gespeicherter Stand", p.gleich, JSON.stringify(p));

    // 3. Zurücksetzen, Zurückholen, Laden einer alten Sicherung
    page.antwort = "ok";
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    await page.click("#knopfReset"); await page.waitForTimeout(200);
    v = await verlaufLesen(page); p = await passt(page);
    pruefe("Zurücksetzen: Übernahmen ohne Stand für alle 12 Wörter, Historie passt", v.ereignisse.filter(e => e.art === "uebernahme" && e.daten === null).length === 12 && p.gleich && p.stand === 0, JSON.stringify(p));
    await page.click("#knopfZurueckholen"); await page.waitForTimeout(300);
    p = await passt(page);
    pruefe("Zurückholen: Historie passt wieder zu den 12 Wörtern", p.gleich && p.stand === 12, JSON.stringify(p));
    const alt2 = {}; Object.keys(st12).slice(0, 2).forEach(id => { alt2[id] = Object.assign({}, st12[id], { fehler: 5 }); });
    await page.fill("#exportFeld", JSON.stringify(alt2)); await page.click("#knopfLaden"); await page.waitForTimeout(300);
    p = await passt(page);
    pruefe("alte Sicherung geladen: Historie passt zum Stand (2 Wörter)", p.gleich && p.stand === 2, JSON.stringify(p));
    pruefe("Teil 1-3 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // 4. Rückgängig
    ctx = await profil(); page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST });
    pruefe("am Anfang kein Rückgängig-Knopf", !(await knopfDa(page, "#rueckgaengig")));
    await page.click("#umdrehen"); const erstes = await gezeigt(page); await page.click(".tap.gut"); await page.waitForTimeout(100);
    pruefe("nach einer Antwort: Rückgängig-Knopf unter \"Antwort zeigen\"", await knopfDa(page, "#rueckgaengig") && await knopfDa(page, "#umdrehen"));
    await page.click("#rueckgaengig"); await page.waitForTimeout(150);
    await page.click("#umdrehen");
    v = await verlaufLesen(page); p = await passt(page);
    pruefe("Rückgängig (neues Wort): Wort " + erstes + " wieder vorne, nicht mehr im Stand, Tageszähler 0",
      (await gezeigt(page)) === erstes && Object.keys(await stand(page)).length === 0 && (await neuHeute(page)) === 0, await gezeigt(page));
    pruefe("Historie: Antwort und Widerruf, Nachrechnen = Stand", v.ereignisse.length === 2 && v.ereignisse[1].art === "widerruf" && v.ereignisse[1].daten === v.ereignisse[0].id && p.gleich,
      JSON.stringify(v.ereignisse.map(e => e.art)));
    pruefe("nach dem Rückgängigmachen kein zweiter Schritt", !(await knopfDa(page, "#rueckgaengig")));
    const st3 = await gelernt(page, 3, 5);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": st3 });
    await page.click("#umdrehen"); const w1 = await gezeigt(page); await page.click(".tap.leicht"); await page.waitForTimeout(100);
    const getanNach = await page.locator("#sitzungText").innerText();
    await page.click("#rueckgaengig"); await page.waitForTimeout(150);
    const nachher = await stand(page), id1 = Object.keys(st3).find(i => i.endsWith("|" + w1));
    pruefe("Rückgängig (Wiederholung): Stand wie vorher, erledigt " + getanNach + " -> " + (await page.locator("#sitzungText").innerText()),
      JSON.stringify(nachher[id1]) === JSON.stringify(st3[id1]) && getanNach === "1" && (await page.locator("#sitzungText").innerText()) === "0", id1);
    // ein einziges fälliges Problemwort, Auswahl "Problemwörter": danach ist der Durchgang fertig
    const id0 = Object.keys(st3)[0];
    await setze(page, { "kotoba-einst": Object.assign({}, EINST, { filter: { art: "problem", wert: 0 } }),
                        "kotoba-v2": { [id0]: Object.assign({}, st3[id0], { fehler: 2 }) } });
    await page.click("#umdrehen"); await page.click(".tap.leicht"); await page.waitForTimeout(150);
    pruefe("letzte Karte des Durchgangs: Rückgängig auch auf der Fertig-Ansicht", (await page.locator(".leer").count()) === 1 && await knopfDa(page, "#rueckgaengig"));
    await page.click("#rueckgaengig"); await page.waitForTimeout(150);
    pruefe("dort Rückgängig: Karte wieder da", (await page.locator("#umdrehen").count()) === 1);
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(100);
    await page.reload(); await page.waitForTimeout(250);
    pruefe("nach Neustart kein Rückgängig-Knopf", !(await knopfDa(page, "#rueckgaengig")));
    pruefe("Teil 4 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // 5. Sicherung Format 3 mit Historie, in einem neuen Browserprofil geladen
    ctx = await profil(); await ctx.addInitScript(ohneTeilen);
    page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST, "kotoba-v2": st12 });
    for(let i = 0; i < 3; i++){ await page.keyboard.press("Space"); await page.keyboard.press("3"); }
    await page.waitForTimeout(100);
    const zahlVorher = (await verlaufLesen(page)).ereignisse.length;
    const standVorher = await stand(page);
    await page.click("#knopfEinstellungen"); await page.waitForTimeout(150);
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#knopfDatei")]);
    const text = fs.readFileSync(await dl.path(), "utf8");
    let s3 = {}; try{ s3 = JSON.parse(text); }catch(e){ /* bleibt leer */ }
    const zahlDatei = await page.evaluate(t => { try{ return VERLAUF.auspacken(JSON.parse(t).ereignisse).length; }catch(e){ return -1; } }, text);
    pruefe("Sicherung Format 3 enthält die Historie (" + zahlDatei + " Ereignisse)", s3.format === 3 && zahlDatei === zahlVorher && zahlVorher === 15, zahlDatei + " / " + zahlVorher);
    await ctx.close();
    ctx = await profil(); page = await seite(ctx);
    page.antwort = "ok";
    await neuLaden(page, async () => {
      await page.setInputFiles("#dateiFeld", { name: "s.json", mimeType: "application/json", buffer: Buffer.from(text) });
    });
    v = await verlaufLesen(page); p = await passt(page);
    pruefe("geladen in neues Profil: Stand wie gesichert, Historie übernommen und passend",
      JSON.stringify(await stand(page)) === JSON.stringify(standVorher) && v.ereignisse.length >= zahlVorher && p.gleich, JSON.stringify(p));
    await ctx.close();

    // 6. Zusammenfassen ab einer (für den Test kleinen) Grenze
    ctx = await profil(); await ctx.addInitScript(() => { window.KOTOBA_EREIGNIS_GRENZE = 6000; });
    page = await seite(ctx);
    await setze(page, { "kotoba-einst": Object.assign({}, EINST, { neuProTag: 0, limit: 0 }), "kotoba-v2": st12 });
    let antworten = 0;
    for(let i = 0; i < 40; i++){ await page.keyboard.press("Space"); await page.keyboard.press(String(1 + (i % 4))); antworten++; }
    await page.waitForTimeout(150);
    v = await verlaufLesen(page); p = await passt(page);
    const groesse = await page.evaluate(() => { const m = JSON.parse(localStorage.getItem("kotoba-ereignisse")); return m.teile.reduce((a, n) => a + (localStorage.getItem("kotoba-ereignisse-" + n) || "").length, 0); });
    pruefe("Zusammenfassen: unter der Grenze (" + groesse + " Zeichen), weniger Ereignisse als Antworten + Übernahmen, Stand unverändert passend",
      !!v.meta.zusammengefasst && groesse <= 6000 && v.ereignisse.length < antworten + 12 && p.gleich, JSON.stringify({ groesse: groesse, ereignisse: v.ereignisse.length, p: p }));
    pruefe("Teil 5-6 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();
  });

  /* ================================================================ KONTO */
  if(will("konto")) await abschnitt("konto", async () => {
    console.log("\nKonto (Paket 4a): Anmeldung, Profile, Bibliothek nur bei Bedarf");
    const lies = (page, k) => page.evaluate(k => { try{ return JSON.parse(localStorage.getItem(k)); }catch(e){ return "UNLESBAR"; } }, k);
    const namen = page => page.evaluate(() => Object.keys(localStorage).sort());
    const text = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, " ").trim() : null; }, sel);
    const sichtbar = (page, sel) => page.evaluate(s => { const e = document.querySelector(s); return !!(e && e.offsetParent); }, sel);
    const bibliothekDa = page => page.evaluate(() => !!(window.supabase && window.supabase.createClient));
    const profilVon = async page => (await lies(page, "kotoba-geraet") || {}).profil;
    const neuLaden = async (page, fn, ms) => { const nav = page.waitForNavigation({ timeout: ms || 8000 }).catch(() => null); await fn(); await nav; await page.waitForTimeout(300); };
    const einstellungen = async page => { await page.click("#knopfEinstellungen"); await page.waitForTimeout(150); };
    const kontoMeldung = (page, muster, ms) => page.waitForFunction(m => new RegExp(m).test((document.querySelector("#kontoMeldung") || {}).textContent || ""),
      muster.source, { timeout: ms || 8000 }).then(() => true, () => false);
    /* Kontext mit eigener konfig.js; zählt die Anfragen nach der Supabase-Bibliothek */
    async function kontext(konfig, mehr){
      const ctx = await profil();
      ctx.bibliothek = 0;
      ctx.on("request", r => { if(r.url().indexOf("/supabase-js/") >= 0) ctx.bibliothek++; });
      await ctx.route("**/konfig.js", r => r.fulfill({ contentType: "text/javascript; charset=utf-8",
        body: "window.KOTOBA_KONFIG = " + JSON.stringify(konfig) + ";" }));
      if(mehr) await mehr(ctx);
      return ctx;
    }
    const LEER = { supabaseUrl: "", supabaseKey: "" };
    const NICHT_DA = { supabaseUrl: "http://127.0.0.1:9", supabaseKey: "sb_publishable_test" };
    const UID = "6f1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d";
    const GERAET = "11111111-2222-4333-8444-555555555555";

    // 0. konfig.js aus dem Repo passt zu konto.js: eingerichtet -> Formular, leer -> Hinweis
    {
      const c0 = await profil();
      let bib0 = 0;
      c0.on("request", r => { if(r.url().indexOf("/supabase-js/") >= 0) bib0++; });
      const p0 = await seite(c0);
      await setze(p0, { "kotoba-einst": EINST });
      const k0 = await p0.evaluate(() => window.KOTOBA_KONFIG || {});
      await einstellungen(p0);
      const formular = await sichtbar(p0, "#kontoEmail");
      pruefe("konfig.js aus dem Repo: " + (k0.supabaseUrl ? "eingerichtet, Anmeldeformular da" : "leer, Hinweis \"nicht eingerichtet\""),
        k0.supabaseUrl ? formular : !formular && /nicht eingerichtet/i.test(await text(p0, "#konto") || ""), String(k0.supabaseUrl));
      pruefe("konfig.js aus dem Repo: beim Start keine Bibliothek, keine Fehler der Seite", bib0 === 0 && p0.fehler.length === 0,
        bib0 + " " + p0.fehler.join(" | "));
      await c0.close();
    }

    // 1. Nicht eingerichtet: kein Formular, keine Bibliothek
    let ctx = await kontext(LEER), page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST });
    await einstellungen(page);
    pruefe("nicht eingerichtet: Konto-Abschnitt sagt es, kein Anmeldeformular",
      /nicht eingerichtet/i.test(await text(page, "#konto") || "") && !(await sichtbar(page, "#kontoEmail")), await text(page, "#konto"));
    pruefe("nicht eingerichtet: Supabase-Bibliothek nicht geladen", ctx.bibliothek === 0 && !(await bibliothekDa(page)), ctx.bibliothek);
    pruefe("Teil 1 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // 2. Eingerichtet, Server nicht erreichbar
    ctx = await kontext(NICHT_DA); page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST });
    pruefe("eingerichtet: beim Start keine Bibliothek geladen (Gastbetrieb startet wie bisher)",
      ctx.bibliothek === 0 && !(await bibliothekDa(page)), ctx.bibliothek);
    await einstellungen(page);
    pruefe("eingerichtet, abgemeldet: Feld für die E-Mail-Adresse", await sichtbar(page, "#kontoEmail") && await sichtbar(page, "#kontoCodeAnfordern"));
    await page.fill("#kontoEmail", "keine-adresse");
    await page.click("#kontoCodeAnfordern");
    pruefe("ungültige Adresse: Hinweis, Bibliothek bleibt ungeladen",
      await kontoMeldung(page, /gültige E-Mail/, 2000) && ctx.bibliothek === 0, await text(page, "#kontoMeldung"));
    await page.fill("#kontoEmail", "jemand@example.com");
    await page.click("#kontoCodeAnfordern");
    pruefe("Server nicht erreichbar: verständliche Meldung", await kontoMeldung(page, /Keine Verbindung/, 15000), await text(page, "#kontoMeldung"));
    pruefe("erst jetzt ist die Bibliothek geladen", ctx.bibliothek >= 1 && await bibliothekDa(page), ctx.bibliothek);
    pruefe("weiter im Gast-Profil, kein Konto vermerkt", (await profilVon(page)) === "gast" && (await lies(page, "kotoba-konto")) === null);
    pruefe("Teil 2 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // 3. Bibliothek lässt sich nicht laden (offline)
    ctx = await kontext(NICHT_DA, c => c.route("**/supabase-js/**", r => r.abort()));
    page = await seite(ctx);
    await setze(page, { "kotoba-einst": EINST });
    await einstellungen(page);
    await page.fill("#kontoEmail", "jemand@example.com");
    await page.click("#kontoCodeAnfordern");
    pruefe("Bibliothek nicht ladbar: Meldung nennt die Internetverbindung", await kontoMeldung(page, /Internetverbindung/), await text(page, "#kontoMeldung"));
    pruefe("Teil 3 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // 4. Angemeldet (nachgestellt, Server nicht erreichbar): Anzeige, Antworten, Abmelden
    ctx = await kontext(NICHT_DA); page = await seite(ctx);
    const gastStand = await gelernt(page, 3, 2), kontoStand = await gelernt(page, 6, 2);
    const angemeldet = { "kotoba-einst": EINST, "kotoba-v2": gastStand,
      "kotoba-geraet": { id: GERAET, profil: UID }, "kotoba-konto": { id: UID, email: "konto@example.com" },
      ["kotoba:" + UID + ":stand"]: kontoStand, ["kotoba:" + UID + ":einst"]: EINST,
      "kotoba-anmeldung": { access_token: "x", refresh_token: "y", expires_at: 1, user: { id: UID } } };
    await setze(page, angemeldet);
    const vorStart = ctx.bibliothek;
    await einstellungen(page);
    pruefe("angemeldet: \"Angemeldet als konto@example.com\", Knöpfe zum Abmelden",
      /Angemeldet als konto@example\.com/.test(await text(page, "#konto") || "") && await sichtbar(page, "#kontoAbmelden")
      && await sichtbar(page, "#kontoEntfernen") && !(await sichtbar(page, "#kontoEmail")), await text(page, "#konto"));
    pruefe("angemeldet: beim Start keine Bibliothek geladen", vorStart === 0 && !(await bibliothekDa(page)), vorStart);
    await page.click("#blattZu"); await page.waitForTimeout(100);
    await page.click("#umdrehen"); await page.click(".tap.gut"); await page.waitForTimeout(150);
    const nachAntwort = await lies(page, "kotoba:" + UID + ":stand");
    pruefe("angemeldet: Antworten gehen in das Profil des Kontos, Gast-Daten bleiben",
      !!nachAntwort && JSON.stringify(nachAntwort) !== JSON.stringify(kontoStand)
      && JSON.stringify(await lies(page, "kotoba-v2")) === JSON.stringify(gastStand));
    await einstellungen(page);
    await neuLaden(page, () => page.click("#kontoAbmelden"), 15000);
    pruefe("Abmelden: Gast-Profil, Konto-Vermerk und Sitzung entfernt",
      (await profilVon(page)) === "gast" && (await lies(page, "kotoba-konto")) === null && (await lies(page, "kotoba-anmeldung")) === null,
      JSON.stringify(await namen(page)));
    pruefe("Abmelden: Daten des Kontos bleiben auf dem Gerät, Gast-Daten unverändert",
      JSON.stringify(await lies(page, "kotoba:" + UID + ":stand")) === JSON.stringify(nachAntwort)
      && JSON.stringify(await lies(page, "kotoba-v2")) === JSON.stringify(gastStand));
    pruefe("Abmelden: Meldung \"Abgemeldet\"", /Abgemeldet/.test(await meldung(page)), await meldung(page));
    pruefe("Teil 4 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));

    // 5. Abmelden und Daten entfernen, erst abgelehnt, dann bestätigt
    await setze(page, angemeldet);
    await einstellungen(page);
    page.antwort = "ablehnen";
    await page.click("#kontoEntfernen"); await page.waitForTimeout(300);
    pruefe("Daten entfernen abgelehnt: nichts geändert, weiter angemeldet",
      page.dialoge.length === 1 && (await profilVon(page)) === UID && !!(await lies(page, "kotoba:" + UID + ":stand"))
      && !!(await lies(page, "kotoba-konto")), page.dialoge.join(" | "));
    pruefe("die Rückfrage warnt: der Lernstand liegt bisher nur auf diesem Gerät", /nur auf diesem Gerät/.test(page.dialoge[0] || ""), page.dialoge[0]);
    page.antwort = "ok";
    await neuLaden(page, () => page.click("#kontoEntfernen"), 15000);
    let k = await namen(page);
    pruefe("Daten entfernen bestätigt: nichts mehr vom Konto auf dem Gerät, abgemeldet",
      !k.some(n => n.indexOf("kotoba:" + UID + ":") === 0) && (await profilVon(page)) === "gast"
      && (await lies(page, "kotoba-konto")) === null && (await lies(page, "kotoba-anmeldung")) === null, k.join(", "));
    pruefe("Daten entfernen: Gast-Daten unverändert", JSON.stringify(await lies(page, "kotoba-v2")) === JSON.stringify(gastStand));
    pruefe("Teil 5 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));

    // 6. Unterbrochene Anmeldung (Konto vermerkt, Profil noch Gast): wird beim Start vollendet
    await setze(page, { "kotoba-einst": EINST, "kotoba-geraet": { id: GERAET, profil: "gast" },
                        "kotoba-konto": { id: UID, email: "konto@example.com" },
                        "kotoba-anmeldung": { access_token: "x", refresh_token: "y", expires_at: 1, user: { id: UID } } });
    let p6 = null;
    for(let i = 0; i < 20 && p6 !== UID; i++){ await page.waitForTimeout(150); p6 = await profilVon(page).catch(() => null); }
    await page.waitForTimeout(300);
    pruefe("unterbrochene Anmeldung: beim Start ins Profil des Kontos gewechselt", p6 === UID, p6);
    // Sitzung ohne Konto-Vermerk (etwa nach einem abgebrochenen Abmelden): wird beim Start entfernt
    await setze(page, { "kotoba-einst": EINST, "kotoba-anmeldung": { access_token: "x", refresh_token: "y", expires_at: 1, user: { id: UID } } });
    pruefe("Sitzung ohne Konto-Vermerk wird beim Start entfernt", (await lies(page, "kotoba-anmeldung")) === null && (await profilVon(page)) === "gast");
    pruefe("Teil 6 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
    await ctx.close();

    // ---------- 7. gegen ein lokales Supabase (auf GitHub im Job "supabase") ----------
    const SBU = (process.env.SUPABASE_URL || "").replace(/\/+$/, ""), SBK = process.env.SUPABASE_PUBLISHABLE_KEY,
          SBG = process.env.SUPABASE_SECRET_KEY, POSTFACH = (process.env.SUPABASE_MAILPIT_URL || "").replace(/\/+$/, "");
    if(!SBU || !SBK || !SBG || !POSTFACH){
      console.log("  übersprungen: Anmeldung gegen ein lokales Supabase (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, "
        + "SUPABASE_SECRET_KEY, SUPABASE_MAILPIT_URL fehlen)");
      return;
    }
    if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(SBU)) throw new Error("nur gegen ein lokales Supabase, nicht " + SBU);
    const admin = async (methode, pfad, daten) => {
      const a = await fetch(SBU + pfad, { method: methode, body: daten ? JSON.stringify(daten) : undefined,
        headers: { apikey: SBG, Authorization: "Bearer " + SBG, "Content-Type": "application/json" } });
      const t = await a.text(); let j = null; try{ j = JSON.parse(t); }catch(e){ /* kein JSON */ }
      return { status: a.status, json: j, text: t };
    };
    const lauf = require("crypto").randomBytes(4).toString("hex");
    const adr = n => "kotoba-konto-" + n + "-" + lauf + "@example.com";
    const konten = {};
    try{
      for(const n of ["a", "b"]){
        const r = await admin("POST", "/auth/v1/admin/users", { email: adr(n), email_confirm: true });
        if(!r.json || !r.json.id) throw new Error("Testkonto " + n + ": " + r.status + " " + r.text.slice(0, 160));
        konten[n] = r.json.id;
      }
      const gelesen = new Set();
      async function codeAusPostfach(email){
        for(let i = 0; i < 60; i++){
          const r = await fetch(POSTFACH + "/api/v1/messages?limit=50").then(a => a.json()).catch(() => ({}));
          const m = (r.messages || []).find(m => !gelesen.has(m.ID) && (m.To || []).some(t => String(t.Address).toLowerCase() === email));
          if(m){
            gelesen.add(m.ID);
            const voll = await fetch(POSTFACH + "/api/v1/message/" + m.ID).then(a => a.json());
            const z = /\b(\d{6,10})\b/.exec(voll.Text || "") || /\b(\d{6,10})\b/.exec(String(voll.HTML || "").replace(/<[^>]*>/g, " "));
            if(z) return z[1];
          }
          await new Promise(f => setTimeout(f, 250));
        }
        throw new Error("keine Mail mit Code an " + email);
      }
      async function codeAnfordern(page, email){
        await einstellungen(page);
        await page.fill("#kontoEmail", email);
        await page.click("#kontoCodeAnfordern");
        return kontoMeldung(page, /unterwegs/, 10000);
      }
      const roh = (page, k) => page.evaluate(k => localStorage.getItem(k), k);

      ctx = await kontext({ supabaseUrl: SBU, supabaseKey: SBK }, c => c.route(SBU + "/**", r => r.continue()));
      page = await seite(ctx);
      await setze(page, { "kotoba-einst": EINST, "kotoba-v2": await gelernt(page, 6, 2), "kotoba-dojo": { blumen: 3 } });
      const gastRoh = await roh(page, "kotoba-v2"), gastDojo = await roh(page, "kotoba-dojo");

      // unbekannte Adresse
      await einstellungen(page);
      await page.fill("#kontoEmail", adr("unbekannt"));
      await page.click("#kontoCodeAnfordern");
      const ok1 = await kontoMeldung(page, /kein Konto/, 10000);
      const nutzer = await admin("GET", "/auth/v1/admin/users?page=1&per_page=1000");
      pruefe("unbekannte Adresse: \"kein Konto\", es wird keines angelegt",
        ok1 && Array.isArray((nutzer.json || {}).users) && !nutzer.json.users.some(u => u.email === adr("unbekannt")),
        await text(page, "#kontoMeldung"));
      await page.click("#blattZu"); await page.waitForTimeout(100);

      // Code anfordern, falscher Code
      pruefe("Konto A: Code unterwegs, Feld für den Code", await codeAnfordern(page, adr("a")) && await sichtbar(page, "#kontoCode"),
        await text(page, "#kontoMeldung"));
      const codeA = await codeAusPostfach(adr("a"));
      await page.fill("#kontoCode", codeA === "000000" ? "111111" : "000000");
      await page.click("#kontoAnmelden");
      pruefe("falscher Code: Meldung, nicht angemeldet",
        await kontoMeldung(page, /stimmt nicht/, 10000) && (await profilVon(page)) === "gast" && (await lies(page, "kotoba-konto")) === null,
        await text(page, "#kontoMeldung"));

      // richtiger Code, Gast-Daten übernehmen
      page.antwort = "ok";
      await page.fill("#kontoCode", codeA);
      await neuLaden(page, () => page.click("#kontoAnmelden"), 15000);
      const ka = await lies(page, "kotoba-konto");
      pruefe("richtiger Code: angemeldet, Profil ist die Benutzerkennung von A",
        (await profilVon(page)) === konten.a && !!ka && ka.id === konten.a && ka.email === adr("a"), JSON.stringify(ka));
      pruefe("Rückfrage zur Übernahme nennt die Wörter ohne Konto (6)", page.dialoge.length === 1 && /\b6 Wörter\b/.test(page.dialoge[0]),
        page.dialoge.join(" | "));
      pruefe("übernommen: Lernstand, Dojo und Historie im Konto wie beim Gast",
        (await roh(page, "kotoba:" + konten.a + ":stand")) === gastRoh && (await roh(page, "kotoba:" + konten.a + ":dojo")) === gastDojo
        && !!(await lies(page, "kotoba:" + konten.a + ":ereignisse")));
      pruefe("Gast-Daten bleiben erhalten (kopiert, nicht verschoben)", (await roh(page, "kotoba-v2")) === gastRoh);
      const sitzung = await lies(page, "kotoba-anmeldung");
      pruefe("Sitzung von A gespeichert", !!sitzung && !!sitzung.user && sitzung.user.id === konten.a && !!sitzung.refresh_token);
      await einstellungen(page);
      pruefe("nach dem Neustart: \"Angemeldet als …\", Bibliothek nicht geladen",
        new RegExp("Angemeldet als " + adr("a").replace(/[.]/g, "\\.")).test(await text(page, "#konto") || "") && !(await bibliothekDa(page)),
        await text(page, "#konto"));

      // Abmelden: auch auf dem Server
      await neuLaden(page, () => page.click("#kontoAbmelden"), 15000);
      pruefe("A abgemeldet: Gast-Profil, Daten von A bleiben auf dem Gerät",
        (await profilVon(page)) === "gast" && (await lies(page, "kotoba-anmeldung")) === null
        && (await roh(page, "kotoba:" + konten.a + ":stand")) === gastRoh);
      const erneuern = await fetch(SBU + "/auth/v1/token?grant_type=refresh_token", { method: "POST",
        headers: { apikey: SBK, "Content-Type": "application/json" }, body: JSON.stringify({ refresh_token: sitzung.refresh_token }) });
      pruefe("Abmelden beendet die Sitzung auch auf dem Server", erneuern.status >= 400, erneuern.status);

      // B ohne Übernahme
      page.antwort = "ablehnen"; page.dialoge.length = 0;
      await codeAnfordern(page, adr("b"));
      await page.fill("#kontoCode", await codeAusPostfach(adr("b")));
      await neuLaden(page, () => page.click("#kontoAnmelden"), 15000);
      const sb = await lies(page, "kotoba:" + konten.b + ":stand");
      pruefe("B angemeldet, Übernahme abgelehnt: Konto B beginnt leer",
        (await profilVon(page)) === konten.b && page.dialoge.length === 1 && (sb === null || Object.keys(sb).length === 0), JSON.stringify(sb));
      pruefe("Gast und A unverändert", (await roh(page, "kotoba-v2")) === gastRoh && (await roh(page, "kotoba:" + konten.a + ":stand")) === gastRoh);
      await einstellungen(page);
      await neuLaden(page, () => page.click("#kontoAbmelden"), 15000);

      // A erneut: keine Rückfrage, Daten von A sind da
      page.dialoge.length = 0; page.antwort = "ok";
      await codeAnfordern(page, adr("a"));
      await page.fill("#kontoCode", await codeAusPostfach(adr("a")));
      await neuLaden(page, () => page.click("#kontoAnmelden"), 15000);
      pruefe("A erneut angemeldet: keine Rückfrage, Lernstand von A wieder da",
        (await profilVon(page)) === konten.a && page.dialoge.length === 0 && (await roh(page, "kotoba:" + konten.a + ":stand")) === gastRoh,
        page.dialoge.join(" | "));

      // A abmelden und Daten entfernen
      await einstellungen(page);
      await neuLaden(page, () => page.click("#kontoEntfernen"), 15000);
      k = await namen(page);
      pruefe("A abgemeldet, Daten entfernt: nichts mehr von A, B und Gast unverändert",
        (await profilVon(page)) === "gast" && !k.some(n => n.indexOf("kotoba:" + konten.a + ":") === 0)
        && k.some(n => n.indexOf("kotoba:" + konten.b + ":") === 0) && (await roh(page, "kotoba-v2")) === gastRoh, k.join(", "));
      pruefe("Teil 7 ohne Fehler der Seite", page.fehler.length === 0, page.fehler.join(" | "));
      await ctx.close();
    } finally {
      for(const n of Object.keys(konten)) await admin("DELETE", "/auth/v1/admin/users/" + konten[n]).catch(() => {});
    }
  });

  await browser.close(); srv.close();
  console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.log("TESTABBRUCH: " + e.message); process.exit(2); });
