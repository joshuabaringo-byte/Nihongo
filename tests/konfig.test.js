/* Prüft die Verbindungsdaten in konfig.js und dass kein geheimer Schlüssel
   im Repo steht.

   Aufruf:  node tests/konfig.test.js     (braucht nur Node und git)
   In konfig.js gehören nur die Projekt-URL und der öffentliche Schlüssel
   (publishable key oder anon key). Der geheime Schlüssel (secret key,
   service_role) und das Datenbank-Passwort haben im Repo und in der App
   nichts zu suchen: Die App ist öffentlich lesbar. */
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { execFileSync } = require("child_process");
const WURZEL = path.join(__dirname, "..");

let fehler = 0;
function pruefe(name, ok, detail){
  if(!ok) fehler++;
  console.log((ok ? "  ok     " : "  FEHLER ") + name + (detail !== undefined && !ok ? "  [" + detail + "]" : ""));
}
/* Inhalt eines JWT, ohne Prüfung der Signatur */
function jwtInhalt(t){
  try{ return JSON.parse(Buffer.from(t.split(".")[1], "base64url").toString("utf8")); }catch(e){ return null; }
}

console.log("\nkonfig.js");
const umgebung = { window: {} };
let lauf = true;
try{ vm.runInNewContext(fs.readFileSync(path.join(WURZEL, "konfig.js"), "utf8"), umgebung, { timeout: 1000 }); }catch(e){ lauf = false; }
const k = umgebung.window.KOTOBA_KONFIG;
pruefe("konfig.js läuft und setzt window.KOTOBA_KONFIG", lauf && !!k && typeof k === "object");
const url = k && k.supabaseUrl, key = k && k.supabaseKey;
pruefe("supabaseUrl und supabaseKey sind Texte", typeof url === "string" && typeof key === "string");
pruefe("beide gesetzt oder beide leer", !!url === !!key);
if(url){
  pruefe("URL: https, ohne Pfad (" + url + ")", /^https:\/\/[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(url), url);
  const jwt = jwtInhalt(key);
  pruefe("Schlüssel ist der öffentliche (sb_publishable_… oder anon)",
    /^sb_publishable_[A-Za-z0-9_-]+$/.test(key) || (!!jwt && jwt.role === "anon"), key.slice(0, 15) + "…");
}else{
  console.log("  (noch nicht eingerichtet: die App zeigt die Anmeldung erst mit URL und Schlüssel)");
}

console.log("\nKein geheimer Schlüssel im Repo");
let dateien;
try{
  dateien = execFileSync("git", ["ls-files", "-z"], { cwd: WURZEL, encoding: "utf8" }).split("\0").filter(Boolean);
}catch(e){
  pruefe("git ls-files", false, String(e.message).split("\n")[0]);
  dateien = [];
}
const BINAER = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf|pdf|zip)$/i;
const GEHEIM = /sb_secret_[A-Za-z0-9_-]{10,}/;
const JWT = /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g;
const DB_PASSWORT = /postgres(ql)?:\/\/[^:\s/]+:[^@\s]+@[^\s"'`]*supabase\.(co|com)/i;
const funde = [];
dateien.filter(d => !BINAER.test(d)).forEach(d => {
  let inhalt;
  try{ inhalt = fs.readFileSync(path.join(WURZEL, d), "utf8"); }catch(e){ return; }
  if(GEHEIM.test(inhalt)) funde.push(d + ": secret key");
  (inhalt.match(JWT) || []).forEach(t => { const j = jwtInhalt(t); if(j && j.role && j.role !== "anon") funde.push(d + ": JWT mit Rolle " + j.role); });
  if(DB_PASSWORT.test(inhalt)) funde.push(d + ": Datenbank-Adresse mit Passwort");
});
// Nur Dateinamen und Art des Fundes ausgeben, nie den Schlüssel selbst.
pruefe(dateien.length + " Dateien durchsucht: kein secret key, kein service_role, kein Datenbank-Passwort", funde.length === 0, funde.join("; "));

console.log(fehler ? "\n" + fehler + " Prüfung(en) FEHLGESCHLAGEN" : "\nalle Prüfungen bestanden");
process.exit(fehler ? 1 : 0);
