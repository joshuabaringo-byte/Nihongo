# ことば · Vokabeltrainer

Privater Vokabeltrainer für Japanisch, gebaut für das iPhone.
1.762 Wörter: die 854 aus den Grundlagen und Topic 1 bis 7 und dazu der Wortschatz der
JLPT-Stufen **N5 (718 Wörter)** und **N4 (667 Wörter)**. Karteikarten mit Wiederholung
nach Plan, Fortschrittsübersicht, Problemwortliste und vollständige Wortliste.

Dazu das **Dojo**: Bilderquiz, Paare finden, Zahlen und Zeit, Aufgaben im Format
des JLPT für N5 und N4 und kurze Lesetexte. Wo es zu einem Wort ein Bild gibt,
steht es auch auf der Karteikarte.

Läuft ohne Server und ohne Netz. Ein Konto ist freiwillig (siehe *Konto*); ohne Konto
bleibt alles auf dem Gerät.

## Einmalig einschalten

Ein Handgriff ist nötig, danach läuft alles von allein. Eine Aktion darf
GitHub Pages nicht selbst erstmalig aktivieren.

1. **Settings → Pages** öffnen.
2. Unter **Build and deployment → Source** den Eintrag **GitHub Actions** wählen.
3. Auf den Reiter **Actions** wechseln, den letzten Lauf öffnen und
   **Re-run all jobs** drücken.

Danach steht die Seite unter `https://joshuabaringo-byte.github.io/Nihongo/`
und wird bei jedem weiteren Push neu gebaut.

## Auf dem iPhone einrichten

1. Die Adresse in **Safari** öffnen (nicht in Chrome, sonst fehlt die Installation).
2. Unten auf **Teilen** tippen, dann **Zum Home-Bildschirm**.
3. Die App startet danach im Vollbild, ohne Adressleiste, und funktioniert offline.

Der Schritt lohnt sich: als installierte App bleibt der Lernstand dauerhaft
gespeichert. In Safari selbst löscht iOS ihn nach etwa sieben Tagen ohne Besuch.

## Bedienung

| Handgriff | Wirkung |
|---|---|
| Auf die Karte tippen | Antwort zeigen |
| **nochmal** | vergessen: in 10 Minuten wieder, zählt als Fehler, der nächste Abstand wird kürzer |
| **schwer** | gewusst, aber mühsam: kürzerer Abstand, das Wort gilt künftig als schwerer |
| **sitzt** | gewusst: der Abstand wächst, so wie FSRS ihn für das Wort berechnet |
| **leicht** | spielend gewusst: längerer Abstand, das Wort gilt künftig als leichter |
| **↶ Rückgängig** unter *Antwort zeigen* | die letzte Antwort zurücknehmen; das Wort kommt wieder (ein Schritt, bis zum Neuladen) |
| Nach links wischen | wie nochmal |
| Nach rechts wischen | wie sitzt |
| Auf ein Wort in den Listen tippen | Aussprache anhören |
| Auf einen Abschnitt unter *Stand* tippen | genau diesen Abschnitt üben |
| Auf **Alle N5-Wörter** oder **Alle N4-Wörter** unter *Stand* tippen | die ganze Stufe üben |
| Auf die Auswahlzeile über der Karte tippen | Stufe, Topic oder Abschnitt wählen |
| Auf den Beispielsatz unter der Karte tippen | Satz anhören |
| Über der Karte **漢字 → かな** wählen | Kanji vorn, Kana und Bedeutung hinten (ohne Kanji bleibt das Kana) |
| In der Liste **N5** oder **N4** wählen | nur Wörter dieser Stufe anzeigen |

Am Rechner gehen zusätzlich Leertaste (umdrehen und sitzt) sowie die Tasten 1 bis 4 für nochmal, schwer, sitzt und leicht.

## Dojo

Der Reiter **Dojo** ist der spielerische Teil. Er hat einen eigenen Stand: nichts,
was dort passiert, verschiebt eine Wiederholung oder macht ein Wort zum Problemwort.

| Bereich | Inhalt |
|---|---|
| **Bilderquiz** | Bild → Wort, Wort → Bild oder nach Gehör. 278 Bilder, wählbar nach „Meine Wörter aus dem Trainer", N5, N4 oder Thema. |
| **Paare finden** | Memory: sechs Bilder und ihre Wörter. Gezählt werden die Züge. |
| **Zahlen und Zeit** | Uhr, Preisschild, Zählen mit ひとつ bis とお, Kalenderblatt, Lage (うえ, した, なか …). Die Bilder werden jedes Mal neu erzeugt. Lesen oder Hören. |
| **Bilderbuch** | Alle Bilder zum Blättern, mit Wort, Kanji, Aussprache und Beispielsatz. |
| **JLPT N5 / N4** | 189 Aufgaben in den Formen der Prüfung: Kanji lesen, Schreibung, passendes Wort, gleiche Bedeutung, Wortgebrauch, Grammatik, Satzbau mit Stern, „Was sagst du?", schnelle Antwort. Jede mit Erklärung. |
| **Lesetexte** | Neun kurze Texte und Aushänge mit Fragen. Antippen zeigt die Übersetzung eines Satzes. |

Eine Runde hat zehn Fragen. Was noch nie dran war oder öfter falsch als richtig
beantwortet wurde, kommt bevorzugt. Am Ende gibt es einen Stempel wie in der
japanischen Schule: Dreieck, Kreis, Doppelkreis oder – ab neun von zehn – den
Blumenkreis はなまる.

Oben rechts in den JLPT-Aufgaben und Lesetexten schaltet ein Knopf die Schreibweise
um: **ふりがな** (Kanji mit Lesung darüber), **かな** (nur Kana) oder **漢字** (ohne Hilfe).

Am Rechner wählen die Tasten 1 bis 4 eine Antwort, die Leertaste geht weiter.

### Woher die Inhalte kommen

Alle Aufgaben und Lesetexte sind eigens für diese App geschrieben. Übernommen ist
nur die *Form* der Prüfungsaufgaben. Aus den amtlichen Beispielheften stammt
nichts, weder Text noch Bild – die gibt es kostenlos bei der Prüfungsstelle unter
[jlpt.jp](https://www.jlpt.jp/e/samples/forlearners.html).

Die Bilder sind [Twemoji](https://github.com/jdecked/twemoji), Copyright Twitter, Inc
und Mitwirkende, Lizenz [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Uhr, Preisschild, Kalender, Tisch und Schachtel sind selbst gezeichnet.

Die Zuordnung der Bildwörter zu N5 und N4 folgt den üblichen inoffiziellen Listen;
eine amtliche Wortliste gibt es seit 2010 nicht mehr.

## JLPT-Wortschatz N5 und N4

Die beiden Stufen stehen als eigene Gruppen **JLPT N5** (9 Abschnitte) und **JLPT N4**
(17 Abschnitte) neben den Topics, geordnet nach Themen: Menschen, Zeit, Orte, Haushalt,
Verben der Bewegung, des Alltags und des Denkens, Adjektive, Wendungen und Zähler.

Was schon in deinen Topics steht, kommt nicht noch einmal vor. Es bleibt dort, wo du
es gelernt hast, und trägt dazu seine Stufe. Deshalb gibt es unter der Auswahl
**Alle N5-Wörter** und **Alle N4-Wörter**: sie holen die Wörter aus beiden Quellen
zusammen, 477 davon aus den Kursabschnitten. Auf der Karte steht bei solchen Wörtern
oben rechts ein Chip *N5* oder *N4*.

Ein Lernstand aus früheren Fassungen bleibt vollständig erhalten: die Kennungen der
bisherigen Wörter haben sich nicht geändert.

**Kanji** stehen bei den JLPT-Wörtern, soweit die Liste eine Schreibung kennt (Wörter in
Katakana oder Kana haben keine), und bei 369 Kurswörtern, die sie vorher nicht hatten. Sie erscheinen unter dem Kana auf der Rückseite (abschaltbar unter *Einstellungen
→ Kanji zeigen*), in der Wortliste und als Vorderseite der Richtung **漢字 → かな**.
Die Suche findet Wörter auch über Kanji und die englische Bedeutung.

**Zählen.** Bei über tausend Wörtern wäre „fällig" nutzlos, wenn jedes nie gesehene Wort
mitzählt. Die Kopfzeile trennt deshalb: *3 fällig · 15 neu* heißt drei Wiederholungen
sind dran und heute sind noch 15 neue Wörter erlaubt. Ein Durchgang nimmt erst die
Wiederholungen und füllt mit Neuem auf, soweit das Limit für neue Wörter es zulässt.

### Woher die Wörter kommen

Die Auswahl der Wörter stammt aus den JLPT-Vokabellisten von Jonathan Waller
([tanos.co.uk/jlpt](https://www.tanos.co.uk/jlpt/)), Lizenz
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), bezogen über
[open-anki-jlpt-decks](https://github.com/jamsinclair/open-anki-jlpt-decks). Aus der
Liste stammen Wort, Kanji und englische Bedeutung. Die deutschen Bedeutungen, die
Verben in ます-Form mit ihrer Gruppe, die Rōmaji und die Einteilung in Abschnitte sind
eigene Arbeit und nicht von einem Muttersprachler gegengelesen.

Die Prüfung selbst veröffentlicht seit 2010 keine Wortlisten mehr. Die Stufen folgen
deshalb dieser inoffiziellen Liste und decken sich nicht in jedem Einzelfall mit dem,
was in einer Prüfung vorkommt.

## Wiederholungsplan

Der Plan rechnet mit **FSRS** (Free Spaced Repetition Scheduler), einem freien
Verfahren des Projekts Open Spaced Repetition. Gerechnet wird nicht in der App selbst,
sondern in dessen offizieller Bibliothek
[ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs)
(Version 5.4.2, Modell FSRS-6, MIT-Lizenz). Sie liegt unverändert in `ts-fsrs/`;
`plan.js` übersetzt nur zwischen dem Lernstand der App und den Karten der Bibliothek.

**Neue Wörter** lernen in Minutenschritten: nach der ersten Antwort kommt das Wort nach
1 oder 10 Minuten wieder (im Durchgang schon nach einigen Karten), erst dann bekommt es
einen Abstand in Tagen. Ein neues Wort, das du gleich mit **leicht** beantwortest,
kommt erst in etwa 8 Tagen wieder.

**Gelernte Wörter:** FSRS merkt sich für jedes Wort zwei Werte: die *Stabilität* (wie
lange du es behältst) und die *Schwierigkeit*. Aus jeder Antwort und der Zeit seit der
letzten Abfrage berechnet es beide neu und legt den nächsten Termin so, dass du das
Wort dann noch mit 90 % Wahrscheinlichkeit weißt. **nochmal** schickt das Wort für
10 Minuten zurück in die Lernschritte; **schwer**, **sitzt** und **leicht** geben
wachsende Abstände. Wer ein Wort zu spät wiederholt und es trotzdem weiß, bekommt
einen größeren Sprung. Die Knöpfe zeigen vorher, was jede Antwort bewirkt.

Alle Einstellungen sind die Vorgaben der Bibliothek (Ziel 90 %,
Lernschritte 1 und 10 Minuten, nach einem Fehler 10 Minuten, Abstand höchstens
36 500 Tage). Dazu ist die Streuung an, damit Wörter, die am selben Tag gelernt wurden,
nicht alle am selben Tag wiederkommen.

**Umstellung von früheren Fassungen:** Ältere Lernstände bleiben erhalten, ihre
Termine auch. Weil sie noch keine Stabilität und Schwierigkeit haben, setzt die
Bibliothek beides bei der nächsten Antwort neu, als wäre es die erste. Der Abstand
beginnt dann wieder klein und wächst rasch.

**Fällig** wird zum Tageswechsel um vier Uhr früh, nicht auf die Minute: Was du heute um
19:35 lernst und morgen dran ist, liegt morgen ab vier Uhr bereit. Nach demselben
Tageswechsel zählt FSRS auch die Tage seit der letzten Antwort, in jeder Zeitzone.
Steht die Uhr des Geräts zurück, zählt das als 0 Tage.

Lässt sich für ein Wort ausnahmsweise kein Termin berechnen, erscheint statt der
Antwortknöpfe nur **Überspringen**; das Wort bleibt dann unverändert.

**Neue Wörter pro Tag** sind begrenzt (Einstellungen, Voreinstellung 15). Ohne Grenze
lernt man an einem Tag Hunderte, und alle kommen am nächsten Tag zusammen wieder. Das
Limit zählt ab dem Tageswechsel; mit *Trotzdem weiterüben* lässt es sich bewusst
überschreiten.

**Antwort-Historie:** Jede Antwort wird mit Zeit, Lerntag und Bewertung festgehalten,
je Profil getrennt. Aus der Historie lässt sich der Stand jedes Wortes genau nachrechnen;
sie ist die Grundlage für die spätere Synchronisierung zwischen Geräten (siehe
`ARCHITEKTUR.md`). Sie beginnt mit diesem Update: Was du vorher gelernt hast, ist als
Ausgangsstand festgehalten. Üben vor dem Termin, das den Plan nicht ändert, wird nicht
festgehalten. Wird die Historie größer als 2 MB, fasst die App die ältesten Antworten zu
einem Stand je Wort zusammen; der Lernstand bleibt dabei gleich.

**Reihenfolge im Durchgang:** erst Lernkarten, dann Wiederholungen (das am längsten
Überfällige zuerst, innerhalb eines Tages gemischt), dann Neues. Unter *Stand → Nächste
7 Tage* siehst du, wie viel in den kommenden Tagen fällig wird.

**Üben vor dem Termin** (*Trotzdem weiterüben*) ändert den Plan nicht, solange du das Wort
weißt, sonst ließe sich ein Wort durch Üben weiterschieben. Vergisst du es, zählt das
wie sonst als Fehler.

**Gefestigt** heißt: der Abstand beträgt mindestens 17 Tage. Ein **Problemwort** wurde
nach dem Lernen mindestens zweimal vergessen und ist noch nicht gefestigt; sobald du
es wieder sicher kannst, fällt es von allein aus der Liste.

Lernstände aus früheren Fassungen werden beim ersten Laden übernommen: Der Abstand der
bisherigen Stufe (1, 2, 4, 8, 17 oder 35 Tage) und der Termin bleiben erhalten, ein
vorgemerktes *nochmal* wird zu einem Lernschritt.

## Lernstand sichern

Unter dem Zahnrad liegt **Als Datei sichern**. Auf dem iPhone öffnet sich das
Teilen-Menü; mit *In Dateien sichern*, am besten in iCloud Drive, liegt die Sicherung
außerhalb der App und übersteht auch einen Gerätewechsel. Wo Teilen nicht geht, wird
die Datei heruntergeladen. Eine Sicherung enthält Lernstand, Einstellungen und
Dojo-Fortschritt, dazu die Antwort-Historie. Zurück geht es mit **Aus Datei laden**.

Dieselbe Sicherung gibt es als Text: **Stand kopieren** legt sie in die Zwischenablage,
zum Zurückholen den Text in das Feld einfügen und **Eingefügten Stand laden** tippen.
Ältere Sicherungen, die nur den Lernstand enthalten, lassen sich weiter laden; dann
wird nur der Lernstand ersetzt.

Laden ersetzt den ganzen Stand, deshalb prüft die App vorher: Was unlesbar ist, kein
Wort dieser App enthält oder dem jetzigen Stand gleicht, wird abgelehnt. Sonst fragt
sie mit Zahlen nach (wie viele Wörter jetzt und in der Sicherung, wie viele gelernte
Wörter dort fehlen, wo dein jetziger Stand neuer ist, ob Einstellungen und Dojo dabei
sind). Vor dem Ersetzen bewahrt sie den jetzigen Stand auf; **Vorherigen Stand
zurückholen** holt ihn wieder (und bewahrt dabei den ersetzten auf). Ändern sich
Einstellungen oder Dojo, startet die App danach einmal neu. Auch **Alles
zurücksetzen** lässt sich so rückgängig machen.

**Erinnerung:** Sind mindestens 10 Wörter begonnen, ist die letzte Sicherung
mindestens 7 Tage her (oder gibt es noch keine) und hast du seitdem gelernt, steht
über der Karte ein Hinweis mit **Jetzt sichern**. **Später** blendet ihn für 3 Tage
aus. In den Einstellungen steht, wann zuletzt gesichert wurde.

**Beschädigte Daten:** Lässt sich ein gespeicherter Stand nicht lesen, legt die App
ihn unverändert unter eigenem Namen ab, bevor sie etwas Neues speichert, und zeigt
über der Karte einen Hinweis mit **Gesicherten Text kopieren**. Gelingt das Ablegen
nicht (Speicher voll), speichert sie in dieser Sitzung nichts darüber.

**Mehrere Tabs:** Sind zwei Tabs offen, liest jeder vor einer Antwort den Stand des
anderen ein und ändert nur das eine Wort. Antworten gehen so nicht verloren. Für
Einstellungen und Dojo gilt weiter: Der Tab, der zuletzt speichert, gewinnt.

## Konto

Unter dem Zahnrad, Abschnitt **Konto**: E-Mail-Adresse eingeben, **Code anfordern**,
den Code aus der Mail eingeben, **Anmelden**. Ein Passwort gibt es nicht. Neue Konten
legt die App nie an; nur Konten, die im Supabase-Projekt angelegt sind, können sich
anmelden.

- Angemeldet arbeitet die App im **Profil des Kontos**. Beim ersten Anmelden auf einem
  Gerät fragt sie, ob der Lernstand ohne Konto übernommen werden soll. Er wird
  kopiert; ohne Anmeldung ist er weiter da.
- **Abmelden** beendet die Sitzung, auch auf dem Server. Der Lernstand des Kontos
  bleibt auf dem Gerät, beim nächsten Anmelden ist er wieder da.
- **Abmelden und Daten von diesem Gerät entfernen** löscht zusätzlich alles, was zu
  diesem Konto auf dem Gerät liegt. Die Daten ohne Konto bleiben.
- Der **Abgleich zwischen Geräten** kommt mit Paket 4b. Bis dahin liegt der Lernstand
  auch angemeldet nur auf dem Gerät; die Sicherung als Datei bleibt wichtig.
- Die Anmeldung braucht Netz. Die Bibliothek dafür (supabase-js) lädt die App erst,
  wenn ein Konto benutzt wird; ohne Konto startet sie so schnell wie bisher.

### Konto einrichten (einmalig)

Die Namen im Supabase-Dashboard können sich leicht ändern; gemeint ist jeweils der
genannte Bereich.

1. Auf supabase.com ein **neues Projekt** anlegen: Region **Northeast Asia (Tokyo)**,
   Tarif *Free*. Das Datenbank-Passwort im Passwort-Manager ablegen. Die App braucht
   es nicht, und es gehört nirgendwohin sonst.
2. **SQL Editor** → neue Abfrage → den ganzen Inhalt von
   `supabase/migrations/20261119000000_lernstand.sql` einfügen → **Run**. Das legt die
   Tabellen und alle Zugriffsregeln an.
3. **Authentication → Sign In / Providers**: den Anbieter **Email** eingeschaltet
   lassen, **Allow new users to sign up** ausschalten. Dann kann sich niemand selbst
   ein Konto anlegen.
4. **Authentication → Emails → Magic Link**: als Betreff `Dein Anmeldecode für ことば`,
   als Text den Inhalt von `supabase/templates/anmeldecode.html` einsetzen. Er enthält
   `{{ .Token }}`, also den Code, und keinen Link: Ein Link würde auf dem iPhone
   Safari öffnen statt der App vom Home-Bildschirm.
5. **Authentication → Users → Add user → Create new user**: die eigene E-Mail-Adresse,
   ein langes zufälliges Passwort (wird nicht gebraucht), **Auto Confirm User**
   ankreuzen.
6. **Project Settings → API Keys**: die **Project URL** (`https://….supabase.co`) und
   den **Publishable key** (`sb_publishable_…`) in `konfig.js` eintragen. Beide sind
   öffentlich und dürfen in der App stehen.

Nie weitergeben oder eintragen: den **Secret key** (`sb_secret_…`), den
`service_role`-Schlüssel und das Datenbank-Passwort. `tests/konfig.test.js` schlägt
an, falls einer davon im Repo landet.

Gut zu wissen:

- Kostenlose Projekte **pausieren** nach etwa einer Woche ohne Nutzung. Die App läuft
  ohne Konto-Funktionen weiter; im Dashboard lässt sich das Projekt wieder starten.
- Der eingebaute **Mailversand** schickt nur wenige Mails pro Stunde und nur an
  Mitglieder des Projekts. Für dich reicht das. Für weitere Personen braucht es einen
  eigenen Mailversand (Authentication → Emails → SMTP).
- Die App nimmt Codes mit 6 bis 10 Ziffern an, je nach Einstellung des Projekts.

## Tests

    node tests/plan.test.js       # Wiederholungsplan, braucht nur Node
    node tests/kennungen.test.js  # keine Kennung geht verloren, braucht nur Node
    node tests/verlauf.test.js    # Antwort-Historie: Nachrechnen, Geräte, Zeitzonen, braucht nur Node
    node tests/version.test.js    # sichtbare Version und Service Worker passen zusammen
    node tests/konfig.test.js     # konfig.js, Bibliothek unverändert, kein geheimer Schlüssel im Repo
    node tests/app.test.js        # die App im Browser, braucht Playwright mit Chromium
    node tests/supabase.test.js   # Datenbank-Sicherheit, braucht ein lokales Supabase (unten)

`app.test.js` startet einen eigenen kleinen Webserver und arbeitet in leeren
Browserprofilen; echte Lernstände bleiben unberührt. Playwright einrichten:
`npm install --no-save playwright && npx playwright install chromium`.

`supabase.test.js` und der Teil des Abschnitts `konto` in `app.test.js`, der sich
wirklich anmeldet, laufen gegen ein **lokales Supabase** (Supabase CLI und Docker,
`supabase start` im Repo-Ordner). Sie brauchen dessen Zugangsdaten aus
`supabase status -o env` als `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`,
`SUPABASE_SECRET_KEY`, `SUPABASE_DB_URL` und `SUPABASE_MAILPIT_URL`. Gegen ein
echtes Projekt laufen sie nicht: Sie legen Testkonten an und löschen sie wieder.

Auf GitHub laufen alle Tests automatisch bei jedem Pull Request und nach jedem Merge
(`.github/workflows/tests.yml`); der Job `supabase` startet dafür ein lokales
Supabase auf dem Runner. Das Ergebnis steht am Pull Request. Das Veröffentlichen
der Website hängt nicht davon ab.

## Wörter ergänzen

Die Wörter der Topics stehen in `vokabeln.js`, die der JLPT-Stufen in
`vokabeln-jlpt.js` (dieselbe Zeilenform, geladen vor `vokabeln.js`). Eine Zeile hat die Form

```js
["3-2","いずみ","izumi","Quelle","N"],
["5-3","かします","kashimasu","verleihen","V",1],
["6-4","ほうほう","hoohoo","Methode","N",0,"method","方法"],
```

also Abschnitt, Kana, Rōmaji, Bedeutung und Wortart. Die Wortart ist `N`, `V`,
`Aい`, `Aな` oder leer. Die drei Felder danach sind alle freiwillig und dürfen
fehlen, solange kein späteres folgt:

| Stelle | Feld | wofür |
| --- | --- | --- |
| 6 | Verbgruppe | `1`, `2` oder `3`; `0` heißt „noch nicht bekannt". Wird für て-Form-Übungen gebraucht und lässt sich nicht aus dem Kana ableiten. |
| 7 | Englisch | die englische Bedeutung, wo die Quelle sie mitliefert |
| 8 | Kanji | die Schreibung in Kanji, wo es eine gibt |

Kanji werden angezeigt (Rückseite, Liste, Richtung 漢字 → かな) und durchsucht,
Englisch wird nur durchsucht. Bei Verben steht die Kanji-Schreibung wie das Kana in
ます-Form, bei な-Adjektiven mit `（な）`. Wer eine spätere Stelle füllen will, ohne eine
frühere zu kennen, schreibt dort `0` beziehungsweise `""`.

Zwei Wörter mit gleicher Lesung im selben Abschnitt bekommen automatisch
verschiedene Kennungen (das zweite trägt seine Kanji oder Bedeutung angehängt). Nur
die Kennung ist der Schlüssel des Lernstands; ein Wort umbenennen heißt, es neu zu
beginnen.

Am Ende von `vokabeln-jlpt.js` stehen drei Tabellen für Wörter aus den Topics, die auf
der Liste stehen: `STUFEN_ZUORDNUNG` (Kennung → 5 oder 4), `STUFEN_KANJI` und
`STUFEN_ENGLISCH` (Schreibung und englische Bedeutung, wo die Zeile selbst sie nicht
hat).

Rōmaji werden mit verdoppelten langen Vokalen geschrieben (`sensee`, `tanjoobi`),
nicht mit Makron. Kommt ein Wort in mehreren Abschnitten vor, bleibt es dort,
wo es zuerst eingeführt wurde.

Ein **neues Topic** braucht nur zwei Handgriffe in derselben Datei:

```js
// 1. Abschnitte oben in ABSCHNITTE eintragen
"4-1": { t: 4, nr: "§1", titel: "Titel des Abschnitts" },

// 2. Wörter unten in ROH ergänzen
["4-1","ことば","kotoba","Wort","N"],
```

Filterleiste, Fortschritt, Wortliste und Fußzeile ziehen von allein nach — die
App liest die vorhandenen Topics aus den Daten, nichts ist fest verdrahtet.

Eine Gruppe, die kein Topic des Buchs ist, bekommt in `TOPICNAMEN` einen eigenen
Namen; ohne Eintrag heißt sie schlicht „Topic n". So liegen die Zählwörter und
Preise von Buchseite 8 bis 9 unter **Grundlagen** vor Topic 1.

Nach jeder Änderung die Version hochzählen, damit die installierte App die neue Fassung
lädt: sichtbar unter *Über* in `index.html` (etwa `0.32 Beta`) und gleichlautend in
`sw.js` (`kotoba-0.32-beta`). `tests/version.test.js` prüft, dass beide zusammenpassen.

### Kennungen

Jedes Wort hat eine Kennung aus Abschnitt und Kana, etwa `8-1|あに`; Lernstände
hängen an dieser Kennung. Eine veröffentlichte Kennung ändert sich deshalb nie:

- **Neue Wörter oder Aufgaben:** danach `node werkzeug/kennungen.js` ausführen. Es
  nimmt die neuen Kennungen in `tests/kennungen.json` auf, das Verzeichnis aller je
  veröffentlichten Kennungen.
- **Wort verschieben oder Lesung korrigieren:** Die alte Kennung kommt mit der neuen
  als Ziel in `UMLEITUNGEN` (oben in der ID-Bildung von `vokabeln.js`). Die App zieht
  vorhandene Lernstände dann von selbst um.
- **Wort entfernen:** nur über eine Umleitung auf ein anderes Wort oder gar nicht.

`node tests/kennungen.test.js` schlägt fehl, sobald eine Kennung ohne Umleitung
verschwindet oder ein Wort mit gleicher Lesung im selben Abschnitt seine Kennung mit
einem anderen tauscht. Das gilt auch für die Kennungen der JLPT-Aufgaben, Lesetexte
und Bilder im Dojo.

## Dojo ergänzen

**Ein Bildwort** ist eine Zeile in `bilder.js`:

```js
["🍎","りんご","ringo","Apfel",5,"essen","","りんごを ひとつ ください。","Einen Apfel, bitte."],
```

also Bild, Kana, Rōmaji, Bedeutung, JLPT-Stufe, Gruppe, Kanji (darf leer sein),
Beispielsatz und dessen Übersetzung. Das Bild ist ein Emoji-Zeichen; gezeichnet
wird es aber nicht mit der Schrift des Geräts, sondern aus `bilder.svg`. Deshalb
nach jeder Änderung an den Bildern einmal

```
node werkzeug/bilder-bauen.js
```

laufen lassen (Node 18 oder neuer, mit Netz). Das Skript holt die fehlenden
Grafiken und schreibt `bilder.svg` neu. Steht das Kana eines Bildworts auch im
Vokabeltrainer, erscheinen Bild und Beispielsatz dort von allein auf der Karte.
Bilder, die nur die Karte schmücken, aber für ein Quiz zu ungenau sind, stehen
weiter unten in `BILDER_NUR_KARTE`.

**Eine Aufgabe** ist eine Zeile in `dojo-daten.js`, einsortiert nach Stufe und Typ:

```js
["5k01","まいあさ コーヒーを （　　）。",["のみます","たべます","よみます","かきます"],"Ich trinke jeden Morgen Kaffee.","Getränke: のみます."],
```

Kennung, Satz, Antworten, Übersetzung, Erklärung. Die **richtige Antwort steht
immer zuerst**; gemischt wird beim Anzeigen. Die Kennung muss neu sein und bleibt
für immer bei ihrer Aufgabe, denn unter ihr merkt sich die App, was gelöst ist.
Die Schreibweise im Japanischen:

| Schreibweise | Wirkung |
|---|---|
| `{漢字\|かんじ}` | Kanji mit Lesung; je nach Einstellung Furigana, nur Kana oder nur Kanji |
| `[ことば]` | das unterstrichene Wort |
| `（　　）` | die Lücke |

Wie die übrigen Typen und die Lesetexte aufgebaut sind, steht als Kommentar am
Anfang der jeweiligen Liste.

Ändern sich `index.html` und `app.js` gemeinsam so, dass sie nur noch als Paar
funktionieren, kann eine Fassung aus dem Cache auf die andere aus dem Netz
treffen. Die App merkt das: Bricht der Start ab oder übernimmt mitten im
Betrieb ein neuer Service Worker, lädt sie sich genau einmal neu. Scheitert
es danach wieder, erscheint ein Hinweis statt eines leeren Bildschirms.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Aufbau der Seite |
| `app.css` | Gestaltung „Papier", hell und dunkel |
| `app.js` | Karteikarten, Durchgänge, Speicherung |
| `plan.js` | der Wiederholungsplan: verbindet die App mit ts-fsrs |
| `verlauf.js` | die Antwort-Historie: Lernereignisse, Nachrechnen, Vereinigen, Zusammenfassen |
| `ts-fsrs/` | die Bibliothek ts-fsrs 5.4.2, unverändert aus dem npm-Paket (`dist/index.umd.js`), mit ihrer MIT-Lizenz |
| `vokabeln.js` | die Wörter und die Abschnitte der Topics |
| `vokabeln-jlpt.js` | der Wortschatz der Stufen N5 und N4 |
| `bilder.js` | Bildwörter mit Beispielsätzen |
| `bilder.svg` | die Bilder selbst, erzeugt aus Twemoji |
| `dojo.js` | das Dojo: Quiz, Paare, Zahlen und Zeit, Lesetexte |
| `dojo-daten.js` | JLPT-Aufgaben und Lesetexte |
| `dojo.css` | Gestaltung des Dojos |
| `werkzeug/bilder-bauen.js` | baut `bilder.svg` neu |
| `schrift/` | Ms Madi, die Schrift der Unterschrift unter *Über* (SIL Open Font License 1.1, Text in `schrift/OFL.txt`) |
| `sw.js` | Offlinebetrieb |
| `konto.js` | der Abschnitt *Konto*: Anmelden mit E-Mail-Code, Abmelden, Profilwechsel |
| `konfig.js` | Projekt-URL und öffentlicher Schlüssel des Supabase-Projekts (sonst nichts) |
| `supabase-js/` | die Bibliothek supabase-js 2.119.0, unverändert aus dem npm-Paket (`dist/umd/supabase.js`), mit ihrer MIT-Lizenz; wird nur bei Bedarf geladen |
| `supabase/` | Datenbank: `migrations/` (Tabellen und Zugriffsregeln), `templates/` (Anmelde-Mail), `config.toml` (nur für das lokale Supabase der Tests) |
| `tests/` | Tests für Wiederholungsplan, Kennungen, App und Datenbank (nicht Teil der Website-Funktion); `tests/kennungen.json` ist das Verzeichnis aller veröffentlichten Kennungen |
| `werkzeug/kennungen.js` | nimmt neue Kennungen ins Verzeichnis auf |
| `ARCHITEKTUR.md` | Zielarchitektur für mehrere Benutzer und Supabase, Datenmodell, Migrationskosten |
| `manifest.webmanifest` | Angaben für den Home-Bildschirm |
