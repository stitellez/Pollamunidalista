function getOutcome(home, away) {
  if (home > away) return 'home';
  if (away > home) return 'away';
  return 'draw';
}

function bothScored(home, away) {
  return home > 0 && away > 0;
}

// K.-o.-Phasen — hier gibt es immer einen Sieger, der weiterkommt.
const KNOCKOUT_PHASES = new Set([
  'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final',
]);

// Welche Seite kommt laut tatsächlichem Ergebnis weiter? 'home' | 'away' | null.
// Bei Unentschieden nach Spielzeit entscheidet das Elfmeterschießen (shootoutWinner).
function actualAdvance(match) {
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return 'home';
  if (match.awayScore > match.homeScore) return 'away';
  if (match.shootoutWinner === 'home' || match.shootoutWinner === 'away') return match.shootoutWinner;
  return null;
}

// Welche Seite hat der Tipper als Weiterkommer angegeben? 'home' | 'away' | null.
// Explizite Wahl (prediction.advance) gewinnt; sonst aus einem nicht-unentschiedenen
// Tipp abgeleitet. Tipp auf Unentschieden ohne explizite Wahl -> null (kein Bonus).
function predictedAdvance(prediction) {
  if (prediction.advance === 'home' || prediction.advance === 'away') return prediction.advance;
  if (prediction.homeScore > prediction.awayScore) return 'home';
  if (prediction.awayScore > prediction.homeScore) return 'away';
  return null;
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
//
// Base scoring is cumulative — every condition the prediction satisfies adds its
// points (exact result implies correct goal difference implies correct outcome,
// so a perfect hit collects all three). The sum (base + custom bonus rules) is
// then multiplied by the phase multiplier (knockout rounds count for more).
function scorePrediction(prediction, match, config) {
  if (match.homeScore === null || match.awayScore === null) return 0;
  if (prediction.homeScore === null || prediction.awayScore === null) return 0;

  const { exactScore, goalDifferenceScore, correctOutcomeScore, phaseMultipliers = {}, bonusRules = [], advanceBonus = 0 } = config.scoring;

  const isExact =
    prediction.homeScore === match.homeScore &&
    prediction.awayScore === match.awayScore;

  const isCorrectGoalDifference =
    (prediction.homeScore - prediction.awayScore) === (match.homeScore - match.awayScore);

  const isCorrectOutcome =
    getOutcome(prediction.homeScore, prediction.awayScore) ===
    getOutcome(match.homeScore, match.awayScore);

  let basePoints = 0;
  if (isExact) basePoints += exactScore;
  if (isCorrectGoalDifference) basePoints += goalDifferenceScore;
  if (isCorrectOutcome) basePoints += correctOutcomeScore;

  let bonusPoints = 0;
  for (const rule of bonusRules) {
    const condition = BONUS_CONDITIONS[rule.type];
    if (condition && condition(prediction, match)) {
      bonusPoints += rule.points;
    }
  }

  // K.-o.-Bonus „Weiterkommer": in Eliminationsspielen Punkte fürs richtige Tippen,
  // welches Team weiterkommt — löst den Elfmeter-Fall sauber (bei getipptem
  // Unentschieden ist die explizite Weiterkommer-Wahl das einzige Unterscheidungsmerkmal).
  if (advanceBonus > 0 && KNOCKOUT_PHASES.has(match.phase)) {
    const actual = actualAdvance(match);
    const predicted = predictedAdvance(prediction);
    if (actual && predicted && actual === predicted) {
      bonusPoints += advanceBonus;
    }
  }

  const multiplier = phaseMultipliers[match.phase] ?? 1;
  let total = (basePoints + bonusPoints) * multiplier;

  // Regel „halbe Punktzahl": nachträglich/verspätet eingetragene Tipps (Flag
  // prediction.halfPoints === true) zählen nur die Hälfte der Endpunktzahl.
  // Wird vom Admin/Injektions-Skript gesetzt; normale Tipps haben das Flag nicht.
  if (prediction.halfPoints === true) total = total / 2;

  return total;
}

function normalizeName(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// Returns points for a tournament-wide "special" prediction (champion / runner-up / top scorer).
function scoreSpecialPrediction(prediction, config) {
  if (!prediction) return 0;
  const { championPoints, runnerUpPoints, topScorerPoints, results } = config.special;

  let total = 0;
  if (results.champion && normalizeName(prediction.champion) === normalizeName(results.champion)) {
    total += championPoints;
  }
  if (results.runnerUp && normalizeName(prediction.runnerUp) === normalizeName(results.runnerUp)) {
    total += runnerUpPoints;
  }
  if (results.topScorer && normalizeName(prediction.topScorer) === normalizeName(results.topScorer)) {
    total += topScorerPoints;
  }
  return total;
}

module.exports = { scorePrediction, scoreSpecialPrediction, getOutcome };
