const express = require('express');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { requireAuth } = require('../middleware/auth');
const { getPhaseDeadline } = require('../utils/phaseDeadlines');

const router = express.Router();

// GET /api/predictions/me — eigene Predictions
router.get('/me', requireAuth, async (req, res) => {
  const predictions = await readJSON('predictions.json');
  res.json(predictions.filter(p => p.userId === req.user.id));
});

// POST /api/predictions — Prediction abgeben oder überschreiben
router.post('/', requireAuth, async (req, res) => {
  const { matchId, homeScore, awayScore } = req.body;
  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'matchId, homeScore, awayScore erforderlich' });
  }
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    return res.status(400).json({ error: 'Scores müssen positive ganze Zahlen sein' });
  }

  const matches = await readJSON('matches.json');
  const match = matches.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  // Server-side lock enforcement — Tipp-Frist der ganzen Phase UND Admin-Phasenfreigabe.
  // Frist = 1 Stunde vor Anpfiff des ERSTEN Spiels der Phase, gilt für alle ihre Spiele gemeinsam.
  const deadline = getPhaseDeadline(matches, match.phase);
  if (deadline !== null && Date.now() >= deadline) {
    return res.status(403).json({ error: 'Tipp gesperrt — die Frist für diese Phase ist abgelaufen (1 Stunde vor dem ersten Spiel der Phase)' });
  }
  const config = await readJSON('config.json');
  const phaseUnlocks = config.phaseUnlocks || {};
  if (phaseUnlocks[match.phase] === false) {
    return res.status(403).json({ error: 'Tipp gesperrt — diese Phase ist vom Admin noch nicht freigegeben' });
  }

  const predictions = await readJSON('predictions.json');
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

  await writeJSON('predictions.json', predictions);
  res.json(entry);
});

module.exports = router;
