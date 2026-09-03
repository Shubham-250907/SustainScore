import { useState, useEffect } from 'react';
import { getTasks, createTask, updateTask, deleteTask } from '../firebase/firestore';

const CATEGORIES = ['Transport', 'Energy', 'Waste', 'Food'];
const FREQUENCIES = ['daily', 'weekly'];
const emptyTask = { title: '', description: '', points: 10, category: 'Energy', frequency: 'daily', co2Impact: 0.1 };
const CAT_COLORS = { Transport: 'bg-blue-100 text-blue-700', Energy: 'bg-yellow-100 text-yellow-700', Waste: 'bg-green-100 text-green-700', Food: 'bg-orange-100 text-orange-700' };

export default function AdminTasksPage() {
  const [tasks,         setTasks]         = useState([]);
  const [editing,       setEditing]       = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(emptyTask);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);

  useEffect(() => {
    getTasks()
      .then(t => setTasks(t))
      .catch(err => console.error('AdminTasksPage load error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    if (editing) {
      await updateTask(editing.taskId, form);
    } else {
      await createTask(form);
    }
    const updated = await getTasks();
    setTasks(updated);
    setEditing(null);
    setForm(emptyTask);
    setShowForm(false);
    setSaving(false);
  };

  const handleEdit = (task) => {
    setEditing(task);
    setForm({ title: task.title, description: task.description, points: task.points, category: task.category, frequency: task.frequency, co2Impact: task.co2Impact });
    setShowForm(true);
  };

  const handleDelete = async (taskId) => {
    await deleteTask(taskId);
    setTasks(prev => prev.filter(t => t.taskId !== taskId));
    setDeleteConfirm(null);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">✅ Manage Tasks</h1>
            <p className="text-gray-500 text-sm mt-1">Add, edit, or remove sustainability tasks</p>
          </div>
          <button
            onClick={() => { setEditing(null); setForm(emptyTask); setShowForm(true); }}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            + Add Task
          </button>
        </div>

        <div className="space-y-3">
          {tasks.map(task => (
            <div key={task.taskId} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{task.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CAT_COLORS[task.category] || 'bg-gray-100 text-gray-600'}`}>{task.category}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 capitalize">{task.frequency}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{task.description}</p>
                  <div className="flex gap-3 text-xs">
                    <span className="text-amber-600 font-semibold">⭐ {task.points} pts</span>
                    <span className="text-gray-400">🌿 {task.co2Impact}kg CO₂</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleEdit(task)} className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-semibold transition-colors">Edit</button>
                  <button onClick={() => setDeleteConfirm(task.taskId)} className="text-xs bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg font-semibold transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-sm text-gray-400 text-center py-8">No tasks yet. Add your first task!</p>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Task' : 'Add New Task'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Task Title *</label>
                <input name="title" value={form.title} onChange={handleChange} placeholder="e.g. Use Reusable Bag" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Points</label>
                  <input name="points" type="number" min="1" value={form.points} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CO₂ Impact (kg)</label>
                  <input name="co2Impact" type="number" min="0" step="0.01" value={form.co2Impact} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select name="category" value={form.category} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Frequency</label>
                  <select name="frequency" value={form.frequency} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white">
                    {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="font-bold text-gray-900 mb-2">Delete Task?</h3>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
