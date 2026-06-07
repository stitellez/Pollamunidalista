import { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '../types';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard').then(r => setBoard(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center text-gray-400 py-20">Cargando clasificación...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Clasificación</h1>

      {board.length === 0 ? (
        <p className="text-gray-500 text-center py-12">Aún no hay resultados registrados.</p>
      ) : (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider w-12">#</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider text-center">Pronósticos</th>
                <th className="px-4 py-3 text-xs text-gray-500 uppercase tracking-wider text-right">Puntos</th>
              </tr>
            </thead>
            <tbody>
              {board.map((entry, idx) => {
                const isMe = entry.userId === user?.id;
                const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
                return (
                  <tr
                    key={entry.userId}
                    className={`border-b border-gray-800 last:border-0 ${isMe ? 'bg-yellow-500/10' : 'hover:bg-gray-800/50'}`}
                  >
                    <td className="px-4 py-3 text-gray-400 text-sm">
                      {medal || <span className="text-gray-600">{idx + 1}</span>}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {entry.name}
                      {isMe && <span className="ml-2 text-xs text-yellow-400">(Tú)</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-sm text-center">{entry.predictedCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-bold text-lg ${entry.totalPoints > 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                        {entry.totalPoints}
                      </span>
                      {entry.specialPoints > 0 && (
                        <div className="text-xs text-gray-500">
                          incl. <span className="text-yellow-500/80">+{entry.specialPoints}</span> 🏆 especiales
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4 text-center">
        La clasificación se actualiza cuando el admin introduce los resultados.
      </p>
    </div>
  );
}
