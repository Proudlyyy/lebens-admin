# Lebens-Admin

Nie wieder eine Frist verpassen: Ausweis, TÜV, Steuererklärung, Vorsorge, Haustiere und eigene Erinnerungen – mit echten Mitteilungen aufs Handy.

- **Android:** echte App mit automatischen Erinnerungen
- **iPhone:** Web-App für den Home-Bildschirm (läuft offline, Erinnerungen über den Kalender)

---

## Einmalige Einrichtung (ca. 15 Minuten, am besten am PC)

### 1. GitHub-Konto anlegen
Auf [github.com](https://github.com) kostenlos registrieren.

### 2. Neues Projekt (Repository) anlegen
1. Oben rechts auf **+** › **New repository**.
2. Name: `lebens-admin`
3. **Public** auswählen (nur dann sind automatischer Bau und Web-App kostenlos).
4. **Create repository** klicken.

### 3. Dateien hochladen
1. Die ZIP-Datei auf dem PC entpacken.
2. Im neuen Repository auf **uploading an existing file** klicken.
3. **Den Inhalt** des entpackten Ordners (nicht den Ordner selbst) ins Browserfenster ziehen. Wichtig: Der versteckte Ordner `.github` muss mit dabei sein.
   - Windows: im Explorer unter *Ansicht* › *Ausgeblendete Elemente* einschalten.
   - Mac: im Finder `Cmd + Shift + .` drücken.
4. Unten **Commit changes** klicken.

### 4. Web-App einschalten (für iPhone)
**Settings** › **Pages** › bei *Source* **GitHub Actions** auswählen.

### 5. Warten, bis alles gebaut ist
Oben auf **Actions** klicken. Nach 5–10 Minuten sind beide Abläufe grün.
Falls „Web-App veröffentlichen“ rot ist, weil Schritt 4 zu spät kam: den Ablauf anklicken und **Re-run all jobs** drücken.

---

## App aufs Handy holen

### Android
1. Auf dem Handy diese Adresse öffnen (`DEINNAME` durch deinen GitHub-Namen ersetzen):
   `https://github.com/DEINNAME/lebens-admin/releases/latest/download/Lebens-Admin.apk`
2. Datei herunterladen und antippen.
3. Android fragt, ob du Apps aus dieser Quelle erlauben willst: **erlauben**.
4. **Installieren**. Beim ersten Start die Mitteilungen erlauben.

Hinweis: Android zeigt eventuell eine Warnung, weil die App nicht aus dem Play Store kommt. Das ist bei selbst gebauten Apps normal.

### iPhone
1. In **Safari** öffnen: `https://DEINNAME.github.io/lebens-admin/`
2. Teilen-Symbol › **Zum Home-Bildschirm**.
3. Die App liegt jetzt wie eine normale App auf dem Home-Bildschirm und funktioniert auch offline.

Automatische Mitteilungen sind auf dem iPhone in dieser Form nicht möglich. Nutze bei wichtigen Terminen den Knopf **„In Google Kalender eintragen“**.

---

## Updates
Jede Änderung an den Dateien im Repository baut automatisch eine neue Version.
- Android: Die APK unter der gleichen Adresse neu herunterladen und installieren. Deine Daten bleiben erhalten.
- iPhone: Die Web-App aktualisiert sich beim nächsten Öffnen mit Internet von selbst.

## Daten und Datenschutz
Alle Angaben bleiben nur auf dem Handy. Es gibt kein Konto und keinen Server. Unter **Einstellungen › Sicherung** kannst du deine Daten sichern, z. B. vor einem Handywechsel.

## Für später: echte iPhone-App
Der Ordner ist ein [Capacitor](https://capacitorjs.com)-Projekt. Mit einem Mac, Xcode und einem Apple-Entwicklerkonto (99 € im Jahr) lässt sich daraus mit `npm install`, `npx cap add ios` und `npm run ios` auch eine echte iPhone-App mit Mitteilungen bauen.

## Aufbau
| Ordner/Datei | Inhalt |
| --- | --- |
| `www/` | Die App selbst (`index.html`, `app.js`, `logic.js` mit allen Fristen) |
| `assets/` | App-Symbol und Symbol für Mitteilungen |
| `signing/debug.keystore` | Signaturschlüssel, damit Updates über die alte Version installiert werden können |
| `.github/workflows/` | Automatischer Bau der Android-App und der Web-App |
| `capacitor.config.json` | App-Name, App-ID und Einstellungen für Mitteilungen |

Alle Fristen ohne Gewähr, Stand Oktober 2026. Vorsorge-Hinweise ersetzen keine ärztliche Beratung.
