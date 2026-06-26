const express = require('express');
const { readJSON, writeJSON } = require('../utils/fileStore');
const { requireAuth } = require('../middleware/auth');
const { getPhaseDeadline, computeGroupRoundMap, getGroupRoundDeadline } = require('../utils/phaseDeadlines');

const router = express.Router();

// GET /api/predictions/me — eigene Predictions
router.get('/me', requireAuth, async (req, res) => {
  const predictions = await readJSON('predictions.json');
  res.json(predictions.filter(p => p.userId === req.user.id));
});

// POST /api/predictions — Prediction abgeben oder überschreiben
router.post('/', requireAuth, async (req, res) => {
  const { matchId, homeScore, awayScore, advance } = req.body;
  if (!matchId || homeScore === undefined || awayScore === undefined) {
    return res.status(400).json({ error: 'matchId, homeScore, awayScore erforderlich' });
  }
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || homeScore < 0 || awayScore < 0) {
    return res.status(400).json({ error: 'Scores müssen positive ganze Zahlen sein' });
  }
  if (advance !== undefined && advance !== null && advance !== 'home' && advance !== 'away') {
    return res.status(400).json({ error: "advance muss 'home', 'away' oder null sein" });
  }

  const matches = await readJSON('matches.json');
  const match = matches.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Spiel nicht gefunden' });

  // Server-side lock enforcement
  if (match.phase === 'group') {
    // Gruppenspiele: Deadline gilt pro Spieltag (1/2/3)
    const groupRoundMap = computeGroupRoundMap(matches);
    const round = groupRoundMap[match.id];
    const deadline = getGroupRoundDeadline(matches, groupRoundMap, round);
    if (deadline !== null && Date.now() >= deadline) {
      return res.status(403).json({ error: `Tipp gesperrt — die Frist für Spieltag ${round} ist abgelaufen (1 Stunde vor dem ersten Spiel des Spieltags)` });
    }
  } else {
    // Andere Phasen: Deadline gilt für die ganze Phase
    const deadline = getPhaseDeadline(matches, match.phase);
    if (deadline !== null && Date.now() >= deadline) {
      return res.status(403).json({ error: 'Tipp gesperrt — die Frist für diese Phase ist abgelaufen (1 Stunde vor dem ersten Spiel der Phase)' });
    }
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

  // Weiterkommer nur für K.-o.-Spiele speichern; bei nicht-unentschiedenem Tipp
  // ist er implizit, wird aber zur Klarheit mitgespeichert wenn mitgeschickt.
  const entry = {
    userId: req.user.id,
    matchId,
    homeScore,
    awayScore,
    submittedAt: new Date().toISOString(),
  };
  if (match.phase !== 'group' && (advance === 'home' || advance === 'away')) {
    entry.advance = advance;
  }

  if (existingIdx >= 0) {
    predictions[existingIdx] = entry;
  } else {
    predictions.push(entry);
  }

  await writeJSON('predictions.json', predictions);
  res.json(entry);
});

module.exports = router;
