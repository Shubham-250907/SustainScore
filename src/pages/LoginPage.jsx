import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Operations', 'Legal'];
const ROLES = ['employee', 'admin'];

export default function LoginPage() {
  const [tab,     setTab]     = useState('login');
  const [form,    setForm]    = useState({ name: '', email: '', password: '', department: 'IT', role: 'employee' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, currentUser } = useAuth();
  const navigate = useNavigate();

  // Redirect already-authenticated users away from login page
  useEffect(() => {
    if (currentUser) {
      navigate(currentUser.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (tab === 'login') {
      const result = await login(form.email, form.password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials');
      }
      // On success: onAuthStateChanged sets currentUser → useEffect above redirects automatically
    } else {
      if (!form.name.trim()) { setError('Name is required'); setLoading(false); return; }
      const result = await signup(form.name, form.email, form.password, form.department, form.role);
      if (!result.success) {
        setError(result.error || 'Signup failed');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🌱</div>
          <h1 className="text-3xl font-black text-gray-900">SustainScore</h1>
          <p className="text-gray-500 mt-1">Corporate Sustainability Engagement Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Tab toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                  tab === t ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                {t === 'login' ? '🔑 Sign In' : '✨ Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'signup' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Arjun Mehta"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                required
              />
            </div>

            {tab === 'signup' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Department</label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  >
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                  >
                    {ROLES.map(r => (
                      <option key={r} value={r}>
                        {r === 'admin' ? '👑 Admin' : '🌿 Employee'}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">Admin accounts can manage tasks, rewards, and review submissions.</p>
                </div>
              </>
            )}

            {error && (
              <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
            >
              {loading ? '⏳ Signing in...' : tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {/* Demo quick-login */}
          {tab === 'login' && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3">Quick demo login:</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, email: 'arjun@sustain.co', password: 'demo1234' }))}
                  className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                  🌿 Employee Demo
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, email: 'dev@sustain.co', password: 'demo1234' }))}
                  className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-3 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  👑 Admin Demo
                </button>
              </div>
              <p className="text-xs text-gray-400 text-center mt-2">↑ Click a button, then press Sign In</p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          IGDITW Hackathon Prototype · AI-assisted sustainability verification
        </p>
      </div>
    </div>
  );
}
