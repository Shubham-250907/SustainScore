import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';

// Pages
import LoginPage         from './pages/LoginPage';
import EmployeeDashboard from './pages/EmployeeDashboard';
import TasksPage         from './pages/TasksPage';
import LeaderboardPage   from './pages/LeaderboardPage';
import RewardsPage       from './pages/RewardsPage';
import ProfilePage       from './pages/ProfilePage';
import AdminDashboard    from './pages/AdminDashboard';
import AdminTasksPage    from './pages/AdminTasksPage';
import AdminRewardsPage  from './pages/AdminRewardsPage';
import SeedPage          from './pages/SeedPage';

// Protected route wrapper
function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && currentUser.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Employee-only guard (redirects admin away)
function EmployeeRoute({ children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

// Root redirect based on role
function RootRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return currentUser.role === 'admin'
    ? <Navigate to="/admin" replace />
    : <Navigate to="/dashboard" replace />;
}

function AppRoutes() {
  const { currentUser } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50">
      {currentUser && <Navbar />}
      <Routes>
        <Route path="/"      element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/seed"  element={<SeedPage />} />

        {/* Employee routes */}
        <Route path="/dashboard"   element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />
        <Route path="/tasks"       element={<EmployeeRoute><TasksPage /></EmployeeRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="/rewards"     element={<EmployeeRoute><RewardsPage /></EmployeeRoute>} />
        <Route path="/profile"     element={<EmployeeRoute><ProfilePage /></EmployeeRoute>} />

        {/* Admin routes */}
        <Route path="/admin"         element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/tasks"   element={<ProtectedRoute adminOnly><AdminTasksPage /></ProtectedRoute>} />
        <Route path="/admin/rewards" element={<ProtectedRoute adminOnly><AdminRewardsPage /></ProtectedRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
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
