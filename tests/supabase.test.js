/* Sicherheit der Datenbank (Paket 4a), geprüft gegen ein lokales Supabase

   Aufruf:  node tests/supabase.test.js
   Braucht ein laufendes lokales Supabase mit den Tabellen aus supabase/migrations
   (supabase start, siehe README) und dessen Zugangsdaten in der Umgebung:
     SUPABASE_URL              etwa http://127.0.0.1:54321
     SUPABASE_PUBLISHABLE_KEY  der öffentliche Schlüssel, wie ihn die App benutzt
     SUPABASE_SECRET_KEY       nur für den Test: legt Testkonten an, prüft nach, räumt auf
     SUPABASE_DB_URL           direkte Verbindung zur Datenbank (für psql)
   Auf GitHub setzt der Workflow alles selbst (Job "supabase"). Der Test läuft
   nur gegen ein Supabase auf diesem Rechner, nie gegen ein echtes Projekt.

   Geprüft wird über dieselbe Schnittstelle, die jeder mit dem öffentlichen
   Schlüssel erreicht, also auch mit selbst gebauten Anfragen:
   - ohne Anmeldung kein Lesen und kein Anlegen
   - zwei Konten A und B sehen und ändern nie die Zeilen des anderen
   - Benutzer und Empfangszeit setzt immer die Datenbank, nie die App
   - Lernereignisse lassen sich nur anlegen und lesen, nie ändern oder löschen
   - doppelt hochgeladene Ereignisse zählen einmal, das erste bleibt
   - ungültige oder zu große Werte werden abgelehnt
   - ein gelöschtes Konto nimmt alle seine Zeilen mit
   Dazu über psql: Jede Tabelle hat Row Level Security, der öffentliche
   Schlüssel hat keine Rechte, und keine Funktion ist von außen aufrufbar.   */
"use strict";
const crypto = require("crypto");
const { execFileSync } = require("child_process");

const SB = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const OEFFENTLICH = process.env.SUPABASE_PUBLISHABLE_KEY || "";
const GEHEIM = process.env.SUPABASE_SECRET_KEY || "";
const DB = process.env.SUPABASE_DB_URL || "";
if(!SB || !OEFFENTLICH || !GEHEIM){
  console.log("Kein lokales Supabase angegeben (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY).\n"
    + "Siehe Kopf dieser Datei und README, Abschnitt Tests.");
  process.exit(2);
}
if(!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(SB)){
  console.log("Abbruch: Dieser Test legt Konten an und löscht sie wieder. Er läuft nur gegen ein lokales Supabase, nicht gegen " + SB);
  process.exit(2);
}

let fehler = 0;
function pruefe(name, ok, detail){
  if(!ok) fehler++;
  console.log((ok ? "  ok     " : "  FEHLER ") + name + (detail !== undefined && !ok ? "  [" + detail + "]" : ""));
}

/* ---------- Anfragen ----------
   Ohne token mit dem öffentlichen Schlüssel allein, also wie jemand ohne Konto. */
async function anfrage(methode, pfad, o){
  o = o || {};
  const schluessel = o.geheim ? GEHEIM : OEFFENTLICH;
  const kopf = { apikey: schluessel, Authorization: "Bearer " + (o.token || schluessel) };
  if(o.daten !== undefined) kopf["Content-Type"] = "application/json";
  if(o.prefer) kopf.Prefer = o.prefer;
  const a = await fetch(SB + pfad, { method: methode, headers: kopf,
                                     body: o.daten === undefined ? undefined : JSON.stringify(o.daten) });
  const text = await a.text();
  let json = null;
  try{ json = text ? JSON.parse(text) : null; }catch(e){ /* kein JSON */ }
  return { status: a.status, json: json, text: text };
}
const erfolg = r => r.status >= 200 && r.status < 300;
const kurz = r => r.status + " " + String(r.text).slice(0, 160);
/* Mit dem geheimen Schlüssel: alle Zeilen einer Tabelle, an Row Level Security vorbei */
async function alle(tabelle, filter){
  const r = await anfrage("GET", "/rest/v1/" + tabelle + "?select=*" + (filter ? "&" + filter : ""), { geheim: true });
  if(r.status !== 200 || !Array.isArray(r.json)) throw new Error("Nachsehen in " + tabelle + " ging nicht: " + kurz(r));
  return r.json;
}
const liste = r => Array.isArray(r.json) ? r.json : [];
/* Liefert eine Leseanfrage keine Zeile? (Abgelehnt oder leere Liste, beides zählt.) */
const nichtsGelesen = r => !erfolg(r) || (Array.isArray(r.json) && r.json.length === 0);
const jetztNah = t => Math.abs(Date.parse(t) - Date.now()) < 120000;

/* ---------- Testkonten ---------- */
const LAUF = crypto.randomBytes(4).toString("hex");
const PASSWORT = crypto.randomBytes(24).toString("base64url");
const adresse = n => "kotoba-test-" + n + "-" + LAUF + "@example.com";
async function kontoAnlegen(n){
  const r = await anfrage("POST", "/auth/v1/admin/users", { geheim: true,
    daten: { email: adresse(n), password: PASSWORT, email_confirm: true } });
  if(!erfolg(r) || !r.json || !r.json.id) throw new Error("Testkonto " + n + " ließ sich nicht anlegen: " + kurz(r));
  const t = await anfrage("POST", "/auth/v1/token?grant_type=password", { daten: { email: adresse(n), password: PASSWORT } });
  if(t.status !== 200 || !t.json || !t.json.access_token) throw new Error("Anmeldung " + n + " ging nicht: " + kurz(t));
  return { id: r.json.id, token: t.json.access_token };
}
async function kontoLoeschen(k){
  return anfrage("DELETE", "/auth/v1/admin/users/" + k.id, { geheim: true });
}

/* Ein Lernereignis, wie es die App in 4b hochladen wird (ARCHITEKTUR.md) */
function ereignis(mehr){
  return Object.assign({ id: crypto.randomUUID(), wort_id: "8-1|あに", art: "antwort", bewertung: 3,
    zeit: new Date().toISOString(), tag: 20411, geraet_id: crypto.randomUUID(), plan_version: "ts-fsrs test",
    daten: null }, mehr || {});
}

/* ---------- Prüfungen über psql ---------- */
function sql(befehl){
  return execFileSync("psql", [DB, "-v", "ON_ERROR_STOP=1", "-At", "-c", befehl], { encoding: "utf8" }).trim();
}
function strukturPruefen(){
  console.log("\nAufbau der Datenbank (psql)");
  if(!DB){ console.log("  übersprungen: SUPABASE_DB_URL fehlt"); return; }
  let ohneRls, rechteOeffentlich, rechteKonto, funktionen, tabellen;
  try{
    tabellen = sql("select string_agg(relname, ',' order by relname) from pg_class c join pg_namespace n on n.oid = c.relnamespace "
      + "where n.nspname = 'public' and c.relkind in ('r', 'p')");
    ohneRls = sql("select coalesce(string_agg(relname, ','), '') from pg_class c join pg_namespace n on n.oid = c.relnamespace "
      + "where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity");
    rechteOeffentlich = sql("select coalesce(string_agg(table_name || ':' || privilege_type, ','), '') "
      + "from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public'");
    rechteKonto = sql("select coalesce(string_agg(table_name || ':' || privilege_type, ',' order by table_name, privilege_type), '') "
      + "from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public'");
    funktionen = sql("select coalesce(string_agg(p.proname, ','), '') from pg_proc p join pg_namespace n on n.oid = p.pronamespace "
      + "where n.nspname = 'public' and (has_function_privilege('anon', p.oid, 'execute') "
      + "or has_function_privilege('authenticated', p.oid, 'execute'))");
  }catch(e){
    pruefe("psql erreichbar", false, String(e.message).split("\n")[0]);
    return;
  }
  pruefe("Tabellen vorhanden: lern_ereignisse, einstellungen, dojo_stand (" + tabellen + ")",
    ["dojo_stand", "einstellungen", "lern_ereignisse"].every(t => tabellen.split(",").includes(t)), tabellen);
  pruefe("jede Tabelle in public hat Row Level Security", ohneRls === "", ohneRls);
  pruefe("der öffentliche Schlüssel (anon) hat keine Rechte an Tabellen", rechteOeffentlich === "", rechteOeffentlich);
  pruefe("angemeldete Konten: Ereignisse nur lesen und anlegen, Einstellungen und Dojo dazu ändern, nichts löschen",
    rechteKonto === "dojo_stand:INSERT,dojo_stand:SELECT,dojo_stand:UPDATE,einstellungen:INSERT,einstellungen:SELECT,"
      + "einstellungen:UPDATE,lern_ereignisse:INSERT,lern_ereignisse:SELECT", rechteKonto);
  pruefe("keine Funktion in public ist von außen aufrufbar", funktionen === "", funktionen);
}

/* ---------- Ablauf ---------- */
(async () => {
  strukturPruefen();

  console.log("\nTestkonten A und B");
  const A = await kontoAnlegen("a"), B = await kontoAnlegen("b");
  pruefe("zwei Testkonten angelegt und angemeldet", !!A.token && !!B.token && A.id !== B.id);
  try{
    /* ======================================================== Lernereignisse */
    console.log("\nLernereignisse");
    const e1 = ereignis({ empfangen_am: "2000-01-01T00:00:00Z" });
    let r = await anfrage("POST", "/rest/v1/lern_ereignisse", { token: A.token, daten: e1, prefer: "return=minimal" });
    pruefe("A legt ein eigenes Ereignis an", erfolg(r), kurz(r));
    r = await anfrage("GET", "/rest/v1/lern_ereignisse?select=*", { token: A.token });
    let z = liste(r).find(x => x.id === e1.id);
    pruefe("A liest es zurück, mit A als Benutzer", !!z && z.user_id === A.id, kurz(r));
    pruefe("Empfangszeit setzt die Datenbank (mitgeschickt war 2000-01-01)", !!z && jetztNah(z.empfangen_am), z && z.empfangen_am);

    // A versucht, ein Ereignis im Namen von B anzulegen
    const e2 = ereignis({ user_id: B.id });
    r = await anfrage("POST", "/rest/v1/lern_ereignisse", { token: A.token, daten: e2, prefer: "return=minimal" });
    let fremd = await alle("lern_ereignisse", "id=eq." + e2.id);
    pruefe("A kann kein Ereignis für B anlegen (abgelehnt oder als A gespeichert)",
      fremd.every(x => x.user_id === A.id), JSON.stringify(fremd));

    // Ohne Anmeldung
    const e3 = ereignis();
    r = await anfrage("POST", "/rest/v1/lern_ereignisse", { daten: e3, prefer: "return=minimal" });
    pruefe("ohne Anmeldung: kein Ereignis anlegbar", !erfolg(r) && (await alle("lern_ereignisse", "id=eq." + e3.id)).length === 0, kurz(r));
    for(const t of ["lern_ereignisse", "einstellungen", "dojo_stand"]){
      r = await anfrage("GET", "/rest/v1/" + t + "?select=*");
      pruefe("ohne Anmeldung: nichts lesbar aus " + t, nichtsGelesen(r), kurz(r));
    }

    // B sieht nichts von A
    r = await anfrage("GET", "/rest/v1/lern_ereignisse?select=*", { token: B.token });
    pruefe("B sieht keine Ereignisse von A", erfolg(r) && !liste(r).some(x => x.user_id === A.id), kurz(r));
    r = await anfrage("GET", "/rest/v1/lern_ereignisse?select=*&user_id=eq." + A.id, { token: B.token });
    pruefe("B sieht auch gezielt nach A gefiltert nichts", nichtsGelesen(r), kurz(r));

    // Nicht ändern, nicht löschen
    // Das Ereignis e1 von A, genau einmal und unverändert (B darf später eine eigene Zeile mit derselben Kennung haben)
    const unveraendert = async () => { const x = await alle("lern_ereignisse", "id=eq." + e1.id + "&user_id=eq." + A.id);
      return x.length === 1 && x[0].bewertung === 3; };
    r = await anfrage("PATCH", "/rest/v1/lern_ereignisse?id=eq." + e1.id, { token: A.token, daten: { bewertung: 1 } });
    pruefe("A kann das eigene Ereignis nicht ändern", await unveraendert(), kurz(r));
    r = await anfrage("DELETE", "/rest/v1/lern_ereignisse?id=eq." + e1.id, { token: A.token });
    pruefe("A kann das eigene Ereignis nicht löschen", await unveraendert(), kurz(r));
    r = await anfrage("PATCH", "/rest/v1/lern_ereignisse?id=eq." + e1.id, { token: B.token, daten: { bewertung: 1 } });
    pruefe("B kann das Ereignis von A nicht ändern", await unveraendert(), kurz(r));
    r = await anfrage("DELETE", "/rest/v1/lern_ereignisse?id=eq." + e1.id, { token: B.token });
    pruefe("B kann das Ereignis von A nicht löschen", await unveraendert(), kurz(r));

    // Doppelt hochgeladen
    r = await anfrage("POST", "/rest/v1/lern_ereignisse", { token: A.token, daten: Object.assign({}, e1, { bewertung: 1 }),
                                                            prefer: "resolution=ignore-duplicates,return=minimal" });
    pruefe("doppelt hochgeladen (wie beim Abgleich): angenommen, gezählt einmal, das erste bleibt",
      erfolg(r) && await unveraendert(), kurz(r));
    r = await anfrage("POST", "/rest/v1/lern_ereignisse", { token: A.token, daten: Object.assign({}, e1, { bewertung: 1 }), prefer: "return=minimal" });
    pruefe("doppelt ohne Hinweis: abgelehnt, das erste bleibt", !erfolg(r) && await unveraendert(), kurz(r));
    r = await anfrage("POST", "/rest/v1/lern_ereignisse", { token: B.token, daten: e1, prefer: "return=minimal" });
    z = await alle("lern_ereignisse", "id=eq." + e1.id);
    pruefe("dieselbe Kennung bei B ist ein eigenes Ereignis von B, das von A bleibt",
      erfolg(r) && z.length === 2 && z.some(x => x.user_id === B.id) && await unveraendert(), kurz(r));

    // Ungültige Werte
    const UNGUELTIG = [
      ["unbekannte Art", { art: "loeschen" }],
      ["Antwort ohne Bewertung", { bewertung: null }],
      ["Bewertung 5", { bewertung: 5 }],
      ["Übernahme mit Bewertung", { art: "uebernahme" }],
      ["Kennung ist keine UUID", { id: "abc" }],
      ["leere Wortkennung", { wort_id: "" }],
      ["Wortkennung über 200 Zeichen", { wort_id: "x".repeat(201) }],
      ["Gerätekennung über 64 Zeichen", { geraet_id: "x".repeat(65) }],
      ["Zusatzdaten über 16 KB", { art: "uebernahme", bewertung: null, daten: { x: "x".repeat(17000) } }],
      ["Lerntag keine ganze Zahl", { tag: 1.5 }]
    ];
    for(const [name, aenderung] of UNGUELTIG){
      const e = ereignis(aenderung);
      r = await anfrage("POST", "/rest/v1/lern_ereignisse", { token: A.token, daten: e, prefer: "return=minimal" });
      const da = typeof e.id === "string" && /^[0-9a-f-]{36}$/.test(e.id) ? await alle("lern_ereignisse", "id=eq." + e.id) : [];
      pruefe("abgelehnt: " + name, !erfolg(r) && da.length === 0, kurz(r));
    }
    const gut = [ereignis({ art: "uebernahme", bewertung: null, daten: { stufe: 2, faellig: 1 } }),
                 ereignis({ art: "uebernahme", bewertung: null, daten: null }),
                 ereignis({ art: "widerruf", bewertung: null, daten: e1.id })];
    r = await anfrage("POST", "/rest/v1/lern_ereignisse", { token: A.token, daten: gut, prefer: "return=minimal" });
    pruefe("gültig: Übernahme mit und ohne Zustand, Widerruf mit Bezug (mehrere auf einmal)",
      erfolg(r) && (await alle("lern_ereignisse", "user_id=eq." + A.id)).length >= 4, kurz(r));

    // Keine Funktion von außen aufrufbar
    r = await anfrage("POST", "/rest/v1/rpc/ereignis_stempeln", { token: A.token, daten: {} });
    pruefe("Stempel-Funktion ist nicht aufrufbar", !erfolg(r), kurz(r));

    /* ======================================================== Einstellungen und Dojo */
    for(const t of ["einstellungen", "dojo_stand"]){
      console.log("\n" + (t === "einstellungen" ? "Einstellungen" : "Dojo-Stand"));
      const eigen = async k => (await alle(t, "user_id=eq." + k.id))[0] || null;
      r = await anfrage("POST", "/rest/v1/" + t, { token: A.token, prefer: "return=minimal",
                                                    daten: { daten: { wert: "a1" }, geaendert_am: "2000-01-01T00:00:00Z" } });
      let za = await eigen(A);
      pruefe("A legt die eigene Zeile an", erfolg(r) && !!za && za.daten.wert === "a1", kurz(r));
      pruefe("Änderungszeit setzt die Datenbank", !!za && jetztNah(za.geaendert_am), za && za.geaendert_am);
      r = await anfrage("POST", "/rest/v1/" + t, { token: A.token, prefer: "resolution=merge-duplicates,return=minimal",
                                                    daten: { daten: { wert: "a2" } } });
      za = await eigen(A);
      pruefe("A überschreibt die eigene Zeile (wie beim Abgleich)", erfolg(r) && !!za && za.daten.wert === "a2", kurz(r));
      r = await anfrage("PATCH", "/rest/v1/" + t + "?user_id=eq." + A.id, { token: A.token, daten: { daten: { wert: "a3" } } });
      za = await eigen(A);
      pruefe("A ändert die eigene Zeile", erfolg(r) && !!za && za.daten.wert === "a3", kurz(r));

      r = await anfrage("POST", "/rest/v1/" + t, { token: B.token, prefer: "return=minimal", daten: { daten: { wert: "b1" } } });
      pruefe("B legt die eigene Zeile an", erfolg(r) && !!(await eigen(B)), kurz(r));
      r = await anfrage("GET", "/rest/v1/" + t + "?select=*", { token: B.token });
      pruefe("B sieht die Zeile von A nicht", erfolg(r) && !liste(r).some(x => x.user_id === A.id) && liste(r).length === 1, kurz(r));
      r = await anfrage("PATCH", "/rest/v1/" + t + "?user_id=eq." + A.id, { token: B.token, daten: { daten: { wert: "von-b" } } });
      za = await eigen(A);
      pruefe("B kann die Zeile von A nicht ändern", !!za && za.daten.wert === "a3", kurz(r));
      r = await anfrage("POST", "/rest/v1/" + t, { token: B.token, prefer: "resolution=merge-duplicates,return=minimal",
                                                    daten: { user_id: A.id, daten: { wert: "von-b" } } });
      za = await eigen(A);
      pruefe("B kann die Zeile von A auch nicht über Anlegen überschreiben", !!za && za.daten.wert === "a3", kurz(r));
      r = await anfrage("PATCH", "/rest/v1/" + t + "?user_id=eq." + A.id, { token: A.token, daten: { user_id: B.id } });
      za = await eigen(A);
      let zb = await eigen(B);
      pruefe("A kann die eigene Zeile nicht an B weitergeben", !!za && za.user_id === A.id && !!zb && zb.daten.wert !== "a3", kurz(r));
      r = await anfrage("DELETE", "/rest/v1/" + t + "?user_id=eq." + A.id, { token: B.token });
      pruefe("B kann die Zeile von A nicht löschen", !!(await eigen(A)), kurz(r));
      r = await anfrage("DELETE", "/rest/v1/" + t + "?user_id=eq." + A.id, { token: A.token });
      pruefe("auch A löscht die eigene Zeile nicht (nur mit dem Konto zusammen)", !!(await eigen(A)), kurz(r));
      r = await anfrage("PATCH", "/rest/v1/" + t + "?user_id=eq." + A.id, { daten: { daten: { wert: "anonym" } } });
      za = await eigen(A);
      pruefe("ohne Anmeldung: nichts änderbar", !!za && za.daten.wert === "a3", kurz(r));
      const gross = t === "einstellungen" ? 70000 : 1100000;
      r = await anfrage("PATCH", "/rest/v1/" + t + "?user_id=eq." + A.id, { token: A.token, daten: { daten: { wert: "x".repeat(gross) } } });
      za = await eigen(A);
      pruefe("zu große Daten abgelehnt (" + Math.round(gross / 1000) + " KB)", !erfolg(r) && !!za && za.daten.wert === "a3", kurz(r));
      r = await anfrage("PATCH", "/rest/v1/" + t + "?user_id=eq." + A.id, { token: A.token, daten: { daten: [1, 2] } });
      za = await eigen(A);
      pruefe("Daten müssen ein Objekt sein", !erfolg(r) && !!za && za.daten.wert === "a3", kurz(r));
    }

    /* ======================================================== Konto löschen */
    console.log("\nKonto löschen");
    r = await kontoLoeschen(A);
    const rest = (await alle("lern_ereignisse", "user_id=eq." + A.id)).length
               + (await alle("einstellungen", "user_id=eq." + A.id)).length
               + (await alle("dojo_stand", "user_id=eq." + A.id)).length;
    pruefe("gelöschtes Konto A: alle seine Zeilen sind weg", erfolg(r) && rest === 0, kurz(r) + " / übrig: " + rest);
    pruefe("die Zeilen von B bleiben", (await alle("lern_ereignisse", "user_id=eq." + B.id)).length === 1
      && (await alle("einstellungen", "user_id=eq." + B.id)).length === 1);
  } finally {
    await kontoLoeschen(A).catch(() => {});
    await kontoLoeschen(B).catch(() => {});
  }

  console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
  process.exit(fehler ? 1 : 0);
})().catch(e => { console.log("TESTABBRUCH: " + e.message); process.exit(2); });
