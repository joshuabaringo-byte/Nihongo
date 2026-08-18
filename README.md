# ことば · Vokabeltrainer ARC Kyoto

Privater Vokabeltrainer für Japanisch, gebaut für das iPhone.
303 Wörter aus Topic 1 bis 3, Karteikarten mit Wiederholung nach Plan,
Fortschrittsübersicht, Problemwortliste und vollständige Wortliste.

Läuft ohne Server, ohne Konto und ohne Netz. Alles bleibt auf dem Gerät.

## Veröffentlichung

Die Aktion unter `.github/workflows/pages.yml` schaltet GitHub Pages beim ersten
Lauf selbst ein und stellt die Seite danach bei jedem Push neu bereit. Die
Adresse lautet `https://joshuabaringo-byte.github.io/Nihongo/`.

Sollte der Lauf an fehlenden Rechten scheitern, hilft ein Griff von Hand:
**Settings → Pages → Build and deployment → Source** auf **GitHub Actions**
stellen und den Lauf unter **Actions** erneut starten.

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
```

also Abschnitt, Kana, Rōmaji, Bedeutung und Wortart (`N`, `V`, `A` oder leer).
Neue Abschnitte kommen oben in `ABSCHNITTE` dazu. Nach einer Änderung in
`sw.js` die `VERSION` hochzählen, damit die installierte App die neue Fassung lädt.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Aufbau der Seite |
| `app.css` | Gestaltung, hell und dunkel |
| `app.js` | Karteikarten, Wiederholungsplan, Speicherung |
| `vokabeln.js` | die 303 Wörter |
| `sw.js` | Offlinebetrieb |
| `manifest.webmanifest` | Angaben für den Home-Bildschirm |
