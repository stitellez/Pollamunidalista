function getOutcome(home, away) {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

function bothScored(home, away) {
  return home > 0 && away > 0;
}

// Each evaluator receives (prediction, match) and returns true if the bonus condition is met.
const BONUS_CONDITIONS = {
  correct_home_goals: (p, m) => p.homeScore === m.homeScore,
  correct_away_goals: (p, m) => p.awayScore === m.awayScore,
  correct_goal_difference: (p, m) => (p.homeScore - p.awayScore) === (m.homeScore - m.awayScore),
  correct_total_goals: (p, m) => (p.homeScore + p.awayScore) === (m.homeScore + m.awayScore),
  correct_draw: (p, m) =>
    getOutcome(p.homeScore, p.awayScore) === 'draw' && getOutcome(m.homeScore, m.awayScore) === 'draw',
  both_teams_scored: (p, m) => bothScored(p.homeScore, p.awayScore) === bothScored(m.homeScore, m.awayScore),
};

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
    const condition = BONUS_CONDITIONS[rule.type];
    if (condition && condition(prediction, match)) {
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
