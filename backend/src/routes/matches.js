const express = require('express');
const { readJSON } = require('../utils/fileStore');
const { getPhaseDeadline, computeGroupRoundMap, getGroupRoundDeadline } = require('../utils/phaseDeadlines');

const router = express.Router();

// GET /api/matches — alle Matches mit computed 'locked' flag
// Gruppenphase: locked wird pro Spieltag (1/2/3) berechnet — 1h vor dem frühesten Spiel des jeweiligen Spieltags.
// Andere Phasen: locked gilt für die ganze Phase gemeinsam.
router.get('/', async (_req, res) => {
  const matches = await readJSON('matches.json');
  const config = await readJSON('config.json');
  const phaseUnlocks = config.phaseUnlocks || {};
  const now = Date.now();

  // Deadlines für Nicht-Gruppenphasen
  const deadlines = {};
  for (const m of matches) {
    if (m.phase !== 'group' && !(m.phase in deadlines)) {
      deadlines[m.phase] = getPhaseDeadline(matches, m.phase);
    }
  }

  // Spieltag-Zuordnung und Deadlines für Gruppenphase
  const groupRoundMap = computeGroupRoundMap(matches);
  const roundDeadlines = {};
  for (let r = 1; r <= 3; r++) {
    roundDeadlines[r] = getGroupRoundDeadline(matches, groupRoundMap, r);
  }

  const result = matches.map(m => {
    if (m.phase === 'group') {
      const round = groupRoundMap[m.id];
      const deadline = roundDeadlines[round];
      return {
        ...m,
        groupRound: round,
        phaseUnlocked: phaseUnlocks['group'] !== false,
        locked: now >= deadline || phaseUnlocks['group'] === false,
      };
    }
    return {
      ...m,
      phaseUnlocked: phaseUnlocks[m.phase] !== false,
      locked: now >= deadlines[m.phase] || phaseUnlocks[m.phase] === false,
    };
  });

  res.json(result);
});

module.exports = router;
