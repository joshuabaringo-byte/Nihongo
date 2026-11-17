# Architektur: mehrere Benutzer, Synchronisierung, Supabase

Die App ist heute privat und läuft nur im Browser, ohne Server. Später soll sie Daten
über Supabase zwischen Geräten abgleichen und vielleicht öffentlich mit mehreren
Benutzerkonten laufen. Dieses Dokument beschreibt die Zielarchitektur, damit die
Datenstruktur schon jetzt nicht von einem einzelnen Benutzer ausgeht.

Stand: Paket 3a ist umgesetzt (Kennungen, Gerät, Profile). Paket 3b
(Lernereignisse) und Paket 4 (Supabase) sind geplant; was dazu hier steht, ist
Entwurf.

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
| Lernereignisse (3b) | `kotoba-ereignisse` | `kotoba:<p>:ereignisse` |
| unlesbare Daten, gesichert | `<Name>-unlesbar-<Zeit>` | `kotoba:<p>:<name>-unlesbar-<Zeit>` |

- Das Gast-Profil nutzt die bisherigen Namen; es wurde nichts umkopiert.
- Erlaubte Profilnamen: Buchstaben, Ziffern, `-` und `_`, höchstens 64 Zeichen.
  Ungültige Werte fallen auf `gast` zurück.
- Später ist das Profil eines angemeldeten Benutzers seine Supabase-`user_id`.
- Die App bleibt ohne Konto nutzbar; dann arbeitet sie im Gast-Profil, nur lokal.

## 4. Lernereignisse (Paket 3b, Entwurf)

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
- **Tageszähler für neue Wörter:** aus den Ereignissen gezählt, nicht gespeichert.
- **Speicherplatz:** etwa 60 Bytes je Ereignis. Der Speicher im Browser fasst auf dem
  iPhone etwa 5 MB. Ohne Server fasst die App ab einer Grenze (vorgeschlagen 2 MB)
  ältere Ereignisse zu einer `uebernahme` je Wort zusammen. Mit Supabase liegt die
  vollständige Historie auf dem Server, lokal bleibt nur, was noch nicht hochgeladen ist.

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

## 6. Supabase (Paket 4, Entwurf)

Region: Tokio (`ap-northeast-1`), nah an den heutigen Nutzern in Japan. Auch für Nutzer
in der EU ist ein Standort in Japan grundsätzlich unproblematisch, weil die EU Japan ein
angemessenes Datenschutzniveau bescheinigt hat.

### Tabellen, Row Level Security

```sql
-- Lernereignisse: unveränderlich, nur anhängen
create table public.lern_ereignisse (
  user_id      uuid        not null default auth.uid() references auth.users (id) on delete cascade,
  id           uuid        not null,                 -- vom Gerät erzeugt
  wort_id      text        not null check (char_length(wort_id) between 1 and 200),
  art          text        not null check (art in ('antwort', 'uebernahme', 'widerruf')),
  bewertung    smallint    check (bewertung between 1 and 4),
  zeit         timestamptz not null,                 -- Zeitpunkt auf dem Gerät
  tag          date        not null,                 -- Lerntag nach dem 4-Uhr-Wechsel
  geraet_id    uuid        not null,
  plan_version text        not null,
  daten        jsonb,
  empfangen_am timestamptz not null default now(),   -- setzt der Server, für den Abruf
  primary key (user_id, id),                         -- Kennungen je Benutzer: kein fremdes Konto kann eine belegen
  check ((art = 'antwort') = (bewertung is not null))
);
create index lern_ereignisse_abruf on public.lern_ereignisse (user_id, empfangen_am);
create index lern_ereignisse_wort  on public.lern_ereignisse (user_id, wort_id, zeit);

-- user_id und empfangen_am setzt immer der Server, nie die App
create function public.ereignis_stempeln() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.user_id := auth.uid();
  new.empfangen_am := now();
  return new;
end $$;
create trigger ereignis_stempeln before insert on public.lern_ereignisse
  for each row execute function public.ereignis_stempeln();

alter table public.lern_ereignisse enable row level security;
create policy "eigene Ereignisse lesen" on public.lern_ereignisse
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "eigene Ereignisse anlegen" on public.lern_ereignisse
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- keine Policies für update und delete: Ereignisse sind unveränderlich

-- Einstellungen und Dojo-Fortschritt je Benutzer, der neueste Stand gewinnt
create table public.einstellungen (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  daten        jsonb not null,
  geaendert_am timestamptz not null default now()
);
create table public.dojo_stand (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  daten        jsonb not null,
  geaendert_am timestamptz not null default now()
);
alter table public.einstellungen enable row level security;
alter table public.dojo_stand    enable row level security;
-- je Tabelle: select, insert und update nur für (select auth.uid()) = user_id
```

- Keine Tabellen für Vokabeln: Die Inhalte bleiben in der App.
- Wird ein Konto gelöscht, verschwinden alle seine Zeilen mit (`on delete cascade`).
  Konto löschen braucht eine Server-Funktion mit Admin-Rechten.
- In die App kommen nur Projekt-URL und der öffentliche Schlüssel („anon“ bzw.
  „publishable“). Der `service_role`-Schlüssel kommt nie in die App oder ins Repo.

### Anmeldung

- E-Mail-Code (Einmalcode, kein Passwort). Ein Magic Link öffnet sich auf dem iPhone in
  Safari statt in der App vom Home-Bildschirm und landet im falschen Speicher.
- Registrierung zunächst abgeschaltet; mehrere Konten funktionieren trotzdem, sobald
  sie eingeschaltet wird. Apple- oder Google-Anmeldung lassen sich ergänzen.

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

- Beim ersten Anmelden fragt die App, ob die Gast-Daten ins Konto übernommen werden.
  Dank der Ereignisse ist das ein Zusammenführen, kein Überschreiben.
- Meldet sich jemand anderes an, bekommt er ein eigenes Profil. Daten eines anderen
  Profils werden nie in sein Konto hochgeladen.
- Abmelden lässt die Daten zunächst auf dem Gerät; auf geteilten Geräten gibt es
  „Abmelden und Daten von diesem Gerät entfernen“.

### Tests

- Row Level Security: automatisch auf GitHub gegen ein lokales Supabase (Supabase CLI,
  Docker) mit zwei Testkonten: A liest nie Zeilen von B, legt keine für B an, ändert und
  löscht keine; ohne Anmeldung gibt es keinen Zugriff.
- Synchronisierung: zwei simulierte Geräte, zwei Benutzer, offline und wieder online,
  doppelte Uploads, späte Ereignisse.

## 7. Migrationskosten

| Entscheidung | Aufwand jetzt | Kosten später, wenn wir es weglassen |
|---|---|---|
| Antwort-Historie | mittel (3b) | hoch: Für alle bis dahin gegebenen Antworten fehlt die Historie dauerhaft; Abgleich nur über ganze Stände, mit Konflikten |
| Zuordnung zu Benutzern (Profile, `user_id`, RLS) | gering (3a erledigt) | hoch: Liegen Daten mehrerer Benutzer erst gemischt vor, lassen sie sich nicht mehr eindeutig zuordnen |
| Stabile Kennungen | gering (3a erledigt) | mittel bis hoch: jede Umbenennung auf dem Server für alle Benutzer nachziehen |
| Lerntag im Ereignis | gering (3b) | mittel: Ereignisse ohne Lerntag rechnen in anderen Zeitzonen abweichend |
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
