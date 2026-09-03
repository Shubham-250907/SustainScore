import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTasks, getUserSubmissions } from '../firebase/firestore';
import TaskCard from '../components/TaskCard';
import TaskCompletionModal from './TaskCompletionModal';

export default function TasksPage() {
  const { currentUser, refreshUser } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filter, setFilter]       = useState('All');
  const [loading, setLoading]     = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!currentUser?.userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [t, s] = await Promise.all([
          getTasks(),
          getUserSubmissions(currentUser.userId),
        ]);
        setTasks(t);
        setSubmissions(s);
      } catch (err) {
        console.error('TasksPage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.userId]);

  const todayMap = {};
  submissions.forEach(s => { if (s.date === todayStr) todayMap[s.taskId] = s; });

  const categories = ['All', ...new Set(tasks.map(t => t.category))];
  const filtered = filter === 'All' ? tasks : tasks.filter(t => t.category === filter);
  const completedCount = Object.keys(todayMap).length;

  const handleSubmitDone = async () => {
    const [s] = await Promise.all([
      getUserSubmissions(currentUser.userId),
      refreshUser(),
    ]);
    setSubmissions(s);
    setSelectedTask(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">✅ Green Actions</h1>
          <p className="text-gray-500 text-sm mt-1">Complete tasks, upload proof, earn points</p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Today's Progress</p>
            <p className="text-sm font-bold text-green-600">{completedCount} / {tasks.length} tasks</p>
          </div>
          <div className="bg-gray-100 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
              style={{ width: tasks.length ? `${(completedCount / tasks.length) * 100}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {completedCount === 0 ? 'Start your first task today! 🌱' : 'Great work! Keep going 🔥'}
          </p>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === cat ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-green-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(task => (
            <TaskCard
              key={task.taskId}
              task={task}
              onComplete={setSelectedTask}
              submissionStatus={todayMap[task.taskId]?.status}
            />
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          *CO₂ estimates based on predefined emission factors. Not directly measured.
        </p>
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
