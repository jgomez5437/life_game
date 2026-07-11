# App Context: Life Simulator Game

This document serves as an architectural overview and file context guide for the Life Simulator game. It should be consulted prior to making changes to understand where different logic and UI components reside.

## High-Level Architecture
- **Frontend**: Vanilla JavaScript without a framework. State is managed centrally in a `window.gameState` / `state.js` object. UI logic is separated by screen or feature into individual files.
- **Backend**: Serverless Node.js functions running on Vercel (`/api`). Used primarily for saving games and user authentication synchronization.
- **Styling**: Tailwind CSS (via CDN) and FontAwesome for icons.

## File and Directory Structure

### `public/src/` (Frontend Application Core)
This is where the vast majority of the game logic and UI lives.

#### `core/` (State and Main Game Loop)
- `state.js`: Defines the global `state` object (which holds `gameState`, `userAuthId`, etc.) and basic getter/setters.
- `gameLogic.js`: Pure functions for game mechanics (e.g., mortality checks, asset depreciation, blackjack outcomes, relationship decay, health calculations, `calculatePromotionChance`). Exports the `GameLogic` object and `CITY_COST_OF_LIVING`. Keeps math and rules separate from the UI.
- `main.js`: The entry point for the game mechanics, handles the core "aging" loop, orchestrates events when a year passes, and ties state changes to UI updates. Exports `CAREER_TRACKS`, `PART_TIME_JOBS`, `INDUSTRIES`, `SUPPLIERS`. `routeHandlers` is the flat dispatch map for all `data-action` clicks.

#### `features/` (Game Domains)
Contains UI screens and specific logic broken down by game mechanics.
- **`assets/`**: Managing owned items and vehicles (`assetsScreen.js`, `goShoppingScreen.js`).
- **`business/`**: Entrepreneurship logic, business dashboards, and creation (`businessDashboard.js`, `createBusinessScreen.js`).
- **`career/`**: Career system with multi-level `CAREER_TRACKS` (15 tracks, 5 levels each). `careerJobsScreen.js` renders the market and handles `applyForCareerTrack`/`applyForJob`. `jobCareerManagerScreen.js` shows promotion progress and handles work harder/slack off/quit. `occupationScreen.js` is the occupation hub. `partTimeJobsScreen.js` shows the 11 part-time jobs.
- **`education/`**: Schooling and university logic (`manageEducationScreen.js`).
- **`more/`**: Options and extra settings (`moreScreen.js`).
- **`player/`**: Core player screens (`mainScreen.js` for the main dashboard and log, `charCreationScreen.js` for new games).
- **`relationships/`**: Social dynamics (`familyFactory.js` for procedural generation of relatives, `relationshipScreen.js` for interactions, `funeralScreen.js` for end-of-life events).

#### `ui/` (Shared UI Logic)
- `ui.js`: DOM manipulation helpers, rendering utility functions, modal managers.
- `utils.js`: Reusable helper functions like `formatMoney`, `getRandomInt`, and browser `localStorage` management (guest saves/loads).

#### `auth/`
- `auth.js` & `loginScreen.js`: Auth0 integration, handling user sessions and login modals.

### `api/` (Backend / Serverless)
- `index.js`, `login.js`, `saveGame.js`, `load.js`, `generateEulogy.js`: Vercel serverless endpoints that communicate with a PostgreSQL database (`@vercel/postgres`).

### Root Files
- `index.html`: The single HTML shell for the application. Contains the DOM targets that the JS files manipulate.
- `styles.css`: Custom CSS overrides that work alongside Tailwind.
- `package.json`: Project dependencies (Jest, Vercel, pg, dotenv) and scripts.

## Important Patterns to Follow
1. **Single Source of Truth**: All player data is stored in the central state. Do not keep derived state in local variables if it needs to persist. Update `state.gameState` and then call UI re-render functions.
2. **Pure Functions for Logic**: Keep complex math and conditional checks in `gameLogic.js`. Keep UI rendering inside `features/` and `ui.js`.
3. **Data Mutation**: The game relies heavily on modifying objects inside arrays (like `assets` and `relationships`). Be mindful of deep cloning vs shallow references when updating these.
