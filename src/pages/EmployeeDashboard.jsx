import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, getUserSubmissions } from '../firebase/firestore';
import SustainabilityScoreGauge from '../components/SustainabilityScoreGauge';
import ImpactStats from '../components/ImpactStats';
import LeaderboardRow from '../components/LeaderboardRow';
import TaskCard from '../components/TaskCard';
import TaskCompletionModal from './TaskCompletionModal';
import { getLeaderboard } from '../firebase/firestore';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function calculatePersonalScore(points = 0, streak = 0) {
  const pointsScore = Math.min(100, (points / 2000) * 100);
  const streakScore = Math.min(100, streak * 10);
  return Math.round(pointsScore * 0.6 + streakScore * 0.4);
}

export default function EmployeeDashboard() {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [tasks,       setTasks]       = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [loading,     setLoading]     = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentUser?.userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [t, s, lb] = await Promise.all([
          getTasks(),
          getUserSubmissions(currentUser.userId),
          getLeaderboard(),
        ]);
        setTasks(t);
        setSubmissions(s);
        setLeaderboard(lb.slice(0, 3));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.userId]);

  // Map taskId → today's submission
  const todayMap = {};
  submissions.forEach(s => { if (s.date === todayStr) todayMap[s.taskId] = s; });

  // CO₂ from all approved submissions
  const co2Saved = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.co2Impact || 0), 0);

  const personalScore = calculatePersonalScore(currentUser?.points, currentUser?.streak);

  const handleSubmitDone = async () => {
    // Re-fetch submissions + refresh user points/streak
    const [s] = await Promise.all([
      getUserSubmissions(currentUser.userId),
      refreshUser(),
    ]);
    setSubmissions(s);
    setSelectedTask(null);
  };

  const todayTasks = tasks.slice(0, 5);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* HERO HEADER */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 text-8xl opacity-10 select-none pointer-events-none" style={{transform:'translate(10px,-10px)'}}>🌍</div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-3xl font-black mb-2">{getGreeting()}, {currentUser?.name?.split(' ')[0]} 👋</h1>
              <p className="text-green-100 mb-6">Keep up your sustainable habits — every action counts! 🌱</p>

              <div className="flex flex-wrap gap-4">
                <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3">
                  <p className="text-green-100 text-xs font-medium">Total Points</p>
                  <p className="text-2xl font-black">⭐ {(currentUser?.points || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3">
                  <p className="text-green-100 text-xs font-medium">Current Streak</p>
                  <p className="text-2xl font-black">🔥 {currentUser?.streak || 0} days</p>
                </div>
                <div className="bg-white/15 backdrop-blur rounded-2xl px-5 py-3">
                  <p className="text-green-100 text-xs font-medium">Department</p>
                  <p className="text-2xl font-black">🏢 {currentUser?.department}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="bg-white/10 backdrop-blur rounded-3xl p-6">
                <p className="text-center text-green-100 text-sm font-medium mb-2">Your Eco Score</p>
                <SustainabilityScoreGauge score={personalScore} size="lg" label="Personal Score" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TODAY'S TASKS */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">🌿 Today's Green Actions</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Complete tasks to earn points and reduce your carbon footprint</p>
                </div>
                <button onClick={() => navigate('/tasks')} className="text-sm text-green-600 font-semibold hover:text-green-700">
                  View all →
                </button>
              </div>
              <div className="space-y-3">
                {todayTasks.map(task => (
                  <TaskCard
                    key={task.taskId}
                    task={task}
                    onComplete={setSelectedTask}
                    submissionStatus={todayMap[task.taskId]?.status}
                  />
                ))}
                {todayTasks.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">No tasks available. Ask an admin to add some! 🌱</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <ImpactStats co2Saved={co2Saved} label="🌍 Your Environmental Impact" />
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            {/* Mini leaderboard */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">🏆 Top Performers</h3>
                <button onClick={() => navigate('/leaderboard')} className="text-xs text-green-600 font-semibold">Full board →</button>
              </div>
              <div className="space-y-1">
                {leaderboard.map((user, i) => (
                  <LeaderboardRow key={user.userId} user={user} rank={i + 1} isCurrentUser={user.userId === currentUser?.userId} />
                ))}
                {leaderboard.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No data yet</p>}
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
              <h3 className="font-bold text-gray-800 mb-3">⚡ Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { to: '/leaderboard', label: '🏆 View Leaderboard' },
                  { to: '/rewards',     label: '🎁 Browse Rewards' },
                  { to: '/profile',     label: '👤 My Profile' },
                ].map(({ to, label }) => (
                  <button
                    key={to}
                    onClick={() => navigate(to)}
                    className="w-full text-left px-4 py-2.5 bg-white rounded-xl text-sm font-medium text-gray-700 hover:shadow-sm transition-all border border-gray-100"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <TaskCompletionModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSubmitDone={handleSubmitDone}
        />
      )}
    </div>
  );
}
