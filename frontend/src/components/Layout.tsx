import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-yellow-500 text-gray-900'
        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚽</span>
            <span className="text-yellow-400 font-bold text-lg">WM 2026</span>
          </div>
          <div className="flex items-center gap-1">
            <NavLink to="/predictions" className={navClass}>Pronósticos</NavLink>
            <NavLink to="/leaderboard" className={navClass}>Clasificación</NavLink>
            <NavLink to="/groups" className={navClass}>Grupos</NavLink>
            <NavLink to="/results" className={navClass}>Resultados</NavLink>
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navClass}>Admin</NavLink>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
