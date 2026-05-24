'use client';
// ─────────────────────────────────────────────────────────────────────────────
// WHY 'use client'?
// This file uses Zustand's `create()` which relies on React hooks internally.
// React hooks require the browser environment (window, event loop, etc.).
// The 'use client' directive tells Next.js: "Do NOT run this file on the server."
// Without it: "Error: useState can only be used in a Client Component."
//
// Think of it as a border sign:
//   🖥️ SERVER (Node.js)  │  'use client'  │  🌐 BROWSER (Chrome/Firefox)
//   ────────────────────────────────────────────────────────────────────
//   DB queries, RSC      │  ← boundary    │  useState, Zustand, DOM
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { PlayerState, LifeEvent, defaultPlayerState } from '@/types/player';
import { clamp } from '@/lib/utils';
import { checkLifeStatus } from '@/lib/gameLogic';

// ─────────────────────────────────────────────────────────────────────────────
// STORE INTERFACE
// This extends PlayerState (the data shape) with ACTIONS (the mutations).
// COMPARISON vs. Vanilla JS:
//   Old: window.gameState.user.money -= 24000; window.renderLifeDashboard();
//   New: usePlayerStore.getState().updateMoney(-24000);
//        → UI updates automatically. No manual re-render call needed.
// ─────────────────────────────────────────────────────────────────────────────
interface PlayerStore extends PlayerState {
  // ─── LIFECYCLE ACTIONS ──────────────────────────────────────────────────
  /** Load a full player state from the database or localStorage. */
  setPlayer: (data: Partial<PlayerState>) => void;

  /** Wipe state back to defaults (New Game / Death reset). */
  resetPlayer: () => void;

  // ─── STAT MUTATIONS ─────────────────────────────────────────────────────
  /**
   * Add or subtract from the player's money.
   * @param delta Positive = earning, Negative = spending
   * @example updateMoney(-24000) // Pay living expenses
   * @example updateMoney(55000)  // Annual salary
   */
  updateMoney: (delta: number) => void;

  /**
   * Add or subtract from the player's health.
   * Automatically clamped to 0–100.
   * @param delta Negative = decay/illness, Positive = recovery
   */
  updateHealth: (delta: number) => void;

  /** Increment the player's age by 1. */
  ageUp: () => void;

  // ─── LOG ACTIONS ────────────────────────────────────────────────────────
  /**
   * Add a life event to the current year's log.
   * Replaces: window.addLog(msg, 'good') in the vanilla game.
   *
   * @param msg  The event description
   * @param type 'good' | 'bad' | 'neutral' — maps to a Tailwind color class
   */
  addLog: (msg: string, type?: 'good' | 'bad' | 'neutral') => void;

  // ─── FLAG SETTERS ───────────────────────────────────────────────────────
  setDead: (cause: string) => void;
  setJobInfo: (title: string, salary: number) => void;
  quitJob: () => void;
  setEducation: (updates: Partial<PlayerState>) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR MAP: Converts your old string-based system to explicit Tailwind classes
// Old: window.addLog("Born!", 'good')  → needed to know 'good' = 'text-green-400'
// New: This map enforces it at the type level and centralizes the mapping.
// ─────────────────────────────────────────────────────────────────────────────
const LOG_COLOR_MAP: Record<'good' | 'bad' | 'neutral', string> = {
  good: 'text-green-400',
  bad: 'text-red-400',
  neutral: 'text-gray-400',
};

// ─────────────────────────────────────────────────────────────────────────────
// THE STORE
// `devtools` middleware enables Redux DevTools browser extension:
//   → See every action fired and state before/after — impossible with window.gameState
// ─────────────────────────────────────────────────────────────────────────────
export const usePlayerStore = create<PlayerStore>()(
  devtools(
    (set, get) => ({
      // ───── INITIAL STATE ────────────────────────────────────────────────
      ...defaultPlayerState,

      // ───── LIFECYCLE ────────────────────────────────────────────────────
      setPlayer: (data) => set({ ...data }, false, 'player/setPlayer'),

      resetPlayer: () =>
        set({ ...defaultPlayerState }, false, 'player/resetPlayer'),

      // ───── STAT MUTATIONS ───────────────────────────────────────────────
      updateMoney: (delta) =>
        set(
          (state) => ({ money: state.money + delta }),
          false,
          'player/updateMoney'
        ),

      updateHealth: (delta) =>
        set(
          (state) => ({ health: clamp(state.health + delta, 0, 100) }),
          false,
          'player/updateHealth'
        ),

      ageUp: () =>
        set(
          (state) => ({ age: state.age + 1 }),
          false,
          'player/ageUp'
        ),

      // ───── LOG ──────────────────────────────────────────────────────────
      addLog: (msg, type = 'neutral') => {
        const color = LOG_COLOR_MAP[type];
        const event: LifeEvent = { msg, color };

        set(
          (state) => {
            const currentAge = state.age;
            const log = [...state.lifeLog];
            const lastEntry = log[log.length - 1];

            if (lastEntry && lastEntry.age === currentAge) {
              // Append to existing year's events
              return {
                lifeLog: [
                  ...log.slice(0, -1),
                  { ...lastEntry, events: [...lastEntry.events, event] },
                ],
              };
            } else {
              // Start a new year entry
              return {
                lifeLog: [...log, { age: currentAge, events: [event] }],
              };
            }
          },
          false,
          'player/addLog'
        );
      },

      // ───── FLAG SETTERS ─────────────────────────────────────────────────
      setDead: (cause) =>
        set(
          { isDead: true, lifeStatus: 'Deceased', deathCause: cause },
          false,
          'player/setDead'
        ),

      setJobInfo: (title, salary) =>
        set(
          (state) => {
            const nextState = { ...state, jobTitle: title, jobSalary: salary, jobPerformance: 50, hasJobWarning: false, hasSeenJobSalary: false };
            return { ...nextState, lifeStatus: checkLifeStatus(nextState) };
          },
          false,
          'player/setJobInfo'
        ),

      quitJob: () =>
        set(
          (state) => {
            const nextState = { ...state, jobTitle: '', jobSalary: 0, hasSeenJobSalary: false, jobPerformance: 50, hasJobWarning: false };
            return { ...nextState, lifeStatus: checkLifeStatus(nextState) };
          },
          false,
          'player/quitJob'
        ),

      setEducation: (updates) => 
        set(
          (state) => {
            const nextState = { ...state, ...updates };
            return { ...nextState, lifeStatus: checkLifeStatus(nextState) };
          },
          false,
          'player/setEducation'
        ),
    }),
    { name: 'PlayerStore' } // Label shown in Redux DevTools
  )
);

// ─────────────────────────────────────────────────────────────────────────────
// CONVENIENCE SELECTOR HOOKS
// These let components subscribe to only a SLICE of the store.
// If only `money` changes, only components using `usePlayerMoney()` re-render.
// Components using `usePlayerHealth()` stay frozen — maximum efficiency.
// ─────────────────────────────────────────────────────────────────────────────
export const usePlayerMoney = () => usePlayerStore((s) => s.money);
export const usePlayerHealth = () => usePlayerStore((s) => s.health);
export const usePlayerAge = () => usePlayerStore((s) => s.age);
export const usePlayerName = () => usePlayerStore((s) => s.username);
export const useLifeLog = () => usePlayerStore((s) => s.lifeLog);
export const useIsDead = () => usePlayerStore((s) => s.isDead);
