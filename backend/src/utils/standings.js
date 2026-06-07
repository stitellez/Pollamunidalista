const { getOutcome } = require('./scoring');

function computeStandings(matches) {
  const groups = {};

  const groupMatches = matches.filter(m => m.phase === 'group');

  for (const match of groupMatches) {
    const g = match.group;
    if (!groups[g]) groups[g] = {};

    for (const team of [match.homeTeam, match.awayTeam]) {
      if (!groups[g][team]) {
        groups[g][team] = { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
      }
    }

    if (match.homeScore === null || match.awayScore === null) continue;

    const home = groups[g][match.homeTeam];
    const away = groups[g][match.awayTeam];
    const outcome = getOutcome(match.homeScore, match.awayScore);

    home.played++;
    away.played++;
    home.gf += match.homeScore;
    home.ga += match.awayScore;
    away.gf += match.awayScore;
    away.ga += match.homeScore;
    home.gd = home.gf - home.ga;
    away.gd = away.gf - away.ga;

    if (outcome === 'home') {
      home.won++;
      home.points += 3;
      away.lost++;
    } else if (outcome === 'away') {
      away.won++;
      away.points += 3;
      home.lost++;
    } else {
      home.drawn++;
      away.drawn++;
      home.points++;
      away.points++;
    }
  }

  const result = {};
  for (const [group, teams] of Object.entries(groups)) {
    result[group] = Object.values(teams).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  }
  return result;
}

module.exports = { computeStandings };
