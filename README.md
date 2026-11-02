# Tabata Wochenplan (PWA)

Persönlicher Tabata-Plan für Oberkörper und Bauch. Läuft offline, ohne Backend und ohne Build-Tools.

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst, Tab-Leiste, Trainingsansicht, Dialoge |
| `style.css` | Dunkles, mobiles Layout (Safe Areas, Hoch- und Querformat) |
| `texts.js` | Alle deutschen Texte an einer Stelle |
| `views.js` | Die fünf Tabs: Start, Training, Wochenplan, Fortschritt, Profil |
| `app.js` | Speicher mit Migration, Router, Plan-Logik, Aktionen, Timer |
| `exercises.js` | Übungsdatenbank (39 Übungen), Equipment, Standard-Wochenplan |
| `illustrations.js` | Figur-Renderer (Gelenkwinkel → SVG) und Equipment-Icons |
| `service-worker.js` | Offline-Cache |
| `manifest.webmanifest`, `icons/` | App-Name, Farben, Icons für den Home-Bildschirm |

## 1. Lokal testen

Die App muss über einen Webserver laufen (nicht per Doppelklick auf `index.html`), sonst funktioniert der Service Worker nicht. Im Projektordner:

```bash
npx serve .
```

oder, falls Python installiert ist:

```bash
python -m http.server 8000
```

Dann im Browser `http://localhost:3000` (serve) bzw. `http://localhost:8000` öffnen.

Hinweis: Auf dem iPhone über die WLAN-Adresse deines Rechners (z. B. `http://192.168.1.20:8000`) läuft die App zwar, aber **ohne Offline-Modus** – Service Worker brauchen HTTPS. Für den echten Einsatz also hosten (Schritt 2).

## 2. Auf GitHub Pages hosten (kostenlos, HTTPS)

1. Auf github.com ein neues, öffentliches Repository anlegen, z. B. `tabata`.
2. Alle Dateien dieses Ordners hochladen („Add file → Upload files"), inklusive Ordner `icons/`.
3. Im Repository: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, Branch `main`, Ordner `/ (root)`, speichern.
4. Nach ca. einer Minute ist die App unter `https://DEIN-NAME.github.io/tabata/` erreichbar.

Jeder andere statische Hoster mit HTTPS funktioniert genauso (Netlify, Cloudflare Pages, eigener Webspace).

## 3. Auf iPhone und iPad installieren

1. Die HTTPS-Adresse in **Safari** öffnen.
2. Unten auf **Teilen** (Quadrat mit Pfeil) tippen → **Zum Home-Bildschirm** → **Hinzufügen**.
3. Die App einmal vom Home-Bildschirm aus öffnen, solange du online bist. Danach läuft sie komplett offline.

Tipps:
- **Stummschalter** am iPhone ausschalten, sonst sind die Piepstöne stumm.
- **Sprachansage** in den Einstellungen aktivieren, wenn du Ansagen möchtest.
- Der Bildschirm bleibt während des Trainings an (Screen Wake Lock, ab iOS 16.4; als Home-Bildschirm-App zuverlässig ab iOS 18.4).
- Fortschritt und Einstellungen liegen lokal im Gerät (localStorage). Löschst du die App vom Home-Bildschirm, sind sie weg.

## Anpassen

**Übungen ändern oder ergänzen:** in `exercises.js` ein Objekt im Array `EXERCISES` bearbeiten oder hinzufügen. Das Pose-Format ist oben in der Datei erklärt (Winkel für Torso, Arme, Beine; alternativ `{ ik: [x, y] }`, um eine Hand oder einen Fuß an einen Punkt zu setzen).

**Eigene Bilder statt Illustration:** Bild in einen Ordner `img/` legen und bei der Übung ein Feld ergänzen, z. B.

```js
{ id: 'liegestuetze', name: 'Liegestütze', image: 'img/liegestuetze.webp', … }
```

Fehlt die Datei, zeigt die App automatisch wieder die SVG-Illustration. Bilder werden beim ersten Laden für den Offline-Betrieb gecacht.

**Wochenplan:** Standardplan in `DEFAULT_PLAN` (`exercises.js`). In der App kannst du unter *Einstellungen* Trainings- und Ruhetage tauschen, den Plan neu mischen oder den Standardplan wiederherstellen.

**Updates ausrollen:** Geänderte Dateien bei GitHub neu hochladen (beim Hochladen gleiche Namen überschreiben, neue Dateien hinzufügen). Für ein garantiert sauberes Update in `service-worker.js` die Zeile `const CACHE = 'tabata-v2'` hochzählen (`tabata-v3` …).

**Aktualisierte Version auf iPhone und iPad laden:**
1. Dateien hochladen und ca. 1 Minute warten.
2. App vom Home-Bildschirm aus öffnen (mit Internet), komplett schließen (im App-Umschalter nach oben wischen) und noch einmal öffnen. Die neue Version steht dann bereit.
3. Zeigt sie noch die alte Oberfläche: Seite in Safari öffnen, Adresse neu laden, danach die App neu starten.
4. Nur im Notfall: App vom Home-Bildschirm löschen und in Safari neu über *Teilen → Zum Home-Bildschirm* hinzufügen. Dabei gehen die lokalen Daten verloren. Sichere sie vorher unter *Profil → Daten exportieren*.

**Daten sichern:** *Profil → Daten exportieren (JSON)* speichert Plan, Verlauf, Profil und Einstellungen als Datei. Mit *Daten importieren* spielst du sie auf einem anderen Gerät wieder ein. Alte Daten aus Version 1 werden beim ersten Start automatisch übernommen.
