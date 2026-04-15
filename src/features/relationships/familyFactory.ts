// src/features/relationships/familyFactory.ts
// ─────────────────────────────────────────────────────────────────────────────
// TypeScript port of public/familyFactory.js
//
// WHAT CHANGED vs. vanilla:
//   1. Returns `GeneratedFamily` (typed) instead of an untyped array
//   2. Uses `FamilyMember` interface — no more silent field mismatches
//   3. `bond` replaces `status` for cross-feature consistency
//   4. Returns parentage metadata so the caller doesn't re-scan the array
//   5. Pure function — no `window.*` references, fully unit-testable
// ─────────────────────────────────────────────────────────────────────────────

import { FamilyMember, GeneratedFamily } from '@/types/relationships';

// ── Static Name Dictionaries ──────────────────────────────────────────────────
// Future: Move to a JSON config for regional name variants
const NAMES = {
  MALE: [
    'James', 'John', 'Robert', 'Michael', 'William', 'David',
    'Richard', 'Joseph', 'Thomas', 'Charles', 'Daniel', 'Matthew',
    'Anthony', 'Mark', 'Donald', 'Steven', 'Paul', 'Andrew', 'Joshua', 'Kenneth',
  ],
  FEMALE: [
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara',
    'Susan', 'Jessica', 'Sarah', 'Karen', 'Nancy', 'Lisa',
    'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
  ],
} as const;

// ── Pure Helpers ──────────────────────────────────────────────────────────────
function getInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getName(gender: 'MALE' | 'FEMALE'): string {
  const pool = NAMES[gender];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'rel_' + Date.now() + Math.random().toString(36).substring(2, 9);
}

// ── Main Export ───────────────────────────────────────────────────────────────

/**
 * Generates a random starting family for a new character.
 * Probability distribution matches vanilla familyFactory.js exactly:
 *   - 75%: Both parents
 *   - 15%: Single mother
 *   -  5%: Single father
 *   -  5%: Orphan (no parents)
 *
 * @param lastName - Player's last name, shared with family members
 * @returns GeneratedFamily with typed members array + parentage metadata
 */
export function generateFamily(lastName: string): GeneratedFamily {
  const members: FamilyMember[] = [];
  let hasMother = false;
  let hasFather = false;

  // ── Parent Generation ─────────────────────────────────────────────────────
  const parentRoll = Math.random();

  if (parentRoll < 0.75) {
    hasMother = true;
    hasFather = true;       // 75%: Both parents
  } else if (parentRoll < 0.90) {
    hasMother = true;       // 15%: Single mother
  } else if (parentRoll < 0.95) {
    hasFather = true;       // 5%:  Single father
  }
  // Remaining 5%: Orphan — both stay false

  if (hasMother) {
    members.push({
      id: getUUID(),
      name: `${getName('FEMALE')} ${lastName}`,
      age: getInt(18, 45),
      type: 'Mother',         // ← TypeScript enforces exact casing here
      bond: getInt(70, 100),
      category: 'family',
    });
  }

  if (hasFather) {
    members.push({
      id: getUUID(),
      name: `${getName('MALE')} ${lastName}`,
      age: getInt(18, 50),
      type: 'Father',         // ← TypeScript enforces exact casing here
      bond: getInt(70, 100),
      category: 'family',
    });
  }

  // ── Sibling Generation ────────────────────────────────────────────────────
  // Requires at least one known parent
  let siblingCount = 0;

  if (hasMother || hasFather) {
    const siblingRoll = Math.random();

    if (siblingRoll < 0.40) siblingCount = 1;       // 40% chance of 1 sibling
    else if (siblingRoll < 0.60) siblingCount = 2;  // 20% chance of 2 siblings
    else if (siblingRoll < 0.70) siblingCount = 3;  // 10% chance of 3 siblings
    // Base case: 30% chance of 0 siblings

    for (let i = 0; i < siblingCount; i++) {
      const isMale = Math.random() > 0.5;
      members.push({
        id: getUUID(),
        name: `${getName(isMale ? 'MALE' : 'FEMALE')} ${lastName}`,
        age: getInt(1, 15),
        type: isMale ? 'Brother' : 'Sister',         // ← Union type, both valid
        bond: getInt(50, 100),
        category: 'family',
      });
    }
  }

  return { members, hasMother, hasFather, siblingCount };
}
