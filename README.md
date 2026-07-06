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

### Eliminatorias: Bono "quién pasa" (penales)

En las eliminatorias **siempre avanza un equipo** (si empatan, penales). Además de los puntos del marcador, hay un **bono configurable "quién pasa"** (`advanceBonus`, por defecto 2 pts, se multiplica por el factor de fase):

- Al pronosticar un partido de eliminatorias, el jugador también elige **qué equipo avanza**. Si predice un marcador no-empate, el equipo que pasa es implícito; si predice empate, **debe** elegir quién pasa en penales.
- Cuando el admin introduce el resultado, en caso de empate elige el ganador de penales (`shootoutWinner`) — y los jugadores que acertaron el equipo que avanza reciben el bono. Configurable en Admin → "Reglas de puntos".

### Regel „halbe Punktzahl" (nachträgliche Tipps)

Ein Tipp, der **nachträglich/verspätet** eingetragen wird (z.B. per Admin-Skript nach Ablauf der Frist), zählt nur die **halbe Endpunktzahl**. Umgesetzt über das Flag `halfPoints: true` am Prediction-Eintrag — normale, fristgerecht abgegebene Tipps haben das Flag nicht und zählen voll.

- Berechnung: `(Basis + Bonus) × Phasenfaktor`, danach **÷ 2** wenn `halfPoints` gesetzt ist. Zentral in `backend/src/utils/scoring.js` — schlägt automatisch in Rangliste, Ergebnissen und Admin-Ansicht durch.
- Setzen: beim Nach-Eintragen das Flag mitgeben (siehe `backend/scripts/set-lucho-m91.js` als Vorlage).
- Hinweis: Bei ungeraden Summen sind halbe Werte möglich (z.B. 9 → 4,5).

## WM 2026 Daten

Gruppen und Anstoßzeiten sind auf Basis des Spielplans Stand Dezember 2024 vorgeladen.
Im Admin-Panel können Ergebnisse jederzeit angepasst werden.

## 🏆 Automatisches K.-o.-Bracket (FIFA-konform)

Das gesamte K.-o.-Tableau (Spiele **M73–M104**: Ronda de 32 → Octavos → Cuartos → Semifinales → Tercer puesto → Final) füllt sich **automatisch**, sobald du die offiziellen Ergebnisse einträgst. Du musst keine Teams mehr von Hand zuweisen.

Wie es funktioniert:
- **Gruppensieger & -zweite** werden aus den Gruppentabellen bestimmt (FIFA-Tiebreaker nach Art. 13: Punkte → Direktvergleich → Gesamt-Tordifferenz → Gesamt-Tore).
- **Die 8 besten Gruppendritten** werden gerankt und über die **offizielle FIFA-Tabelle aus Annex C** (alle 495 Kombinationen, `data/thirdsAllocation.json`) den richtigen Achtelfinal-Plätzen zugeordnet.
- **Sieger der K.-o.-Spiele** rücken automatisch in die nächste Runde. Endet ein Spiel unentschieden, wählst du im Knockout-Tab den **Sieger im Elfmeterschießen**.

Quelle der Bracket-Struktur: *Regulations for the FIFA World Cup 26™*, Art. 12.6–12.11 + Annex C.
Logik: `backend/src/utils/bracket.js` (+ `standings.js`). Test über einen kompletten simulierten Turnierverlauf: `node backend/scripts/test-bracket.js`.

> ⚠️ **NICHT `npm run seed` ausführen, wenn das Turnier schon läuft!** `seed` überschreibt users / predictions / config / matches in KV → **alle Teilnehmer, Tipps und Ergebnisse wären weg.**
>
> Für ein laufendes Turnier gibt es eine **sichere Migration ohne Datenverlust** — sie behält Gruppenspiele samt Ergebnissen, Nutzer, Tipps und Spezialtipps und ersetzt nur das K.-o.-Tableau durch die korrekte FIFA-Struktur (+ ergänzt `advanceBonus`):
> ```bash
> node backend/scripts/migrate-bracket.js            # Vorschau (schreibt NICHTS)
> node backend/scripts/migrate-bracket.js --commit   # ausführen
> ```
> Die Vorschau prüft auch, ob Tipps verloren gingen, und bricht im Zweifel ab. `npm run seed` ist nur für eine **leere** Erstbefüllung gedacht.
