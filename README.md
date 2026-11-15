# ことば · Vokabeltrainer

Privater Vokabeltrainer für Japanisch, gebaut für das iPhone.
854 Wörter aus den Grundlagen und Topic 1 bis 7, Karteikarten mit Wiederholung nach Plan,
Fortschrittsübersicht, Problemwortliste und vollständige Wortliste.

Dazu das **Dojo**: Bilderquiz, Paare finden, Zahlen und Zeit, Aufgaben im Format
des JLPT für N5 und N4 und kurze Lesetexte. Wo es zu einem Wort ein Bild gibt,
steht es auch auf der Karteikarte.

Läuft ohne Server, ohne Konto und ohne Netz. Alles bleibt auf dem Gerät.

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
| **nochmal** | zurück auf Stufe 1, morgen wieder fällig, zählt als Fehler |
| **sitzt** | eine Stufe weiter |
| **leicht** | zwei Stufen weiter |
| Nach links wischen | wie nochmal |
| Nach rechts wischen | wie sitzt |
| Auf ein Wort in den Listen tippen | Aussprache anhören |
| Auf einen Abschnitt unter *Stand* tippen | genau diesen Abschnitt üben |
| Auf die Auswahlzeile über der Karte tippen | Topic oder Abschnitt wählen |

| Auf den Beispielsatz unter der Karte tippen | Satz anhören |

Am Rechner gehen zusätzlich Leertaste (umdrehen und sitzt) sowie die Tasten 1, 2 und 3.

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

## Wiederholungsplan

Sechs Stufen. Nach einer richtigen Antwort ist das Wort wieder fällig nach
1, 2, 4, 8, 17 und 35 Tagen. Ab Stufe 5 gilt es als gefestigt.
Ein **nochmal** setzt auf Stufe 1 zurück; das Wort ist damit am nächsten Tag
wieder fällig und taucht im laufenden Durchgang nicht noch einmal auf.

## Lernstand sichern

Unter dem Zahnrad liegt **Stand kopieren**. Der kopierte Text ist der komplette
Lernstand der Karteikarten; er passt in eine Notiz. Der Stand des Dojos (Stempel,
gelöste Aufgaben) ist nicht dabei. Zum Zurückholen den Text in das Feld einfügen
und **Eingefügten Stand laden** tippen.

## Wörter ergänzen

Alle Wörter stehen in `vokabeln.js`. Eine Zeile hat die Form

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

Englisch und Kanji werden bisher nur gespeichert, nicht angezeigt. Wer eine
spätere Stelle füllen will, ohne eine frühere zu kennen, schreibt dort `0`
beziehungsweise `""`.

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

Nach jeder Änderung in `sw.js` die `VERSION` hochzählen, damit die installierte
App die neue Fassung lädt.

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
| `app.js` | Karteikarten, Wiederholungsplan, Speicherung |
| `vokabeln.js` | die Wörter und die Abschnitte |
| `bilder.js` | Bildwörter mit Beispielsätzen |
| `bilder.svg` | die Bilder selbst, erzeugt aus Twemoji |
| `dojo.js` | das Dojo: Quiz, Paare, Zahlen und Zeit, Lesetexte |
| `dojo-daten.js` | JLPT-Aufgaben und Lesetexte |
| `dojo.css` | Gestaltung des Dojos |
| `werkzeug/bilder-bauen.js` | baut `bilder.svg` neu |
| `sw.js` | Offlinebetrieb |
| `manifest.webmanifest` | Angaben für den Home-Bildschirm |
