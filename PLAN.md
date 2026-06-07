# WM 2026 Predictor App — Implementierungsplan

**Status:** BESTÄTIGT — bereit zum Bauen  
**Erstellt:** 2026-06-04  
**Projekt-Pfad:** `~/Projects/wm-predictor`

---

## Tech Stack

| Schicht | Technologie |
|---------|------------|
| Frontend | Vite + React + TypeScript + Tailwind CSS (Port 5173) |
| Backend | Node.js + Express.js (JavaScript, Port 3001) |
| Daten | JSON-Dateien in `/data/` (kein Datenbankserver) |
| Auth | JWT (localStorage) + bcryptjs für PINs |
| Run | `npm run dev` via `concurrently` aus Root |

---

## Entscheidungen (bestätigt)

- **WM-Daten:** Best-available Gruppen A–L + ungefähre Anstoßzeiten, editierbar im Admin-Panel
- **Start-User:** Nur `Santi` als Admin (PIN: `1234`, änderbar im Admin)
- **Scoring:** Komplett frei konfigurierbar im Admin-Panel (kein Preset)
- **Scope:** Alle Runden (104 Spiele total):
  - Gruppenphase: 48 Spiele
  - Round of 32: 32 Spiele (TBD-Platzhalter)
  - Round of 16: 16 Spiele (TBD-Platzhalter)
  - Viertelfinale: 8 Spiele
  - Halbfinale: 4 Spiele
  - Spiel um Platz 3: 1 Spiel
  - Finale: 1 Spiel
- **Scoring-Stacking:** Konfigurierbar (Admin entscheidet exklusiv vs. additiv)
- **Knockout-Teams:** Admin trägt sie ein sobald Gruppen abgeschlossen

---

## Phasen

### Phase 0: Scaffold (S)
- Root `package.json` mit concurrently
- Backend: Express + Health-Route
- Frontend: Vite + React + Tailwind
- `.gitignore`, `backend/.env`

### Phase 1: Seed-Daten (M)
- `data/config.json` — leeres Scoring-Schema
- `data/users.json` — Santi Admin, PIN 1234 (bcrypt-gehasht)
- `data/matches.json` — 104 Matches
- `data/predictions.json` — `[]`

### Phase 2: Auth-API (M)
- `fileStore.js`, `auth.js` middleware
- `GET /api/auth/users`, `POST /api/auth/login`

### Phase 3: Core-Logik (L)
- `scoring.js` (pure function)
- Routes: matches, predictions (mit server-side Lock), leaderboard

### Phase 4: Standings + Admin-API (L)
- `standings.js` (pure function)
- Admin-Routes: Ergebnisse, Knockout-Teams, Config, User-Management

### Phase 5: Frontend Foundation (M)
- Types, API-Client, AuthContext, Layout, LoginPage, App-Routing

### Phase 6: Feature-Pages (L)
- Dashboard, Predictions, Leaderboard, GroupsPage

### Phase 7: Admin-UI (M)
- AdminPage mit Tabs: Ergebnisse, Teams zuweisen, Scoring-Config, Predictions ansehen, User

### Phase 8: README + Tests (S)
- README für Santiago, Unit-Tests für scoring.js + standings.js

---

## Abhängigkeitskette

```
0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
```

---

## Änderungshistorie

| Datum | Wer | Was |
|-------|-----|-----|
| 2026-06-04 | Santiago + Claude | Plan erstellt und bestätigt |
