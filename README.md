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

## Daten-Speicherung

**Lokale Entwicklung & Produktion (Vercel):** Alle Daten (Users, Matches, Predictions, Config) liegen in **Vercel KV** (Redis), nicht mehr in lokalen JSON-Dateien — das war nötig, weil Vercel-Serverless-Functions kein beschreibbares Dateisystem haben.

Die ursprünglichen Seed-Daten liegen weiterhin als Referenz in `/data/`:
- `users.json` — Teilnehmer (Startzustand: Admin "Santi")
- `matches.json` — WM-2026-Spielplan
- `predictions.json` — leer (Startzustand)
- `config.json` — Punkte-Regeln (Default)

## Deployment auf Vercel (Schritt-für-Schritt)

1. **GitHub-Repo erstellen** und den lokalen Stand pushen (`git remote add origin ...` → `git push -u origin main`)
2. **Vercel-Projekt anlegen:** [vercel.com](https://vercel.com) → "Add New Project" → das GitHub-Repo auswählen. Vercel erkennt `vercel.json` automatisch (Build der `frontend/`, API-Function unter `/api`)
3. **KV-Store anlegen:** Im Vercel-Projekt → Tab "Storage" → "Create Database" → "KV" (Upstash Redis) → mit dem Projekt verlinken. Vercel injiziert dann automatisch die Env-Vars `KV_REST_API_URL`, `KV_REST_API_TOKEN` etc.
4. **JWT_SECRET setzen:** Projekt → Settings → Environment Variables → `JWT_SECRET` mit einem langen zufälligen String anlegen
5. **Lokale Env-Vars holen:** `vercel env pull backend/.env` (oder die KV-Werte manuell aus dem Storage-Tab in `backend/.env` kopieren — Vorlage siehe `backend/.env.template`)
6. **Daten einmalig seeden:** `npm --prefix backend run seed` — schreibt die Inhalte aus `/data/*.json` einmalig in den KV-Store
7. **Deploy auslösen** (passiert automatisch bei Push auf den Hauptbranch, oder manuell über `vercel --prod`)

Danach läuft Frontend + Backend unter derselben Vercel-Domain (`/api/*` wird per Rewrite an die Serverless-Function geroutet — kein CORS-Thema in Produktion).

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
