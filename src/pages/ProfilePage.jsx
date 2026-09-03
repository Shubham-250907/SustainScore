import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserSubmissions, getTasks, getUserRedemptions } from '../firebase/firestore';
import ImpactStats from '../components/ImpactStats';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [submissions,  setSubmissions]  = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [redemptions,  setRedemptions]  = useState([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!currentUser?.userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [s, t, rd] = await Promise.all([
          getUserSubmissions(currentUser.userId),
          getTasks(),
          getUserRedemptions(currentUser.userId),
        ]);
        setSubmissions(s);
        setTasks(t);
        setRedemptions(rd);
      } catch (err) {
        console.error('ProfilePage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.userId]);

  const taskMap = {};
  tasks.forEach(t => { taskMap[t.taskId] = t; });

  const approved  = submissions.filter(s => s.status === 'approved');
  const pending   = submissions.filter(s => s.status === 'pending');
  const rejected  = submissions.filter(s => s.status === 'rejected');
  const co2Saved  = approved.reduce((sum, s) => sum + (s.co2Impact || 0), 0);
  const personalScore = Math.min(100, Math.round(
    Math.min(100, (currentUser?.points || 0) / 20) * 0.6 +
    Math.min(100, (currentUser?.streak || 0) * 10) * 0.4
  ));

  const STATUS_STYLES = {
    approved: 'text-green-700 bg-green-100',
    pending:  'text-yellow-700 bg-yellow-100',
    rejected: 'text-red-700 bg-red-100',
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-7 text-white shadow-xl">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-black text-white shadow-lg">
              {currentUser?.name?.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black">{currentUser?.name}</h1>
              <p className="text-green-100 text-sm">{currentUser?.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full">🏢 {currentUser?.department}</span>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${currentUser?.role === 'admin' ? 'bg-purple-400/30 text-purple-100' : 'bg-green-400/30 text-green-100'}`}>
                  {currentUser?.role === 'admin' ? '👑 Admin' : '🌿 Employee'}
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
              <p className="text-2xl font-black">⭐ {(currentUser?.points || 0).toLocaleString()}</p>
              <p className="text-xs text-green-100 mt-0.5">Total Points</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
              <p className="text-2xl font-black">🔥 {currentUser?.streak || 0}</p>
              <p className="text-xs text-green-100 mt-0.5">Day Streak</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-2xl p-4 text-center">
              <p className="text-2xl font-black">{personalScore}</p>
              <p className="text-xs text-green-100 mt-0.5">Eco Score</p>
            </div>
          </div>
        </div>

        {/* Impact */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <ImpactStats co2Saved={co2Saved} label="🌍 Your Environmental Impact" />
        </div>

        {/* Submission history */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">📋 Submission History</h3>
          <div className="flex gap-4 mb-4 text-sm">
            <span className="text-green-600 font-semibold">✓ {approved.length} Approved</span>
            <span className="text-yellow-600 font-semibold">🟡 {pending.length} Pending</span>
            <span className="text-red-600 font-semibold">✗ {rejected.length} Rejected</span>
          </div>
          {submissions.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">No submissions yet — complete your first task! 🌱</p>
            : (
              <div className="space-y-2">
                {submissions.map(sub => (
                  <div key={sub.submissionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{taskMap[sub.taskId]?.title || 'Task'}</p>
                      <p className="text-xs text-gray-400">{sub.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.aiVerified && <span className="text-xs text-blue-600">🤖 AI</span>}
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[sub.status] || ''}`}>
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>

        {/* Redeemed rewards */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">🎟️ Redeemed Rewards</h3>
          {redemptions.length === 0
            ? <p className="text-sm text-gray-400 text-center py-4">No rewards redeemed yet. Head to the Rewards page! 🎁</p>
            : (
              <div className="space-y-3">
                {redemptions.map(r => (
                  <div key={r.redemptionId} className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{r.rewardName}</p>
                        <p className="text-xs text-gray-400">{r.pointsSpent} pts spent</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Voucher Code</p>
                        <code className="text-sm font-bold text-green-700 bg-white px-3 py-1 rounded-lg border border-green-200">{r.voucherCode}</code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
