import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const NAV_EMPLOYEE = [
  { to: '/dashboard', label: '🏠 Dashboard' },
  { to: '/tasks',     label: '✅ Tasks' },
  { to: '/leaderboard', label: '🏆 Leaderboard' },
  { to: '/rewards',   label: '🎁 Rewards' },
  { to: '/profile',   label: '👤 Profile' },
];

const NAV_ADMIN = [
  { to: '/admin',         label: '📊 Dashboard' },
  { to: '/admin/tasks',   label: '✅ Tasks' },
  { to: '/admin/rewards', label: '🎁 Rewards' },
];

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = currentUser?.role === 'admin' ? NAV_ADMIN : NAV_EMPLOYEE;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!currentUser) return null;

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={currentUser.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
            <span className="text-2xl">🌱</span>
            <span className="font-bold text-xl text-green-700">SustainScore</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(({ to, label }) => {
              const active = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-green-100 text-green-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* User info + logout */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-semibold text-gray-800">{currentUser.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                currentUser.role === 'admin'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {currentUser.role === 'admin' ? '👑 Admin' : '🌿 Employee'}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
