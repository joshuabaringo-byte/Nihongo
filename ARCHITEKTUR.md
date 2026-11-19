# Architektur: mehrere Benutzer, Synchronisierung, Supabase

Die App ist heute privat und läuft nur im Browser, ohne Server. Später soll sie Daten
über Supabase zwischen Geräten abgleichen und vielleicht öffentlich mit mehreren
Benutzerkonten laufen. Dieses Dokument beschreibt die Zielarchitektur, damit die
Datenstruktur schon jetzt nicht von einem einzelnen Benutzer ausgeht.

Stand: Paket 3a (Kennungen, Gerät, Profile) und Paket 3b (Lernereignisse) sind
umgesetzt. Paket 4 (Supabase) ist geplant; was dazu hier steht, ist Entwurf.

## 1. Schichten

| Schicht | Inhalt | Gehört |
|---|---|---|
| Globale Inhalte | Vokabeln, Bilder, JLPT-Aufgaben, Lesetexte: feste Dateien in der App | allen, nur lesbar |
| Lernereignisse (3b) | jede Antwort als unveränderlicher Eintrag; die Grundlage für alles andere | genau einem Benutzer |
| Abgeleiteter Stand | Zustand jedes Wortes, aus den Ereignissen nachgerechnet; schneller Zwischenspeicher | genau einem Benutzer |
| Einstellungen, Dojo | die meisten je Benutzer, manche nur je Gerät (Abschnitt 5) | Benutzer bzw. Gerät |
| Server (Paket 4) | Anmeldung, Ereignisse, Einstellungen, Dojo; Row Level Security | jede Zeile genau einem Benutzer |

Grundsätze:

- **Inhalte und Fortschritt sind getrennt.** Globale Inhalte enthalten nie Daten eines
  Benutzers. Benutzerdaten verweisen nur über Kennungen auf Inhalte.
- **Keine feste Benutzer-ID.** Lokal gehören Daten zu einem Profil, auf dem Server zu
  `user_id`. Die setzt die Datenbank aus der Anmeldung (`auth.uid()`), nie die App.
- **Ereignisse werden nur angehängt.** Korrekturen sind selbst Ereignisse. Daten
  mehrerer Geräte lassen sich so in beliebiger Reihenfolge vereinigen.
- **Jedes Ereignis hat eine zufällige Kennung (UUID)** vom Gerät. Doppelt hochgeladen
  ist es trotzdem nur einmal gespeichert.

## 2. Kennungen der Inhalte (umgesetzt in 3a)

- Wörter: `Abschnitt|Kana`, bei gleicher Lesung im selben Abschnitt mit Kanji oder
  Bedeutung angehängt (`8-9|～かい|～階`). Dojo: Kennungen der JLPT-Aufgaben
  (`5l01`), Lesetexte (`t5-1`), Bilder (das Zeichen) und Bildgruppen.
- Eine veröffentlichte Kennung ändert sich nie. `tests/kennungen.json` verzeichnet alle
  je veröffentlichten Kennungen und wächst nur (`node werkzeug/kennungen.js`).
- Wird ein Wort verschoben oder seine Lesung korrigiert, kommt die alte Kennung in
  `UMLEITUNGEN` (`vokabeln.js`). Die App zieht Lernstände beim Laden um; gibt es unter
  der neuen Kennung schon einen Stand, bleibt der alte unangetastet liegen.
- `tests/kennungen.test.js` schlägt fehl, wenn eine Kennung ohne Umleitung verschwindet
  oder ein Wort mit gleicher Lesung seine Kennung mit einem anderen tauscht.
- Für Dojo-Kennungen gibt es noch keine Umleitungen. Muss sich eine ändern, braucht
  `dojo.js` zuerst dieselbe Umleitung.

## 3. Gerät und Profile (umgesetzt in 3a)

`kotoba-geraet` gilt für das Gerät: `{ id: <zufällige UUID>, profil: <aktives Profil> }`.
Die Gerätekennung sagt nichts über den Benutzer.

Ein Gerät kann mehrere Profile tragen. Kein Profil sieht oder überschreibt die Daten
eines anderen, auch nicht die gesicherten Kopien unlesbarer Daten.

| Inhalt | Gast-Profil (`gast`) | jedes andere Profil `<p>` |
|---|---|---|
| Lernstand | `kotoba-v2` | `kotoba:<p>:stand` |
| Einstellungen | `kotoba-einst` | `kotoba:<p>:einst` |
| Dojo | `kotoba-dojo` | `kotoba:<p>:dojo` |
| aufbewahrter Stand | `kotoba-v2-vorher` | `kotoba:<p>:vorher` |
| Lernereignisse: Verzeichnis | `kotoba-ereignisse` | `kotoba:<p>:ereignisse` |
| Lernereignisse: Teile | `kotoba-ereignisse-<n>` | `kotoba:<p>:ereignisse-<n>` |
| unlesbare Daten, gesichert | `<Name>-unlesbar-<Zeit>` | `kotoba:<p>:<name>-unlesbar-<Zeit>` |

- Das Gast-Profil nutzt die bisherigen Namen; es wurde nichts umkopiert.
- Erlaubte Profilnamen: Buchstaben, Ziffern, `-` und `_`, höchstens 64 Zeichen.
  Ungültige Werte fallen auf `gast` zurück.
- Das Profil eines angemeldeten Benutzers ist seine Supabase-`user_id` (umgesetzt in 4a).
- Die App bleibt ohne Konto nutzbar; dann arbeitet sie im Gast-Profil, nur lokal.
- Für das Gerät, nicht für ein Profil, gelten außerdem `kotoba-konto` (wer angemeldet
  ist: `{ id, email }`) und `kotoba-anmeldung` (die Sitzung der Supabase-Bibliothek).

## 4. Lernereignisse (umgesetzt in 3b)

| Feld | Bedeutung |
|---|---|
| `id` | zufällige UUID vom Gerät |
| `art` | `antwort`; `uebernahme` (fester Stand eines Wortes); `widerruf` (Rückgängig) |
| `wort` | Kennung des Wortes |
| `bewertung` | 1 bis 4 (nochmal, schwer, sitzt, leicht), nur bei `antwort` |
| `zeit` | Zeitpunkt auf dem Gerät |
| `tag` | Lerntag nach dem 4-Uhr-Wechsel, so wie das Gerät ihn erlebt hat |
| `geraet` | Gerätekennung |
| `plan` | Version des Wiederholungsplans (ts-fsrs, Modell, Einstellungen) |
| `daten` | Zustand bei `uebernahme`, Kennung des widerrufenen Ereignisses bei `widerruf` |

- **Zuordnung:** Ein Ereignis gehört lokal über das Profil, auf dem Server über
  `user_id` zu einem Benutzer; im Ereignis selbst steht keine Benutzer-ID.
- **Nachrechnen eines Wortes:** letzte `uebernahme`, dann alle späteren Antworten in
  der Reihenfolge (`zeit`, `id`), ohne widerrufene, durch `plan.js` und ts-fsrs. Die
  Tage zwischen zwei Antworten zählen nach `tag`, nicht nach der Zeitzone des
  rechnenden Geräts; so rechnet jedes Gerät dasselbe.
- **Vereinigen:** Ereignisse mehrerer Geräte werden über `id` vereinigt; doppelte zählen
  einmal, die Reihenfolge des Eintreffens ist egal.
- **Erster Start von 3b:** Der vorhandene Stand wird je Wort als `uebernahme`
  übernommen. Eine Historie der Antworten davor gibt es nicht.
- **Laden einer Sicherung, Zurücksetzen, Zurückholen** erzeugen `uebernahme`-Ereignisse.
  So übertragen sie sich auf andere Geräte; spätere Antworten von dort setzen darauf auf.
- **Tageszähler für neue Wörter:** Jeder Stand hält den Lerntag seiner ersten Antwort
  fest (`erst`); gezählt werden Wörter mit `erst` = heute. Das ergibt sich aus der
  Historie und stimmt über Tabs und Geräte hinweg.
- **Rückgängig:** Ein Schritt, bis zum Neuladen; die App hält ein `widerruf`-Ereignis fest.
- **Üben vor dem Termin,** das den Plan nicht ändert („unverändert“), wird nicht
  festgehalten.
- **Speicherung** (`app.js`): je Profil in Teilen zu höchstens 500 Ereignissen, gepackt
  (Gerät und Plan stehen einmal je Teil); ein Verzeichnis nennt die Teile und ihre Größe.
  Beim Antworten wird nur der jüngste Teil frisch gelesen und geschrieben, das Ereignis vor
  dem Stand. Scheitert das Speichern, bleibt es vorgemerkt.
- **Speicherplatz:** etwa 100 Zeichen je Antwort. Der Speicher im Browser fasst auf dem
  iPhone etwa 5 MB. Über 2 MB fasst die App die ältesten drei Viertel zu einer
  `uebernahme` je Wort zusammen; der Stand bleibt exakt gleich. Mit Supabase liegt die
  vollständige Historie auf dem Server, lokal bleibt nur, was noch nicht hochgeladen ist.
- **Sicherung Format 3** enthält die Historie; beim Laden wird sie übernommen (doppelte
  Kennungen einmal) und der geladene Stand je Wort als `uebernahme` festgehalten.

## 5. Einstellungen: je Benutzer oder je Gerät

Vorschlag, umgesetzt in Paket 4; bis dahin gilt alles je Profil auf einem Gerät.

| Einstellung | gilt für | Grund |
|---|---|---|
| Abfragerichtung, Rōmaji, Kanji, Bilder | Benutzer | gehört zur Lernweise |
| neue Wörter pro Tag, Karten pro Durchgang, mischen | Benutzer | gehört zum Lernplan |
| Aussprache automatisch | Gerät | Lautsprecher unterscheiden sich |
| Thema hell/dunkel | Gerät | folgt oft dem Gerät |
| gewählter Abschnitt, Filter der Wortliste | Gerät | auf Telefon und Tablet oft verschieden |
| letzte Sicherung, Erinnerung | Gerät | betrifft die Datei auf diesem Gerät |
| Tageszähler neue Wörter | – | wird aus den Ereignissen gezählt (3b) |
| Dojo-Auswahl (Bildersatz, Richtung, Übungsart, Schreibweise) | Gerät | Bedienung |
| Dojo-Fortschritt (Zähler, Bestwerte, Serie, Blumen) | Benutzer | Lernfortschritt |

## 6. Supabase (4a umgesetzt: Datenbank und Anmeldung; 4b folgt: Abgleich)

Region: Tokio (`ap-northeast-1`), nah an den heutigen Nutzern in Japan. Auch für Nutzer
in der EU ist ein Standort in Japan grundsätzlich unproblematisch, weil die EU Japan ein
angemessenes Datenschutzniveau bescheinigt hat.

### Tabellen, Row Level Security (umgesetzt in 4a)

Das SQL steht in `supabase/migrations/20261119000000_lernstand.sql`; die Einrichtung
im README unter *Konto einrichten*.

| Tabelle | Inhalt | Rechte eines angemeldeten Benutzers |
|---|---|---|
| `lern_ereignisse` | Antworten, Übernahmen, Widerrufe wie in `verlauf.js`; Schlüssel `(user_id, id)` | eigene lesen und anlegen; nie ändern oder löschen |
| `einstellungen` | eine Zeile je Benutzer, `daten` als JSON-Objekt | eigene lesen, anlegen, ändern |
| `dojo_stand` | eine Zeile je Benutzer, `daten` als JSON-Objekt | eigene lesen, anlegen, ändern |

- **Ohne Anmeldung** (`anon`) gibt es keine Rechte an den Tabellen; mit Anmeldung nur
  an den eigenen Zeilen (Row Level Security mit `(select auth.uid()) = user_id`).
- **`user_id` und die Zeitstempel setzt ein Trigger**, was auch immer die App schickt:
  beim Anlegen `auth.uid()`, beim Ändern bleibt der bisherige Benutzer. Eine Zeile
  wandert nie zu einem anderen Konto. `empfangen_am` ist der Merker für den Abruf (4b).
- **Doppelte Uploads** sind harmlos: Mit `on conflict do nothing` (PostgREST:
  `Prefer: resolution=ignore-duplicates`) bleibt das erste Ereignis. Weil die Kennung
  je Benutzer gilt, kann kein fremdes Konto eine Kennung vorab belegen.
- **Angepasst gegenüber dem Entwurf:** `tag` ist eine ganze Zahl, genau der Lerntag der
  App (Tage seit 1970-01-01 nach dem Kalender des Geräts, Tageswechsel 4 Uhr), damit
  nichts umgerechnet werden muss. `geraet_id` ist Text bis 64 Zeichen wie in
  `verlauf.js`. Dazu Größengrenzen: `daten` eines Ereignisses 16 KB, Einstellungen
  64 KB, Dojo 1 MB.
- Die Trigger-Funktionen sind von außen nicht aufrufbar; Rechte werden ausdrücklich
  vergeben, nicht über die Voreinstellungen von Supabase.
- Keine Tabellen für Vokabeln: Die Inhalte bleiben in der App.
- Wird ein Konto gelöscht, verschwinden alle seine Zeilen mit (`on delete cascade`).
  Konto löschen in der App braucht später eine Server-Funktion mit Admin-Rechten.
- In die App kommen nur Projekt-URL und der öffentliche Schlüssel („publishable“ bzw.
  „anon“), in `konfig.js`. Der geheime Schlüssel (`secret`, `service_role`) kommt nie
  in die App oder ins Repo; `tests/konfig.test.js` prüft das.

### Anmeldung (umgesetzt in 4a, `konto.js`)

- E-Mail-Code (Einmalcode, kein Passwort). Ein Magic Link öffnet sich auf dem iPhone in
  Safari statt in der App vom Home-Bildschirm und landet im falschen Speicher. Die
  Mailvorlage (`supabase/templates/anmeldecode.html`) enthält deshalb nur den Code.
- Registrierung abgeschaltet; die App fragt Codes mit `shouldCreateUser: false` an und
  legt so nie ein Konto an. Mehrere Konten funktionieren trotzdem, sobald die
  Registrierung eingeschaltet wird. Apple- oder Google-Anmeldung lassen sich ergänzen.
- Die Bibliothek (`supabase-js/supabase.js`, unverändert) lädt `konto.js` erst beim
  Anfordern oder Prüfen eines Codes und beim Abmelden. Ohne Konto, und in 4a auch
  angemeldet, startet die App ohne sie.
- Nach dem Anmelden: `kotoba-konto` wird gesetzt, das Profil wechselt auf die
  `user_id`, die App startet neu. Abmelden beendet die Sitzung auch auf dem Server;
  antwortet er nicht, wird nach 5 Sekunden trotzdem lokal abgemeldet.
- Zustände, die sich selbst heilen: Gibt es eine Sitzung ohne `kotoba-konto`, wird sie
  beim Start entfernt. Gibt es `kotoba-konto`, aber ein anderes Profil (Anmelden
  unterbrochen), wechselt die App beim Start ins Profil des Kontos.

### Synchronisierung

1. **Hochladen:** Neue lokale Ereignisse gehen hoch; doppelte ignoriert der Server
   (`on conflict do nothing`). Erst nach Bestätigung gelten sie lokal als hochgeladen.
2. **Abholen:** Ereignisse mit `empfangen_am` nach dem letzten Abruf, mit einigen Minuten
   Überlappung, damit nichts zwischen zwei Abrufen durchrutscht; über `id` vereinigt.
3. **Nachrechnen:** nur die betroffenen Wörter. Trifft ein altes Ereignis eines lange
   offline gewesenen Geräts ein, holt die App die ganze Historie dieses Wortes.
4. **Einstellungen und Dojo:** ganzes Dokument, der neueste Stand gewinnt.
5. **Offline:** Die App arbeitet ohne Netz weiter; die Warteschlange liegt je Profil.

### Mehrere Benutzer auf einem Gerät

- Beim ersten Anmelden auf einem Gerät (das Profil des Kontos ist dort noch leer)
  fragt die App, ob die Gast-Daten ins Konto übernommen werden. In 4a werden
  Lernstand, Einstellungen, Dojo und Historie kopiert; die Gast-Daten bleiben. Mit dem
  Abgleich (4b) gehen die kopierten Ereignisse hoch und vereinigen sich mit denen
  anderer Geräte: ein Zusammenführen, kein Überschreiben.
- Meldet sich jemand anderes an, bekommt er ein eigenes Profil. Daten eines anderen
  Profils werden nie in sein Konto hochgeladen.
- Abmelden lässt die Daten auf dem Gerät; auf geteilten Geräten gibt es
  „Abmelden und Daten von diesem Gerät entfernen“. Bis 4b liegt der Lernstand eines
  Kontos nur auf dem Gerät, deshalb warnt die Rückfrage davor.

### Tests

- Row Level Security (umgesetzt, `tests/supabase.test.js`): automatisch auf GitHub
  gegen ein lokales Supabase (Supabase CLI, Docker) mit zwei Testkonten: A liest nie
  Zeilen von B, legt keine für B an, ändert und löscht keine; ohne Anmeldung kein
  Zugriff; der Server stempelt Benutzer und Zeiten; doppelte Ereignisse zählen einmal;
  ungültige Werte werden abgelehnt; ein gelöschtes Konto nimmt alles mit. Dazu über
  psql: jede Tabelle hat RLS, `anon` hat keine Rechte, keine Funktion ist aufrufbar.
- Anmeldung im Browser (umgesetzt, `tests/app.test.js konto`): mit Code aus dem
  Testpostfach, falscher Code, unbekannte Adresse, Übernahme ja und nein, Abmelden
  auch auf dem Server, Daten entfernen; ohne Server: Bibliothek nur bei Bedarf,
  Meldungen ohne Netz.
- Synchronisierung (4b): zwei simulierte Geräte, zwei Benutzer, offline und wieder
  online, doppelte Uploads, späte Ereignisse.

## 7. Migrationskosten

| Entscheidung | Aufwand jetzt | Kosten später, wenn wir es weglassen |
|---|---|---|
| Antwort-Historie | mittel (3b, erledigt) | hoch: Für alle bis dahin gegebenen Antworten fehlt die Historie dauerhaft; Abgleich nur über ganze Stände, mit Konflikten |
| Zuordnung zu Benutzern (Profile, `user_id`, RLS) | gering (3a erledigt) | hoch: Liegen Daten mehrerer Benutzer erst gemischt vor, lassen sie sich nicht mehr eindeutig zuordnen |
| Stabile Kennungen | gering (3a erledigt) | mittel bis hoch: jede Umbenennung auf dem Server für alle Benutzer nachziehen |
| Lerntag im Ereignis | gering (3b, erledigt) | mittel: Ereignisse ohne Lerntag rechnen in anderen Zeitzonen abweichend |
| Einstellungen nach Gerät und Benutzer trennen | gering (Liste oben, Umsetzung Paket 4) | gering bis mittel |
| localStorage statt IndexedDB | – | mittel: asynchroner Speicher, Umzug der Daten auf jedem Gerät; erst nötig bei sehr großen Historien oder vielen Profilen auf einem Gerät |
| Vokabeln in die Datenbank (eigene Listen, Inhaltsverwaltung) | hoch, unnötig | mittel bis hoch; Lernstände bleiben dank stabiler Kennungen unberührt |
| Dojo als Dokument statt Ereignisse | – | mittel, falls Dojo-Zähler über Geräte exakt zusammengeführt werden sollen |
| FSRS-Parameter oder -Version ändern | mit Historie günstig: alle Wörter neu berechnen | ohne Historie unmöglich, gilt dann erst ab der Änderung |

## 8. Was beim Öffentlichmachen zusätzlich anfällt

- Konto löschen (Server-Funktion); Datenexport gibt es mit der Sicherung schon.
- Eigener E-Mail-Versand: Der Standard-Versand von Supabase schickt nur wenige Mails pro
  Stunde und nur an Mitglieder des Projekts.
- Missbrauchsschutz: Captcha, Obergrenze für die Datenmenge je Konto.
- Schrift selbst ausliefern: Heute lädt die App ihre Schrift von Google-Servern. Selbst
  ausgeliefert funktioniert sie auch offline, und es geht keine Anfrage an Dritte; für
  Nutzer in der EU ist das zusätzlich datenschutzrechtlich ratsam.
- Rechtliches hängt davon ab, wo die App betrieben wird und an wen sie sich richtet:
  - Betrieben aus Japan gilt das japanische Datenschutzgesetz (APPI, 個人情報保護法):
    offenlegen, wofür Daten wie die E-Mail-Adresse genutzt werden, und sie schützen. Für
    die Speicherung bei einem Anbieter mit Sitz im Ausland (Supabase, USA) gelten
    zusätzliche Pflichten.
  - Richtet sich die App gezielt an Menschen in der EU (naheliegend, weil sie auf Deutsch
    ist), gilt zusätzlich die DSGVO: Datenschutzerklärung, Vertrag zur
    Auftragsverarbeitung mit Supabase.
  - Kostenpflichtige Angebote bräuchten in Japan außerdem die Angaben nach dem Gesetz
    über bestimmte Handelsgeschäfte (特定商取引法).
  - Vor einer Veröffentlichung lohnt eine rechtliche Prüfung; das hier ist keine.
- Bezahlter Supabase-Tarif (derzeit etwa 25 US-Dollar im Monat), damit das Projekt nicht
  pausiert und Backups hat. Kostenlose Projekte pausieren nach etwa einer Woche ohne
  Nutzung.
- Übersetzung, falls nicht nur Deutschsprachige: Alle Texte stehen fest im Code.
