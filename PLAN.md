# Social System Overhaul: Romance, Marriage, Pregnancy, Kids & Legacy

## Context

The game's relationship system currently only supports family (generated once at birth), friends/enemies, and a rotating cast of classmates — there's no way to fall in love, marry, have kids, or pass the game on to the next generation. Digging into the code turned up something notable: the previous author already scaffolded for exactly this feature and never finished it. The `category` field is defensively checked against `'spouse'` and `'child'` in ~9 places across `relationshipScreen.js`/`funeralScreen.js`/`gameLogic.js`, and `mainScreen.js` already contains a fully-working "continue as your child after death" flow (`renderDeathScreen`/`continueAsChild`) that filters for `type === 'Son'/'Daughter'` — it just has nothing to filter, because nothing has ever created a relationship with those types. This overhaul is about filling in already-anticipated slots, not building from a blank slate.

Scope decisions already made with the user:
- **Opposite-sex pairings only** — no adoption system needed.
- **Lightweight dating** — romance reuses the existing friend/enemy status-meter interaction pattern (no browsable candidate pool, no compatibility scoring).
- **Pregnancy is fully abstracted** — conceive this year, baby appears as a new child relationship at the next age-up. The core yearly `ageUp()` loop structure is not touched.

The work is broken into 5 independently shippable chunks, ordered so each chunk is playable/demoable on its own before starting the next.

---

## Current State (verified against source)

- All NPCs (family/friends/enemies/classmates) live in one flat `user.relationships` array, disambiguated by `category` (`'family'|'friend'|'enemy'|'classmate'`, plus dead `'spouse'|'child'`) and `type` (`'Mother'|'Father'|'Brother'|'Sister'|'Friend'|'Enemy'|'Classmate'|'Teacher'`, plus dead `'Son'|'Daughter'`).
- Relationship object: `{ id, name, age, type, status (0-100), category, interactedThisYear, isCurrentClassmate?, health? (never actually set, always defaults to 100), deathCause?, inheritanceAmt? }`. No `gender` field exists on relationships today.
- `public/src/core/gameLogic.js` — pure logic: `checkMortality(age, health)` (`MORTALITY_RATES` bracket table, gameLogic.js:188-198), `calculateRelationshipDecay`, `checkRelationshipCategoryShift(category, status)` (gameLogic.js:434, exemption list `['family','spouse','child','classmate']`), `calculateInheritance(age, roll)` (gameLogic.js:448, only rolled for `type === 'Mother'/'Father'`), `generateSchoolCohort`, `attemptBefriend(status, isTeacher, roll)`.
- `public/src/features/relationships/relationshipScreen.js` — `renderRelationships()`, `renderPersonInteraction(id)`, `openRelationshipConfirm`, `performRelationshipAction`, `spendTimeWithAll`. **The interaction catalog (Spend Time/Give Money/Insult/Compliment/Call to Chat/Ask to be Friends) plus its age/affordability/hostility gating is duplicated verbatim 3x** across these functions (a 4th partial duplicate lives in `spendTimeWithAll`). Adding ~9 romance interactions on top without fixing this would triple the debt.
- `public/src/features/relationships/familyFactory.js` — `FamilyFactory.generateFamily(lastName)`, own `NAMES.MALE/FEMALE` arrays duplicated from `gameLogic.js`'s ungendered `FIRST_NAMES`/`LAST_NAMES`.
- `public/src/features/relationships/funeralScreen.js` — `isFamily = ['family','spouse','child'].includes(deceased.category)` (funeralScreen.js:25) already correctly routes spouse/child deaths through the rich family funeral flow — **works automatically** once such relationships exist. Inheritance roll is currently gated to `type === 'Mother'/'Father'` only (funeralScreen.js:29).
- `public/src/features/player/mainScreen.js` — `ageUp()` (mainScreen.js:19-59) calls, in order: `handleHealth`, `handleFinances`, `handleEducation`, `handleMarket`, `handleLifeEvents`, `handleRelationships(user)`, then `processNextFuneral()`. Verified directly: **`renderDeathScreen` (line 73) and `continueAsChild` (line 191) already fully implement "continue as your kid"** — filters `user.relationships` for `type === 'Son'/'Daughter'`, splits estate, offers a "Play as [child]" button, and fully reconstructs `state.gameState.user` from the chosen child. This needs zero changes — it will just start working the moment children with the correct `type` exist.
- `public/src/core/main.js` — verified: action dispatch is a flat `routeHandlers` object (main.js:738) checked by name in the click handler (main.js:836-838). Every new player-facing action must be imported into `main.js` and added to this object.
- Tests: `tests/gameLogic.test.js` covers the existing pure functions — new pure functions should get equivalent coverage.

---

## Chunk 0 — Foundational Refactor (no visible feature change)

Do this first so romance interactions don't triple the existing duplication.

1. **Consolidate the interaction catalog.** In `gameLogic.js`, add:
   - `RELATIONSHIP_INTERACTIONS` — single source-of-truth config array (key, name, icon, desc, cost, statusChange, minAgeSelf/Target, allowed categories, unlock thresholds) replacing the 3 duplicated arrays in `relationshipScreen.js`.
   - `getAvailableInteractions(person, user)` — pure function, filters the catalog for a given person/user pair.
   - `isInteractionBlocked(interactionKey, person, user)` — pure function returning `{blocked, reason}`, replacing the duplicated age/affordability/hostility checks.
   - `isHostile(person)` — extracted from the repeated `['family','spouse','child'].includes(category) ? status<15 : status<30` check, used by the above and by `spendTimeWithAll`.
   Rewire `renderPersonInteraction`, `openRelationshipConfirm`, `performRelationshipAction`, and `spendTimeWithAll` in `relationshipScreen.js` to use these instead of their local copies.
2. **Add `gender` to every relationship-creation site**: `familyFactory.js` (infer from role: Mother/Sister = female, Father/Brother = male), `generateSchoolCohort` (random per classmate/teacher). Existing saves without `gender` should be treated as romance-ineligible, not crash.
3. **Centralize gendered name pools**: merge `familyFactory.js`'s `NAMES.MALE/FEMALE` and `gameLogic.js`'s `FIRST_NAMES`/`LAST_NAMES` into `FIRST_NAMES_MALE`/`FIRST_NAMES_FEMALE`/`LAST_NAMES` living in `gameLogic.js`; have `familyFactory.js` import them instead of maintaining its own copy.
4. **Add `'partner'` and `'ex'` to the exemption list** in `checkRelationshipCategoryShift` (and the inline duplicate in `mainScreen.js`'s decay pass) — harmless now, required before Chunk 1 so an un-interacted dating partner never gets force-flipped to `'enemy'` by the generic yearly decay pass.

**Verify:** `npm test` passes unchanged; manually click through every existing interaction (Spend Time, Give Money, Insult, Compliment, Call to Chat, Ask to be Friends) and confirm identical behavior to before the refactor.

**Files:** `gameLogic.js`, `relationshipScreen.js`, `familyFactory.js`, `mainScreen.js` (exemption list only).

---

## Chunk 1 — Dating & Romance Progression (no marriage yet)

1. **New pure function** `generateStranger(userAge, userGender, roll)` in `gameLogic.js` — returns one relationship-shaped NPC, gender opposite of `userGender`, age band `userAge-3` to `userAge+5` (min 18), `category: 'friend'`, `status` 20-40.
2. **New "Go Out / Meet Someone" button** on `renderRelationships` (mirrors the existing "Spend Time With All" button), cost $50, gated by `user.age >= 16` and once/year via a new `user.hasMetSomeoneThisYear` flag (reset in `handleRelationships`, same pattern as `hasSpentTimeWithAll`).
3. **New catalog entries** in `RELATIONSHIP_INTERACTIONS`:
   - `ask_out` — category `friend`, opposite gender, status ≥ 40, no existing partner/spouse (monogamy gate below), age 16+. On confirm: `category → 'partner'`, `type → 'Boyfriend'/'Girlfriend'`.
   - `flirt` (+10 status), `go_on_date` ($100, +15 status), `make_love` (18+ both, flavor/status only — no pregnancy roll yet), `break_up` (→ `category:'ex'`, `type → 'Ex-Boyfriend'/'Ex-Girlfriend'`). All gated to `category === 'partner'`.
4. **Monogamy gate** (hard rule, not optional): before allowing `ask_out`, check `!user.relationships.some(r => r.category === 'partner' || r.category === 'spouse')`. Block with a clear message if already attached.
5. Add a "Romance" section to `renderRelationships` so dating partners are visible (currently the screen only groups family/friend/enemy).

**Verify:** age a fresh character to 16+, raise a friend/classmate to status ≥ 40, Ask Out, confirm Flirt/Go on a Date/Break Up apply the right cost/status, confirm an un-interacted partner's yearly decay never flips them to `enemy`, confirm the monogamy gate blocks a second Ask Out attempt.

**Files:** `gameLogic.js`, `relationshipScreen.js`.

---

## Chunk 2 — Marriage & Divorce

1. **New pure function** `calculateProposalAcceptance(status, roll)` in `gameLogic.js` — mirrors `attemptBefriend`'s "chance derived from status" pattern.
2. **New file** `public/src/features/relationships/romanceScreen.js` (mirrors `funeralScreen.js`'s structure) containing:
   - `propose(personId)` — gated to `type` Boyfriend/Girlfriend, status ≥ 75, cost $3000, 18+ both. Success → `type → 'Fiancé'/'Fiancée'`; failure → -15 status, stays dating.
   - `openWeddingPlanner()` / `confirmWeddingPlan(index)` — reuses the tiered-paid-choice modal pattern already proven in `funeralScreen.js`'s `chooseFuneralType`/`confirmFuneralPlan`. Suggested tiers: Courthouse ($200), Small Ceremony ($5,000), Big Wedding ($20,000), Destination Wedding ($50,000). On confirm: `category → 'spouse'`, `type → 'Husband'/'Wife'`.
   - `fileForDivorce(personId)` — simple `UI.showConfirm`, flat $5,000 legal fee + 50% split of `user.money` to the ex. On confirm: `category → 'ex'`, `type → 'Ex-Husband'/'Ex-Wife'`.
3. **Extend inheritance eligibility**: in `funeralScreen.js`, change the inheritance-roll condition from `type === 'Mother'/'Father'` to `['Mother','Father','Husband','Wife'].includes(type)` — a one-line change; everything downstream (`finishFuneralAndNext`) is already generic and needs no edits. Widowhood already routes correctly through the existing `isFamily` gate with zero other changes.
4. Wire `romanceScreen.js`'s new exports into `main.js`'s import list and `routeHandlers`.

**Verify:** progress a partner through Ask Out → Propose → Get Married → File for Divorce, confirming money/status changes at each step. Force (or wait out) a spouse's mortality roll and confirm the funeral screen shows the rich family-tier options and correctly rolls inheritance.

**Files:** new `romanceScreen.js`, `gameLogic.js`, `funeralScreen.js` (1 line), `main.js`.

---

## Chunk 3 — Pregnancy & Birth

1. **New fields on `user`**: `isExpecting` (bool), `expectingWithId` (relationship id of the other parent). Stored on `user`, not on the partner relationship, so the flag survives even if the partner relationship is later deleted (breakup/death) mid-pregnancy.
2. **New pure functions** in `gameLogic.js`: `calculatePregnancyChance(carryingParentAge, roll)` (age-scaled: 50% under 35, tapering to 2% by 45+), `getLastName(fullName)`, `getRandomFirstName(gender)`.
3. **New action** `tryForBaby(partnerId)` in `romanceScreen.js` — married-only, both 18+, not already expecting. `carryingParentAge` = `user.age` if `user.gender === 'female'`, else the spouse's age. Rolls `calculatePregnancyChance`; on success sets `user.isExpecting = true`.
4. **New subsystem** `handlePregnancy(user)` in `mainScreen.js`, added as a single new line in `ageUp()` immediately **after** `handleRelationships(user)` (so a newborn enters `user.relationships` too late to be double-aged/mortality-checked in its own birth year — it starts participating normally next `ageUp()`). This is additive only; it does not change the loop's cadence or structure.
   ```js
   handleRelationships(user);
   handlePregnancy(user);   // new
   ```
   On resolution: 50/50 gender roll, builds a `{ id, name, age: 0, type: 'Son'/'Daughter', gender, status: 100, category: 'child', interactedThisYear: false }` object, pushes to `user.relationships`, logs a birth message, clears `isExpecting`/`expectingWithId`.

**Verify:** married couple, both 18+, Try for a Baby until success, age up once (no baby yet), age up again and confirm a new `category:'child'` relationship appears at age 0, age up a third time and confirm the child ages to 1 without being touched by the friend/enemy category-shift logic.

**Files:** `gameLogic.js`, `mainScreen.js`, `romanceScreen.js`.

---

## Chunk 4 — Continue-as-Child Verification & Legacy Polish

No structural changes expected — `renderDeathScreen`/`continueAsChild` already work correctly once Chunk 3 produces properly-typed children. This chunk is primarily end-to-end verification, plus two optional polish items:

- **Optional:** reserve a spousal share of the estate in `renderDeathScreen` before splitting the remainder among children (currently a surviving spouse gets $0 of the player's own estate — a gap, since widowhood in the *other* direction, spouse-dies-first, is already handled correctly by Chunk 2's funeral changes).
- **Optional:** regenerate a small starting family when continuing as a child, since `continueAsChild` currently purges all relationships (existing intentional behavior per its code comment "prevent cyclical graphing" — the continuing child loses siblings and their other parent instantly).

**Verify (full regression):** play a life — date, marry, have 2 children, die — confirm both children surface as "Play as X" options with the correct inherited-money split, select one, and confirm the game continues playably as that child (correct name/age/gender/school enrollment).

**Files:** `mainScreen.js` (only if implementing the optional polish items).

---

## Optional Realism Additions (pick and choose later, not required)

- Random "It's Complicated" argument events for dating/married couples during the yearly decay pass.
- Miscarriage risk in `handlePregnancy`, mirroring the existing `MORTALITY_RATES` bracket style.
- Ongoing alimony/child-support deduction after divorce instead of (or alongside) the one-time asset split.
- Remarriage after divorce/widowhood needs no special code — the monogamy gate naturally reopens once a spouse relationship leaves `category:'spouse'`.
- Twins/multiple births — small chance in `handlePregnancy` to produce two children.
- "Love at first sight" — occasional high-status roll from `generateStranger` as a shortcut to `ask_out` eligibility.
- Age-appropriate flavor text (teen dating vs. adult wedding copy), matching the existing age-aware tone of `checkLifeStatus`.

---

## Suggested Order of Attack

Chunk 0 → 1 → 2 → 3 → 4, each verified end-to-end before starting the next. Chunk 0 is pure refactor (safe to do anytime, ideally first). Chunks 1-3 each add one complete, demoable capability (dating, marriage, kids). Chunk 4 is mostly confirming the dormant "continue as your kid" feature actually fires correctly now that it has real data to work with.
