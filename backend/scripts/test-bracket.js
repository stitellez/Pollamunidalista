// Simuliert einen kompletten Turnierverlauf und prüft, dass sich das Bracket
// nach jedem Ergebnis korrekt automatisch füllt (Gruppen -> R32 -> ... -> Finale).
//
//   node backend/scripts/test-bracket.js
//
// Nutzt KEIN KV — arbeitet rein auf data/matches.json + data/thirdsAllocation.json.

const fs = require('fs');
const path = require('path');
const { propagate, knockoutResult } = require('../src/utils/bracket');
const { computeStandings, computeThirdPlaceRanking } = require('../src/utils/standings');

const DATA = path.join(__dirname, '../../data');
const base = JSON.parse(fs.readFileSync(path.join(DATA, 'matches.json'), 'utf8'));

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  ❌ FAIL:', msg); }
}

// Deterministische, aber „realistische" Tor-Erzeugung pro Match.
function scoreFor(seed) {
  const h = (seed * 7 + 3) % 5;
  const a = (seed * 13 + 1) % 4;
  return [h, a];
}

let matches = base.map(m => ({ ...m }));

// ---------- 1) Gruppenphase: alle 72 Spiele eintragen ----------
let seed = 1;
matches.forEach(m => {
  if (m.phase === 'group') {
    const [h, a] = scoreFor(seed++);
    m.homeScore = h; m.awayScore = a;
  }
});
matches = propagate(matches);

const standings = computeStandings(matches);
const groups = Object.keys(standings).sort();
console.log('Gruppen gefunden:', groups.join(''));
assert(groups.length === 12, 'es müssen 12 Gruppen sein, ist: ' + groups.length);

// R32 darf keine TBD mehr enthalten
const r32 = matches.filter(m => m.phase === 'round_of_32');
assert(r32.length === 16, 'R32 hat 16 Spiele');
const tbdR32 = r32.filter(m => m.homeTeam === 'TBD' || m.awayTeam === 'TBD');
assert(tbdR32.length === 0, 'kein TBD in R32 nach voller Gruppenphase; offen: ' + tbdR32.map(m=>m.id).join(','));

// Die 8 Dritten-Slots müssen genau die 8 bestplatzierten Dritten enthalten
const ranking = computeThirdPlaceRanking(matches, standings);
const top8Teams = new Set(ranking.slice(0, 8).map(t => t.team));
const thirdSlotMatches = ['m74','m77','m79','m80','m81','m82','m85','m87'];
const teamsInThirdSlots = new Set(thirdSlotMatches.map(id => {
  const m = matches.find(x => x.id === id);
  return m.awayTeam; // Dritter steht immer auf der Auswärtsseite dieser Spiele
}));
assert(teamsInThirdSlots.size === 8, 'genau 8 verschiedene Dritte in den Slots');
let allTop8 = true;
for (const t of teamsInThirdSlots) if (!top8Teams.has(t)) allTop8 = false;
assert(allTop8, 'die Teams in den Dritten-Slots sind genau die 8 besten Dritten');
console.log('Top-8 Dritte (Gruppen):', ranking.slice(0,8).map(t=>t.group).sort().join(''));

// Kein Team darf in R32 doppelt vorkommen, keine zwei aus derselben Gruppe im selben Spiel
const seen = new Set();
let dupTeam = false;
r32.forEach(m => {
  [m.homeTeam, m.awayTeam].forEach(t => { if (seen.has(t)) dupTeam = true; seen.add(t); });
});
assert(!dupTeam, 'kein Team kommt in R32 doppelt vor');
assert(seen.size === 32, 'R32 enthält 32 verschiedene Teams, ist: ' + seen.size);

// ---------- 2) K.-o.-Runden nacheinander simulieren ----------
function playRound(phase, expectTbdNext) {
  const roundMatches = matches.filter(m => m.phase === phase);
  roundMatches.forEach(m => {
    let [h, a] = scoreFor(seed++);
    m.homeScore = h; m.awayScore = a;
    if (h === a) m.shootoutWinner = (seed % 2 === 0) ? 'home' : 'away'; // Elfmeter erzwingen
  });
  matches = propagate(matches);
}

playRound('round_of_32');
const r16 = matches.filter(m => m.phase === 'round_of_16');
assert(r16.length === 8, 'R16 hat 8 Spiele');
assert(r16.every(m => m.homeTeam !== 'TBD' && m.awayTeam !== 'TBD'), 'kein TBD in R16 nach R32');

playRound('round_of_16');
const qf = matches.filter(m => m.phase === 'quarterfinal');
assert(qf.length === 4, 'QF hat 4 Spiele (nicht 8!)');
assert(qf.every(m => m.homeTeam !== 'TBD' && m.awayTeam !== 'TBD'), 'kein TBD in QF nach R16');

playRound('quarterfinal');
const sf = matches.filter(m => m.phase === 'semifinal');
assert(sf.length === 2, 'SF hat 2 Spiele (nicht 4!)');
assert(sf.every(m => m.homeTeam !== 'TBD' && m.awayTeam !== 'TBD'), 'kein TBD in SF nach QF');

playRound('semifinal');
const third = matches.find(m => m.phase === 'third_place');
const final = matches.find(m => m.phase === 'final');
assert(third.homeTeam !== 'TBD' && third.awayTeam !== 'TBD', 'Spiel um Platz 3 ist gefüllt');
assert(final.homeTeam !== 'TBD' && final.awayTeam !== 'TBD', 'Finale ist gefüllt');

// Finale = Sieger SF1 vs Sieger SF2 ; Platz 3 = Verlierer SF1 vs Verlierer SF2
const sf1 = matches.find(m => m.id === 'm101');
const sf2 = matches.find(m => m.id === 'm102');
const r1 = knockoutResult(sf1), r2 = knockoutResult(sf2);
assert(final.homeTeam === r1.winner && final.awayTeam === r2.winner, 'Finale = Sieger der Halbfinals');
assert(third.homeTeam === r1.loser && third.awayTeam === r2.loser, 'Platz 3 = Verlierer der Halbfinals');
console.log(`Finale: ${final.homeTeam} vs ${final.awayTeam}`);
console.log(`Platz 3: ${third.homeTeam} vs ${third.awayTeam}`);

// ---------- 3) Reset-Verhalten: ein Gruppenergebnis löschen -> Folge wird wieder TBD-fähig ----------
{
  let m2 = matches.map(x => ({ ...x }));
  const g = m2.find(x => x.phase === 'group');
  g.homeScore = null; g.awayScore = null;
  m2 = propagate(m2);
  const winnerSlot = m2.find(x => x.id === 'm79'); // 1.º A
  // Gruppe A ist jetzt unvollständig -> deren Sieger/Dritten-Zuordnung unbestimmt
  const aGroup = g.group;
  const dependsOnA = ['m73','m74','m75','m76','m77','m78','m79','m80','m81','m82','m85','m87'];
  // mindestens die Dritten-Slots werden TBD, weil die 8er-Menge nicht mehr feststeht
  const anyTbd = ['m74','m77','m79','m80','m81','m82','m85','m87']
    .some(id => { const m = m2.find(x=>x.id===id); return m.awayTeam === 'TBD'; });
  assert(anyTbd, 'nach Löschen eines Gruppenergebnisses werden die Dritten-Slots wieder TBD');
}

// ---------- 4) Scoring: Bonus „Weiterkommer" inkl. Elfmeter-Fall ----------
{
  const { scorePrediction } = require('../src/utils/scoring');
  const config = { scoring: {
    exactScore: 5, goalDifferenceScore: 3, correctOutcomeScore: 1,
    advanceBonus: 2, phaseMultipliers: { round_of_16: 1, group: 1 }, bonusRules: [],
  }};

  // a) Elfmeter: Tipp 1:1 + "home pasa", real 1:1 (home im Elfmeter) -> Marker (5+3+1) + Bonus 2 = 11
  const koTie = { phase: 'round_of_16', homeScore: 1, awayScore: 1, shootoutWinner: 'home' };
  assert(scorePrediction({ homeScore: 1, awayScore: 1, advance: 'home' }, koTie, config) === 11,
    'K.-o. Unentschieden + richtiger Weiterkommer (Elfmeter) = 11');
  // b) gleicher Tipp aber "away pasa" -> kein Bonus -> 9
  assert(scorePrediction({ homeScore: 1, awayScore: 1, advance: 'away' }, koTie, config) === 9,
    'K.-o. Unentschieden + falscher Weiterkommer = 9 (kein Bonus)');
  // c) Tipp auf Unentschieden OHNE Weiterkommer-Wahl -> kein Bonus -> 9
  assert(scorePrediction({ homeScore: 1, awayScore: 1 }, koTie, config) === 9,
    'K.-o. Unentschieden ohne Weiterkommer-Wahl = kein Bonus');
  // d) klarer Sieg-Tipp 2:0, real 2:0 -> Weiterkommer implizit korrekt -> 5+3+1 +2 = 11
  const koWin = { phase: 'round_of_16', homeScore: 2, awayScore: 0, shootoutWinner: null };
  assert(scorePrediction({ homeScore: 2, awayScore: 0 }, koWin, config) === 11,
    'K.-o. klarer Sieg: Weiterkommer implizit -> Bonus zählt');
  // e) Gruppenspiel: Bonus zählt NIE
  const grp = { phase: 'group', homeScore: 1, awayScore: 1, shootoutWinner: null };
  assert(scorePrediction({ homeScore: 1, awayScore: 1, advance: 'home' }, grp, config) === 9,
    'Gruppenspiel: kein Weiterkommer-Bonus');
}

console.log(`\n${failed === 0 ? '✅' : '❌'}  ${passed} Checks bestanden, ${failed} fehlgeschlagen.`);
process.exit(failed === 0 ? 0 : 1);
