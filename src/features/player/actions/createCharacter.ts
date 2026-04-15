// src/features/player/actions/createCharacter.ts
// ─────────────────────────────────────────────────────────────────────────────
// The isolated async logic extracted from vanilla submitCharacter().
//
// OLD DESIGN (charCreationScreen.js line 52):
//   One 100-line function handling: auth check + DOM read + validation +
//   API call + family gen + state mutation + UI render.
//   → Can't test any part without the entire browser environment.
//
// NEW DESIGN:
//   This file handles ONLY: validate + family gen + API + store init.
//   The React component handles ONLY: UI state + calling this function.
//   → Each piece is independently testable and readable.
// ─────────────────────────────────────────────────────────────────────────────

import { generateFamily } from '@/features/relationships/familyFactory';
import { usePlayerStore } from '@/features/player/usePlayerStore';
import { defaultPlayerState, Relationship } from '@/types/player';
import { FamilyMember } from '@/types/relationships';

// ── Type Mapping: FamilyMember → Relationship ────────────────────────────────
// WHY TWO TYPES EXIST:
//   FamilyMember uses proper-noun labels ('Mother','Father') so factory log
//   messages can say "Born to your Mother, Sarah" with correct context.
//
//   Relationship uses semantic categories ('parent','sibling') so game mechanics
//   can ask "does the player have any living parents?" with a generic query.
//
// This mapper is the "Anti-Corruption Layer" — it translates at the boundary
// so each type stays clean for its own purpose.
const FAMILY_TYPE_MAP: Record<FamilyMember['type'], Relationship['type']> = {
  Mother:  'parent',
  Father:  'parent',
  Brother: 'sibling',
  Sister:  'sibling',
};

function familyToRelationships(members: FamilyMember[]): Relationship[] {
  return members.map((m) => ({
    id:   m.id,
    name: m.name,
    age:  m.age,
    type: FAMILY_TYPE_MAP[m.type],
    bond: m.bond,
  }));
}

// ── Name Validation ────────────────────────────────────────────────────────
// Port of public/gameLogic.js `sanitizeName()` — extracted as a pure function.
// Returns typed result instead of { isValid, error, cleanedName } plain object.

export interface ValidationResult {
  isValid: true;
  cleanedName: string;
  lastName: string;
}

export interface ValidationError {
  isValid: false;
  error: string;
}

export function sanitizeName(rawInput: string): ValidationResult | ValidationError {
  if (!rawInput || typeof rawInput !== 'string') {
    return { isValid: false, error: 'Name cannot be empty.' };
  }

  const cleanedName = rawInput.trim().replace(/\s+/g, ' ');
  const nameParts = cleanedName.split(' ');

  if (nameParts.length < 2) {
    return { isValid: false, error: 'You must enter both a first and last name.' };
  }

  if (cleanedName.length > 25) {
    return { isValid: false, error: 'Keep the name to 25 characters or less.' };
  }

  const validFormatRegex = /^[A-Za-z]+(?:[- ][A-Za-z]+)*$/;
  if (!validFormatRegex.test(cleanedName)) {
    return {
      isValid: false,
      error: 'Name can only contain letters, spaces, and single hyphens.',
    };
  }

  const lastName = nameParts[nameParts.length - 1];
  return { isValid: true, cleanedName, lastName };
}

// ── Create Character Action ────────────────────────────────────────────────

export interface CreateCharacterInput {
  name: string;
  gender: 'male' | 'female';
  city: string;
  isGuest: boolean;
  /** Auth0 user if logged in, undefined for guest */
  authUser?: { sub: string; email: string };
}

export type CreateCharacterResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Orchestrates the full character creation pipeline:
 * 1. Validate name
 * 2. Generate starting family
 * 3. Call API (authenticated) or skip (guest)
 * 4. Initialize Zustand store
 * 5. Return success/failure — UI handles the redirect
 *
 * This replaces submitCharacter() from charCreationScreen.js
 */
export async function createCharacter(
  input: CreateCharacterInput
): Promise<CreateCharacterResult> {
  // ── Step 1: Validate Name ───────────────────────────────────────────────
  const validation = sanitizeName(input.name);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }

  const { cleanedName, lastName } = validation;

  // ── Step 2: Generate Family ─────────────────────────────────────────────
  const { members, hasMother, hasFather, siblingCount } = generateFamily(lastName);

  // ── Step 3: API Call (authenticated users only) ─────────────────────────
  try {
    if (!input.isGuest && input.authUser) {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auth0_id: input.authUser.sub,
          email: input.authUser.email,
          username: cleanedName,
          gender: input.gender,
          city: input.city,
          relationships: members,
        }),
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to save character. Please try again.' };
      }
    }

    // ── Step 4: Initialize Zustand Store ──────────────────────────────────
    // Replaces: window.loadAndRenderGame(userData) and window.updateGameInfo(dbUser)
    const { setPlayer, addLog } = usePlayerStore.getState();

    setPlayer({
      ...defaultPlayerState,
      username: cleanedName,
      gender: input.gender,
      city: input.city,
      relationships: familyToRelationships(members),
      lifeLog: [],
    });

    // ── Step 5: Birth Log Entries ─────────────────────────────────────────
    // Replaces the parentage log block in charCreationScreen.js lines 124–142
    const mother = members.find((r) => r.type === 'Mother');
    const father = members.find((r) => r.type === 'Father');

    if (mother && father) {
      addLog(
        `You were born to ${mother.name} (Age ${mother.age}) and ${father.name} (Age ${father.age}).`,
        'neutral'
      );
    } else if (mother) {
      addLog(`You were born to a single mother, ${mother.name} (Age ${mother.age}).`, 'neutral');
    } else if (father) {
      addLog(`You were born to a single father, ${father.name} (Age ${father.age}).`, 'neutral');
    } else {
      addLog('You were born an orphan with no known parents.', 'bad');
    }

    if (siblingCount > 0) {
      addLog(`You have ${siblingCount} older sibling${siblingCount > 1 ? 's' : ''}.`, 'neutral');
    }

    addLog(`Born in ${input.city}. Welcome to the world!`, 'good');

    return { success: true };
  } catch (error) {
    console.error('Character creation failed:', error);
    return { success: false, error: 'An unexpected error occurred. Please try again.' };
  }
}
