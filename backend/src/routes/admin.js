const express = require('express');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { requireAdmin } = require('../middleware/auth');
const { scorePrediction } = require('../utils/scoring');
const { propagate } = require('../utils/bracket');

const router = express.Router();

// Alle Routes nur für Admins
router.use(requireAdmin);

// PUT /api/admin/matches/:id/result — Ergebnis eintragen
// Nach jedem Ergebnis wird das gesamte K.-o.-Bracket automatisch neu aufgelöst
// (Gruppensieger/-zweite, beste Dritte via Annex-C-Tabelle, Sieger der K.-o.-Spiele).
// shootoutWinner ('home'|'away') wird bei Unentschieden in K.-o.-Spielen verwendet,
// um den Sieger fürs Weiterkommen zu bestimmen (Elfmeterschießen).
router.put('/matches/:id/result', async (req, res) => {
  const { homeScore, awayScore, shootoutWinner } = req.body;
  if (homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'homeScore und awayScore erforderlich' });
  }

  let matches = await readJSON('matches.json');
  const idx = matches.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  if (matches[idx].resultLocked) {
    return res.status(403).json({ error: 'Ergebnis ist gesperrt — erst entsperren, um es zu ändern' });
  }

  const cleared = homeScore === '' || awayScore === '';
  matches[idx].homeScore = cleared ? null : Number(homeScore);
  matches[idx].awayScore = cleared ? null : Number(awayScore);
  // Elfmeter-Sieger nur relevant für K.-o.-Spiele; bei Reset/klarem Sieger zurücksetzen
  if ('shootoutWinner' in matches[idx]) {
    matches[idx].shootoutWinner =
      cleared || matches[idx].homeScore !== matches[idx].awayScore ? null : (shootoutWinner ?? null);
  }

  // Bracket automatisch fortschreiben und die komplette (aufgelöste) Liste speichern
  matches = propagate(matches);
  await writeJSON('matches.json', matches);
  res.json(matches.find(m => m.id === req.params.id));
});

// PUT /api/admin/matches/:id/lock-result — Ergebnis sperren/entsperren (verhindert versehentliche Änderungen)
router.put('/matches/:id/lock-result', async (req, res) => {
  const { locked } = req.body;
  if (typeof locked !== 'boolean') return res.status(400).json({ error: 'locked (boolean) erforderlich' });

  const matches = await readJSON('matches.json');
  const idx = matches.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  matches[idx].resultLocked = locked;
  await writeJSON('matches.json', matches);
  res.json(matches[idx]);
});

// PUT /api/admin/matches/:id/teams — Knockout-Teams zuweisen
router.put('/matches/:id/teams', async (req, res) => {
  const { homeTeam, awayTeam } = req.body;
  if (!homeTeam || !awayTeam) return res.status(400).json({ error: 'homeTeam und awayTeam erforderlich' });

  const matches = await readJSON('matches.json');
  const idx = matches.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  matches[idx].homeTeam = homeTeam;
  matches[idx].awayTeam = awayTeam;
  await writeJSON('matches.json', matches);
  res.json(matches[idx]);
});

// GET /api/admin/config
router.get('/config', async (_req, res) => {
  res.json(await readJSON('config.json'));
});

// PUT /api/admin/config — Scoring-Regeln, Phasen-Freigaben & Spezial-Konfiguration speichern
router.put('/config', async (req, res) => {
  const { scoring, special, phaseUnlocks } = req.body;
  if (!scoring && !special && !phaseUnlocks) {
    return res.status(400).json({ error: 'scoring, special oder phaseUnlocks object erforderlich' });
  }

  const config = await readJSON('config.json');
  if (scoring) config.scoring = { ...config.scoring, ...scoring };
  if (phaseUnlocks) config.phaseUnlocks = { ...config.phaseUnlocks, ...phaseUnlocks };
  if (special) {
    config.special = {
      ...config.special,
      ...special,
      results: special.results ? { ...config.special.results, ...special.results } : config.special.results,
    };
  }
  await writeJSON('config.json', config);
  res.json(config);
});

// PUT /api/admin/special-results — Meister, Vizemeister, Torschützenkönig eintragen
router.put('/special-results', async (req, res) => {
  const { champion, runnerUp, topScorer } = req.body;

  const config = await readJSON('config.json');
  config.special.results = {
    champion: champion || null,
    runnerUp: runnerUp || null,
    topScorer: topScorer || null,
  };
  await writeJSON('config.json', config);
  res.json(config.special);
});

// GET /api/admin/matches/:id/predictions — alle User-Predictions für ein Spiel
router.get('/matches/:id/predictions', async (req, res) => {
  const users = await readJSON('users.json');
  const predictions = await readJSON('predictions.json');
  const matches = await readJSON('matches.json');
  const config = await readJSON('config.json');

  const match = matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  const matchPreds = predictions.filter(p => p.matchId === req.params.id);

  const result = users.map(user => {
    const pred = matchPreds.find(p => p.userId === user.id);
    return {
      userId: user.id,
      name: user.name,
      homeScore: pred ? pred.homeScore : null,
      awayScore: pred ? pred.awayScore : null,
      submittedAt: pred ? pred.submittedAt : null,
      points: pred && match.homeScore !== null ? scorePrediction(pred, match, config) : null,
    };
  });

  res.json(result);
});

// GET /api/admin/users — alle User (für Admin-Panel)
router.get('/users', async (_req, res) => {
  const users = await readJSON('users.json');
  res.json(users.map(u => ({ id: u.id, name: u.name, role: u.role })));
});

module.exports = router;
