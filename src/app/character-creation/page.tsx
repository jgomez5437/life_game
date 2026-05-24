'use client';
// src/app/character-creation/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// The Character Creation Screen — React port of charCreationScreen.js
//
// WHY 'use client':
//   This component uses useState (for form fields, errors, loading),
//   useRouter (for navigation after submit), and calls the Zustand store.
//   All of these require the browser environment → 'use client' required.
//
// KEY CHANGES vs. vanilla charCreationScreen.js:
//   1. selectedGender: was a module-level `let` → now `useState` (scoped, safe)
//   2. UI sync: was manual className surgery → now derived from state
//   3. Source of truth: was the DOM → now React controlled inputs
//   4. Submit logic: was a 100-line god function → calls `createCharacter()` action
//   5. Error display: was window.UI.showModal() → inline <ErrorMessage />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';

import ErrorMessage from '@/components/ui/ErrorMessage';
import { createCharacter } from '@/features/player/actions/createCharacter';
import { useUser } from '@auth0/nextjs-auth0/client';
import { usePlayerStore } from '@/features/player/usePlayerStore';

// ── Constants ─────────────────────────────────────────────────────────────────
// Migrated verbatim from charCreationScreen.js line 3
const CITIES = [
  'New York', 'Los Angeles', 'San Francisco', 'Houston', 'Miami', 'Tucson',
  'London', 'Osaka', 'Tokyo', 'Berlin', 'Madrid', 'Bandar Seri Begawan',
  'Paris', 'Beijing', 'Toronto', 'Mexico City', 'Cairo',
];

// ── Styles ────────────────────────────────────────────────────────────────────
// Centralising the active/inactive button styles removes the manual DOM surgery.
// Old: get('btn-male').className = "p-3 rounded border border-blue-500..."
// New: className={gender === 'male' ? MALE_ACTIVE : GENDER_INACTIVE}
const MALE_ACTIVE   = 'p-3 rounded-lg border-2 border-blue-500 bg-blue-900/30 text-blue-200 font-semibold transition-all duration-200';
const FEMALE_ACTIVE = 'p-3 rounded-lg border-2 border-pink-500 bg-pink-900/30 text-pink-200 font-semibold transition-all duration-200';
const GENDER_INACTIVE = 'p-3 rounded-lg border-2 border-slate-600 bg-slate-900 text-slate-400 font-semibold hover:border-slate-500 transition-all duration-200';

// ── Component ─────────────────────────────────────────────────────────────────

export default function CharacterCreationPage() {
  const router = useRouter();

  // ─── Form State ─────────────────────────────────────────────────────────
  // Replaces: let selectedGender = 'male' (module-level) + DOM reads
  // These are the SINGLE SOURCE OF TRUTH — not the DOM.
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [city, setCity] = useState(CITIES[0]);

  // ─── UI State ───────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoading: authLoading } = useUser();

  // ─── Check for Existing Save ─────────────────────────────────────────────
  // If the user just logged in via Auth0, check if they already have a save.
  // If so, load it and redirect them straight to the game!
  useEffect(() => {
    if (user && user.sub) {
      setIsLoading(true);
      fetch(`/api/load?auth0_id=${user.sub}`)
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('No save found');
        })
        .then(data => {
          if (data && data.game_data) {
            usePlayerStore.getState().setPlayer(data.game_data);
            router.push('/game');
          } else {
            setIsLoading(false);
          }
        })
        .catch(() => {
          setIsLoading(false);
        });
    }
  }, [user, router]);

  // ─── Submit Handler ──────────────────────────────────────────────────────
  // Replaces: async function submitCharacter() in charCreationScreen.js
  // This handler is thin — it delegates all logic to the `createCharacter` action.
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await createCharacter({
      name,
      gender,
      city,
      isGuest: !user,
      authUser: user && user.sub && user.email ? { sub: user.sub, email: user.email } : undefined,
    });

    if (!result.success) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // Success → navigate to the game dashboard
    // The Zustand store is already populated by createCharacter()
    router.push('/game');
  }

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      {/* Back button */}
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1 transition-colors"
        >
          ← Back
        </Link>
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-green-600 rounded-full blur-[100px] opacity-10" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 select-none">👶</div>
          <h1 className="text-3xl font-bold text-white">New Life</h1>
          <p className="text-slate-400 mt-1">Design your destiny.</p>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-5"
        >
          {/* Name Input — CONTROLLED COMPONENT */}
          {/* Old: DOM read → get('inp-name').value */}
          {/* New: controlled → `name` state variable */}
          <div>
            <label
              htmlFor="inp-name"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              Full Name
            </label>
            <input
              id="inp-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null); // Clear error on typing
              }}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors"
              placeholder="First and Last Name"
              maxLength={30}
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Gender Toggle — DECLARATIVE */}
          {/* Old: manual className surgery in selectGender() per button */}
          {/* New: className derived from state — one conditional per button */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-male"
                type="button"
                onClick={() => setGender('male')}
                className={gender === 'male' ? MALE_ACTIVE : GENDER_INACTIVE}
              >
                ♂ Male
              </button>
              <button
                id="btn-female"
                type="button"
                onClick={() => setGender('female')}
                className={gender === 'female' ? FEMALE_ACTIVE : GENDER_INACTIVE}
              >
                ♀ Female
              </button>
            </div>
          </div>

          {/* City Select — CONTROLLED COMPONENT */}
          {/* Old: DOM read → get('inp-city').value */}
          {/* New: controlled → `city` state variable */}
          <div>
            <label
              htmlFor="inp-city"
              className="block text-sm font-medium text-slate-400 mb-2"
            >
              Birth City
            </label>
            <select
              id="inp-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors cursor-pointer"
            >
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Inline Error — replaces window.UI.showModal("Wait", error) */}
          <ErrorMessage message={error} />

          {/* Submit Button */}
          <button
            id="btn-start-life"
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-lg transition-all duration-200 shadow-lg shadow-green-900/30 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Creating your life...
              </span>
            ) : (
              '🌱 Start Life'
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
