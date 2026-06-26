const { getOutcome } = require('./scoring');

// Baut eine leere Statistik-Zeile für ein Team.
function emptyRow(team) {
  return { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
}

// Wendet ein gespieltes Match auf zwei Statistik-Zeilen an (mutiert home/away).
function applyMatch(home, away, homeScore, awayScore) {
  const outcome = getOutcome(homeScore, awayScore);
  home.played++; away.played++;
  home.gf += homeScore; home.ga += awayScore;
  away.gf += awayScore; away.ga += homeScore;
  home.gd = home.gf - home.ga;
  away.gd = away.gf - away.ga;
  if (outcome === 'home') { home.won++; home.points += 3; away.lost++; }
  else if (outcome === 'away') { away.won++; away.points += 3; home.lost++; }
  else { home.drawn++; away.drawn++; home.points++; away.points++; }
}

// Berechnet Punkte/Tore NUR aus den Spielen zwischen einer Teilmenge von Teams
// (Head-to-Head) — für die FIFA-Tiebreaker nach Artikel 13, Schritt 1.
function headToHead(teamNames, groupMatches) {
  const sub = {};
  for (const t of teamNames) sub[t] = emptyRow(t);
  for (const m of groupMatches) {
    if (m.homeScore === null || m.awayScore === null) continue;
    if (sub[m.homeTeam] && sub[m.awayTeam]) {
      applyMatch(sub[m.homeTeam], sub[m.awayTeam], m.homeScore, m.awayScore);
    }
  }
  return sub;
}

// Vergleicht zwei Gesamt-Zeilen nach Gesamt-Tordifferenz, dann Gesamt-Toren.
function compareOverall(a, b) {
  if (b.gd !== a.gd) return b.gd - a.gd;
  return b.gf - a.gf;
}

// Sortiert die Teams einer Gruppe nach FIFA-Artikel 13:
//   1. Gesamtpunkte
//   2. bei Gleichstand: Direktvergleich (Punkte → TD → Tore) NUR unter den punktgleichen Teams
//   3. danach: Gesamt-Tordifferenz → Gesamt-Tore
// (Fair-Play-Wertung und Losentscheid werden nicht automatisch aufgelöst — solche
//  Extremfälle kann der Admin im Knockout-Tab manuell überschreiben.)
function rankGroup(rows, groupMatches) {
  const sorted = [...rows].sort((a, b) => b.points - a.points);
  const result = [];
  let i = 0;
  while (i < sorted.length) {
    // alle Teams mit identischer Punktzahl zusammenfassen
    let j = i;
    while (j < sorted.length && sorted[j].points === sorted[i].points) j++;
    const tiedRows = sorted.slice(i, j);

    if (tiedRows.length === 1) {
      result.push(tiedRows[0]);
    } else {
      const names = tiedRows.map(r => r.team);
      const h2h = headToHead(names, groupMatches);
      tiedRows.sort((a, b) => {
        const ha = h2h[a.team], hb = h2h[b.team];
        if (hb.points !== ha.points) return hb.points - ha.points;
        if (hb.gd !== ha.gd) return hb.gd - ha.gd;
        if (hb.gf !== ha.gf) return hb.gf - ha.gf;
        return compareOverall(a, b);
      });
      result.push(...tiedRows);
    }
    i = j;
  }
  return result;
}

// Liefert pro Gruppe die sortierte Tabelle (Index 0 = Sieger, 1 = Zweiter, 2 = Dritter ...).
function computeStandings(matches) {
  const groups = {};
  const groupMatchesByGroup = {};
  const groupMatches = matches.filter(m => m.phase === 'group');

  for (const match of groupMatches) {
    const g = match.group;
    if (!groups[g]) { groups[g] = {}; groupMatchesByGroup[g] = []; }
    groupMatchesByGroup[g].push(match);
    for (const team of [match.homeTeam, match.awayTeam]) {
      if (!groups[g][team]) groups[g][team] = emptyRow(team);
    }
    if (match.homeScore === null || match.awayScore === null) continue;
    applyMatch(groups[g][match.homeTeam], groups[g][match.awayTeam], match.homeScore, match.awayScore);
  }

  const result = {};
  for (const [group, teams] of Object.entries(groups)) {
    result[group] = rankGroup(Object.values(teams), groupMatchesByGroup[group]);
  }
  return result;
}

// Ist eine Gruppe vollständig gespielt? (alle 6 Spiele haben ein Ergebnis)
function isGroupComplete(matches, group) {
  const gm = matches.filter(m => m.phase === 'group' && m.group === group);
  return gm.length > 0 && gm.every(m => m.homeScore !== null && m.awayScore !== null);
}

// Rangliste der Gruppendritten über alle Gruppen hinweg (nur vollständige Gruppen),
// sortiert nach Punkte → Gesamt-TD → Gesamt-Tore. Liefert Array von { group, team, ...stats }.
function computeThirdPlaceRanking(matches, standings) {
  const thirds = [];
  for (const [group, table] of Object.entries(standings)) {
    if (!isGroupComplete(matches, group)) continue;
    if (table[2]) thirds.push({ group, ...table[2] });
  }
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    return b.gf - a.gf;
  });
  return thirds;
}

module.exports = { computeStandings, computeThirdPlaceRanking, isGroupComplete };
