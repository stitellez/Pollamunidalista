import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import PredictionsPage from './pages/PredictionsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GroupsPage from './pages/GroupsPage';
import ResultsPage from './pages/ResultsPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== 'admin') return <Navigate to="/predictions" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/predictions" element={
        <ProtectedRoute><Layout><PredictionsPage /></Layout></ProtectedRoute>
      } />
      <Route path="/leaderboard" element={
        <ProtectedRoute><Layout><LeaderboardPage /></Layout></ProtectedRoute>
      } />
      <Route path="/groups" element={
        <ProtectedRoute><Layout><GroupsPage /></Layout></ProtectedRoute>
      } />
      <Route path="/results" element={
        <ProtectedRoute><Layout><ResultsPage /></Layout></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><Layout><AdminPage /></Layout></AdminRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
