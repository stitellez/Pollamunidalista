import { useState, useEffect } from 'react';
import type { Match, Config } from '../types';
import api from '../api/client';

type Tab = 'results' | 'knockout' | 'scoring' | 'predictions' | 'users';

function ResultsTab({ matches }: { matches: Match[] }) {
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
    } finally {
      setSaving(null);
    }
  }

  async function clearResult(match: Match) {
    setSaving(match.id);
    try {
      await api.put(`/admin/matches/${match.id}/result`, { homeScore: '', awayScore: '' });
      setLocalScores(prev => ({ ...prev, [match.id]: { home: '', away: '' } }));
    } finally {
      setSaving(null);
    }
  }

  const groupMatches = matches.filter(m => m.phase === 'group');
  const groups = [...new Set(groupMatches.map(m => m.group!))].sort();

  return (
    <div>
      <p className="text-gray-400 text-sm mb-4">Introduce los resultados — la clasificación y las tablas se actualizan automáticamente.</p>
      {groups.map(group => (
        <div key={group} className="mb-6">
          <h3 className="text-yellow-400 font-semibold mb-2 text-sm uppercase">Grupo {group}</h3>
          <div className="space-y-2">
            {groupMatches.filter(m => m.group === group).map(match => {
              const s = getScore(match);
              return (
                <div key={match.id} className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-2.5">
                  <span className="flex-1 text-right text-sm text-white">{match.homeTeam}</span>
                  <input
                    type="number" min="0" max="20" value={s.home}
                    onChange={e => setLocalScores(prev => ({ ...prev, [match.id]: { ...getScore(match), home: e.target.value } }))}
                    className="w-10 text-center bg-gray-700 border border-gray-600 rounded py-1 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <span className="text-gray-500">:</span>
                  <input
                    type="number" min="0" max="20" value={s.away}
                    onChange={e => setLocalScores(prev => ({ ...prev, [match.id]: { ...getScore(match), away: e.target.value } }))}
                    className="w-10 text-center bg-gray-700 border border-gray-600 rounded py-1 text-white text-sm focus:outline-none focus:border-yellow-500"
                  />
                  <span className="flex-1 text-sm text-white">{match.awayTeam}</span>
                  <button
                    onClick={() => saveResult(match)}
                    disabled={saving === match.id}
                    className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded disabled:opacity-50"
                  >
                    {saving === match.id ? '...' : 'Guardar'}
                  </button>
                  {match.homeScore !== null && (
                    <button onClick={() => clearResult(match)} className="text-xs text-red-400 hover:text-red-300">✕</button>
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

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-500 mb-2">{match.label}</div>
      <div className="flex gap-2 items-center mb-2">
        <input value={home} onChange={e => setHome(e.target.value)} placeholder="Equipo local"
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500" />
        <span className="text-gray-500">vs</span>
        <input value={away} onChange={e => setAway(e.target.value)} placeholder="Equipo visitante"
          className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-yellow-500" />
        <button onClick={saveTeams} disabled={saving === 'teams'}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded disabled:opacity-50">
          {saving === 'teams' ? '...' : 'Teams'}
        </button>
      </div>
      {match.homeTeam !== 'TBD' && (
        <div className="flex gap-2 items-center">
          <input type="number" value={hs} onChange={e => setHs(e.target.value)} min="0" max="20"
            className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-yellow-500" />
          <span className="text-gray-500">:</span>
          <input type="number" value={as_} onChange={e => setAs(e.target.value)} min="0" max="20"
            className="w-12 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-yellow-500" />
          <button onClick={saveResult} disabled={saving === 'result'}
            className="px-3 py-1 bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-xs font-bold rounded disabled:opacity-50">
            {saving === 'result' ? '...' : 'Resultado'}
          </button>
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

  return (
    <div className="max-w-md space-y-6">
      <p className="text-gray-400 text-sm">Reglas de puntuación para todos los partidos. Los cambios se aplican de inmediato a la clasificación.</p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Puntos por resultado exacto</label>
          <input type="number" min="0" value={s.exactScore}
            onChange={e => setConfig({ ...config, scoring: { ...s, exactScore: Number(e.target.value) } })}
            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">Puntos por acierto de signo (victoria/empate)</label>
          <input type="number" min="0" value={s.correctOutcome}
            onChange={e => setConfig({ ...config, scoring: { ...s, correctOutcome: Number(e.target.value) } })}
            className="w-24 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500" />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">¿Cómo se calculan los puntos?</label>
          <select value={s.stacking}
            onChange={e => setConfig({ ...config, scoring: { ...s, stacking: e.target.value as 'exclusive' | 'additive' } })}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-yellow-500">
            <option value="exclusive">Exclusivo — solo cuenta el mejor resultado (por defecto)</option>
            <option value="additive">Aditivo — los puntos se suman</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Exclusivo: el resultado exacto da {s.exactScore} pts, O el acierto de signo da {s.correctOutcome} pts.<br />
            Aditivo: con resultado exacto se obtienen {s.exactScore + s.correctOutcome} pts en total.
          </p>
        </div>
      </div>

      <button onClick={save}
        className={`px-6 py-2 rounded-lg font-bold transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-gray-900'}`}>
        {saved ? '✓ Guardado' : 'Guardar reglas'}
      </button>
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
              {m.homeTeam} vs {m.awayTeam} {m.homeScore !== null ? `(${m.homeScore}:${m.awayScore})` : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedMatch && preds.length > 0 && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {selMatch && (
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50">
              <span className="font-semibold text-white">{selMatch.homeTeam} vs {selMatch.awayTeam}</span>
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
    { key: 'scoring', label: '⚙️ Reglas de puntos' },
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

      {tab === 'results' && <ResultsTab matches={matches} />}
      {tab === 'knockout' && <KnockoutTab matches={matches} onUpdate={loadMatches} />}
      {tab === 'scoring' && <ScoringTab />}
      {tab === 'predictions' && <PredictionsViewTab matches={matches} />}
      {tab === 'users' && <UsersTab />}
    </div>
  );
}
