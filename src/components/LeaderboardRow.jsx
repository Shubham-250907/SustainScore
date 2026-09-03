const MEDAL = ['🥇', '🥈', '🥉'];

export default function LeaderboardRow({ user, rank, isCurrentUser = false }) {
  const medal = rank <= 3 ? MEDAL[rank - 1] : null;

  return (
    <div className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
      isCurrentUser
        ? 'bg-green-50 border border-green-200'
        : 'hover:bg-gray-50'
    }`}>
      {/* Rank */}
      <div className="w-8 text-center shrink-0">
        {medal ? (
          <span className="text-xl">{medal}</span>
        ) : (
          <span className="text-sm font-bold text-gray-400">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
        isCurrentUser ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'
      }`}>
        {user.name.charAt(0)}
      </div>

      {/* Name + dept */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-green-700' : 'text-gray-800'}`}>
          {user.name} {isCurrentUser && <span className="text-xs font-normal text-green-500">(you)</span>}
        </p>
        <p className="text-xs text-gray-400">{user.department}</p>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <p className="text-sm font-bold text-amber-600">⭐ {user.points.toLocaleString()}</p>
        <p className="text-xs text-gray-400">pts</p>
      </div>
    </div>
  );
}
