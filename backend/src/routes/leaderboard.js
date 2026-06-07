const express = require('express');
const { readJSON } = require('../utils/fileStore');
const { scorePrediction, scoreSpecialPrediction } = require('../utils/scoring');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/leaderboard
router.get('/', requireAuth, async (_req, res) => {
  const users = await readJSON('users.json');
  const matches = await readJSON('matches.json');
  const predictions = await readJSON('predictions.json');
  const specialPredictions = await readJSON('specialPredictions.json');
  const config = await readJSON('config.json');

  const finishedMatches = matches.filter(
    m => m.homeScore !== null && m.awayScore !== null
  );

  const board = users.map(user => {
    const userPreds = predictions.filter(p => p.userId === user.id);
    let totalPoints = 0;
    const breakdown = [];

    for (const match of finishedMatches) {
      const pred = userPreds.find(p => p.matchId === match.id);
      const points = pred ? scorePrediction(pred, match, config) : 0;
      totalPoints += points;
      if (pred) {
        breakdown.push({ matchId: match.id, points, homeScore: pred.homeScore, awayScore: pred.awayScore });
      }
    }

    const specialPred = specialPredictions.find(p => p.userId === user.id);
    const specialPoints = scoreSpecialPrediction(specialPred, config);
    totalPoints += specialPoints;

    return {
      userId: user.id,
      name: user.name,
      totalPoints,
      predictedCount: userPreds.length,
      specialPoints,
      breakdown,
    };
  });

  board.sort((a, b) => b.totalPoints - a.totalPoints);
  res.json(board);
});

module.exports = router;
