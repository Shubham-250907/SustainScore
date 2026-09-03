import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { verifyProofWithAI } from '../services/geminiVerification';
import { createSubmission, approveSubmission } from '../firebase/firestore';
import { compressImageToBase64 } from '../utils/imageUtils';

export default function TaskCompletionModal({ task, onClose, onSubmitDone }) {
  const { currentUser } = useAuth();
  const [file, setFile]     = useState(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | verifying | result
  const [aiResult, setAiResult] = useState(null);
  const [error, setError]   = useState('');
  const fileRef = useRef();

  const handleFileChange = e => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStatus('idle');
    setAiResult(null);
    setError('');
  };

  const handleSubmit = async () => {
    if (!file) { setError('Please upload a photo first.'); return; }
    setError('');

    const today = new Date().toISOString().split('T')[0];
    const submissionId = `sub_${Date.now()}`;

    try {
      // Step 1: Compress image to base64 for Firestore storage (no Firebase Storage needed)
      setStatus('uploading');
      let proofImageBase64 = null;
      try {
        proofImageBase64 = await compressImageToBase64(file);
      } catch (compressErr) {
        console.warn('Image compression failed:', compressErr);
        // Continue without image
      }

      // Step 2: AI verification
      setStatus('verifying');
      let aiRes;
      try {
        aiRes = await verifyProofWithAI(file, task.title, task.description);
      } catch {
        aiRes = { verified: false, confidence: 0, reason: 'AI unavailable — flagged for admin review.' };
      }
      setAiResult(aiRes);

      const autoApprove = aiRes.verified && aiRes.confidence > 0.75;
      const submissionStatus = autoApprove ? 'approved' : 'pending';

      // Step 3: Create submission in Firestore (image stored as base64, no Storage needed)
      const docRef = await createSubmission({
        userId: currentUser.userId,
        taskId: task.taskId,
        proofImageBase64,          // stored directly in Firestore
        proofImageUrl: null,       // Storage not used (requires paid plan)
        status: submissionStatus,
        points: autoApprove ? task.points : 0,
        co2Impact: autoApprove ? task.co2Impact : 0,
        date: today,
        aiVerified: autoApprove,
        aiConfidence: aiRes.confidence,
        aiReason: aiRes.reason,
      });

      // Step 4: If auto-approved, immediately award points + update streak
      if (autoApprove) {
        await approveSubmission(docRef.id, currentUser.userId, task.points, task.co2Impact);
      }

      setStatus('result');
    } catch (err) {
      console.error(err);
      setError('Submission failed: ' + err.message);
      setStatus('idle');
    }
  };

  const handleConfirm = () => {
    onSubmitDone && onSubmitDone();
  };

  const isHighConfidence = aiResult?.confidence > 0.75 && aiResult?.verified;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Complete Task</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Task info */}
          <div className="bg-green-50 rounded-2xl p-4">
            <h3 className="font-bold text-green-800 text-base mb-1">{task.title}</h3>
            <p className="text-sm text-green-700">{task.description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs font-semibold text-amber-600">⭐ +{task.points} pts</span>
              <span className="text-xs text-gray-400">🌿 ~{task.co2Impact}kg CO₂ saved*</span>
            </div>
          </div>

          {/* Upload */}
          {status === 'idle' && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">📸 Upload Proof Photo</p>
              <div
                onClick={() => fileRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl cursor-pointer transition-colors min-h-40 flex flex-col items-center justify-center ${
                  preview ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-green-300 hover:bg-green-50'
                }`}
              >
                {preview
                  ? <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-2xl" />
                  : (
                    <div className="text-center p-6">
                      <p className="text-4xl mb-2">📷</p>
                      <p className="text-sm text-gray-500">Click to upload a photo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG up to 10MB</p>
                    </div>
                  )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              {preview && (
                <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 underline mt-2">
                  Change photo
                </button>
              )}
            </div>
          )}

          {/* Uploading / Verifying spinner */}
          {(status === 'uploading' || status === 'verifying') && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
              <div className="text-center">
                <p className="font-semibold text-gray-800">
                  {status === 'uploading' ? '☁️ Uploading photo...' : '🤖 AI Verifying Proof...'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {status === 'verifying' ? 'Analysing your photo with Gemini Vision' : 'Saving to cloud storage'}
                </p>
                <p className="text-xs text-gray-400 mt-2 italic">AI-assisted verification — not 100% guaranteed</p>
              </div>
            </div>
          )}

          {/* Result */}
          {status === 'result' && aiResult && (
            <div className={`rounded-2xl p-5 ${isHighConfidence ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {isHighConfidence
                  ? <span className="text-lg font-bold text-green-700">✅ AI Verified!</span>
                  : <span className="text-lg font-bold text-yellow-700">🟡 Needs Admin Review</span>
                }
                <span className="text-sm text-gray-500">({Math.round(aiResult.confidence * 100)}% confidence)</span>
              </div>
              <p className="text-sm text-gray-600">{aiResult.reason}</p>
              {isHighConfidence
                ? <p className="text-xs text-green-600 mt-2">Points awarded immediately ⭐</p>
                : <p className="text-xs text-yellow-700 mt-2">An admin will review before points are awarded.</p>
              }
              <p className="text-xs text-gray-400 mt-3 italic">*AI-assisted verification only. Does not guarantee real-world action.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-xl text-sm font-semibold transition-colors">
            Cancel
          </button>

          {status === 'idle' && (
            <button
              onClick={handleSubmit}
              disabled={!file}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:text-gray-400 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
            >
              Submit for Verification 🚀
            </button>
          )}

          {status === 'result' && (
            <button
              onClick={handleConfirm}
              className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors text-white ${
                isHighConfidence ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-500 hover:bg-yellow-600'
              }`}
            >
              {isHighConfidence ? 'Claim Points! ⭐' : 'Submit for Review 📋'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
