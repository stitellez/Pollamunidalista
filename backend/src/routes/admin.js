const express = require('express');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { requireAdmin } = require('../middleware/auth');
const { scorePrediction } = require('../utils/scoring');

const router = express.Router();

// Alle Routes nur für Admins
router.use(requireAdmin);

// PUT /api/admin/matches/:id/result — Ergebnis eintragen
router.put('/matches/:id/result', async (req, res) => {
  const { homeScore, awayScore } = req.body;
  if (homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'homeScore und awayScore erforderlich' });
  }

  const matches = await readJSON('matches.json');
  const idx = matches.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  matches[idx].homeScore = homeScore === '' ? null : Number(homeScore);
  matches[idx].awayScore = awayScore === '' ? null : Number(awayScore);
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

// PUT /api/admin/config — Scoring-Regeln speichern
router.put('/config', async (req, res) => {
  const { scoring, special } = req.body;
  if (!scoring && !special) return res.status(400).json({ error: 'scoring oder special object erforderlich' });

  const config = await readJSON('config.json');
  if (scoring) config.scoring = { ...config.scoring, ...scoring };
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
