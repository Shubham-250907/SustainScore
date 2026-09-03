import { useState, useEffect } from 'react';
import { getRewards, createReward, updateReward, deleteReward, getAllRedemptions } from '../firebase/firestore';

const emptyReward = { name: '', description: '', pointsRequired: 500 };

export default function AdminRewardsPage() {
  const [rewards,       setRewards]       = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [editing,       setEditing]       = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(emptyReward);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [notifRead,     setNotifRead]     = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [r, rd] = await Promise.all([getRewards(), getAllRedemptions()]);
        setRewards(r);
        setNotifications(rd);
      } catch (err) {
        console.error('AdminRewardsPage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const unreadCount = notifRead ? 0 : notifications.length;

  const handleChange = e => {
    const { name, value, type } = e.target;
    setForm(f => ({ ...f, [name]: type === 'number' ? parseInt(value) || 0 : value }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editing) {
      await updateReward(editing.rewardId, form);
    } else {
      await createReward(form);
    }
    const updated = await getRewards();
    setRewards(updated);
    setEditing(null);
    setForm(emptyReward);
    setShowForm(false);
    setSaving(false);
  };

  const handleEdit = (reward) => {
    setEditing(reward);
    setForm({ name: reward.name, description: reward.description, pointsRequired: reward.pointsRequired });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await deleteReward(id);
    setRewards(prev => prev.filter(r => r.rewardId !== id));
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
            <h1 className="text-2xl font-black text-gray-900">🎁 Manage Rewards</h1>
            <p className="text-gray-500 text-sm mt-1">Add, edit, or remove rewards</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowNotifs(!showNotifs); setNotifRead(true); }}
              className="relative bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => { setEditing(null); setForm(emptyReward); setShowForm(true); }}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              + Add Reward
            </button>
          </div>
        </div>

        {/* Notifications panel */}
        {showNotifs && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-6 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">🔔 Reward Claims</h3>
              <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            {notifications.length === 0
              ? <p className="text-sm text-gray-400 text-center py-6">No claims yet</p>
              : (
                <div className="divide-y divide-gray-50">
                  {notifications.map(n => (
                    <div key={n.redemptionId} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          🎉 <strong>{n.employeeName || 'An employee'}</strong> redeemed <strong>{n.rewardName}</strong>
                        </p>
                        <p className="text-xs text-gray-400">Code: {n.voucherCode}</p>
                      </div>
                      <span className="text-xs text-amber-600 font-semibold">-{n.pointsSpent}pts</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        )}

        {/* Rewards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {rewards.map(reward => (
            <div key={reward.rewardId} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-bold text-gray-900">{reward.name}</h3>
                <span className="text-amber-600 font-bold text-sm shrink-0">⭐ {reward.pointsRequired}</span>
              </div>
              <p className="text-sm text-gray-500 mb-4">{reward.description}</p>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(reward)} className="flex-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 rounded-lg font-semibold transition-colors">Edit</button>
                <button onClick={() => setDeleteConfirm(reward.rewardId)} className="flex-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 py-2 rounded-lg font-semibold transition-colors">Delete</button>
              </div>
            </div>
          ))}
          {rewards.length === 0 && <p className="text-sm text-gray-400 col-span-2 text-center py-8">No rewards yet. Add your first!</p>}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editing ? 'Edit Reward' : 'Add New Reward'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Reward Name *</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="e.g. ☕ Coffee Voucher" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Points Required</label>
                <input name="pointsRequired" type="number" min="1" value={form.pointsRequired} onChange={handleChange} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Reward'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center">
            <p className="text-4xl mb-3">⚠️</p>
            <h3 className="font-bold text-gray-900 mb-2">Delete Reward?</h3>
            <p className="text-sm text-gray-500 mb-5">This cannot be undone.</p>
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
