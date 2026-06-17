import { useState, useEffect } from 'react';
import type { Match, Prediction, SpecialPrediction } from '../types';
import api from '../api/client';
import { teamLabel } from '../utils/flags';

const PHASE_LABELS: Record<string, string> = {
  group: 'Fase de grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de final',
  quarterfinal: 'Cuartos de final',
  semifinal: 'Semifinal',
  third_place: 'Tercer puesto',
  final: 'Final',
};

const PHASE_ORDER = ['group','round_of_32','round_of_16','quarterfinal','semifinal','third_place','final'];

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
  });
}

function MatchCard({ match, myPred, onSave }: {
  match: Match;
  myPred: Prediction | null;
  onSave: (matchId: string, home: number, away: number) => Promise<void>;
}) {
  const [home, setHome] = useState<string>(myPred ? String(myPred.homeScore) : '');
  const [away, setAway] = useState<string>(myPred ? String(myPred.awayScore) : '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    if (home === '' || away === '') return;
    setSaving(true);
    try {
      await onSave(match.id, Number(home), Number(away));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const hasResult = match.homeScore !== null;
  const isTBD = match.homeTeam === 'TBD' || match.awayTeam === 'TBD';

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 ${match.locked ? 'border-gray-700 opacity-90' : 'border-gray-700 hover:border-gray-600'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-500">{formatKickoff(match.kickoff)}</span>
        {match.locked && (
          <span className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded-full">Cerrado</span>
        )}
        {!match.locked && myPred && (
          <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Pronosticado ✓</span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="flex-1 text-right font-semibold text-white">{teamLabel(match.homeTeam)}</span>

        {match.locked || isTBD ? (
          <div className="flex items-center gap-2 text-center min-w-[80px] justify-center">
            {hasResult ? (
              <span className="text-yellow-400 font-bold text-lg">
                {match.homeScore} : {match.awayScore}
              </span>
            ) : myPred ? (
              <span className="text-gray-300">{myPred.homeScore} : {myPred.awayScore}</span>
            ) : (
              <span className="text-gray-600">- : -</span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="number" min="0" max="20" value={home}
              onChange={e => setHome(e.target.value)}
              className="w-10 text-center bg-gray-800 border border-gray-600 rounded py-1 text-white focus:outline-none focus:border-yellow-500"
            />
            <span className="text-gray-500">:</span>
            <input
              type="number" min="0" max="20" value={away}
              onChange={e => setAway(e.target.value)}
              className="w-10 text-center bg-gray-800 border border-gray-600 rounded py-1 text-white focus:outline-none focus:border-yellow-500"
            />
          </div>
        )}

        <span className="flex-1 font-semibold text-white">{teamLabel(match.awayTeam)}</span>
      </div>

      {!match.locked && !isTBD && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={handleSave}
            disabled={home === '' || away === '' || saving}
            className={`px-4 py-1 rounded-lg text-sm font-medium transition-colors ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 disabled:opacity-40'
            }`}
          >
            {saved ? '✓ Guardado' : saving ? 'Guardando...' : myPred ? 'Editar' : 'Pronosticar'}
          </button>
        </div>
      )}

      {hasResult && myPred && (
        <div className="mt-2 text-center text-xs text-gray-500">
          Tu pronóstico: {myPred.homeScore} : {myPred.awayScore}
        </div>
      )}
    </div>
  );
}

function SpecialPredictionsCard() {
  const [teams, setTeams] = useState<string[]>([]);
  const [prediction, setPrediction] = useState<SpecialPrediction | null>(null);
  const [locked, setLocked] = useState(false);
  const [champion, setChampion] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [topScorer, setTopScorer] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/special/teams').then(r => r.data),
      api.get('/special/me').then(r => r.data),
    ]).then(([t, me]) => {
      setTeams(t);
      setLocked(me.locked);
      setPrediction(me.prediction);
      if (me.prediction) {
        setChampion(me.prediction.champion || '');
        setRunnerUp(me.prediction.runnerUp || '');
        setTopScorer(me.prediction.topScorer || '');
      }
    }).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    try {
      const { data } = await api.post('/special', { champion, runnerUp, topScorer });
      setPrediction(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-10">Cargando...</div>;

  return (
    <div className="max-w-md bg-gray-900 border border-gray-700 rounded-xl p-5">
      <h2 className="text-lg font-bold text-white mb-1">🏆 Pronósticos especiales</h2>
      <p className="text-sm text-gray-400 mb-5">
        ¿Quién será el campeón, el subcampeón y el máximo goleador del torneo? Solo puedes pronosticar antes de que arranque el primer partido.
      </p>

      {locked && (
        <div className="mb-4 text-xs bg-red-900/40 text-red-400 px-3 py-2 rounded-lg">
          🔒 Cerrado — el torneo ya ha comenzado, ya no se pueden cambiar estos pronósticos.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">🥇 Campeón del mundo</label>
          {locked ? (
            <p className="text-white font-semibold">{prediction?.champion ? teamLabel(prediction.champion) : '— sin pronóstico —'}</p>
          ) : (
            <select value={champion} onChange={e => setChampion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500">
              <option value="">— Selecciona un equipo —</option>
              {teams.map(t => <option key={t} value={t}>{teamLabel(t)}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">🥈 Subcampeón</label>
          {locked ? (
            <p className="text-white font-semibold">{prediction?.runnerUp ? teamLabel(prediction.runnerUp) : '— sin pronóstico —'}</p>
          ) : (
            <select value={runnerUp} onChange={e => setRunnerUp(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500">
              <option value="">— Selecciona un equipo —</option>
              {teams.map(t => <option key={t} value={t}>{teamLabel(t)}</option>)}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">⚽ Máximo goleador</label>
          {locked ? (
            <p className="text-white font-semibold">{prediction?.topScorer || '— sin pronóstico —'}</p>
          ) : (
            <input type="text" value={topScorer} onChange={e => setTopScorer(e.target.value)}
              placeholder="Nombre del jugador"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
          )}
        </div>
      </div>

      {!locked && (
        <button onClick={save} disabled={saving}
          className={`mt-5 px-6 py-2 rounded-lg font-bold transition-colors ${
            saved ? 'bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 disabled:opacity-50'
          }`}>
          {saved ? '✓ Guardado' : saving ? 'Guardando...' : 'Guardar pronósticos'}
        </button>
      )}
    </div>
  );
}

function PhaseDeadlineBanner({ matches, label }: { matches: Match[]; label?: string }) {
  const phaseUnlocked = matches.every(m => m.phaseUnlocked);

  if (!phaseUnlocked) {
    return (
      <div className="mb-4 text-sm bg-red-900/30 text-red-300 border border-red-900/50 px-4 py-3 rounded-lg">
        🔒 {label ? `${label}: todavía` : 'Esta fase todavía'} no está abierta para pronósticos — el administrador la abrirá cuando corresponda.
      </div>
    );
  }

  if (matches.length === 0) return null;

  const earliest = matches.reduce((min, m) => (new Date(m.kickoff) < new Date(min.kickoff) ? m : min));
  const deadline = new Date(new Date(earliest.kickoff).getTime() - 60 * 60 * 1000);

  if (Date.now() >= deadline.getTime()) {
    return (
      <div className="mb-4 text-sm bg-red-900/30 text-red-300 border border-red-900/50 px-4 py-3 rounded-lg">
        🔒 {label ? `${label}: el` : 'El'} plazo para pronosticar ya ha terminado — los partidos de esta jornada están cerrados.
      </div>
    );
  }

  return (
    <div className="mb-4 text-sm bg-yellow-900/20 text-yellow-300 border border-yellow-900/40 px-4 py-3 rounded-lg">
      ⏰ {label ? `${label}: puedes` : 'Puedes'} pronosticar hasta <span className="font-semibold">1 hora antes</span> del primer partido —
      el plazo termina el <span className="font-semibold">{formatKickoff(deadline.toISOString())}</span>.
    </div>
  );
}

export default function PredictionsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [myPreds, setMyPreds] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePhase, setActivePhase] = useState('group');

  useEffect(() => {
    Promise.all([
      api.get('/matches').then(r => r.data),
      api.get('/predictions/me').then(r => r.data),
    ]).then(([m, p]) => {
      setMatches(m);
      setMyPreds(p);
      // Auto-select first phase with non-TBD matches
      const firstActive = PHASE_ORDER.find(phase =>
        m.some((match: Match) => match.phase === phase && match.homeTeam !== 'TBD')
      );
      if (firstActive) setActivePhase(firstActive);
    }).finally(() => setLoading(false));
  }, []);

  async function savePrediction(matchId: string, home: number, away: number) {
    await api.post('/predictions', { matchId, homeScore: home, awayScore: away });
    setMyPreds(prev => {
      const filtered = prev.filter(p => p.matchId !== matchId);
      return [...filtered, { userId: '', matchId, homeScore: home, awayScore: away, submittedAt: new Date().toISOString() }];
    });
  }

  const phases = PHASE_ORDER.filter(p => matches.some(m => m.phase === p));
  const visibleMatches = matches.filter(m => m.phase === activePhase);

  // Gruppenphase: nach Spieltag (1/2/3) aufteilen, dann pro Spieltag nach Gruppe
  const groupRoundSections = activePhase === 'group'
    ? [1, 2, 3].map(round => {
        const roundMatches = visibleMatches.filter(m => m.groupRound === round);
        const byGroup = roundMatches.reduce((acc, m) => {
          const g = m.group!;
          if (!acc[g]) acc[g] = [];
          acc[g].push(m);
          return acc;
        }, {} as Record<string, Match[]>);
        return { round, matches: roundMatches, byGroup };
      }).filter(s => s.matches.length > 0)
    : null;


  if (loading) return <div className="text-center text-gray-400 py-20">Cargando partidos...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Mis pronósticos</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {phases.map(phase => (
          <button
            key={phase}
            onClick={() => setActivePhase(phase)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activePhase === phase
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {PHASE_LABELS[phase]}
          </button>
        ))}
        <button
          onClick={() => setActivePhase('special')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activePhase === 'special'
              ? 'bg-yellow-500 text-gray-900'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🏆 Especiales
        </button>
      </div>

      {activePhase !== 'special' && activePhase !== 'group' && visibleMatches.length > 0 && (
        <PhaseDeadlineBanner matches={visibleMatches} />
      )}

      {activePhase === 'special' ? (
        <SpecialPredictionsCard />
      ) : groupRoundSections ? (
        groupRoundSections.map(({ round, matches: roundMatches, byGroup }) => (
          <div key={round} className="mb-10">
            <h2 className="text-white font-bold text-base mb-3">Jornada {round}</h2>
            <PhaseDeadlineBanner matches={roundMatches} label={`Jornada ${round}`} />
            {Object.entries(byGroup).sort(([a], [b]) => a.localeCompare(b)).map(([group, gMatches]) => (
              <div key={group} className="mb-8">
                <h3 className="text-yellow-400 font-semibold mb-3 text-sm uppercase tracking-wider">
                  Grupo {group}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {gMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      myPred={myPreds.find(p => p.matchId === match.id) || null}
                      onSave={savePrediction}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleMatches.map(match => (
            <MatchCard
              key={match.id}
              match={match}
              myPred={myPreds.find(p => p.matchId === match.id) || null}
              onSave={savePrediction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
