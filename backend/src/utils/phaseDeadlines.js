const LOCK_BUFFER_MS = 60 * 60 * 1000; // 1 Stunde vor Anpfiff des ersten Spiels der Phase/des Spieltags

// Tipp-Schluss für eine (Nicht-Gruppen-)Phase = Anpfiff ihres frühesten Spiels minus 1 Stunde.
function getPhaseDeadline(matches, phase) {
  const phaseMatches = matches.filter(m => m.phase === phase);
  if (phaseMatches.length === 0) return null;
  const earliestKickoff = Math.min(...phaseMatches.map(m => new Date(m.kickoff).getTime()));
  return earliestKickoff - LOCK_BUFFER_MS;
}

// Berechnet pro Gruppenspiel den Spieltag (1, 2 oder 3):
// Spiele innerhalb einer Gruppe werden nach Anpfiff sortiert;
// die ersten 2 = Spieltag 1, nächsten 2 = Spieltag 2, letzten 2 = Spieltag 3.
function computeGroupRoundMap(matches) {
  const map = {};
  const groups = [...new Set(matches.filter(m => m.phase === 'group').map(m => m.group))];
  for (const group of groups) {
    const sorted = matches
      .filter(m => m.phase === 'group' && m.group === group)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
    sorted.forEach((m, i) => { map[m.id] = Math.floor(i / 2) + 1; });
  }
  return map;
}

// Tipp-Schluss für einen Gruppen-Spieltag = frühester Anpfiff aller Spiele dieses Spieltags minus 1 Stunde.
function getGroupRoundDeadline(matches, groupRoundMap, round) {
  const roundMatches = matches.filter(m => m.phase === 'group' && groupRoundMap[m.id] === round);
  if (roundMatches.length === 0) return null;
  const earliest = Math.min(...roundMatches.map(m => new Date(m.kickoff).getTime()));
  return earliest - LOCK_BUFFER_MS;
}

module.exports = { getPhaseDeadline, computeGroupRoundMap, getGroupRoundDeadline, LOCK_BUFFER_MS };
