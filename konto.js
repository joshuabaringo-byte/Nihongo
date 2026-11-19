/* ==================================================================
   ことば - Konto: Anmelden mit einem Code per E-Mail (Paket 4a)
   Braucht app.js (window.KOTOBA) und konfig.js (window.KOTOBA_KONFIG).

   - Die Supabase-Bibliothek (supabase-js/supabase.js, unverändert) wird erst
     geladen, wenn sie gebraucht wird: beim Anfordern und Prüfen eines Codes
     und beim Abmelden. Ohne Konto startet die App so schnell wie bisher.
   - Angemeldet arbeitet die App im Profil des Kontos (Name = Benutzer-
     kennung). Beim ersten Anmelden auf einem Gerät fragt sie, ob der
     Lernstand ohne Konto übernommen werden soll; er wird kopiert, nicht
     verschoben.
   - Auf dem Gerät gespeichert:
       kotoba-konto       wer angemeldet ist: { id, email }
       kotoba-anmeldung   die Sitzung der Bibliothek (Zugangsschlüssel)
     Ohne kotoba-konto gilt das Gerät als abgemeldet; eine übrig gebliebene
     Sitzung wird dann beim Start entfernt.
   - Neue Konten legt die App nie an (shouldCreateUser: false); auf dem
     Server ist das Registrieren zusätzlich abgeschaltet.
   Der Abgleich zwischen Geräten folgt in Paket 4b.
   ================================================================== */
(function(){
"use strict";
var K = window.KOTOBA;
if(!K || !K.profilWechseln) return;            // app.js fehlt oder stammt aus einem anderen Stand

var KONFIG = window.KOTOBA_KONFIG || {};
var URL_SB = typeof KONFIG.supabaseUrl === "string" ? KONFIG.supabaseUrl.replace(/\/+$/, "") : "";
var SCHLUESSEL = typeof KONFIG.supabaseKey === "string" ? KONFIG.supabaseKey : "";
var EINGERICHTET = /^https?:\/\/[^\s\/]+$/.test(URL_SB) && !!SCHLUESSEL;
var K_KONTO = "kotoba-konto";
var SITZUNG = "kotoba-anmeldung";               // Speichername der Sitzung in der Bibliothek
var BIBLIOTHEK = "supabase-js/supabase.js";
var ABMELDEN_HOECHSTENS = 5000;                 // ms; danach wird ohne Antwort des Servers abgemeldet

function $(id){ return document.getElementById(id); }
var esc = K.esc;

/* ---------- Gespeicherter Zustand ---------- */
function gueltigeKennung(id){
  return typeof id === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
function kontoLesen(){
  var k = K.hole(K_KONTO, null);
  return k && gueltigeKennung(k.id) && typeof k.email === "string" ? k : null;
}
function sitzungEntfernen(){
  try{
    for(var i = localStorage.length - 1; i >= 0; i--){
      var n = localStorage.key(i);
      if(n === SITZUNG || n.indexOf(SITZUNG + "-") === 0) localStorage.removeItem(n);
    }
  }catch(e){ /* dann ist nichts zu entfernen */ }
}

/* ---------- Bibliothek nur bei Bedarf ---------- */
var laden = null, client = null;
function bibliothek(){
  if(window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
  if(!laden) laden = new Promise(function(fertig, fehler){
    var s = document.createElement("script");
    function gescheitert(){
      laden = null;
      if(s.parentNode) s.parentNode.removeChild(s);
      var e = new Error("Bibliothek nicht geladen"); e.art = "bibliothek";
      fehler(e);
    }
    s.src = BIBLIOTHEK;
    s.onload = function(){ if(window.supabase && window.supabase.createClient) fertig(window.supabase); else gescheitert(); };
    s.onerror = gescheitert;
    document.head.appendChild(s);
  });
  return laden;
}
function verbindung(){
  return bibliothek().then(function(sb){
    if(!client) client = sb.createClient(URL_SB, SCHLUESSEL, { auth: {
      storageKey: SITZUNG, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    return client;
  });
}

/* ---------- Meldungen ---------- */
function fehlerText(e, schritt){
  if(e && e.art === "bibliothek") return "Für die Anmeldung braucht die App eine Internetverbindung. Bitte später noch einmal versuchen.";
  var code = (e && e.code) || "", status = e && e.status, text = String((e && e.message) || "");
  if((e && e.name === "AuthRetryableFetchError") || status === 0 || (!status && /fetch|network|load/i.test(text))){
    return "Keine Verbindung zum Server. Bitte später noch einmal versuchen.";
  }
  if(code === "otp_disabled" || code === "signup_disabled" || /signups? not allowed/i.test(text)){
    return "Für diese E-Mail-Adresse gibt es kein Konto. Neue Konten lassen sich derzeit nicht anlegen.";
  }
  if(code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || status === 429){
    return "Zu viele Versuche. Bitte ein paar Minuten warten und es dann noch einmal versuchen.";
  }
  if(code === "email_address_not_authorized"){
    return "An diese Adresse kann der Server noch keine Mail schicken. Dafür braucht das Projekt einen eigenen Mailversand.";
  }
  if(code === "email_address_invalid" || (schritt === "anfordern" && code === "validation_failed")){
    return "Bitte eine gültige E-Mail-Adresse eingeben.";
  }
  if(schritt === "pruefen" && (code === "otp_expired" || code === "invalid_credentials" || status === 400 || status === 401 || status === 403)){
    return "Der Code stimmt nicht oder ist abgelaufen. Bitte prüfen oder einen neuen anfordern.";
  }
  if(status >= 500) return "Der Server antwortet gerade nicht. Bitte später noch einmal versuchen.";
  return "Das hat nicht geklappt" + (code ? " (" + code + ")" : "") + ". Bitte später noch einmal versuchen.";
}
function meldung(text, istFehler){
  var m = $("kontoMeldung");
  if(!m) return;
  m.textContent = text || "";
  m.classList.toggle("fehler", !!istFehler);
}

/* ---------- Anzeige ---------- */
var schritt = "email", adresse = "", beschaeftigt = false;
function sperren(an){
  beschaeftigt = an;
  var f = $("kontoFormular");
  if(f) Array.prototype.forEach.call(f.elements, function(e){ e.disabled = an; });
}
var MELDUNG = '<p class="kontomeldung" id="kontoMeldung" role="status" aria-live="polite"></p>';
function zeichnen(){
  var box = $("konto");
  if(!box) return;
  var konto = kontoLesen();
  if(konto){
    box.innerHTML = '<div class="info" id="kontoText">Angemeldet als <b>' + esc(konto.email) + "</b>. "
      + "Der Abgleich zwischen deinen Geräten kommt mit einer der nächsten Versionen; bis dahin bleibt "
      + "der Lernstand dieses Kontos auf diesem Gerät.</div>" + MELDUNG
      + '<button class="knopf" id="kontoAbmelden">Abmelden</button>'
      + '<button class="knopf warn" id="kontoEntfernen">Abmelden und Daten von diesem Gerät entfernen</button>';
    $("kontoAbmelden").addEventListener("click", function(){ abmelden(false); });
    $("kontoEntfernen").addEventListener("click", function(){ abmelden(true); });
    return;
  }
  if(!EINGERICHTET){
    box.innerHTML = '<div class="info" id="kontoText">Die Anmeldung ist noch nicht eingerichtet. '
      + "Ohne Konto bleibt der Lernstand wie bisher auf diesem Gerät.</div>";
    return;
  }
  if(schritt === "code"){
    box.innerHTML = '<div class="info" id="kontoText">Gib den Code aus der E-Mail an <b>' + esc(adresse) + "</b> ein.</div>"
      + '<form id="kontoFormular" novalidate>'
      + '<input class="feld" id="kontoCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="10" '
      + 'placeholder="Code aus der E-Mail" aria-label="Code aus der E-Mail">'
      + '<button class="knopf voll" id="kontoAnmelden" type="submit">Anmelden</button></form>' + MELDUNG
      + '<button class="knopf" id="kontoZurueck" type="button">Andere Adresse oder neuer Code</button>';
    $("kontoFormular").addEventListener("submit", function(e){ e.preventDefault(); codePruefen(); });
    $("kontoZurueck").addEventListener("click", function(){ if(beschaeftigt) return; schritt = "email"; zeichnen(); });
    return;
  }
  box.innerHTML = '<div class="info" id="kontoText">Mit einem Konto wird dein Lernstand später zwischen deinen '
    + "Geräten abgeglichen. Zum Anmelden bekommst du einen Code per E-Mail. Neue Konten lassen sich derzeit "
    + "nicht anlegen.</div>"
    + '<form id="kontoFormular" novalidate>'
    + '<input class="feld" id="kontoEmail" type="email" autocomplete="email" autocapitalize="off" spellcheck="false" '
    + 'placeholder="E-Mail-Adresse" aria-label="E-Mail-Adresse">'
    + '<button class="knopf voll" id="kontoCodeAnfordern" type="submit">Code anfordern</button></form>' + MELDUNG;
  $("kontoEmail").value = adresse;
  $("kontoFormular").addEventListener("submit", function(e){ e.preventDefault(); codeAnfordern(); });
}

/* ---------- Anmelden ---------- */
function codeAnfordern(){
  if(beschaeftigt) return;
  var email = String($("kontoEmail").value || "").trim().toLowerCase();
  if(email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    meldung("Bitte eine gültige E-Mail-Adresse eingeben.", true);
    return;
  }
  adresse = email;
  sperren(true);
  meldung("Code wird angefordert …");
  verbindung().then(function(c){
    return c.auth.signInWithOtp({ email: email, options: { shouldCreateUser: false } });
  }).then(function(r){
    if(r && r.error) throw r.error;
    beschaeftigt = false;
    schritt = "code";
    zeichnen();
    meldung("Der Code ist unterwegs an " + email + ". Falls nichts ankommt, sieh im Spam-Ordner nach.");
  }).catch(function(e){
    sperren(false);
    meldung(fehlerText(e, "anfordern"), true);
  });
}
function codePruefen(){
  if(beschaeftigt) return;
  var code = String($("kontoCode").value || "").replace(/\s+/g, "");
  if(!/^\d{6,10}$/.test(code)){
    meldung("Bitte den Code aus der E-Mail eingeben (nur Ziffern).", true);
    return;
  }
  sperren(true);
  meldung("Code wird geprüft …");
  verbindung().then(function(c){
    return c.auth.verifyOtp({ email: adresse, token: code, type: "email" });
  }).then(function(r){
    if(r && r.error) throw r.error;
    var u = r && r.data && (r.data.user || (r.data.session && r.data.session.user));
    if(!u || !gueltigeKennung(u.id)) throw new Error("Anmeldung ohne Benutzer");
    angemeldet(u.id, u.email || adresse);
  }).catch(function(e){
    sperren(false);
    meldung(fehlerText(e, "pruefen"), true);
  });
}
/* Beim ersten Anmelden auf diesem Gerät (das Profil des Kontos ist noch leer)
   wird nachgefragt, ob der Lernstand ohne Konto übernommen werden soll. */
function angemeldet(id, email){
  function zurueck(text){
    sitzungEntfernen();                        // nicht halb angemeldet bleiben
    K.entferne(K_KONTO);
    sperren(false);
    meldung(text, true);
  }
  if(!K.profilNamen(id).length){
    var g = K.gastDaten();
    if(g.woerter > 0 || g.dojo){
      var was = g.woerter > 0 ? K.woerterText(g.woerter) + " begonnen" : "";
      if(g.dojo) was += was ? ", dazu Fortschritt im Dojo" : "Fortschritt im Dojo";
      var ja = confirm("Auf diesem Gerät gibt es einen Lernstand ohne Konto (" + was + ").\n\n"
        + "In dein Konto übernehmen? Er bleibt dabei auch ohne Anmeldung erhalten.\n\n"
        + "OK: übernehmen\nAbbrechen: im Konto ohne ihn beginnen");
      if(ja && !K.gastKopieren(id)){ zurueck("Übernehmen ging nicht, der Speicher ist voll. Du bist nicht angemeldet."); return; }
    }
  }
  if(!K.lege(K_KONTO, { id: id, email: email }) || !K.profilWechseln(id, "Angemeldet als " + email)){
    zurueck("Speichern ging nicht. Du bist nicht angemeldet.");
  }
}

/* ---------- Abmelden ----------
   Die Bibliothek beendet die Sitzung auch auf dem Server. Ist der nicht
   erreichbar, wird nach kurzer Zeit trotzdem abgemeldet: Die Sitzung auf
   dem Gerät wird gelöscht und ist damit nicht mehr nutzbar. */
function abmelden(entfernen){
  if(beschaeftigt) return;
  var konto = kontoLesen();
  if(entfernen && !confirm("Abmelden und den Lernstand dieses Kontos von diesem Gerät löschen?\n\n"
      + "Achtung: Bis der Abgleich zwischen Geräten kommt, liegt der Lernstand des Kontos nur auf diesem Gerät. "
      + "Gelöscht ist er dann weg, außer du hast ihn vorher als Datei gesichert.")) return;
  beschaeftigt = true;
  meldung("Abmelden …");
  var fertig = false;
  function weiter(){
    if(fertig) return;
    fertig = true;
    sitzungEntfernen();
    K.entferne(K_KONTO);
    if(entfernen && konto) K.profilEntfernen(konto.id);
    var text = entfernen ? "Abgemeldet, Daten dieses Kontos vom Gerät entfernt" : "Abgemeldet";
    if(!K.profilWechseln(K.GAST, text)){ beschaeftigt = false; meldung("Abgemeldet, aber das Profil ließ sich nicht wechseln. Bitte die App neu öffnen.", true); }
  }
  setTimeout(weiter, ABMELDEN_HOECHSTENS);
  try{
    verbindung().then(function(c){ return c.auth.signOut({ scope: "local" }); }).then(weiter, weiter);
  }catch(e){ weiter(); }
}

/* ---------- Start ---------- */
function start(){
  var konto = kontoLesen();
  if(!konto){
    sitzungEntfernen();                        // übrig gebliebene Sitzung ohne Konto-Vermerk
  }else if(K.profil !== konto.id){
    // Das Anmelden wurde unterbrochen, bevor das Profil gewechselt war: jetzt
    // vollenden, höchstens einmal je Sitzung des Browsers.
    var merker = "kotoba-konto-wechsel", schon = true;
    try{ schon = sessionStorage.getItem(merker) === konto.id; sessionStorage.setItem(merker, konto.id); }catch(e){ /* dann nicht */ }
    if(!schon && K.profilWechseln(konto.id, "Angemeldet als " + konto.email)) return;
  }
  zeichnen();
}
start();
})();
