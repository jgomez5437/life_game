// src/types/player.ts
// ─────────────────────────────────────────────────────────────────────────────
// This file is the "contract" for all player data in the game.
// Every TypeScript error caught here is a runtime crash prevented.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SHAPE: A single item a player owns.
 *
 * Why `category` is a Union Type, not just `string`:
 *   - In vanilla JS: `asset.category === 'vehicel'` (typo) silently fails
 *   - In TypeScript: `'vehicel'` is NOT assignable to `'vehicle' | 'property' | 'investment'`
 *     → Compile error catches the bug before it ships.
 */
export interface Asset {
  id: string;
  name: string;
  category: 'vehicle' | 'property' | 'investment';
  type?: string; // e.g. sedan, suv, etc.
  value: number;
  condition: number; // 0–100 percent
  purchasePrice?: number;
}

/**
 * SHAPE: A person in the player's life.
 *
 * Why `bond` is typed as `number` (not string):
 *   - Old JS: `window.gameState.user.relationships[0].bond = "100"` (string from DOM input)
 *     causes `bond + 5 = "1005"` (string concatenation, not addition).
 *   - TypeScript: assigning `"100"` to `bond: number` is a compile error.
 */
export interface Relationship {
  id: string;
  name: string;
  category: 'family' | 'spouse' | 'child' | 'friend' | 'enemy';
  type: string; // e.g., 'Mother', 'Father', 'Enemy', 'Friend'
  bond: number; // 0–100
  age?: number;
}

/**
 * SHAPE: A single event in the player's life story.
 */
export interface LifeEvent {
  msg: string;
  color: string; // Tailwind class e.g. "text-green-400"
}

/**
 * SHAPE: One year's worth of life events.
 */
export interface LifeLogEntry {
  age: number;
  events: LifeEvent[];
}

/**
 * SHAPE: A business owned by the player.
 */
export interface BusinessState {
  industry: string;
  supplier: string;
  productPrice: number;
  marketingBudget: number;
  employeePay: number;
  revenue: number;
  expenses: number;
  cash: number;
  customers: number;
}

/**
 * THE MASTER SHAPE: The complete state of a player at any moment in time.
 *
 * Why this replaces `window.gameState`:
 *   - `window.gameState` is typed as `any` — TypeScript cannot help you at all.
 *   - Every field here is EXPLICIT and REQUIRED (unless marked with `?`).
 *   - If you add a new field to this interface but forget to add it to the
 *     Zustand store's initial state, TypeScript gives you a compile error
 *     rather than a silent `undefined` at runtime.
 */
export interface PlayerState {
  // ─── IDENTITY ───────────────────────────────────────────────────────────
  username: string;
  /**
   * Why `'male' | 'female'` not `string`:
   *   - Prevents `gender = "Male"` (capital M) breaking a switch-case comparison
   */
  gender: 'male' | 'female';
  city: string;

  // ─── CORE STATS ─────────────────────────────────────────────────────────
  age: number;
  health: number;   // 0–100. Below 0 → player is clinically dead
  money: number;    // Can be negative (debt). Not `string`!
  lifeStatus: string;
  isDead: boolean;
  deathCause?: string;

  // ─── EDUCATION (Undergrad) ───────────────────────────────────────────────
  isStudent: boolean;
  universityEnrolled: boolean;
  universitySchoolYear: number;
  universityGraduated: boolean;
  major: string;
  schoolActions: number;
  schoolPerformance: number;  // 0–100
  highSchoolRetained: boolean;

  // ─── EDUCATION (Grad School) ─────────────────────────────────────────────
  gradSchoolEnrolled: boolean;
  /**
   * Why `string | null` not just `string`:
   *   - When not enrolled, this MUST be null (not "" which is truthy in some checks)
   *   - Forces every consumer to write: `if (gradSchoolType !== null)` before using it
   *   - Prevents `null.includes("Medical")` runtime crashes
   */
  gradSchoolType: string | null;
  gradSchoolYear: number;
  gradSchoolDegree: string | null;
  parentsTried: boolean;
  scholarshipTried: boolean;

  // ─── CAREER & FINANCE ────────────────────────────────────────────────────
  jobTitle?: string;
  jobSalary?: number;
  jobPerformance: number;
  jobActions: number;
  hasJobWarning: boolean;
  hasSeenJobSalary?: boolean;
  monthlyOutflow: number;
  studentLoans: number;
  monthlyLivingExpense: number;
  hasSeenExpenseMsg: boolean;

  // ─── BUSINESS ────────────────────────────────────────────────────────────
  hasBusiness: boolean;
  companyName: string | null;
  ceoSalary: number;
  business: BusinessState | null;

  // ─── COLLECTIONS ─────────────────────────────────────────────────────────
  assets: Asset[];
  relationships: Relationship[];

  // ─── LIFE LOG ────────────────────────────────────────────────────────────
  lifeLog: LifeLogEntry[];
}

/**
 * The initial/default state for a brand new player.
 * This is the TypeScript-safe equivalent of the old `window.loadAndRenderGame()` defaults.
 */
export const defaultPlayerState: PlayerState = {
  username: '',
  gender: 'male',
  city: 'New York',
  age: 0,
  health: 100,
  money: 0,
  lifeStatus: 'Baby',
  isDead: false,
  deathCause: undefined,

  isStudent: false,
  universityEnrolled: false,
  universitySchoolYear: 0,
  universityGraduated: false,
  major: '',
  schoolActions: 0,
  schoolPerformance: 50,
  highSchoolRetained: false,

  gradSchoolEnrolled: false,
  gradSchoolType: null,
  gradSchoolYear: 0,
  gradSchoolDegree: null,
  parentsTried: false,
  scholarshipTried: false,

  jobTitle: '',
  jobSalary: 0,
  jobPerformance: 50,
  jobActions: 0,
  hasJobWarning: false,
  monthlyOutflow: 0,
  studentLoans: 0,
  monthlyLivingExpense: 0,
  hasSeenExpenseMsg: false,
  hasSeenJobSalary: false,

  hasBusiness: false,
  companyName: null,
  ceoSalary: 0,
  business: null,

  assets: [],
  relationships: [],
  lifeLog: [],
};
