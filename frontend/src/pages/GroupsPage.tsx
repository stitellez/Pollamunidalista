import { useState, useEffect } from 'react';
import type { StandingRow } from '../types';
import api from '../api/client';

export default function GroupsPage() {
  const [standings, setStandings] = useState<Record<string, StandingRow[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/standings').then(r => setStandings(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-20">Cargando tablas...</div>;

  const groups = Object.keys(standings).sort();

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Fase de grupos</h1>

      {groups.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aún no hay resultados.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {groups.map(group => (
            <div key={group} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50">
                <h2 className="text-yellow-400 font-bold text-sm uppercase tracking-wider">Grupo {group}</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs">
                    <th className="px-3 py-2 text-left">Equipo</th>
                    <th className="px-2 py-2 text-center">PJ</th>
                    <th className="px-2 py-2 text-center">G</th>
                    <th className="px-2 py-2 text-center">E</th>
                    <th className="px-2 py-2 text-center">P</th>
                    <th className="px-2 py-2 text-center">Goles</th>
                    <th className="px-2 py-2 text-center">DG</th>
                    <th className="px-2 py-2 text-center font-bold text-gray-300">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings[group].map((row, idx) => (
                    <tr
                      key={row.team}
                      className={`border-t border-gray-800 ${idx < 2 ? 'text-white' : 'text-gray-400'}`}
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {idx < 2 && <div className="w-1 h-4 bg-green-500 rounded-full" />}
                          {idx === 2 && <div className="w-1 h-4 bg-yellow-500/60 rounded-full" />}
                          {idx === 3 && <div className="w-1 h-4 bg-transparent rounded-full" />}
                          <span className="font-medium">{row.team}</span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-center">{row.played}</td>
                      <td className="px-2 py-2 text-center">{row.won}</td>
                      <td className="px-2 py-2 text-center">{row.drawn}</td>
                      <td className="px-2 py-2 text-center">{row.lost}</td>
                      <td className="px-2 py-2 text-center">{row.gf}:{row.ga}</td>
                      <td className="px-2 py-2 text-center">{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                      <td className="px-2 py-2 text-center font-bold text-yellow-400">{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-4 text-xs text-gray-600">
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-green-500 rounded-full" /> Clasifica</div>
        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-yellow-500/60 rounded-full" /> Posible clasificación (mejores 8 terceros)</div>
      </div>
    </div>
  );
}
