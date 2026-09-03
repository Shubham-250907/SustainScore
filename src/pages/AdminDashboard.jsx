import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { getAllSubmissions, getAllUsers, getTasks, approveSubmission, rejectSubmission, computeCompanyScore } from '../firebase/firestore';
import SubmissionRow from '../components/SubmissionRow';

const DEPT_COLORS = ['#16a34a', '#059669', '#0d9488', '#0891b2'];

/**
 * Build a trend array using only the real current score.
 * The prior months simulate a ramp-up but are clearly labelled as projected.
 * We only pin the CURRENT month to real data.
 */
function buildTrend(currentScore) {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('default', { month: 'short' });
    months.push({ month: label, isCurrent: i === 0 });
  }
  // Only last month is real; prior months are linearly projected back
  return months.map((m, idx) => ({
    month: m.month,
    score: m.isCurrent
      ? currentScore
      : Math.max(0, Math.round(currentScore * (0.70 + idx * 0.04))),
    projected: !m.isCurrent,
  }));
}

export default function AdminDashboard() {
  const [submissions,  setSubmissions]  = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [users,        setUsers]        = useState([]);
  const [companyScore, setCompanyScore] = useState(null);
  const [deptData,     setDeptData]     = useState([]);
  const [loading,      setLoading]      = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [subs, allUsers, t, score] = await Promise.all([
        getAllSubmissions(),
        getAllUsers(),
        getTasks(),
        computeCompanyScore(),
      ]);
      setSubmissions(subs);
      setUsers(allUsers);
      setTasks(t);
      setCompanyScore(score);

      // Compute dept scores from user points
      const employees = allUsers.filter(u => u.role === 'employee');
      const depts = {};
      employees.forEach(u => {
        if (!depts[u.department]) depts[u.department] = { total: 0, count: 0 };
        depts[u.department].total += u.points || 0;
        depts[u.department].count += 1;
      });
      const deptArr = Object.entries(depts).map(([dept, { total, count }]) => ({
        department: dept,
        score: Math.min(100, Math.round((total / count / 2000) * 100)),
        employees: count,
      })).sort((a, b) => b.score - a.score);
      setDeptData(deptArr);
    } catch (err) {
      console.error('AdminDashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (submissionId) => {
    const sub = submissions.find(s => s.submissionId === submissionId);
    if (!sub) return;
    const task = tasks.find(t => t.taskId === sub.taskId);
    await approveSubmission(submissionId, sub.userId, task?.points || 0, task?.co2Impact || 0);
    await load();
  };

  const handleReject = async (submissionId) => {
    await rejectSubmission(submissionId);
    setSubmissions(prev => prev.map(s => s.submissionId === submissionId ? { ...s, status: 'rejected' } : s));
  };

  const pending = submissions.filter(s => s.status === 'pending');

  // Build trend from real score (only current month is actual data)
  const trend = buildTrend(companyScore?.score || 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">📊 Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Company-wide sustainability overview</p>
        </div>

        {/* COMPANY SCORE HERO */}
        <div className="bg-gradient-to-r from-green-700 to-emerald-600 rounded-3xl p-8 mb-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 text-9xl opacity-5 select-none pointer-events-none" style={{transform:'translate(20px,-20px)'}}>🌍</div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              <div>
                <p className="text-green-200 text-sm font-semibold uppercase tracking-wider mb-2">Company Sustainability Score</p>
                <div className="flex items-end gap-3">
                  <p className="text-7xl font-black">{companyScore?.score ?? '--'}</p>
                  <div className="mb-3">
                    <span className="text-green-300 text-lg font-bold">/ 100</span>
                    <p className="text-green-300 text-sm font-semibold">Live calculated</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { label: 'Participation', value: companyScore?.participationScore ?? 0, weight: '30%' },
                    { label: 'Completion',    value: companyScore?.completionScore ?? 0,    weight: '30%' },
                    { label: 'Impact',        value: companyScore?.impactScore ?? 0,        weight: '40%' },
                  ].map(({ label, value, weight }) => (
                    <div key={label} className="bg-white/15 backdrop-blur rounded-xl px-4 py-3">
                      <p className="text-green-200 text-xs">{label} ({weight})</p>
                      <p className="text-white text-xl font-black">{value}</p>
                      <div className="bg-white/20 rounded-full h-1 mt-1">
                        <div className="bg-white h-1 rounded-full" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-green-200 text-xs font-semibold">Score Trend</p>
                  <p className="text-green-300 text-xs opacity-75">← projected · live →</p>
                </div>
                <ResponsiveContainer width="100%" height={100}>
                  <LineChart data={trend}>
                    <Line type="monotone" dataKey="score" stroke="#86efac" strokeWidth={2.5} dot={(props) => {
                      const isLast = props.index === trend.length - 1;
                      return <circle key={props.index} cx={props.cx} cy={props.cy} r={isLast ? 5 : 3} fill={isLast ? '#fff' : '#86efac'} stroke={isLast ? '#86efac' : 'none'} strokeWidth={2} />;
                    }} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#bbf7d0' }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '10px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', fontSize: '12px' }} formatter={(v, name, props) => [`${v}/100`, props.payload?.projected ? 'Projected' : 'Live Score']} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* KEY STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: '👥', label: 'Total Employees',  value: companyScore?.totalEmployees ?? 0,  sub: `${companyScore?.activeEmployees ?? 0} active this month` },
            { icon: '✅', label: 'Tasks Completed',  value: companyScore?.tasksCompleted ?? 0,   sub: `${pending.length} pending review` },
            { icon: '🌿', label: 'CO₂ Saved',        value: `${(companyScore?.totalCO2Saved ?? 0).toFixed(1)}kg`, sub: 'estimated impact*' },
            { icon: '📈', label: 'Participation',    value: `${companyScore?.participationScore ?? 0}%`, sub: 'approved tasks this month' },
          ].map(({ icon, label, value, sub }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-2xl mb-2">{icon}</p>
              <p className="text-xs text-gray-500 font-medium">{label}</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Participation bar */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">🎯 Participation Rate</h3>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">{companyScore?.activeEmployees ?? 0} of {companyScore?.totalEmployees ?? 0} employees active this month</p>
              <p className="text-sm font-bold text-green-700">{companyScore?.participationScore ?? 0}%</p>
            </div>
            <div className="bg-gray-100 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all"
                style={{ width: `${companyScore?.participationScore || 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">Target: 90% participation this quarter</p>
          </div>

          {/* Department chart */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">🏢 Department Performance</h3>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={deptData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip contentStyle={{ borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px' }} formatter={v => [`${v}/100`, 'Score']} />
                <Bar dataKey="score" radius={[5, 5, 0, 0]}>
                  {deptData.map((_, idx) => <Cell key={idx} fill={DEPT_COLORS[idx % DEPT_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SUBMISSIONS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900">📋 Recent Submissions</h3>
              <p className="text-xs text-gray-400 mt-0.5">Click "View Proof" to see uploaded photos. Approve/Reject updates points live.</p>
            </div>
            {pending.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full">
                {pending.length} awaiting review
              </span>
            )}
          </div>
          <div className="p-4 space-y-1">
            {submissions.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No submissions yet. Seed the database or wait for employees to submit!</p>
              : submissions.map(sub => {
                const task = tasks.find(t => t.taskId === sub.taskId);
                const user = users.find(u => u.userId === sub.userId);
                return (
                  <SubmissionRow
                    key={sub.submissionId}
                    submission={sub}
                    task={task}
                    user={user}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                );
              })
            }
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          *All CO₂ estimates are based on predefined emission factors (World Bank). Not directly measured.
        </p>
      </div>
    </div>
  );
}
