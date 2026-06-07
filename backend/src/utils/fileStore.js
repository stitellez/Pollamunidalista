const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');

function readJSON(filename) {
  const file = path.join(DATA_DIR, filename);
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(filename, data) {
  const file = path.join(DATA_DIR, filename);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readJSON, writeJSON };
