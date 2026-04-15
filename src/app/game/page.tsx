'use client';
// src/app/game/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// PLACEHOLDER — Game Dashboard
// This page will be fully built in Task 3 (Main Dashboard migration).
// For now it confirms the character creation flow routes correctly and
// allows us to read the Zustand store to verify state was populated.
// ─────────────────────────────────────────────────────────────────────────────

import { usePlayerStore, usePlayerName, usePlayerAge, usePlayerHealth, usePlayerMoney } from '@/features/player/usePlayerStore';
import { formatMoney } from '@/lib/utils';
import Link from 'next/link';

export default function GamePage() {
  const username = usePlayerName();
  const age      = usePlayerAge();
  const health   = usePlayerHealth();
  const money    = usePlayerMoney();
  const lifeLog  = usePlayerStore((s) => s.lifeLog);

  // If no player is loaded yet (e.g. direct URL access), redirect back to start
  if (!username) {
    return (
      <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 font-sans">
        <p className="text-slate-400 text-lg mb-6">No active game found.</p>
        <Link
          href="/"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all"
        >
          ← Start a New Life
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      {/* ── TASK 3 PLACEHOLDER ── */}
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🌱</div>
          <h1 className="text-2xl font-bold">Game Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Task 3 — Coming Soon</p>
        </div>

        {/* Zustand Store Verification Panel */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 space-y-3 mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
            ✅ Zustand Store — Populated Successfully
          </h2>
          <Row label="Name"   value={username} />
          <Row label="Age"    value={String(age)} />
          <Row label="Health" value={`${health}%`} />
          <Row label="Money"  value={formatMoney(money)} />
        </div>

        {/* Life Log Preview */}
        {lifeLog.length > 0 && (
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
              Life Log
            </h2>
            <ul className="space-y-2 text-sm">
              {lifeLog[0]?.events.map((event, i) => (
                <li key={i} className={event.color}>
                  {event.msg}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Link
          href="/"
          className="block text-center text-slate-500 hover:text-slate-300 text-sm mt-8 transition-colors"
        >
          ← Back to Start
        </Link>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
