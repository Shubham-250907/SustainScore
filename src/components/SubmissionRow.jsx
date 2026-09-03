import { useState } from 'react';

const STATUS_STYLES = {
  approved: { badge: 'bg-green-100 text-green-700', icon: '✓', label: 'Approved' },
  pending:  { badge: 'bg-yellow-100 text-yellow-700', icon: '🟡', label: 'Pending' },
  rejected: { badge: 'bg-red-100 text-red-700', icon: '✗', label: 'Rejected' },
};

/**
 * SubmissionRow — admin view of a single submission.
 * Receives task/user data as props (resolved by the parent from Firestore).
 * Falls back to submission fields if task/user objects aren't passed.
 */
export default function SubmissionRow({ submission, task, user, onApprove, onReject }) {
  const [showPhoto, setShowPhoto] = useState(false);
  const style = STATUS_STYLES[submission.status] || STATUS_STYLES.pending;

  const userName    = user?.name      || submission.userName   || 'Unknown';
  const taskTitle   = task?.title     || submission.taskTitle  || 'Unknown task';
  const taskPoints  = task?.points    || submission.points     || 0;

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 rounded-xl transition-colors">
        {/* User avatar */}
        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
          {userName.charAt(0)}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
          <p className="text-xs text-gray-400 truncate">{taskTitle} · {submission.date}</p>
          {submission.aiVerified && (
            <span className="text-xs text-blue-600 font-medium">🤖 AI verified ({Math.round((submission.aiConfidence || 0) * 100)}%)</span>
          )}
        </div>

        {/* Points */}
        <span className="text-xs font-semibold text-amber-600 shrink-0">⭐ {taskPoints}pts</span>

        {/* Status badge */}
        <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${style.badge}`}>
          {style.icon} {style.label}
        </span>

        {/* Proof photo */}
        <button
          onClick={() => setShowPhoto(true)}
          className="text-xs text-blue-600 hover:text-blue-800 underline shrink-0"
        >
          View Proof
        </button>

        {/* Approve/Reject */}
        {submission.status === 'pending' && (
          <div className="flex gap-1 shrink-0">
            <button
              onClick={() => onApprove && onApprove(submission.submissionId)}
              className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg font-semibold transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => onReject && onReject(submission.submissionId)}
              className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1 rounded-lg font-semibold transition-colors"
            >
              Reject
            </button>
          </div>
        )}
      </div>

      {/* Proof photo modal */}
      {showPhoto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowPhoto(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Proof Photo</h3>
              <button onClick={() => setShowPhoto(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="bg-gray-100 rounded-xl aspect-video flex items-center justify-center mb-4 overflow-hidden">
              {(submission.proofImageBase64 || submission.proofImageUrl) ? (
                <img
                  src={submission.proofImageBase64 || submission.proofImageUrl}
                  alt="Proof"
                  className="rounded-xl object-cover w-full h-full"
                />
              ) : (
                <div className="text-center text-gray-400 p-4">
                  <p className="text-4xl mb-2">📸</p>
                  <p className="text-sm font-medium">No photo uploaded</p>
                  <p className="text-xs mt-1 text-gray-400">
                    {submission.proofImageBase64 === null && submission.proofImageUrl === null
                      ? 'This is seeded demo data — real submissions will show the proof photo here.'
                      : 'Employee did not upload a photo.'}
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1"><strong>Task:</strong> {taskTitle}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Submitted by:</strong> {userName}</p>
            <p className="text-sm text-gray-600"><strong>Date:</strong> {submission.date}</p>
            {submission.aiVerified && (
              <p className="text-sm text-blue-600 mt-1">🤖 AI confidence: {Math.round((submission.aiConfidence || 0) * 100)}%</p>
            )}
            {submission.aiReason && (
              <p className="text-xs text-gray-500 mt-1 italic">"{submission.aiReason}"</p>
            )}
            {submission.status === 'pending' && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => { onApprove && onApprove(submission.submissionId); setShowPhoto(false); }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Approve ✓
                </button>
                <button
                  onClick={() => { onReject && onReject(submission.submissionId); setShowPhoto(false); }}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Reject ✗
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
