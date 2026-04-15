// src/types/relationships.ts
// ─────────────────────────────────────────────────────────────────────────────
// TypeScript interfaces for all relationship/family data.
// Replaces the untyped objects from vanilla familyFactory.js
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SHAPE: One person in the player's starting family (generated at char creation).
 *
 * WHY THE UNION TYPE ON `type` MATTERS:
 *   Vanilla JS, familyFactory.js line 39:  type: 'Mother'
 *   Vanilla JS, charCreationScreen.js line 126: rels.find(r => r.type === 'Mother')
 *
 *   Bug scenario: A developer changes 'Mother' to 'mother' in the factory.
 *   Result: `find()` returns undefined → `mother.name` → runtime crash.
 *
 *   TypeScript fix: `'mother'` is not assignable to `'Mother' | 'Father' | ...`
 *   The compile error appears the moment you type the wrong case.
 *
 * WHY `bond` INSTEAD OF `status`:
 *   The vanilla code used `status` in FamilyFactory but `bond` semantically
 *   in relationship screens. Unifying to `bond` means one source of truth —
 *   no silent mismatch when a component reads `.bond` on a `FamilyMember`.
 */
export interface FamilyMember {
  id: string;
  name: string;
  age: number;
  /** Strict union prevents case-typo bugs that cause silent `undefined` crashes. */
  type: 'Mother' | 'Father' | 'Brother' | 'Sister';
  bond: number;        // 0–100. Was `status` in vanilla — renamed for consistency
  category: 'family';
}

/**
 * Result shape returned by `generateFamily()`.
 * The optional parentage booleans let the caller log birth context
 * without re-scanning the array.
 */
export interface GeneratedFamily {
  members: FamilyMember[];
  hasMother: boolean;
  hasFather: boolean;
  siblingCount: number;
}
