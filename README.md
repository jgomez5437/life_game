# Life Simulator

A web-based, text-driven life simulation game built with Vanilla JavaScript and a serverless Node.js backend. Players navigate life from birth to death, managing relationships, education, careers, and dynamic economic assets.

## Architecture & Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Vanilla JavaScript | Manages DOM manipulation, game loop, and client-side state. |
| **Styling** | Tailwind CSS (CDN) & FontAwesome | Rapid, utility-first UI design and visual iconography. |
| **Authentication** | Auth0 SPA JS | Secures user profiles and synchronizes local state with the database. |
| **Backend** | Vercel Serverless (Node.js) | Handles API routing (`/api/login`, `/api/saveGame`) and data persistence. |

## Core Systems

### 1. State Management
The game utilizes a centralized "Single Source of Truth" pattern via the `window.gameState` object. All user actions mutate this state, and UI modules render directly from it, preventing data desynchronization.

### 2. Procedural Generation (Factory Pattern)
Modules like `familyFactory.js` encapsulate the logic for generating randomized, weighted data. At birth, the engine calculates parental structures (75% both parents, 15% single mother, etc.) and populates the relationship arrays before the initial UI render.

### 3. Dynamic Economy
Assets depreciate based on internal condition and external market forces. The `simulateVehicleMarket()` engine calculates randomized annual volatility, directly impacting player net worth and forcing strategic asset management.

## Local Setup & Development

1. Clone the repository to your local machine.
2. Configure the `.env` file in the root directory with your Auth0 client credentials and database connection strings.
3. Install backend dependencies by executing `npm install`.
4. Boot the local development environment using the Vercel CLI via `vercel dev`.
5. Open a browser and navigate to the localhost port provided by the CLI to load `index.html`.

## Project Directory Structure

* `/api/` - Serverless backend endpoints (Login, Save Game).
* `/public/` - Client-facing application.
    * `/screens/` - UI rendering logic segmented by view (e.g., `mainScreen.js`, `charCreationScreen.js`).
    * `gameLogic.js` - Pure utility functions, state checks, and mathematical calculations.
    * `index.html` - The application entry point and primary DOM shell.
* `/src/tests/` - Jest unit tests verifying core logic constraints and probability distributions.

## Strategic Roadmap

* **Phase 1:** Finalize the Vanilla JS implementation of core loops (Aging, Complex Interactions, Real Estate).
* **Phase 2:** Architect a migration path from global state mutations to a modern declarative framework (React + Zustand/Context API).
* **Phase 3:** Expand procedural generation to include geographical data dictionaries and multi-generational trait inheritance.