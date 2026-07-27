# App Context: Life Simulator Game

This document serves as an architectural overview and developer guide for the Life Simulator game codebase. Consult this document before making changes to understand where game logic, state management, and UI components reside, as well as key coding conventions.

---

## High-Level Architecture

- **Frontend**: Vanilla JavaScript (ES Modules). Centralized state in `state.js` (`state.gameState.user`). Component/screen logic is split by feature in `public/src/features/`.
- **Event Dispatch System**: Interactive UI controls use standard HTML attributes `data-action="handlerName"` and `data-args="..."`, automatically routed through `routeHandlers` registered in `public/src/core/main.js`.
- **Backend**: Serverless Node.js functions running on Vercel (`/api/`) communicating with a PostgreSQL database (`@vercel/postgres`) for Auth0 session syncing and game saves.
- **Styling**: Tailwind CSS (via CDN) with FontAwesome icons and custom CSS overrides in `styles.css`.
- **Testing**: Jest unit tests executing in a `jsdom` environment with ES Module support (`npm test`).

---

## Running Tests & Commands

- **Run Unit Tests**: `npm test`
  *(Executes `node --experimental-vm-modules node_modules/jest/bin/jest.js` across all files in `tests/`)*
- **Run Local Server**: `npx vercel dev` or any local static web server.

---

## File and Directory Structure

### `public/src/` (Frontend Application Core)

#### `core/` (State & Game Loop Engine)
- **`state.js`**: Global `state` object holding active `gameState`, Auth0 client reference, and session state.
- **`gameLogic.js`**: Pure mathematical and rule-based functions (e.g., mortality checks, asset depreciation, city cost of living adjustments, tenant applicant generation, stock price algorithms, blackjack resolution). Keeps rules separate from DOM rendering. Exports `GameLogic` and `CITY_COST_OF_LIVING`.
- **`main.js`**: Application entry point. Drives the core "Age Up" annual loop, triggers random yearly life events, orchestrates UI refreshes, and houses `routeHandlers` (the flat dispatch map for all `data-action` UI clicks).
- **`avatarLogic.js`**: Generates procedural character appearance features (skin tone, hair styles, eye color, facial hair, glasses, makeup).

#### `features/` (Game Domains)
- **`assets/`**:
  - `assetsScreen.js`: Asset management dashboard for owned real estate (tenant screening, lease renewals, evictions, damage repairs), vehicles (primary ride selection, joyrides, auto insurance, selling), and jewelry (equipping, appreciation, insurance, gifting, pawn/sale).
  - `goShoppingScreen.js`: Marketplace UI for purchasing real estate properties, vehicles, and jewelry.
  - `investmentsScreen.js`: Investment dashboard for High-Yield Savings accounts (deposits/withdrawals) and Stock Market trading (share purchases, dividend tracking, sector news blog).
- **`business/`**:
  - `createBusinessScreen.js`: Startup wizard for founding companies across 4 industry types with supplier selection (Cheap, Balanced, Premium).
  - `businessDashboard.js`: Company management office (production sliders, pricing, wage setting, CEO salary, quarterly/annual financial reports, employee hiring/layoffs, factory upgrades, company acquisition/sale).
- **`career/`**:
  - `careerJobsScreen.js`: Career track listings (15 tracks, 5 levels each) with qualification checks and interview mini-game questions.
  - `jobCareerManagerScreen.js`: Job management dashboard showing performance meters, work harder / slack off buttons, promotion requests, raises, and resignation options.
  - `partTimeJobsScreen.js`: Hourly job listings (11 part-time roles with age requirements).
  - `occupationScreen.js`: Main occupation hub displaying current job or school status, university major enrollment, and graduate school applications (Medical, Law, Business).
- **`education/`**:
  - `manageEducationScreen.js`: Elementary, middle, and high school academic activities, studying, and school performance metrics.
- **`more/`**:
  - `moreScreen.js`: Hub for diet plans, gym memberships, doctor physicals, lottery tickets (regular and jackpot), Blackjack card game, vacation travel, and international country relocation.
- **`player/`**:
  - `mainScreen.js`: Primary life dashboard, life log timeline (`addLog`), and main stat meters (Health, Happiness, Smarts, Looks).
  - `charCreationScreen.js`: Character creator with procedural avatar preview, name validation, gender selection, birth country/city picker, and parentage log generator.
- **`relationships/`**:
  - `familyFactory.js`: Procedurally generates family members (parents, siblings) and simulates dynamic NPC life progression (aging, careers, marriage, offspring, independent life events, illness, death).
  - `relationshipScreen.js`: Social relationships UI for spending time, giving gifts (jewelry, cars), complimenting, insulting, apologizing, or breaking up.
  - `funeralScreen.js`: Handles eulogies and end-of-life events for deceased relatives.

#### `ui/` (Shared UI & Formatting Utilities)
- **`ui.js`**: `UI` object providing `updateHeader` (renders dynamic FlagCDN country flags, bank balance, health indicators), `showModal`, `showCustomModal`, `showConfirm`, and `renderScreen`.
- **`utils.js`**: Reusable helpers. Contains `COUNTRIES_DATA` (country currency ISO codes, symbols, locales, and cities) and `Utils.formatMoney`.
- **`avatarRenderer.js`**: Renders SVG/HTML character avatars based on appearance configuration objects.

#### `auth/`
- **`auth.js` & `loginScreen.js`**: Auth0 authentication flow, login/logout handlers, and session persistence.

### `api/` (Vercel Serverless Endpoints)
- **`index.js`**, **`login.js`**, **`saveGame.js`**, **`load.js`**, **`generateEulogy.js`**: PostgreSQL endpoints for game state persistence and AI eulogy generation.

### `tests/` (Automated Unit Tests)
- **`utils.test.js`**: Tests for `Utils.formatMoney` (verifying Western numerals `0-9` and country currency symbols for USA, Germany, Egypt, UAE, etc.) and helper utilities.
- **`gameLogic.test.js`**: Comprehensive test coverage for game mechanics, promotion math, tenant generation, asset depreciation, and country cost-of-living calculations.

---

## Essential Coding Conventions & Guidelines

1. **Currency & Localization Formatting**:
   - **Always use `Utils.formatMoney(amount)`**: Never hardcode `$` in HTML template strings or event log text.
   - **Western Numerals Everywhere**: `Utils.formatMoney` enforces standard Western digits (`0-9`, e.g. `85,000`) across all locales, appending the local country's currency symbol (e.g. `E£85,000` for Cairo, `AED 85,000` for Dubai, `€85,000` for Berlin).
   - **Historical Lifelog Retention**: When a player moves countries, historical `lifeLog` text entries must retain the currency string active at the age the event occurred, while new log entries use the new active currency.

2. **Single Centralized State**:
   - All game state lives in `state.gameState.user`.
   - Never store persistent game state in local module variables. Mutate `state.gameState.user` directly, call `saveGame()`, and re-render the appropriate screen or call `UI.updateHeader(user)`.

3. **Separated Concerns**:
   - Keep calculations, odds, math, and business logic inside pure functions in `gameLogic.js`.
   - Keep HTML rendering and user interaction handlers inside `features/` files and `ui.js`.

4. **Event Binding Pattern**:
   - Create interactive UI elements with `data-action="handlerName"` and optional `data-args="arg1, 'arg2'"`.
   - Ensure new handlers are registered in `routeHandlers` in `public/src/core/main.js`.
