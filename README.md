# ことば · Vokabeltrainer

Privater Vokabeltrainer für Japanisch, gebaut für das iPhone.
765 Wörter aus den Grundlagen und Topic 1 bis 6, Karteikarten mit Wiederholung nach Plan,
Fortschrittsübersicht, Problemwortliste und vollständige Wortliste.

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

Am Rechner gehen zusätzlich Leertaste (umdrehen und sitzt) sowie die Tasten 1, 2 und 3.

## Wiederholungsplan

Sechs Stufen. Nach einer richtigen Antwort ist das Wort wieder fällig nach
1, 2, 4, 8, 17 und 35 Tagen. Ab Stufe 5 gilt es als gefestigt.
Ein **nochmal** setzt auf Stufe 1 zurück; das Wort ist damit am nächsten Tag
wieder fällig und taucht im laufenden Durchgang nicht noch einmal auf.

## Lernstand sichern

Unter dem Zahnrad liegt **Stand kopieren**. Der kopierte Text ist der komplette
Lernstand; er passt in eine Notiz. Zum Zurückholen den Text in das Feld einfügen
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
| `sw.js` | Offlinebetrieb |
| `manifest.webmanifest` | Angaben für den Home-Bildschirm |
