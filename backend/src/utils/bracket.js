// =============================================================================
//  FIFA World Cup 2026 — offizielle K.-o.-Struktur (Annex / Art. 12.6–12.11 der
//  FIFA-Reglemente) + automatischer Bracket-Resolver.
//
//  Quelle der Struktur: Regulations for the FIFA World Cup 26™, Art. 12.6–12.11.
//  Quelle der Dritten-Zuordnung: Annex C (495 Kombinationen) -> data/thirdsAllocation.json.
//
//  Jeder K.-o.-Platz hat eine `source`, die beschreibt, woher sein Team kommt:
//    { type:'winner',   group:'A' }   -> Gruppensieger (1.)
//    { type:'runnerUp', group:'B' }   -> Gruppenzweiter (2.)
//    { type:'thirdSlot', match:'m74' }-> bester Dritter, via Annex-C-Tabelle zugeteilt
//    { type:'winnerOf', match:'m74' } -> Sieger eines K.-o.-Spiels
//    { type:'loserOf',  match:'m101' }-> Verlierer eines K.-o.-Spiels (Spiel um Platz 3)
//
//  Die acht Spiele, die einen Dritten beherbergen: m74 m77 m79 m80 m81 m82 m85 m87.
// =============================================================================

const W = (group) => ({ type: 'winner', group });
const R = (group) => ({ type: 'runnerUp', group });
const T = (match) => ({ type: 'thirdSlot', match });
const Wm = (match) => ({ type: 'winnerOf', match });
const Lm = (match) => ({ type: 'loserOf', match });

// id -> { phase, label, home (source), away (source) }
// label ist menschenlesbar und wird angezeigt solange das Team noch "TBD" ist.
const BRACKET = {
  // ---- Round of 32 (M73–M88) ----
  m73: { phase: 'round_of_32', label: '2.º A vs 2.º B',                home: R('A'), away: R('B') },
  m74: { phase: 'round_of_32', label: '1.º E vs 3.º (A/B/C/D/F)',      home: W('E'), away: T('m74') },
  m75: { phase: 'round_of_32', label: '1.º F vs 2.º C',                home: W('F'), away: R('C') },
  m76: { phase: 'round_of_32', label: '1.º C vs 2.º F',                home: W('C'), away: R('F') },
  m77: { phase: 'round_of_32', label: '1.º I vs 3.º (C/D/F/G/H)',      home: W('I'), away: T('m77') },
  m78: { phase: 'round_of_32', label: '2.º E vs 2.º I',                home: R('E'), away: R('I') },
  m79: { phase: 'round_of_32', label: '1.º A vs 3.º (C/E/F/H/I)',      home: W('A'), away: T('m79') },
  m80: { phase: 'round_of_32', label: '1.º L vs 3.º (E/H/I/J/K)',      home: W('L'), away: T('m80') },
  m81: { phase: 'round_of_32', label: '1.º D vs 3.º (B/E/F/I/J)',      home: W('D'), away: T('m81') },
  m82: { phase: 'round_of_32', label: '1.º G vs 3.º (A/E/H/I/J)',      home: W('G'), away: T('m82') },
  m83: { phase: 'round_of_32', label: '2.º K vs 2.º L',                home: R('K'), away: R('L') },
  m84: { phase: 'round_of_32', label: '1.º H vs 2.º J',                home: W('H'), away: R('J') },
  m85: { phase: 'round_of_32', label: '1.º B vs 3.º (E/F/G/I/J)',      home: W('B'), away: T('m85') },
  m86: { phase: 'round_of_32', label: '1.º J vs 2.º H',                home: W('J'), away: R('H') },
  m87: { phase: 'round_of_32', label: '1.º K vs 3.º (D/E/I/J/L)',      home: W('K'), away: T('m87') },
  m88: { phase: 'round_of_32', label: '2.º D vs 2.º G',                home: R('D'), away: R('G') },

  // ---- Round of 16 (M89–M96) ----
  m89: { phase: 'round_of_16', label: 'Ganador M74 vs Ganador M77', home: Wm('m74'), away: Wm('m77') },
  m90: { phase: 'round_of_16', label: 'Ganador M73 vs Ganador M75', home: Wm('m73'), away: Wm('m75') },
  m91: { phase: 'round_of_16', label: 'Ganador M76 vs Ganador M78', home: Wm('m76'), away: Wm('m78') },
  m92: { phase: 'round_of_16', label: 'Ganador M79 vs Ganador M80', home: Wm('m79'), away: Wm('m80') },
  m93: { phase: 'round_of_16', label: 'Ganador M83 vs Ganador M84', home: Wm('m83'), away: Wm('m84') },
  m94: { phase: 'round_of_16', label: 'Ganador M81 vs Ganador M82', home: Wm('m81'), away: Wm('m82') },
  m95: { phase: 'round_of_16', label: 'Ganador M86 vs Ganador M88', home: Wm('m86'), away: Wm('m88') },
  m96: { phase: 'round_of_16', label: 'Ganador M85 vs Ganador M87', home: Wm('m85'), away: Wm('m87') },

  // ---- Quarter-finals (M97–M100) ----
  m97:  { phase: 'quarterfinal', label: 'Ganador M89 vs Ganador M90',  home: Wm('m89'), away: Wm('m90') },
  m98:  { phase: 'quarterfinal', label: 'Ganador M93 vs Ganador M94',  home: Wm('m93'), away: Wm('m94') },
  m99:  { phase: 'quarterfinal', label: 'Ganador M91 vs Ganador M92',  home: Wm('m91'), away: Wm('m92') },
  m100: { phase: 'quarterfinal', label: 'Ganador M95 vs Ganador M96',  home: Wm('m95'), away: Wm('m96') },

  // ---- Semi-finals (M101–M102) ----
  m101: { phase: 'semifinal', label: 'Ganador M97 vs Ganador M98',  home: Wm('m97'), away: Wm('m98') },
  m102: { phase: 'semifinal', label: 'Ganador M99 vs Ganador M100', home: Wm('m99'), away: Wm('m100') },

  // ---- Spiel um Platz 3 (M103) + Finale (M104) ----
  m103: { phase: 'third_place', label: 'Perdedor SF1 vs Perdedor SF2', home: Lm('m101'), away: Lm('m102') },
  m104: { phase: 'final',       label: 'Ganador SF1 vs Ganador SF2',   home: Wm('m101'), away: Wm('m102') },
};

const KNOCKOUT_IDS = Object.keys(BRACKET);
const TBD = 'TBD';

// Sieger/Verlierer eines K.-o.-Spiels bestimmen.
// Bei Gleichstand (Verlängerung -> Elfmeter) entscheidet match.shootoutWinner ('home'|'away').
function knockoutResult(match) {
  if (!match || match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return { winner: match.homeTeam, loser: match.awayTeam };
  if (match.awayScore > match.homeScore) return { winner: match.awayTeam, loser: match.homeTeam };
  // Unentschieden -> Elfmeterschießen muss gesetzt sein
  if (match.shootoutWinner === 'home') return { winner: match.homeTeam, loser: match.awayTeam };
  if (match.shootoutWinner === 'away') return { winner: match.awayTeam, loser: match.homeTeam };
  return null; // Sieger noch unbestimmt (Elfmeter fehlt)
}

// Löst eine einzelne `source` zu einem konkreten Teamnamen auf (oder 'TBD').
//   standings: { A: [row,row,...], ... } (sortiert)
//   thirdGroupBySlot: { m74:'F', m77:'G', ... } (Gruppenbuchstabe je Dritten-Slot) oder null
//   resolvedById: { m73:{home,away}, ... } bereits aufgelöste K.-o.-Matches (für Sieger/Verlierer)
//   matchById: Zugriff auf gespielte K.-o.-Ergebnisse
function resolveSource(src, ctx) {
  const { standings, completeGroups, thirdGroupBySlot, matchById } = ctx;
  switch (src.type) {
    case 'winner':
      return completeGroups.has(src.group) ? standings[src.group][0].team : TBD;
    case 'runnerUp':
      return completeGroups.has(src.group) ? standings[src.group][1].team : TBD;
    case 'thirdSlot': {
      if (!thirdGroupBySlot) return TBD;
      const group = thirdGroupBySlot[src.match];
      if (!group) return TBD;
      return standings[group] ? standings[group][2].team : TBD;
    }
    case 'winnerOf': {
      const r = knockoutResult(matchById[src.match]);
      return r ? r.winner : TBD;
    }
    case 'loserOf': {
      const r = knockoutResult(matchById[src.match]);
      return r ? r.loser : TBD;
    }
    default:
      return TBD;
  }
}

// Bestimmt die Gruppenbuchstaben-Zuordnung für die acht Dritten-Slots:
// erst wenn ALLE 12 Gruppen fertig sind (sonst steht die Achtermenge nicht fest).
// Liefert z.B. { m74:'F', m77:'G', ... } oder null.
function resolveThirdSlots(matches, standings, allocationTable) {
  const groupLetters = Object.keys(standings);
  const { computeThirdPlaceRanking, isGroupComplete } = require('./standings');
  const allComplete = groupLetters.length === 12 && groupLetters.every(g => isGroupComplete(matches, g));
  if (!allComplete) return null;

  const ranking = computeThirdPlaceRanking(matches, standings);
  const top8 = ranking.slice(0, 8).map(t => t.group).sort();
  const key = top8.join('');
  const mapping = allocationTable.allocation[key];
  if (!mapping) return null; // sollte nie passieren, wenn Tabelle vollständig ist
  return mapping;
}

// Kernfunktion: löst das gesamte Bracket auf und liefert pro K.-o.-Match { id, homeTeam, awayTeam }.
// Reihenfolge der Auflösung folgt den IDs (m73..m104), sodass spätere Runden auf
// bereits aufgelöste frühere Runden zugreifen.
function resolveBracket(matches, allocationTable) {
  const { computeStandings, isGroupComplete } = require('./standings');
  const standings = computeStandings(matches);
  const completeGroups = new Set(Object.keys(standings).filter(g => isGroupComplete(matches, g)));
  const thirdGroupBySlot = resolveThirdSlots(matches, standings, allocationTable);

  // Arbeitskopie der K.-o.-Matches (mit aktuellen Ergebnissen) als Lookup
  const matchById = {};
  for (const m of matches) if (BRACKET[m.id]) matchById[m.id] = { ...m };

  const ctx = { standings, completeGroups, thirdGroupBySlot, matchById };
  const resolved = {};

  for (const id of KNOCKOUT_IDS) {
    const def = BRACKET[id];
    const homeTeam = resolveSource(def.home, ctx);
    const awayTeam = resolveSource(def.away, ctx);
    resolved[id] = { id, homeTeam, awayTeam, label: def.label, phase: def.phase };
    // aufgelöste Teams sofort in die Arbeitskopie schreiben, damit Folge-Runden
    // (winnerOf/loserOf) korrekt weiterrechnen
    if (matchById[id]) { matchById[id].homeTeam = homeTeam; matchById[id].awayTeam = awayTeam; }
  }
  return resolved;
}

// Wendet das aufgelöste Bracket auf das matches-Array an (mutiert NICHT — liefert neue Liste).
// Setzt homeTeam/awayTeam/label/phase der K.-o.-Matches; Gruppenspiele bleiben unberührt.
// Wenn ein Team durch ein Ergebnis "TBD" würde, das vorher gesetzt war, bleibt TBD —
// das ist gewollt (z.B. wenn ein Ergebnis zurückgesetzt wird, leert sich die Folgerunde).
function applyBracket(matches, allocationTable) {
  const resolved = resolveBracket(matches, allocationTable);
  return matches.map(m => {
    const r = resolved[m.id];
    if (!r) return m;
    return { ...m, homeTeam: r.homeTeam, awayTeam: r.awayTeam, label: r.label, phase: r.phase };
  });
}

// Lädt die offizielle Annex-C-Tabelle (495 Kombinationen) von der Festplatte.
// Statische Referenzdaten — ändern sich nie, daher gecached und nicht aus KV gelesen.
let _allocation = null;
function loadAllocation() {
  if (!_allocation) _allocation = require('../../../data/thirdsAllocation.json');
  return _allocation;
}

// Komfort-Wrapper: löst das Bracket mit der eingebauten Annex-C-Tabelle auf und
// liefert die aktualisierte matches-Liste. Das ist die Funktion, die nach jedem
// eingetragenen Ergebnis aufgerufen wird.
function propagate(matches) {
  return applyBracket(matches, loadAllocation());
}

module.exports = { BRACKET, KNOCKOUT_IDS, resolveBracket, applyBracket, knockoutResult, propagate, loadAllocation };
