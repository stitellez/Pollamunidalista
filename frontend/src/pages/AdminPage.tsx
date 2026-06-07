import { useState, useEffect } from 'react';
import type { Match, Config, Phase } from '../types';
import api from '../api/client';
import { teamLabel } from '../utils/flags';

type Tab = 'results' | 'knockout' | 'phases' | 'scoring' | 'special' | 'predictions' | 'users';

function ResultsTab({ matches, onUpdate }: { matches: Match[]; onUpdate: () => void }) {
  const [saving, setSaving] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState<Record<string, { home: string; away: string }>>({});

  function getScore(match: Match) {
    return localScores[match.id] || {
      home: match.homeScore !== null ? String(match.homeScore) : '',
      away: match.awayScore !== null ? String(match.awayScore) : '',
    };
  }

  async function saveResult(match: Match) {
    const s = getScore(match);
    if (s.home === '' || s.away === '') return;
    setSaving(match.id);
    try {
      await api.put(`/admin/matches/${match.id}/result`, {
        homeScore: Number(s.home),
        awayScore: Number(s.away),
      });
      onUpdate();
    } finally {
      setSaving(null);
    }
  }

  async function clearResult(match: Match) {
    setSaving(match.id);
    try {
      await api.put(`/admin/matches/${match.id}/result`, { homeScore: '', awayScore: '' });
      setLocalScores(prev => ({ ...prev, [match.id]: { home: '', away: '' } }));
      onUpdate();
    } finally {
      setSaving(null);
    }
  }

  async function toggleLock(match: Match) {
    setSaving(`lock-${match.id}`);
    try {
      await api.put(`/admin/matches/${match.id}/lock-result`, { locked: !match.resultLocked });
      onUpdate();
    } finally {
      setSaving(null);
    }
  }

  const groupMatches = matches.filter(m => m.phase === 'group');
  const groups = [...new Set(groupMatches.map(m => m.group!))].sort();

  return (
    <div>
      <p className="text-gray-400 text-sm mb-4">
        Introduce los resultados — la clasificación y las tablas se actualizan automáticamente.
        Cuando un resultado sea definitivo, bloquéalo con 🔒 para que no pueda cambiarse por error.
      </p>
      {groups.map(group => (
        <div key={group} className="mb-6">
          <h3 className="text-yellow-400 font-semibold mb-2 text-sm uppercase">Grupo {group}</h3>
          <div className="space-y-2">
            {groupMatches.filter(m => m.group === group).map(match => {
              const s = getScore(match);
              const locked = match.resultLocked;
              return (
                <div key={match.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2.5">
                  <span className="flex-1 text-right text-sm text-white">{teamLabel(match.homeTeam)}</span>
                  <input
                    type="number" min="0" max="20" value={s.home} disabled={locked}
                    onChange={e => setLocalScores(prev => ({ ...prev, [match.id]: { ...getScore(match), home: e.target.value } }))}
                    className="w-10 text-center bg-gray-700 border border-gray-600 rounded py-1 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-50"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="number" min="0" max="20" value={s.away} disabled={locked}
                    onChange={e => setLocalScores(prev => ({ ...prev, [match.id]: { ...getScore(match), away: e.target.value } }))}
                    className="w-10 text-center bg-gray-700 border border-gray-600 rounded py-1 text-white text-sm focus:outline-none focus:border-yellow-500 disabled:opacity-50"
                  />
                  <span className="flex-1 text-sm text-white">{teamLabel(match.awayTeam)}</span>
                  <button
                    onClick={() => saveResult(match)}
                    disabled={saving === match.id || locked}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded disabled:opacity-50"
                  >
                    {saving === match.id ? '...' : 'Guardar'}
                  </button>
                  {match.homeScore !== null && !locked && (
                    <button onClick={() => clearResult(match)} className="text-xs text-red-400 hover:text-red-300">✕</button>
                  )}
                  {match.homeScore !== null && (
                    <button
                      onClick={() => toggleLock(match)}
                      disabled={saving === `lock-${match.id}`}
                      title={locked ? 'Resultado bloqueado — clic para desbloquear' : 'Bloquear resultado definitivo'}
                      className={`text-xs px-2 py-1 rounded transition-colors ${
                        locked ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {locked ? '🔒' : '🔓'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function KnockoutMatchRow({ match, onUpdate }: { match: Match; onUpdate: () => void }) {
  const [home, setHome] = useState(match.homeTeam === 'TBD' ? '' : match.homeTeam);
  const [away, setAway] = useState(match.awayTeam === 'TBD' ? '' : match.awayTeam);
  const [hs, setHs] = useState(match.homeScore !== null ? String(match.homeScore) : '');
  const [as_, setAs] = useState(match.awayScore !== null ? String(match.awayScore) : '');
  const [saving, setSaving] = useState<string | null>(null);

  async function saveTeams() {
    setSaving('teams');
    try {
      await api.put(`/admin/matches/${match.id}/teams`, { homeTeam: home || 'TBD', awayTeam: away || 'TBD' });
      onUpdate();
    } finally { setSaving(null); }
  }

  async function saveResult() {
    if (hs === '' || as_ === '') return;
    setSaving('result');
    try {
      await api.put(`/admin/matches/${match.id}/result`, { homeScore: Number(hs), awayScore: Number(as_) });
      onUpdate();
    } finally { setSaving(null); }
  }

  async function toggleLock() {
    setSaving('lock');
    try {
      await api.put(`/admin/matches/${match.id}/lock-result`, { locked: !match.resultLocked });
      onUpdate();
    } finally { setSaving(null); }
  }

  const locked = match.resultLocked;

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-2">{match.label}</div>
      <div className="flex gap-2 items-center mb-2">
        <input value={home} onChange={e => setHome(e.target.value)} placeholder="Equipo local" disabled={locked}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500 disabled:opacity-50" />
        <span className="text-gray-500">vs</span>
        <input value={away} onChange={e => setAway(e.target.value)} placeholder="Equipo visitante" disabled={locked}
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500 disabled:opacity-50" />
        <button onClick={saveTeams} disabled={saving === 'teams' || locked}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded disabled:opacity-50">
          {saving === 'teams' ? '...' : 'Teams'}
        </button>
      </div>
      {match.homeTeam !== 'TBD' && (
        <div className="flex gap-2 items-center">
          <input type="number" value={hs} onChange={e => setHs(e.target.value)} min="0" max="20" disabled={locked}
            className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-yellow-500 disabled:opacity-50" />
          <span className="text-gray-500">:</span>
          <input type="number" value={as_} onChange={e => setAs(e.target.value)} min="0" max="20" disabled={locked}
            className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-yellow-500 disabled:opacity-50" />
          <button onClick={saveResult} disabled={saving === 'result' || locked}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded disabled:opacity-50">
            {saving === 'result' ? '...' : 'Resultado'}
          </button>
          {match.homeScore !== null && (
            <button
              onClick={toggleLock}
              disabled={saving === 'lock'}
              title={locked ? 'Resultado bloqueado — clic para desbloquear' : 'Bloquear resultado definitivo'}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                locked ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {locked ? '🔒' : '🔓'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function KnockoutTab({ matches, onUpdate }: { matches: Match[]; onUpdate: () => void }) {
  const knockoutMatches = matches.filter(m => m.phase !== 'group');

  const phaseOrder = ['round_of_32','round_of_16','quarterfinal','semifinal','third_place','final'];
  const phaseLabels: Record<string, string> = {
    round_of_32: 'Ronda de 32', round_of_16: 'Octavos de final',
    quarterfinal: 'Cuartos de final', semifinal: 'Semifinal',
    third_place: 'Tercer puesto', final: 'Final',
  };

  return (
    <div>
      <p className="text-gray-400 text-sm mb-4">Introduce los equipos de las rondas eliminatorias en cuanto se conozcan.</p>
      {phaseOrder.map(phase => {
        const phaseMatches = knockoutMatches.filter(m => m.phase === phase);
        if (phaseMatches.length === 0) return null;
        return (
          <div key={phase} className="mb-6">
            <h3 className="text-yellow-400 font-semibold mb-2 text-sm uppercase">{phaseLabels[phase]}</h3>
            <div className="space-y-2">
              {phaseMatches.map(match => (
                <KnockoutMatchRow key={match.id} match={match} onUpdate={onUpdate} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}


const PHASE_ORDER: Phase[] = ['group', 'round_of_32', 'round_of_16', 'quarterfinal', 'semifinal', 'third_place', 'final'];
const PHASE_LABELS: Record<Phase, string> = {
  group: 'Fase de grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de final',
  quarterfinal: 'Cuartos de final',
  semifinal: 'Semifinal',
  third_place: 'Tercer puesto',
  final: 'Final',
};

function ScoringTab() {
  const [config, setConfig] = useState<Config | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/admin/config').then(r => setConfig(r.data));
  }, []);

  async function save() {
    if (!config) return;
    await api.put('/admin/config', { scoring: config.scoring });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (!config) return <div className="text-gray-400">Cargando...</div>;
  const s = config.scoring;
  const total = s.exactScore + s.goalDifferenceScore + s.correctOutcomeScore;

  function setMultiplier(phase: Phase, value: number) {
    setConfig({ ...config!, scoring: { ...s, phaseMultipliers: { ...s.phaseMultipliers, [phase]: value } } });
  }

  return (
    <div className="max-w-md space-y-6">
      <p className="text-gray-400 text-sm">
        Reglas de puntuación base — se suman todas las condiciones que aciertes (un resultado exacto también
        acierta la diferencia de goles y el signo). Los cambios se aplican de inmediato a la clasificación.
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">🎯 Resultado exacto</label>
          <input type="number" min="0" value={s.exactScore}
            onChange={e => setConfig({ ...config, scoring: { ...s, exactScore: Number(e.target.value) } })}
            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">📊 Diferencia de goles correcta</label>
          <input type="number" min="0" value={s.goalDifferenceScore}
            onChange={e => setConfig({ ...config, scoring: { ...s, goalDifferenceScore: Number(e.target.value) } })}
            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">✅ Signo correcto (victoria/empate)</label>
          <input type="number" min="0" value={s.correctOutcomeScore}
            onChange={e => setConfig({ ...config, scoring: { ...s, correctOutcomeScore: Number(e.target.value) } })}
            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
        </div>

        <p className="text-xs text-gray-500">
          Un pronóstico perfecto suma {s.exactScore} + {s.goalDifferenceScore} + {s.correctOutcomeScore} = <span className="text-yellow-400 font-bold">{total} pts</span> (antes del multiplicador de fase).
        </p>
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">🔢 Multiplicador por fase</label>
        <p className="text-xs text-gray-500 mb-3">Los puntos de cada partido se multiplican según la fase — las rondas eliminatorias valen más.</p>
        <div className="space-y-2">
          {PHASE_ORDER.map(phase => (
            <div key={phase} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 rounded px-3 py-2">
              <span className="text-sm text-gray-300">{PHASE_LABELS[phase]}</span>
              <div className="flex items-center gap-2">
                <input type="number" min="1" value={s.phaseMultipliers[phase] ?? 1}
                  onChange={e => setMultiplier(phase, Number(e.target.value))}
                  className="w-16 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-center text-white focus:outline-none focus:border-yellow-500" />
                <span className="text-xs text-gray-500">×</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BonusRulesEditor config={config} setConfig={setConfig} />

      <button onClick={save}
        className={`px-6 py-2 rounded-lg font-bold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}>
        {saved ? '✓ Guardado' : 'Guardar reglas'}
      </button>
    </div>
  );
}

const BONUS_CONDITIONS: { value: string; label: string }[] = [
  { value: 'correct_home_goals', label: 'Aciertas los goles exactos del equipo local' },
  { value: 'correct_away_goals', label: 'Aciertas los goles exactos del equipo visitante' },
  { value: 'correct_goal_difference', label: 'Aciertas la diferencia de goles' },
  { value: 'correct_total_goals', label: 'Aciertas el número total de goles del partido' },
  { value: 'correct_draw', label: 'Aciertas un empate (predices empate Y el resultado es empate)' },
  { value: 'both_teams_scored', label: 'Aciertas si ambos equipos marcan o no' },
];

function conditionLabel(type: string): string {
  return BONUS_CONDITIONS.find(c => c.value === type)?.label ?? type;
}

type BonusRule = { name: string; type: string; points: number };

function BonusRulesEditor({ config, setConfig }: { config: Config; setConfig: (c: Config) => void }) {
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState(BONUS_CONDITIONS[0].value);
  const [newPoints, setNewPoints] = useState(1);
  const rules = config.scoring.bonusRules ?? [];

  function updateRules(rules: BonusRule[]) {
    setConfig({ ...config, scoring: { ...config.scoring, bonusRules: rules } });
  }

  function addRule() {
    if (!newName.trim()) return;
    updateRules([...rules, { name: newName.trim(), type: newType, points: newPoints }]);
    setNewName('');
    setNewPoints(1);
  }

  function removeRule(index: number) {
    updateRules(rules.filter((_, i) => i !== index));
  }

  return (
    <div>
      <label className="block text-sm text-gray-300 mb-1">Tus propias reglas de bonificación</label>
      <p className="text-xs text-gray-500 mb-3">
        Crea tus propias reglas: ponle un nombre, elige la condición que debe cumplirse y cuántos puntos extra otorga.
        Estos puntos se suman siempre, además de las reglas de arriba.
      </p>

      {rules.length > 0 && (
        <ul className="space-y-2 mb-4">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded px-3 py-2">
              <span className="text-sm text-gray-200">
                <span className="font-semibold text-white">{rule.name}</span>
                <span className="text-gray-400"> — {conditionLabel(rule.type)}</span>
                {' → '}<span className="text-yellow-400 font-bold">+{rule.points} pts</span>
              </span>
              <button onClick={() => removeRule(i)}
                className="text-gray-500 hover:text-red-400 text-sm px-2">
                ✕ Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-3 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nombre de tu regla</label>
          <input type="text" value={newName} placeholder="p. ej. 'Mago de la diferencia'"
            onChange={e => setNewName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Condición — ¿qué debe acertar el usuario?</label>
          <select value={newType} onChange={e => setNewType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500">
            {BONUS_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Puntos extra</label>
            <input type="number" min="0" value={newPoints}
              onChange={e => setNewPoints(Number(e.target.value))}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
          </div>
          <button onClick={addRule} disabled={!newName.trim()}
            className="px-4 py-2 rounded-lg font-semibold bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-700 disabled:text-gray-500 text-gray-900 transition-colors">
            + Crear regla
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDeadline(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
  });
}

function PhasesTab({ matches }: { matches: Match[] }) {
  const [config, setConfig] = useState<Config | null>(null);
  const [saving, setSaving] = useState<Phase | null>(null);

  useEffect(() => {
    api.get('/admin/config').then(r => setConfig(r.data));
  }, []);

  async function toggle(phase: Phase) {
    if (!config) return;
    const next = !config.phaseUnlocks[phase];
    setSaving(phase);
    try {
      const { data } = await api.put('/admin/config', { phaseUnlocks: { [phase]: next } });
      setConfig(data);
    } finally {
      setSaving(null);
    }
  }

  if (!config) return <div className="text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-md">
      <p className="text-gray-400 text-sm mb-4">
        Por defecto solo está abierta la fase de grupos. Abre las siguientes fases manualmente cuando quieras
        que los participantes puedan pronosticar — el plazo de cada fase se cierra automáticamente 1 hora antes
        del saque inicial de su primer partido (para todos sus partidos a la vez).
      </p>
      <div className="space-y-2">
        {PHASE_ORDER.map(phase => {
          const unlocked = config.phaseUnlocks[phase];
          const phaseMatches = matches.filter(m => m.phase === phase);
          const firstKickoff = phaseMatches.length
            ? phaseMatches.reduce((min, m) => (new Date(m.kickoff) < new Date(min.kickoff) ? m : min)).kickoff
            : null;
          const deadline = firstKickoff ? new Date(new Date(firstKickoff).getTime() - 60 * 60 * 1000) : null;
          return (
            <div key={phase} className="flex items-center justify-between bg-gray-800 border border-gray-700 rounded-lg px-4 py-3">
              <div>
                <div className="text-sm font-medium text-white">{PHASE_LABELS[phase]}</div>
                {firstKickoff && (
                  <div className="text-xs text-gray-500 mt-0.5">Primer partido: {formatDeadline(firstKickoff)}</div>
                )}
                {deadline && (
                  <div className="text-xs text-gray-500 mt-0.5">Cierre de pronósticos (−1h): {formatDeadline(deadline.toISOString())}</div>
                )}
              </div>
              <button
                onClick={() => toggle(phase)}
                disabled={saving === phase}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  unlocked
                    ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
                    : 'bg-red-900/40 text-red-400 hover:bg-red-900/60'
                }`}
              >
                {saving === phase ? '...' : unlocked ? '🔓 Abierta' : '🔒 Cerrada'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SpecialTab() {
  const [config, setConfig] = useState<Config | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [champion, setChampion] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [topScorer, setTopScorer] = useState('');
  const [savedPoints, setSavedPoints] = useState(false);
  const [savedResults, setSavedResults] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/admin/config').then(r => r.data),
      api.get('/special/teams').then(r => r.data),
    ]).then(([c, t]) => {
      setConfig(c);
      setTeams(t);
      setChampion(c.special.results.champion || '');
      setRunnerUp(c.special.results.runnerUp || '');
      setTopScorer(c.special.results.topScorer || '');
    });
  }, []);

  async function savePoints() {
    if (!config) return;
    await api.put('/admin/config', { special: { ...config.special, results: undefined } });
    setSavedPoints(true);
    setTimeout(() => setSavedPoints(false), 2000);
  }

  async function saveResults() {
    await api.put('/admin/special-results', { champion, runnerUp, topScorer });
    setSavedResults(true);
    setTimeout(() => setSavedResults(false), 2000);
  }

  if (!config) return <div className="text-gray-400">Cargando...</div>;
  const sp = config.special;

  return (
    <div className="max-w-md space-y-10">
      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-1">Puntos por pronóstico especial acertado</h3>
        <p className="text-xs text-gray-500 mb-4">Cuántos puntos otorga cada pronóstico especial si acierta.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">🥇 Campeón correcto</label>
            <input type="number" min="0" value={sp.championPoints}
              onChange={e => setConfig({ ...config, special: { ...sp, championPoints: Number(e.target.value) } })}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">🥈 Subcampeón correcto</label>
            <input type="number" min="0" value={sp.runnerUpPoints}
              onChange={e => setConfig({ ...config, special: { ...sp, runnerUpPoints: Number(e.target.value) } })}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">⚽ Máximo goleador correcto</label>
            <input type="number" min="0" value={sp.topScorerPoints}
              onChange={e => setConfig({ ...config, special: { ...sp, topScorerPoints: Number(e.target.value) } })}
              className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
          </div>
        </div>
        <button onClick={savePoints}
          className={`mt-4 px-6 py-2 rounded-lg font-bold transition-colors ${savedPoints ? 'bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}>
          {savedPoints ? '✓ Guardado' : 'Guardar puntos'}
        </button>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-300 mb-1">Resultados finales del torneo</h3>
        <p className="text-xs text-gray-500 mb-4">
          Cuando se sepa quién es el campeón, subcampeón y máximo goleador, introdúcelo aquí — la clasificación se recalcula automáticamente.
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">🥇 Campeón del mundo</label>
            <select value={champion} onChange={e => setChampion(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500">
              <option value="">— Sin definir —</option>
              {teams.map(t => <option key={t} value={t}>{teamLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">🥈 Subcampeón</label>
            <select value={runnerUp} onChange={e => setRunnerUp(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500">
              <option value="">— Sin definir —</option>
              {teams.map(t => <option key={t} value={t}>{teamLabel(t)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">⚽ Máximo goleador</label>
            <input type="text" value={topScorer} onChange={e => setTopScorer(e.target.value)}
              placeholder="Nombre del jugador"
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
          </div>
        </div>
        <button onClick={saveResults}
          className={`mt-4 px-6 py-2 rounded-lg font-bold transition-colors ${savedResults ? 'bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}>
          {savedResults ? '✓ Guardado' : 'Guardar resultados'}
        </button>
      </div>
    </div>
  );
}

function PredictionsViewTab({ matches }: { matches: Match[] }) {
  const [selectedMatch, setSelectedMatch] = useState('');
  const [preds, setPreds] = useState<{ userId: string; name: string; homeScore: number | null; awayScore: number | null; points: number | null }[]>([]);

  const finishedOrLocked = matches.filter(m => m.locked || m.homeScore !== null);

  async function loadPreds(matchId: string) {
    setSelectedMatch(matchId);
    const res = await api.get(`/admin/matches/${matchId}/predictions`);
    setPreds(res.data);
  }

  const selMatch = matches.find(m => m.id === selectedMatch);

  return (
    <div>
      <div className="mb-4">
        <label className="block text-sm text-gray-400 mb-1">Selecciona un partido</label>
        <select value={selectedMatch} onChange={e => loadPreds(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full max-w-sm focus:outline-none focus:border-yellow-500">
          <option value="">-- Elige un partido --</option>
          {finishedOrLocked.map(m => (
            <option key={m.id} value={m.id}>
              {teamLabel(m.homeTeam)} vs {teamLabel(m.awayTeam)} {m.homeScore !== null ? `(${m.homeScore}:${m.awayScore})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && preds.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {selMatch && (
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50">
              <span className="font-semibold text-white">{teamLabel(selMatch.homeTeam)} vs {teamLabel(selMatch.awayTeam)}</span>
              {selMatch.homeScore !== null && (
                <span className="ml-3 text-yellow-400">Resultado: {selMatch.homeScore}:{selMatch.awayScore}</span>
              )}
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 text-xs">
                <th className="px-4 py-2 text-left">Nombre</th>
                <th className="px-4 py-2 text-center">Pronóstico</th>
                <th className="px-4 py-2 text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {preds.map(p => (
                <tr key={p.userId} className="border-b border-gray-800 last:border-0">
                  <td className="px-4 py-2 text-white">{p.name}</td>
                  <td className="px-4 py-2 text-center">
                    {p.homeScore !== null ? (
                      <span className="text-gray-300">{p.homeScore}:{p.awayScore}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {p.points !== null ? (
                      <span className={p.points > 0 ? 'text-yellow-400 font-bold' : 'text-gray-500'}>{p.points}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<{ id: string; name: string; role: string }[]>([]);
  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [resetPins, setResetPins] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await api.get('/admin/users');
    setUsers(res.data);
  }

  async function addUser() {
    if (!newName || !newPin) return;
    await api.post('/auth/users', { name: newName, pin: newPin });
    setNewName(''); setNewPin('');
    setMsg('✓ Usuario añadido');
    setTimeout(() => setMsg(''), 2000);
    loadUsers();
  }

  async function deleteUser(id: string, name: string) {
    if (!confirm(`¿Seguro que quieres eliminar a ${name}?`)) return;
    await api.delete(`/auth/users/${id}`);
    loadUsers();
  }

  async function resetPin(id: string) {
    const pin = resetPins[id];
    if (!pin) return;
    await api.put(`/auth/users/${id}/pin`, { pin });
    setResetPins(prev => ({ ...prev, [id]: '' }));
    setMsg('✓ PIN restablecido');
    setTimeout(() => setMsg(''), 2000);
  }

  return (
    <div className="max-w-lg">
      {msg && <div className="mb-4 text-green-400 text-sm">{msg}</div>}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden mb-6">
        <div className="px-4 py-3 border-b border-gray-800 text-sm font-semibold text-gray-300">Participantes</div>
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800 last:border-0">
            <span className="flex-1 text-white text-sm">{u.name}</span>
            {u.role === 'admin' && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Admin</span>}
            <input
              value={resetPins[u.id] || ''}
              onChange={e => setResetPins(prev => ({ ...prev, [u.id]: e.target.value }))}
              placeholder="Nuevo PIN"
              className="w-24 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500"
            />
            <button onClick={() => resetPin(u.id)}
              className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded">PIN</button>
            <button onClick={() => deleteUser(u.id, u.name)}
              className="text-xs text-red-400 hover:text-red-300">✕</button>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Añadir nuevo participante</h3>
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nombre"
            className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500" />
          <input value={newPin} onChange={e => setNewPin(e.target.value)} placeholder="PIN"
            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-yellow-500" />
          <button onClick={addUser}
            className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-bold rounded">
            Añadir
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('results');
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => { loadMatches(); }, []);

  function loadMatches() {
    api.get('/matches').then(r => setMatches(r.data));
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'results', label: '📋 Resultados' },
    { key: 'knockout', label: '🏆 Eliminatorias' },
    { key: 'phases', label: '🔓 Fases' },
    { key: 'scoring', label: '⚙️ Reglas de puntos' },
    { key: 'special', label: '🏆 Especiales' },
    { key: 'predictions', label: '👁 Ver pronósticos' },
    { key: 'users', label: '👥 Participantes' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Panel de administración</h1>

      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-yellow-500 text-gray-900'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'results' && <ResultsTab matches={matches} onUpdate={loadMatches} />}
      {tab === 'knockout' && <KnockoutTab matches={matches} onUpdate={loadMatches} />}
      {tab === 'phases' && <PhasesTab matches={matches} />}
      {tab === 'scoring' && <ScoringTab />}
      {tab === 'special' && <SpecialTab />}
      {tab === 'predictions' && <PredictionsViewTab matches={matches} />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}
