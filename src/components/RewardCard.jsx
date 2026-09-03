export default function RewardCard({ reward, userPoints, onRedeem, redeemed = false }) {
  const canAfford = userPoints >= reward.pointsRequired;
  const shortage = reward.pointsRequired - userPoints;

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-sm border transition-all hover:shadow-md ${
      redeemed ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
    }`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-bold text-gray-900 text-base">{reward.name}</h3>
        <span className="text-amber-600 font-bold text-sm shrink-0">⭐ {reward.pointsRequired}</span>
      </div>

      <p className="text-sm text-gray-500 mb-4 leading-relaxed">{reward.description}</p>

      {redeemed ? (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-xl">
          ✓ Redeemed
        </span>
      ) : (
        <div>
          <button
            onClick={() => canAfford && onRedeem && onRedeem(reward)}
            disabled={!canAfford}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              canAfford
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {canAfford ? 'Redeem Now 🎉' : `Need ${shortage} more pts`}
          </button>
        </div>
      )}
    </div>
  );
}
