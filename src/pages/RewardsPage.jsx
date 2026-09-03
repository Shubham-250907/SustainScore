import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getRewards, createRedemption, getUserRedemptions, updateUserPoints } from '../firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import RewardCard from '../components/RewardCard';

function generateVoucherCode(rewardName) {
  // Hardcoded: voucher codes are randomly generated strings — no real voucher system
  const prefix = rewardName.replace(/[^A-Z]/g, '').slice(0, 3) || 'SS';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `SS-${prefix}-${code}`;
}

export default function RewardsPage() {
  const { currentUser, refreshUser } = useAuth();
  const [rewards,     setRewards]     = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [successModal, setSuccessModal] = useState(null);

  useEffect(() => {
    if (!currentUser?.userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [r, rd] = await Promise.all([
          getRewards(),
          getUserRedemptions(currentUser.userId),
        ]);
        setRewards(r);
        setRedemptions(rd);
      } catch (err) {
        console.error('RewardsPage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser?.userId]);

  const redeemedIds = redemptions.map(r => r.rewardId);

  const handleRedeem = async (reward) => {
    if ((currentUser?.points || 0) < reward.pointsRequired) return;

    const voucherCode = generateVoucherCode(reward.name);
    const today = new Date().toISOString().split('T')[0];

    // 1. Deduct points from user
    await updateDoc(doc(db, 'users', currentUser.userId), {
      points: (currentUser.points || 0) - reward.pointsRequired,
    });

    // 2. Create redemption record
    await createRedemption({
      userId: currentUser.userId,
      rewardId: reward.rewardId,
      rewardName: reward.name,
      voucherCode,
      pointsSpent: reward.pointsRequired,
      employeeName: currentUser.name,
    });

    await refreshUser();
    const rd = await getUserRedemptions(currentUser.userId);
    setRedemptions(rd);
    setSuccessModal({ reward, voucherCode });
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-gray-900">🎁 Rewards</h1>
            <p className="text-gray-500 text-sm mt-1">Redeem your eco-points for great rewards</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
            <p className="text-xs text-amber-600 font-medium">Available Points</p>
            <p className="text-2xl font-black text-amber-700">⭐ {(currentUser?.points || 0).toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {rewards.map(reward => (
            <RewardCard
              key={reward.rewardId}
              reward={reward}
              userPoints={currentUser?.points || 0}
              onRedeem={handleRedeem}
              redeemed={redeemedIds.includes(reward.rewardId)}
            />
          ))}
          {rewards.length === 0 && <p className="text-sm text-gray-400 col-span-2 text-center py-8">No rewards available yet. Ask an admin to add some! 🎁</p>}
        </div>

        {redemptions.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">🎟️ Your Redemptions</h3>
            <div className="space-y-3">
              {redemptions.map(r => (
                <div key={r.redemptionId} className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{r.rewardName}</p>
                    <p className="text-xs text-gray-400">-{r.pointsSpent} pts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium mb-0.5">Voucher Code</p>
                    <code className="text-sm font-bold text-green-700 bg-white px-3 py-1 rounded-lg border border-green-200">{r.voucherCode}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {successModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-xl font-black text-gray-900 mb-1">Reward Redeemed!</h2>
            <p className="text-gray-600 mb-6">{successModal.reward.name}</p>
            <div className="bg-green-50 rounded-2xl p-5 mb-6 border border-green-200">
              <p className="text-xs text-gray-500 mb-2 font-medium">Your Voucher Code</p>
              <code className="text-2xl font-black text-green-700 tracking-wider">{successModal.voucherCode}</code>
              <p className="text-xs text-gray-400 mt-2">Saved to your profile</p>
            </div>
            <p className="text-xs text-gray-400 mb-4 italic">*Simulated reward. No real voucher integration.</p>
            <button
              onClick={() => setSuccessModal(null)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Awesome! 🌱
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
