# AGENTS.md — AI Agent Navigation & Architecture Index

This document is the primary architectural map for AI coding agents working in **Start a Life** (`life_game`). Read this file first to jump directly to the exact module, state property, or test file you need without broad `grep` scans or multi-page file reads.

---

## 1. Fast Commands & Targeted Testing

Avoid running the entire 55-file Jest suite during iterative debugging—run only the targeted test file:

```bash
# Run a single test file (fastest, minimal context output)
node --experimental-vm-modules node_modules/jest/bin/jest.js tests/core/gameLogic.test.js

# Run tests by layer
npm run test:api        # Serverless API & Stripe/Auth validation tests
npm run test:core       # Core game logic, state, persistence & events
npm run test:features   # Feature screens & domain mechanics
npm run test:ui         # Avatar SVG, modal system, themes & navigation

# Full suite & production build check
npm test
npm run build
```

---

## 2. Domain-to-File Routing Map

> **Barrel Compatibility Rule**: [`public/src/core/gameLogic.js`](file:///home/antigravity/jgomez5437/life_game/public/src/core/gameLogic.js) and [`public/src/core/eventManager.js`](file:///home/antigravity/jgomez5437/life_game/public/src/core/eventManager.js) act as backward-compatible barrels re-exporting `GameLogic` and `LIFE_EVENTS` / `EventManager`. When reading or editing domain logic, open the specific sub-module under `public/src/core/logic/` or `public/src/core/events/` rather than paging through the barrel.

| Domain / System | Pure Logic (`public/src/core/...`) | UI Screens & Modals (`public/src/...`) | Unit Tests (`tests/...`) |
| :--- | :--- | :--- | :--- |
| **Player Stats, City CoL & Suggestions** | `logic/playerStatsLogic.js` (via `gameLogic.js`), `recommendations.js` | `features/player/charCreationScreen.js`, `features/player/playerOverviewScreen.js` | `core/smartsAndLooks.test.js`, `core/citySalaryScaling.test.js`, `core/recommendations.test.js` |
| **Age-Up Turn Loop & Death / Eulogy** | `logic/healthMortalityLogic.js`, `eulogyGenerator.js` | `features/player/mainScreen.js` (`ageUpHandlers.js`), `features/player/graveyardScreen.js` | `core/ageUpPersistence.test.js`, `core/deathStatePersistenceAndRefresh.test.js`, `core/eulogyGenerator.test.js`, `features/player/graveyard.test.js` |
| **Education, Degrees & Student Loans** | `logic/educationLogic.js` (re-exported via `logic/educationSkillsLogic.js`), `constants.js` (`MAJORS`, `GRAD_SCHOOLS`) | `features/education/manageEducationScreen.js`, `features/education/instantDiploma.js`, `features/career/occupationScreen.js` | `features/education/educationMilestones.test.js`, `features/education/instantDiploma.test.js`, `features/player/studentLoans.test.js` |
| **Skills & Musical Instruments** | `logic/educationSkillsLogic.js`, `constants.js` (`SKILL_TRACKS`) | `features/more/skillsScreen.js` | `features/more/skillsSystem.test.js` |
| **Corporate Careers & Part-Time Jobs** | `logic/businessFinanceLogic.js` (`calculatePromotionChance`), `constants.js` (`CAREER_TRACKS`, `PART_TIME_JOBS`) | `features/career/careerJobsScreen.js`, `features/career/jobCareerManagerScreen.js`, `features/career/partTimeJobsScreen.js` | `features/career/specialCareersAndMafia.test.js` |
| **Pro Athlete, Actor, Musician & Mafia** | `logic/athleteCareerLogic.js`, `logic/crimePrisonLogic.js` (`processMafiaCrime`), `constants.js` (`PRO_SPORTS_LEAGUES`, `SPECIAL_CAREER_TRACKS`) | `features/career/careerJobsScreen.js`, `features/career/jobCareerManagerScreen.js` | `features/career/athleteCareer.test.js`, `features/career/specialCareersAndMafia.test.js` |
| **Startup / Business Simulator** | `logic/businessFinanceLogic.js`, `features/business/businessTypes.js`, `constants.js` (`INDUSTRIES`, `SUPPLIERS`) | `features/business/businessDashboard.js` (`businessTabsRenderer.js`), `features/business/createBusinessScreen.js` | `features/business/businessOverhaul.test.js`, `features/business/businessValuationCap.test.js` |
| **Taxes, Cashflow & Net Worth** | `logic/cashflowTaxLogic.js` (re-exported via `logic/businessFinanceLogic.js`) | `features/player/playerOverviewScreen.js`, `features/player/desktopPanels.js` | `features/player/cashflowModal.test.js`, `core/statSynchronizationAndDeductions.test.js` |
| **Real Estate, Mortgages & Landlord** | `logic/realEstateLandlordLogic.js`, `logic/landlordTenantLogic.js` | `features/assets/assetsScreen.js` (`assetsPropertySalesModals.js`, `assetsLandlordModals.js`), `features/assets/goShoppingScreen.js` | `features/assets/propertyManager.test.js`, `core/gameLogicRealEstate.test.js` |
| **Vehicles, Auto Loans & Jewelry** | `logic/vehiclesJewelryLogic.js` | `features/assets/assetsScreen.js` (`assetsVehicleJewelryModals.js`), `features/assets/goShoppingScreen.js` | `core/gameLogicVehiclesAndLifestyle.test.js` |
| **Stocks, Crypto & High-Yield Savings** | `logic/investmentsLogic.js` | `features/assets/investmentsScreen.js` | `core/gameLogic.test.js` |
| **Relationships, Dating, Marriage & Wills** | `logic/relationshipsNpcLogic.js`, `logic/npcGeneratorLogic.js`, `features/relationships/familyFactory.js` | `features/relationships/relationshipScreen.js` (`meetPeopleModals.js`, `intimacyInfidelityModals.js`), `features/relationships/romanceScreen.js`, `features/relationships/funeralScreen.js` | `core/gameLogicRelationships.test.js`, `features/relationships/relationships.test.js`, `features/relationships/funeralScreen.test.js`, `core/inheritance.test.js` |
| **Health, Diets, Clinic & Diseases** | `logic/healthMortalityLogic.js`, `logic/diseasesLogic.js` | `features/more/moreScreen.js` (`moreActivitiesModals.js`) | `core/diseases.test.js`, `core/gameLogic.test.js` |
| **Casino, Lottery, Travel & Relocation** | `logic/casinoLotteryLogic.js`, `logic/relationshipsNpcLogic.js` (`moveCountry`) | `features/more/casinoScreen.js`, `features/more/moreScreen.js` | `core/gameLogicVehiclesAndLifestyle.test.js`, `features/more/casinoDebounce.test.js`, `features/more/casinoExit.test.js` |
| **Crime, Arrest, Court Trials & Prison** | `logic/crimePrisonLogic.js`, `logic/prisonSimulationLogic.js` | `features/more/crimeScreen.js`, `features/more/prisonScreen.js` (`prisonTabsRenderer.js`, `prisonContrabandCombatModals.js`) | `features/more/crimeSystem.test.js`, `features/more/crimeScreen.test.js`, `features/more/prison.test.js` |
| **Random Life Events Engine** | `eventManager.js` + `events/{eventHelpers,youthSchoolEvents,familyRelationshipEvents,careerBusinessEvents,lifestyleAssetEvents}.js` | `features/life/lifeEventModal.js` | `core/eventManager.test.js` |
| **Avatar Phenotypes & Vector SVG** | `avatarLogic.js` | `ui/avatarRenderer.js` (`ui/avatarHairRenderer.js`), `features/store/godModeAvatarEditor.js` | `core/avatarLogic.test.js`, `ui/avatarRenderer.test.js` |
| **Store, God Mode, VIP & Stripe** | `state.js` (`hasPurchasedPack`, `setVerifiedPurchases`), `adManager.js` | `features/store/storeScreen.js`, `features/store/vipLounge.js`, `api/create-checkout-session.js`, `api/stripe-webhook.js`, `api/verify-checkout-session.js` | `features/store/store.test.js`, `features/store/godModeEntitlements.test.js`, `features/store/vipSupporter.test.js`, `api/stripeCheckout.test.js` |
| **Save Slots, Time Machine & Cloud Sync** | `saveSlotManager.js` (`stateMigration.js`), `timeMachine.js`, `main.js` (`cloudSync.js`, `actionRouter.js`, `lazyActions.js`) | `auth/auth.js`, `auth/loginScreen.js`, `api/saveGame.js`, `api/load.js`, `api/login.js`, `api/lib/validation.js` | `core/timeMachineAndSaveSlots.test.js`, `core/cloudSaveSyncRace.test.js`, `core/cloudGuestConflictResolution.test.js`, `api/saveGameValidation.test.js` |

---

## 3. Core Architecture & Control Flow

### 3.1 Single Source of Truth (`public/src/core/state.js`)
- `state.gameState` holds the active game payload:
  - `state.gameState.user`: Active player object (`name`, `age`, `gender`, `country`, `city`, `money`, `health`, `happiness`, `smarts`, `looks`, `isAlive`, `causeOfDeath`, `jobTitle`, `salary`, `careerTrack`, `careerLevel`, `partTimeJob`, `school`, `enrolledSchoolYears`, `currentSchoolYear`, `major`, `gradSchool`, `educationDegrees`, `studentLoan`, `assets`, `relationships`, `skills`, `diseases`, `investments`, `savingsBalance`, `business`, `prison`, `athleteCareer`, `purchases`, `lifeEventFlags`, etc.).
  - `state.gameState.lifeLog`: Array of `{ age, events: [{ msg, color }] }` entries mutated via `addLog(msg, type)`.
  - `state.gameState.pendingEvents` & `state.gameState.completedEventsHistory`: Managed by `EventManager`.
  - `state.gameState.graveyard`: Array of ancestor summaries for past lives.
- **Purchase Entitlement Security**: Always check `hasPurchasedPack(packId)` from [`state.js`](file:///home/antigravity/jgomez5437/life_game/public/src/core/state.js). Never trust legacy flags like `user.godMode` or `gameState.purchasedPacks`.

### 3.2 Declarative Event Delegation & Lazy Loading
1. **No Inline Handlers**: UI HTML templates must never use `onclick="..."`. Always use `data-action="actionName"` and optional JSON `data-args='{"id": 123}'` (or `data-id`, `data-type`, etc.).
2. **Module Preloading (`public/src/core/moduleLoader.js`)**:
   - `MODULE_REGISTRY` maps module keys to dynamic `import()` factories across Tier 1 (Immediate), Tier 2 (Idle Preload), and Tier 3 (On-Demand Lazy).
   - `ACTION_TO_MODULE` maps `data-action` names to `MODULE_REGISTRY` keys so hovering/focusing a button preloads its chunk before the click completes.
3. **Action Dispatch (`public/src/core/main.js` / `actionRouter.js`)**:
   - Global click listener intercepts `[data-action]`, checks navigation locks (`isAlive`, `pendingFuneral`, `prison.inPrison`), parses `data-args`, and invokes `routeHandlers[action](args, targetElement, event)`.

### 3.3 Modal & UI Conventions (`public/src/ui/ui.js`)
- Use `UI.showModal({ title, content, buttons, size })`, `UI.showAlert(title, message, onClose)`, and `UI.showConfirm(title, message, confirmText, onConfirm, cancelText, onCancel)`.
- Modals support stacking (`_modalStack`); calling `UI.closeModal()` automatically restores any underlying modal or refreshes the active view.
- Sanitize user-entered strings or external text via `escapeHtml` from [`public/src/ui/utils.js`](file:///home/antigravity/jgomez5437/life_game/public/src/ui/utils.js) or `GameLogic.sanitizeName`.

---

## 4. Codebase Modularity Guardrails (For AI Agents)

1. **800-Line Ceiling**: Keep individual `.js` files under **750–800 lines** so any file can be read completely in a single `view_file` call without pagination.
2. **Preserve Barrels**: Do not remove exports from `public/src/core/gameLogic.js`, `public/src/core/eventManager.js`, `public/src/core/main.js`, `public/src/core/saveSlotManager.js`, or feature screen entry points registered in `MODULE_REGISTRY`.
3. **CSS Source of Truth**: Edit custom styles in [`public/styles.css`](file:///home/antigravity/jgomez5437/life_game/public/styles.css) or [`public/tailwind-input.css`](file:///home/antigravity/jgomez5437/life_game/public/tailwind-input.css) and compile via `npm run build:css`. Do not hand-edit generated bundles (`public/styles.bundle.css`, `public/styles.dist.css`, `public/tailwind.output.css`).
4. **Keep `AGENTS.md` Synchronized**: When adding a new feature module, state domain, or `data-action` group, update the routing table in Section 2.
