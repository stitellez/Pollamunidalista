// Schreibt die bestehenden data/*.json Dateien einmalig in Vercel KV.
// Voraussetzung: KV_REST_API_URL + KV_REST_API_TOKEN in backend/.env (von Vercel kopiert/gepullt).
//
// Aufruf: npm --prefix backend run seed

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { writeJSON } = require('../src/utils/fileStore');

const DATA_DIR = path.join(__dirname, '../../data');
const FILES = ['users.json', 'matches.json', 'predictions.json', 'config.json'];

async function seed() {
  for (const filename of FILES) {
    const file = path.join(DATA_DIR, filename);
    const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
    await writeJSON(filename, data);
    console.log(`✅ ${filename} → KV geschrieben (${Array.isArray(data) ? data.length + ' Einträge' : 'Objekt'})`);
  }
  console.log('🌱 Seed abgeschlossen.');
}

seed().catch(err => {
  console.error('❌ Seed fehlgeschlagen:', err);
  process.exit(1);
});
