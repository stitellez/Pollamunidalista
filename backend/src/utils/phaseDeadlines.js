const LOCK_BUFFER_MS = 60 * 60 * 1000; // 1 Stunde vor Anpfiff des ersten Spiels der Phase

// Tipp-Schluss für eine Phase = Anpfiff ihres frühesten Spiels minus 1 Stunde.
// Gilt für die ganze Phase gemeinsam — nicht pro Spiel.
function getPhaseDeadline(matches, phase) {
  const phaseMatches = matches.filter(m => m.phase === phase);
  if (phaseMatches.length === 0) return null;
  const earliestKickoff = Math.min(...phaseMatches.map(m => new Date(m.kickoff).getTime()));
  return earliestKickoff - LOCK_BUFFER_MS;
}

module.exports = { getPhaseDeadline, LOCK_BUFFER_MS };
