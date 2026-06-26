// Lädt ALLE KV-Daten in einen lokalen, mit Zeitstempel versehenen Ordner herunter.
// Reines Backup (nur Lesen) — schreibt NICHTS nach KV.
//
//   node backend/scripts/backup-kv.js
//
// Ablage: backend/backups/<YYYY-MM-DD_HH-MM-SS>/*.json  (in .gitignore-würdig, lokal)

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { readJSON } = require('../src/utils/fileStore');

const KEYS = ['users.json', 'predictions.json', 'specialPredictions.json', 'matches.json', 'config.json'];

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
}

async function main() {
  const dir = path.join(__dirname, '../backups', stamp());
  fs.mkdirSync(dir, { recursive: true });
  console.log(`\n=== KV-Backup -> ${path.relative(path.join(__dirname, '../..'), dir)} ===\n`);

  for (const key of KEYS) {
    const data = await readJSON(key);
    const file = path.join(dir, key);
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
    const size = Array.isArray(data) ? `${data.length} Einträge` : (data ? 'Objekt' : 'LEER/∅');
    console.log(`  ✅ ${key.padEnd(24)} ${size}`);
  }
  console.log(`\n✅ Backup vollständig in: ${dir}\n`);
  // Pfad zurückgeben für ggf. nachgelagerte Verifikation
  return dir;
}

main().catch(err => { console.error('❌ Backup fehlgeschlagen:', err); process.exit(1); });
