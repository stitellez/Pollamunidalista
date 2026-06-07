const express = require('express');
const { readJSON } = require('../utils/fileStore');
const { getPhaseDeadline } = require('../utils/phaseDeadlines');

const router = express.Router();

// GET /api/matches — alle Matches mit computed 'locked' flag
// Eine Phase (alle ihre Spiele gemeinsam) ist gesperrt, wenn entweder die Tipp-Frist
// erreicht ist (1 Stunde vor Anpfiff des ersten Spiels der Phase) ODER der Admin
// die Phase noch nicht freigegeben hat (phaseUnlocks in config.json).
router.get('/', async (_req, res) => {
  const matches = await readJSON('matches.json');
  const config = await readJSON('config.json');
  const phaseUnlocks = config.phaseUnlocks || {};
  const now = Date.now();
  const deadlines = {};
  for (const m of matches) {
    if (!(m.phase in deadlines)) deadlines[m.phase] = getPhaseDeadline(matches, m.phase);
  }
  const result = matches.map(m => ({
    ...m,
    phaseUnlocked: phaseUnlocks[m.phase] !== false,
    locked: now >= deadlines[m.phase] || phaseUnlocks[m.phase] === false,
  }));
  res.json(result);
});

module.exports = router;
