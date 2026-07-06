// Einmal-Skript: trägt Luchos fehlenden Tipp für m91 (Brazil vs Norway, R16) nach.
// Tipp: 2:2, Norwegen (away) kommt per Elfmeterschießen weiter (advance=away).
// Dry-Run per Default; schreibt NUR mit --commit nach KV.
//
//   node backend/scripts/set-lucho-m91.js            # Vorschau
//   node backend/scripts/set-lucho-m91.js --commit   # ausführen

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { readJSON, writeJSON } = require('../src/utils/fileStore');
const { scorePrediction } = require('../src/utils/scoring');

const COMMIT = process.argv.includes('--commit');
const MATCH_ID = 'm91';
// Brasilien:Norwegen, Norwegen weiter. halfPoints=true -> zählt nur die halbe
// Endpunktzahl (Regel für nachträglich eingetragene Tipps).
const NEW = { homeScore: 2, awayScore: 2, advance: 'away', halfPoints: true };

async function main() {
  const users = await readJSON('users.json');
  const matches = await readJSON('matches.json');
  const config = await readJSON('config.json');
  const predictions = await readJSON('predictions.json');

  const lucho = users.find(u => /^lucho$/i.test(u.name));
  if (!lucho) throw new Error('User Lucho nicht gefunden');
  const match = matches.find(m => m.id === MATCH_ID);
  if (!match) throw new Error(`Spiel ${MATCH_ID} nicht gefunden`);

  console.log(`Spiel  : ${match.homeTeam} vs ${match.awayTeam} (${match.phase}) — Ergebnis ${match.homeScore}:${match.awayScore} shootout=${match.shootoutWinner ?? '-'}`);
  console.log(`User   : ${lucho.name} (${lucho.id})`);

  const idx = predictions.findIndex(p => p.userId === lucho.id && p.matchId === MATCH_ID);
  console.log(`Vorher : ${idx >= 0 ? 'EXISTIERT ' + JSON.stringify(predictions[idx]) : 'kein Tipp'}`);

  const entry = {
    userId: lucho.id,
    matchId: MATCH_ID,
    homeScore: NEW.homeScore,
    awayScore: NEW.awayScore,
    advance: NEW.advance,
    halfPoints: NEW.halfPoints,
    submittedAt: new Date().toISOString(),
  };

  const points = scorePrediction(entry, match, config);
  console.log(`Neu    : ${JSON.stringify(entry)}`);
  console.log(`Punkte : ${points}`);

  if (!COMMIT) {
    console.log('\n[DRY-RUN] nichts geschrieben. Mit --commit ausführen.');
    return;
  }

  if (idx >= 0) predictions[idx] = entry; else predictions.push(entry);
  await writeJSON('predictions.json', predictions);
  console.log(`\n✅ geschrieben. predictions.json jetzt ${predictions.length} Einträge.`);
}

main().catch(e => { console.error('FEHLER:', e.message); process.exit(1); });
