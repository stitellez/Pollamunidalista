const express = require('express');
const { readJSON } = require('../utils/fileStore');
const { computeStandings } = require('../utils/standings');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/standings
router.get('/', requireAuth, (_req, res) => {
  const matches = readJSON('matches.json');
  res.json(computeStandings(matches));
});

module.exports = router;
