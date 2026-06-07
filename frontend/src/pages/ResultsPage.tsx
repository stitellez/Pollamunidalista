import { useState, useEffect } from 'react';
import type { MatchResult } from '../types';
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

function formatKickoff(iso: string) {
  return new Date(iso).toLocaleString('es-ES', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin'
  });
}

function pointsBadge(points: number) {
  if (points >= 3) return 'bg-yellow-500/20 text-yellow-400';
  if (points > 0) return 'bg-green-900/40 text-green-400';
  return 'bg-gray-800 text-gray-500';
}

function MatchResultCard({ result }: { result: MatchResult }) {
  const sorted = [...result.predictions].sort((a, b) => b.points - a.points);

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 mb-1">
            {formatKickoff(result.kickoff)}
            {result.group && ` · Grupo ${result.group}`}
            {result.label && ` · ${result.label}`}
          </div>
          <div className="font-semibold text-white">
            {teamLabel(result.homeTeam)} <span className="text-yellow-400">{result.homeScore} : {result.awayScore}</span> {teamLabel(result.awayTeam)}
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs">
            <th className="px-4 py-2 text-left">Nombre</th>
            <th className="px-2 py-2 text-center">Pronóstico</th>
            <th className="px-4 py-2 text-right">Puntos</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => (
            <tr key={p.userId} className="border-t border-gray-800">
              <td className="px-4 py-2 text-white">{p.name}</td>
              <td className="px-2 py-2 text-center text-gray-300">
                {p.homeScore !== null ? `${p.homeScore} : ${p.awayScore}` : <span className="text-gray-600">sin pronóstico</span>}
              </td>
              <td className="px-4 py-2 text-right">
                <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${pointsBadge(p.points)}`}>
                  {p.points}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ResultsPage() {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/results').then(r => setResults(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-20">Cargando resultados...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Resultados y puntos</h1>

      {results.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aún no hay resultados registrados.</p>
      ) : (
        <div className="space-y-4">
          {results.map(result => (
            <div key={result.matchId}>
              <div className="text-xs text-gray-600 mb-1.5">{PHASE_LABELS[result.phase] || result.phase}</div>
              <MatchResultCard result={result} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
