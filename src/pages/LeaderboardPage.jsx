import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard, getAllUsers } from '../firebase/firestore';
import LeaderboardRow from '../components/LeaderboardRow';

const DEPT_COLORS = ['#16a34a', '#059669', '#0d9488', '#0891b2'];

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [view,     setView]     = useState('individual');
  const [ranked,   setRanked]   = useState([]);
  const [deptData, setDeptData] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const users = await getLeaderboard();
        setRanked(users);

        // Aggregate department scores (avg points normalized)
        const depts = {};
        users.forEach(u => {
          if (!depts[u.department]) depts[u.department] = { total: 0, count: 0 };
          depts[u.department].total += u.points || 0;
          depts[u.department].count += 1;
        });
        const deptArr = Object.entries(depts).map(([dept, { total, count }]) => ({
          department: dept,
          // Normalize to 0-100: avg points / 2000 * 100
          score: Math.min(100, Math.round((total / count / 2000) * 100)),
          employees: count,
        })).sort((a, b) => b.score - a.score);
        setDeptData(deptArr);
      } catch (err) {
        console.error('LeaderboardPage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">🏆 Leaderboard</h1>
          <p className="text-gray-500 text-sm mt-1">See how you rank against your colleagues</p>
        </div>

        {/* View toggle */}
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-gray-100 mb-6 w-fit">
          {[{ id: 'individual', label: '👤 Individual' }, { id: 'department', label: '🏢 Department' }].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${view === id ? 'bg-green-600 text-white shadow' : 'text-gray-600'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {view === 'individual' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Podium */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
              <p className="text-white text-xs font-semibold uppercase tracking-wider mb-4">Top Performers</p>
              <div className="flex items-end justify-center gap-4">
                {ranked[1] && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">{ranked[1].name?.charAt(0)}</div>
                    <p className="text-white text-xs font-semibold truncate max-w-16">{ranked[1].name?.split(' ')[0]}</p>
                    <p className="text-white/80 text-xs">⭐ {ranked[1].points}</p>
                    <div className="bg-white/20 rounded-t-lg w-16 h-12 flex items-center justify-center"><span className="text-2xl">🥈</span></div>
                  </div>
                )}
                {ranked[0] && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold text-xl shadow-lg">{ranked[0].name?.charAt(0)}</div>
                    <p className="text-white text-sm font-bold">{ranked[0].name?.split(' ')[0]}</p>
                    <p className="text-yellow-200 text-xs font-semibold">⭐ {ranked[0].points}</p>
                    <div className="bg-white/20 rounded-t-lg w-20 h-16 flex items-center justify-center"><span className="text-3xl">🥇</span></div>
                  </div>
                )}
                {ranked[2] && (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">{ranked[2].name?.charAt(0)}</div>
                    <p className="text-white text-xs font-semibold truncate max-w-16">{ranked[2].name?.split(' ')[0]}</p>
                    <p className="text-white/80 text-xs">⭐ {ranked[2].points}</p>
                    <div className="bg-white/20 rounded-t-lg w-16 h-8 flex items-center justify-center"><span className="text-2xl">🥉</span></div>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4 divide-y divide-gray-50">
              {ranked.map((user, i) => (
                <LeaderboardRow key={user.userId} user={user} rank={i + 1} isCurrentUser={user.userId === currentUser?.userId} />
              ))}
              {ranked.length === 0 && <p className="text-sm text-gray-400 text-center py-6">No data yet — seed the database first! 🌱</p>}
            </div>
          </div>
        )}

        {view === 'department' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Department Scores</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={deptData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={v => [`${v}/100`, 'Score']} />
                  <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                    {deptData.map((_, idx) => <Cell key={idx} fill={DEPT_COLORS[idx % DEPT_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {deptData.map((dept, i) => (
                <div key={dept.department} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🏅'}</span>
                    <p className="font-bold text-gray-900">{dept.department}</p>
                  </div>
                  <p className="text-3xl font-black text-green-700">{dept.score}</p>
                  <p className="text-xs text-gray-400">sustainability score</p>
                  <div className="mt-3 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${dept.score}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{dept.employees} employees</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
