/* Verbindung zum eigenen Supabase-Projekt (Konto und später Abgleich).
   Hier stehen nur die Projekt-URL und der öffentliche Schlüssel
   (publishable key, "sb_publishable_…"). Beide sind dafür gemacht, in einer
   Web-App zu stehen; geschützt sind die Daten durch die Anmeldung und die
   Regeln in der Datenbank (supabase/migrations).
   NIE hier eintragen: den geheimen Schlüssel (secret key, service_role) und
   das Datenbank-Passwort. tests/konfig.test.js prüft das.
   Leer gelassen bleibt das Konto aus; die App läuft wie bisher ohne Anmeldung. */
window.KOTOBA_KONFIG = {
  supabaseUrl: "https://idkgpaitqrhccbidzkde.supabase.co",
  supabaseKey: "sb_publishable__ty4Tae_HVUGE88YqkXAwA_477tpc2z"
};
