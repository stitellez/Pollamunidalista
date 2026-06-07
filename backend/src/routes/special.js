const express = require('express');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Tournament-wide picks lock once the first match kicks off.
async function getLockTime(matches) {
  const kickoffs = matches.map(m => new Date(m.kickoff).getTime());
  return Math.min(...kickoffs);
}

// GET /api/special/teams — Liste aller teilnehmenden Teams (für Meister/Vizemeister-Auswahl)
router.get('/teams', async (_req, res) => {
  const matches = await readJSON('matches.json');
  const teams = new Set();
  for (const m of matches) {
    if (m.phase === 'group') {
      if (m.homeTeam !== 'TBD') teams.add(m.homeTeam);
      if (m.awayTeam !== 'TBD') teams.add(m.awayTeam);
    }
  }
  res.json([...teams].sort());
});

// GET /api/special/me — eigene Spezial-Vorhersage + Sperrstatus
router.get('/me', requireAuth, async (req, res) => {
  const [predictions, matches] = await Promise.all([
    readJSON('specialPredictions.json'),
    readJSON('matches.json'),
  ]);
  const mine = predictions.find(p => p.userId === req.user.id) || null;
  const locked = Date.now() >= await getLockTime(matches);
  res.json({ prediction: mine, locked });
});

// POST /api/special — Spezial-Vorhersage abgeben oder überschreiben
router.post('/', requireAuth, async (req, res) => {
  const { champion, runnerUp, topScorer } = req.body;
  if (!champion && !runnerUp && !topScorer) {
    return res.status(400).json({ error: 'Mindestens ein Feld erforderlich' });
  }

  const matches = await readJSON('matches.json');
  if (Date.now() >= await getLockTime(matches)) {
    return res.status(403).json({ error: 'Vorhersagen gesperrt — das Turnier hat bereits begonnen' });
  }

  const predictions = await readJSON('specialPredictions.json');
  const existingIdx = predictions.findIndex(p => p.userId === req.user.id);

  const entry = {
    userId: req.user.id,
    champion: champion || null,
    runnerUp: runnerUp || null,
    topScorer: topScorer || null,
    submittedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    predictions[existingIdx] = entry;
  } else {
    predictions.push(entry);
  }

  await writeJSON('specialPredictions.json', predictions);
  res.json(entry);
});

module.exports = router;
