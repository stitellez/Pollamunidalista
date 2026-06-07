const express = require('express');
const { readJSON } = require('../utils/fileStore');

const router = express.Router();

// GET /api/matches — alle Matches mit computed 'locked' flag
router.get('/', (_req, res) => {
  const matches = readJSON('matches.json');
  const now = Date.now();
  const result = matches.map(m => ({
    ...m,
    locked: now >= new Date(m.kickoff).getTime(),
  }));
  res.json(result);
});

module.exports = router;
