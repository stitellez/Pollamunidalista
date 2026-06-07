# ⚽ WM 2026 Predictor

Tipp-Runde für die Fußball-WM 2026.

## Starten

```bash
cd ~/Projects/wm-predictor
npm run dev
```

Dann im Browser öffnen: **http://localhost:5173**

## Login

- **Name:** Santi (Admin)
- **PIN:** 1234

## Admin-Panel

Als Admin siehst du einen extra Tab "Admin":
- **Ergebnisse** — Spielergebnisse eintragen (Rangliste aktualisiert sich automatisch)
- **Knockout** — Teams für R32, R16, QF, SF, Finale zuweisen
- **Punkte-Regeln** — Punktesystem selbst definieren
- **Tipps ansehen** — alle Tipps pro Spiel einsehen
- **Teilnehmer** — User hinzufügen, PINs zurücksetzen, User löschen

## Neue Teilnehmer hinzufügen

Admin → "Teilnehmer" → Name + PIN eingeben → "Hinzufügen"

## Daten-Dateien

Alle Daten liegen in `/data/`:
- `users.json` — Teilnehmer
- `matches.json` — Spiele + Ergebnisse
- `predictions.json` — alle Tipps
- `config.json` — Punkte-Regeln

## Punkte-System (Standard)

| Tipp | Punkte |
|------|--------|
| Exaktes Ergebnis | 3 |
| Richtiger Ausgang (Sieg/Unentschieden) | 1 |
| Falsch | 0 |

Anpassbar im Admin-Panel → "Punkte-Regeln".

## WM 2026 Daten

Gruppen und Anstoßzeiten sind auf Basis des Spielplans Stand Dezember 2024 vorgeladen.
Im Admin-Panel können Ergebnisse und Knockout-Teams jederzeit angepasst werden.
