const CATEGORY_COLORS = {
  Transport: 'bg-blue-100 text-blue-700',
  Energy:    'bg-yellow-100 text-yellow-700',
  Waste:     'bg-green-100 text-green-700',
  Food:      'bg-orange-100 text-orange-700',
};

const CATEGORY_ICONS = {
  Transport: '🚌',
  Energy:    '💡',
  Waste:     '♻️',
  Food:      '🥗',
};

export default function TaskCard({ task, onComplete, completed = false, submissionStatus = null }) {
  const color = CATEGORY_COLORS[task.category] || 'bg-gray-100 text-gray-700';
  const icon = CATEGORY_ICONS[task.category] || '🌱';

  const getStatusBadge = () => {
    if (submissionStatus === 'approved') return (
      <span className="flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded-full">
        ✓ AI Verified
      </span>
    );
    if (submissionStatus === 'pending') return (
      <span className="flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
        🟡 Pending Review
      </span>
    );
    if (submissionStatus === 'rejected') return (
      <span className="flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded-full">
        ✗ Rejected
      </span>
    );
    return null;
  };

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
      submissionStatus === 'approved' ? 'border-green-200 bg-green-50/30' :
      submissionStatus === 'pending'  ? 'border-yellow-200' :
      submissionStatus === 'rejected' ? 'border-red-200' :
      'border-gray-100'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className="text-2xl shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-gray-900 text-sm">{task.title}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
                {task.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">{task.description}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-xs font-semibold text-amber-600">⭐ +{task.points} pts</span>
              <span className="text-xs text-gray-400">🌿 ~{task.co2Impact}kg CO₂ saved*</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {getStatusBadge()}
          {!submissionStatus && (
            <button
              onClick={() => onComplete && onComplete(task)}
              className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
