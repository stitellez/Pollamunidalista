function getOutcome(home, away) {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

// Returns points for a single prediction against an actual result.
// config.stacking: 'exclusive' = best rule only | 'additive' = rules stack
function scorePrediction(prediction, match, config) {
  if (match.homeScore === null || match.awayScore === null) return 0;
  if (prediction.homeScore === null || prediction.awayScore === null) return 0;

  const { exactScore, correctOutcome, stacking, bonusRules = [] } = config.scoring;

  const isExact =
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore;

  const isCorrectOutcome =
    getOutcome(prediction.homeScore, prediction.awayScore) ===
    getOutcome(match.homeScore, match.awayScore);

  let bonusPoints = 0;
  for (const rule of bonusRules) {
    if (rule.type === 'correct_home_goals' && prediction.homeScore === match.homeScore) {
      bonusPoints += rule.points;
    }
    if (rule.type === 'correct_away_goals' && prediction.awayScore === match.awayScore) {
      bonusPoints += rule.points;
    }
  }

  if (stacking === 'additive') {
    let total = 0;
    if (isExact) total += exactScore;
    else if (isCorrectOutcome) total += correctOutcome;
    total += bonusPoints;
    return total;
  }

  // exclusive: best matching rule only (+ bonus on top)
  if (isExact) return exactScore + bonusPoints;
  if (isCorrectOutcome) return correctOutcome + bonusPoints;
  return 0;
}

module.exports = { scorePrediction, getOutcome };
