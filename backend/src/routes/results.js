const express = require('express');
const { readJSON } = require('../utils/fileStore');
const { scorePrediction } = require('../utils/scoring');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/results — abgeschlossene Spiele mit allen Tipps + Punkten (für alle User)
router.get('/', requireAuth, (_req, res) => {
  const users = readJSON('users.json');
  const matches = readJSON('matches.json');
  const predictions = readJSON('predictions.json');
  const config = readJSON('config.json');

  const finishedMatches = matches
    .filter(m => m.homeScore !== null && m.awayScore !== null)
    .sort((a, b) => new Date(b.kickoff).getTime() - new Date(a.kickoff).getTime());

  const result = finishedMatches.map(match => {
    const matchPreds = predictions.filter(p => p.matchId === match.id);

    const userPredictions = users.map(user => {
      const pred = matchPreds.find(p => p.userId === user.id);
      return {
        userId: user.id,
        name: user.name,
        homeScore: pred ? pred.homeScore : null,
        awayScore: pred ? pred.awayScore : null,
        points: pred ? scorePrediction(pred, match, config) : 0,
      };
    });

    return {
      matchId: match.id,
      phase: match.phase,
      group: match.group,
      label: match.label || null,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      kickoff: match.kickoff,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      predictions: userPredictions,
    };
  });

  res.json(result);
});

module.exports = router;
