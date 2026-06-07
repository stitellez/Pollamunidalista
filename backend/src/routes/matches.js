const express = require('express');
const { readJSON } = require('../utils/fileStore');

const router = express.Router();

// GET /api/matches — alle Matches mit computed 'locked' flag
// Ein Match ist gesperrt, wenn entweder der Anpfiff erreicht ist ODER der Admin
// die Phase noch nicht freigegeben hat (phaseUnlocks in config.json).
router.get('/', async (_req, res) => {
  const matches = await readJSON('matches.json');
  const config = await readJSON('config.json');
  const phaseUnlocks = config.phaseUnlocks || {};
  const now = Date.now();
  const result = matches.map(m => ({
    ...m,
    phaseUnlocked: phaseUnlocks[m.phase] !== false,
    locked: now >= new Date(m.kickoff).getTime() || phaseUnlocks[m.phase] === false,
  }));
  res.json(result);
});

module.exports = router;
