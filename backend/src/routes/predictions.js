const express = require('express');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/predictions/me — eigene Predictions
router.get('/me', requireAuth, (req, res) => {
  const predictions = readJSON('predictions.json');
  res.json(predictions.filter(p => p.userId === req.user.id));
});

// POST /api/predictions — Prediction abgeben oder überschreiben
router.post('/', requireAuth, (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;
  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'matchId, homeScore, awayScore erforderlich' });
  }
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    return res.status(400).json({ error: 'Scores müssen positive ganze Zahlen sein' });
  }

  const matches = readJSON('matches.json');
  const match = matches.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  // Server-side lock enforcement
  if (Date.now() >= new Date(match.kickoff).getTime()) {
    return res.status(403).json({ error: 'Tipp gesperrt — Spiel hat bereits begonnen' });
  }

  const predictions = readJSON('predictions.json');
  const existingIdx = predictions.findIndex(
    p => p.userId === req.user.id && p.matchId === matchId
  );

  const entry = {
    userId: req.user.id,
    matchId,
    homeScore,
    awayScore,
    submittedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    predictions[existingIdx] = entry;
  } else {
    predictions.push(entry);
  }

  writeJSON('predictions.json', predictions);
  res.json(entry);
});

module.exports = router;
