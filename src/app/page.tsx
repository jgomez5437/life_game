// src/app/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Login Screen — entry point of the game.
// Replaces: public/screens/loginScreen.js
//
// WHY THIS IS A SERVER COMPONENT (no 'use client'):
//   This page has NO interactivity — it just renders two links/buttons.
//   Next.js renders it on the server as static HTML → fastest possible load.
//   Only the character creation page needs client-side state.
// ─────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start a Life',
  description: 'Live a customized life. Make choices. Leave a legacy.',
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      {/* Ambient glow backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-10" />
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full">
        {/* Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 rounded-full" />
          <div className="relative z-10 text-8xl animate-pulse select-none">🌎</div>
        </div>

        {/* Title */}
        <h1 className="text-5xl font-bold text-white mb-2 tracking-tight">
          Start a Life
        </h1>
        <p className="text-slate-400 text-lg mb-10 max-w-xs">
          Live a customized life. Make choices. Leave a legacy.
        </p>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {/*
            Cloud Save button — in a future task this will trigger Auth0 login.
            For now it links to character creation (same as guest) to keep the
            routing wired up and testable.
          */}
          <Link
            href="/character-creation"
            id="btn-cloud-login"
            className="flex w-full items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/50 transition-all duration-200"
          >
            <span>☁️</span>
            <span>Cloud Save / Login</span>
          </Link>

          <Link
            href="/character-creation"
            id="btn-guest"
            className="flex w-full items-center justify-center bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 font-bold py-4 rounded-xl border border-slate-700 transition-all duration-200"
          >
            Play as Guest
          </Link>
        </div>

        {/* Footer version */}
        <p className="mt-10 text-xs text-slate-600">
          v2.0.0 &bull; Built with Next.js 16 &bull; TypeScript &bull; Zustand
        </p>
      </div>
    </main>
  );
}
