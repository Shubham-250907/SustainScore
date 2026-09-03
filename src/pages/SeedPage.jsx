import { useState } from 'react';
import { runSeed } from '../firebase/seed';

export default function SeedPage() {
  const [logs,    setLogs]    = useState([]);
  const [running, setRunning] = useState(false);
  const [done,    setDone]    = useState(false);
  const [failed,  setFailed]  = useState(false);

  const handleSeed = async () => {
    setLogs([]);
    setRunning(true);
    setDone(false);
    setFailed(false);
    const result = await runSeed((msg) => setLogs(prev => [...prev, msg]));
    setRunning(false);
    if (result.success) {
      setDone(true);
    } else {
      setFailed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-8 font-mono">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-2">🌱 SustainScore DB Seed</h1>
        <p className="text-gray-400 text-sm mb-6">
          Populates Firestore with demo data (tasks, rewards, users, submissions).
          Safe to re-run — clears existing data first.
        </p>

        {/* IMPORTANT: Firestore rules notice */}
        <div className="bg-yellow-900/40 border border-yellow-600 rounded-xl p-4 mb-6 text-sm">
          <p className="text-yellow-300 font-bold mb-2">⚠️ One-time setup: Open Firestore rules</p>
          <p className="text-yellow-200 mb-2">Go to <strong>Firebase Console → Firestore → Rules</strong>, paste this and click <strong>Publish</strong>:</p>
          <pre className="bg-gray-900 rounded-lg p-3 text-green-300 text-xs overflow-auto">{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}`}</pre>
          <p className="text-yellow-400 text-xs mt-2">✅ No Storage rules needed — photos are stored in Firestore directly.</p>
        </div>

        {/* Log output */}
        <div className="bg-gray-800 rounded-2xl p-4 mb-6 min-h-48 overflow-auto max-h-96 text-sm leading-relaxed">
          {logs.length === 0 && <p className="text-gray-500">Output will appear here...</p>}
          {logs.map((line, i) => (
            <p key={i} className={
              line.startsWith('✅') || line.startsWith('🎉') ? 'text-green-400' :
              line.startsWith('❌') ? 'text-red-400' :
              line.startsWith('⚠️') ? 'text-yellow-400' :
              line.startsWith('  ✓') ? 'text-emerald-300' :
              'text-gray-300'
            }>{line}</p>
          ))}
          {running && <p className="text-yellow-300 animate-pulse">...</p>}
        </div>

        {/* Success banner */}
        {done && (
          <div className="bg-green-900/40 border border-green-700 rounded-xl p-4 mb-4 text-sm">
            <p className="text-green-300 font-bold mb-1">✅ Seeding complete!</p>
            <p className="text-green-400">Employee: <code className="text-white">arjun@sustain.co</code> / <code className="text-white">demo1234</code></p>
            <p className="text-green-400">Admin:    <code className="text-white">dev@sustain.co</code> / <code className="text-white">demo1234</code></p>
            <a href="/login" className="inline-block mt-3 bg-green-600 hover:bg-green-500 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors">
              Go to Login →
            </a>
          </div>
        )}

        {/* Failure banner */}
        {failed && (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 mb-4 text-sm">
            <p className="text-red-300 font-bold mb-1">❌ Seed failed</p>
            <p className="text-red-400 mb-2">Most likely cause: <strong className="text-white">Firestore security rules are blocking writes.</strong></p>
            <p className="text-yellow-300 text-xs">→ Go to Firebase Console → Firestore Database → Rules → paste the rules shown above → Publish → then Run Seed again.</p>
          </div>
        )}

        <button
          onClick={handleSeed}
          disabled={running}
          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold px-8 py-3 rounded-xl transition-colors"
        >
          {running ? '⏳ Seeding...' : '🚀 Run Seed'}
        </button>

        <p className="text-gray-600 text-xs mt-4">
          Dev only. Remove /seed route before production.
        </p>
      </div>
    </div>
  );
}
