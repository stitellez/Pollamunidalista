// SICHERE Migration auf das automatische FIFA-Bracket — OHNE Datenverlust.
//
// Was sie macht:
//   • Gruppenspiele (m1..m72) inkl. EINGETRAGENER ERGEBNISSE bleiben aus KV erhalten.
//   • Das (kaputte/alte) K.-o.-Tableau wird durch die korrekte FIFA-Struktur (m73..m104) ersetzt.
//   • Danach wird das Bracket aus den vorhandenen Gruppenergebnissen aufgelöst (Auto-Fill).
//   • config.scoring.advanceBonus wird ergänzt, falls es fehlt — sonst bleibt die Config unangetastet.
//   • users.json / predictions.json / specialPredictions.json werden NICHT angefasst.
//
// Standard = DRY-RUN (zeigt nur, was passieren würde, schreibt NICHTS).
// Erst mit  --commit  wird tatsächlich nach KV geschrieben.
//
//   node backend/scripts/migrate-bracket.js            # Vorschau
//   node backend/scripts/migrate-bracket.js --commit   # ausführen

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { readJSON, writeJSON } = require('../src/utils/fileStore');
const { propagate, KNOCKOUT_IDS } = require('../src/utils/bracket');

const COMMIT = process.argv.includes('--commit');
const NEW_IDS = new Set(KNOCKOUT_IDS); // m73..m104

async function main() {
  const liveMatches = await readJSON('matches.json');
  const predictions = (await readJSON('predictions.json')) || [];
  const config = (await readJSON('config.json')) || {};

  if (!Array.isArray(liveMatches)) throw new Error('KV hat keine matches.json — Abbruch.');

  // 1) Gruppenspiele aus KV behalten (mit Ergebnissen!)
  const groupMatches = liveMatches.map(m => ({ ...m })).filter(m => m.phase === 'group');
  const groupWithResults = groupMatches.filter(m => m.homeScore !== null).length;

  // 2) Saubere K.-o.-Struktur aus der lokalen data/matches.json (m73..m104, alle TBD)
  const seedMatches = JSON.parse(fs.readFileSync(path.join(__dirname, '../../data/matches.json'), 'utf8'));
  const newKnockout = seedMatches.filter(m => NEW_IDS.has(m.id)).map(m => ({ ...m }));

  // 3) Kombinieren + Bracket aus vorhandenen Gruppenergebnissen auflösen
  let merged = [...groupMatches, ...newKnockout];
  merged = propagate(merged);

  // 4) Sicherheits-Check: gibt es Tipps auf ALTE K.-o.-IDs, die verloren gingen?
  const oldKnockoutIds = new Set(liveMatches.filter(m => m.phase !== 'group').map(m => m.id));
  const orphanPreds = predictions.filter(p => oldKnockoutIds.has(p.matchId) && !NEW_IDS.has(p.matchId));
  const groupPreds = predictions.filter(p => groupMatches.some(g => g.id === p.matchId));

  // 5) Config: advanceBonus ergänzen, sonst nichts ändern
  const newConfig = JSON.parse(JSON.stringify(config));
  newConfig.scoring = newConfig.scoring || {};
  const addedBonus = newConfig.scoring.advanceBonus === undefined;
  if (addedBonus) newConfig.scoring.advanceBonus = 2;

  // ---- Bericht ----
  const resolvedR32 = merged.filter(m => m.phase === 'round_of_32');
  const filledR32 = resolvedR32.filter(m => m.homeTeam !== 'TBD' && m.awayTeam !== 'TBD').length;

  console.log(`\n=== Migration ${COMMIT ? '(COMMIT — schreibt nach KV)' : '(DRY-RUN — schreibt NICHTS)'} ===\n`);
  console.log('UNANGETASTET:');
  console.log(`  • users.json            (bleibt)`);
  console.log(`  • predictions.json      ${predictions.length} Tipps  (bleibt) — davon Gruppenphase: ${groupPreds.length}`);
  console.log(`  • specialPredictions    (bleibt)`);
  console.log('\nMATCHES:');
  console.log(`  • Gruppenspiele behalten: ${groupMatches.length}  (mit Ergebnis: ${groupWithResults})`);
  console.log(`  • Altes K.-o.-Tableau ersetzt: ${oldKnockoutIds.size} Einträge -> neu: ${newKnockout.length} (m73..m104)`);
  console.log(`  • Gesamt nach Migration: ${merged.length} (Soll: 104)`);
  console.log(`  • R32 bereits aufgelöst aus aktuellen Gruppenergebnissen: ${filledR32}/16`);
  console.log('\nCONFIG:');
  console.log(`  • advanceBonus: ${addedBonus ? 'NEU hinzugefügt (=2)' : 'bereits vorhanden (' + newConfig.scoring.advanceBonus + ') — unverändert'}`);

  if (orphanPreds.length > 0) {
    console.log(`\n⚠️  ACHTUNG: ${orphanPreds.length} Tipps zeigen auf ALTE K.-o.-IDs und würden verwaisen!`);
    console.log('   (IDs:', [...new Set(orphanPreds.map(p => p.matchId))].join(', '), ')');
    console.log('   -> Migration NICHT committen, bevor das geklärt ist. Melde dich, dann bauen wir ein Remapping.');
  } else {
    console.log(`\n✅ Keine Tipps auf alte K.-o.-IDs — es geht KEIN Pronóstico verloren.`);
  }

  if (!COMMIT) {
    console.log('\nVorschau fertig. Nichts geschrieben. Zum Ausführen:  node backend/scripts/migrate-bracket.js --commit\n');
    return;
  }
  if (orphanPreds.length > 0) {
    console.log('\n❌ Abbruch: verwaiste K.-o.-Tipps vorhanden. Erst klären (siehe oben).\n');
    process.exit(1);
  }

  await writeJSON('matches.json', merged);
  await writeJSON('config.json', newConfig);
  console.log('\n✅ Geschrieben: matches.json + config.json. users/predictions/specialPredictions unberührt.\n');
}

main().catch(err => { console.error('❌ Migration fehlgeschlagen:', err); process.exit(1); });
