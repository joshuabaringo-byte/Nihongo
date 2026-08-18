# ことば · Vokabeltrainer ARC Kyoto

Privater Vokabeltrainer für Japanisch, gebaut für das iPhone.
457 Wörter aus Topic 1 bis 5, Karteikarten mit Wiederholung nach Plan,
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
| **nochmal** | Wort kommt nach vier Karten wieder, zählt als Fehler |
| **sitzt** | eine Stufe weiter |
| **leicht** | zwei Stufen weiter |
| Nach links wischen | wie nochmal |
| Nach rechts wischen | wie sitzt |
| Auf ein Wort in den Listen tippen | Aussprache anhören |
| Auf einen Abschnitt unter *Stand* tippen | genau diesen Abschnitt üben |

Am Rechner gehen zusätzlich Leertaste (umdrehen und sitzt) sowie die Tasten 1, 2 und 3.

## Wiederholungsplan

Sechs Stufen. Nach einer richtigen Antwort ist das Wort wieder fällig nach
1, 2, 4, 8, 17 und 35 Tagen. Ab Stufe 5 gilt es als gefestigt.
Ein **nochmal** setzt auf Stufe 1 zurück und legt das Wort in der laufenden
Sitzung gleich noch einmal vor.

## Lernstand sichern

Unter dem Zahnrad liegt **Stand kopieren**. Der kopierte Text ist der komplette
Lernstand; er passt in eine Notiz. Zum Zurückholen den Text in das Feld einfügen
und **Eingefügten Stand laden** tippen.

## Wörter ergänzen

Alle Wörter stehen in `vokabeln.js`. Eine Zeile hat die Form

```js
["3-2","いずみ","izumi","Quelle","N"],
["5-3","かします","kashimasu","verleihen","V",1],
```

also Abschnitt, Kana, Rōmaji, Bedeutung und Wortart. Die Wortart ist `N`, `V`,
`Aい`, `Aな` oder leer. Bei Verben darf ein sechstes Feld die Verbgruppe (1, 2
oder 3) tragen; sie wird für て-Form-Übungen gebraucht und lässt sich nicht aus
dem Kana ableiten.

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

Nach jeder Änderung in `sw.js` die `VERSION` hochzählen, damit die installierte
App die neue Fassung lädt.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Aufbau der Seite |
| `app.css` | Gestaltung, hell und dunkel |
| `app.js` | Karteikarten, Wiederholungsplan, Speicherung |
| `vokabeln.js` | die Wörter und die Abschnitte |
| `sw.js` | Offlinebetrieb |
| `manifest.webmanifest` | Angaben für den Home-Bildschirm |
