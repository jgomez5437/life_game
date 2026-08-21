# 🌟 Start a Life — Life Simulator

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Vite](https://img.shields.io/badge/Vite-8.2+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/ES6-Modules-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Auth0](https://img.shields.io/badge/Auth0-SPA_SDK-EB5424?logo=auth0&logoColor=white)](https://auth0.com/)
[![Vercel Serverless](https://img.shields.io/badge/Vercel-Serverless_%2B_Postgres-000000?logo=vercel&logoColor=white)](https://vercel.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash_AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-635BFF?logo=stripe&logoColor=white)](https://stripe.com/)
[![Jest Tests](https://img.shields.io/badge/Tests-Jest_JSDOM-C21325?logo=jest&logoColor=white)](https://jestjs.io/)

**Start a Life** is a rich, text-driven life simulation web game built with **Vanilla JavaScript (ES6 Modules)**, **Tailwind CSS**, and a **Vercel Serverless Backend (Node.js + PostgreSQL)**. 

Players guide a procedurally generated character from birth to death—making pivotal decisions across education, career paths, entrepreneurship, real estate, financial markets, criminal enterprises, romantic relationships, and multi-generational legacies.

🎮 **Live Demo**: [https://startalife.app](https://startalife.app)

---

## 📖 Table of Contents

- [Key Features](#-key-features)
- [Architecture & Tech Stack](#-architecture--tech-stack)
- [Directory Structure](#-directory-structure)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
  - [Development Scripts](#development-scripts)
- [Core Systems & Mechanics](#-core-systems--mechanics)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Development Conventions](#-development-conventions)
- [Deployment](#-deployment)
- [License](#-license)

---

## ✨ Key Features

### 🧬 Procedural Character & Vector Avatar Engine
- **Deterministic Trait Generation**: Characters are born with unique PRNG seed-driven physical and psychological traits (Health, Happiness, Smarts, Looks, Discipline, Karma).
- **Dynamic SVG Avatar Engine**: Custom vector avatar renderer (`public/src/ui/avatarRenderer.js`) that dynamically ages characters from infancy to elderly years, featuring evolving hairstyles, skin tones, facial features, accessories, and progressive hair graying.
- **City & Cost-of-Living Scaling**: Birth locations dynamically scale salaries, tax brackets, and cost of living.

### 🎓 Education & Academic Tracks
- Navigate through Primary School, High School, and University.
- Choose from diverse undergraduate majors (Computer Science, Pre-Med, Pre-Law, Business, Engineering, Arts, etc.).
- Advance through Graduate Schools (Medical School, Law School, Business MBA).
- Maintain grades, drop out, study hard, or unlock the **Instant Diploma** store perk.

### 💼 Careers, Special Paths & Underworld
- **Corporate Ladders**: Apply for multi-tiered job openings, manage workload vs. stress, ask for raises/promotions, handle coworker interactions, and negotiate salaries.
- **Special Careers**: Pursue stardom as a Musician, Actor, or Professional Athlete.
- **Mafia Syndicate**: Join an organized crime syndicate, work through ranks (Associate to Boss/Godmother), manage extortion rackets, and orchestrate underworld hits.
- **Part-Time & Freelancing**: Pick up gigs and side hustles to fund early life or studies.

### 🏢 Entrepreneurship & Startup Simulator
- **Found Companies**: Launch startups across high-tech, biotech, retail, automotive, AI, and consumer goods.
- **Manage Operations**: Control pricing models, marketing spend, R&D budgets, employee headcounts, and product quality.
- **Venture Capital & Exits**: Pitch venture capitalists across Seed, Series A, Series B, and Series C funding rounds; grow enterprise valuation toward a public IPO or major acquisition.

### 🏘️ Real Estate, Landlording & Luxury Assets
- **Property Ownership**: Buy, renovate, and sell residential homes, commercial buildings, and luxury penthouses.
- **Landlord Mechanics**: Screen prospective tenants, set rental rates, handle repairs, manage evictions, and collect passive rental yields.
- **Vehicles & Luxuries**: Purchase cars, aircraft, superyachts, and fine jewelry subject to annual market depreciation and maintenance costs.

### 📈 Financial Markets & Crypto
- Real-time simulated stock exchange and cryptocurrency markets driven by algorithmic market volatility and economic news cycles.

### ⚖️ Crime & Incarceration Engine
- Commit offenses ranging from shoplifting and pickpocketing to grand theft auto, bank heists, and contract hits.
- Dynamic risk calculations factor in player stats and police response.
- Stand trial with public defenders or expensive private defense attorneys.
- **Prison System**: Serve sentences, manage prison gang reputations, interact with wardens, work prison jobs, incite riots, or plan daring escapes.

### 💍 Relationships, Romance & Family
- Meet partners via organic encounters or matchmaking.
- Manage relationship metrics, plan dates, buy gifts, take vacations, and propose marriage.
- Draft prenuptial agreements, manage divorces, child custody, and alimony.
- Maintain relationships with parents, siblings, children, and grandchildren.

### 🪦 Mortality, Wills & Gemini AI Eulogies
- Realistic actuarial mortality engine factoring in age, health, lifestyle, and random life events.
- **Google Gemini 2.5 Flash Integration**: Serverless AI generation of rich, darkly humorous, and personalized biographical eulogies reflecting exact life milestones.
- **Graveyard & Will System**: Record past lives, pass down accumulated fortunes to heirs, and view family lineages across generations.

### ⏳ Time Machine, Save Slots & God Mode
- **Time Machine**: Rewind aging and reverse catastrophic life mistakes.
- **Save Slot Manager**: Switch seamlessly between multiple named guest profiles or cloud saves.
- **God Mode**: Customize avatar appearance, edit stats, adjust relationships, and control RNG.
- **In-Game Store**: Stripe-powered microtransactions for supporter perks and expansion packs.

---

## 🛠 Architecture & Tech Stack

```
                                  ┌─────────────────────────────────────────┐
                                  │             Start a Life UI             │
                                  │   (Vanilla JS ES6 + Tailwind + FontAwesome) │
                                  └───────────────────┬─────────────────────┘
                                                      │
                                    ┌─────────────────┴─────────────────┐
                                    ▼                                   ▼
                       ┌────────────────────────┐          ┌────────────────────────┐
                       │   Local State Engine   │          │  Auth0 SPA Client SDK  │
                       │  (state.js / gameLogic)│          │   (Guest & Auth Sync)  │
                       └────────────┬───────────┘          └────────────┬───────────┘
                                    │                                   │
                                    │      Vercel Serverless APIs       │
                                    └─────────────────┬─────────────────┘
                                                      ▼
                       ┌────────────────────────────────────────────────────────────┐
                       │                      /api Serverless                       │
                       │   • /api/login                   • /api/saveGame           │
                       │   • /api/load                    • /api/generateEulogy     │
                       │   • /api/create-checkout-session • /api/stripe-webhook     │
                       └──────────────┬───────────────────────────────┬─────────────┘
                                      ▼                               ▼
                       ┌────────────────────────┐          ┌────────────────────────┐
                       │  Vercel Postgres (DB)  │          │   Google Gemini 2.5    │
                       │  (JSONB Player Saves)  │          │   & Stripe API Webhooks│
                       └────────────────────────┘          └────────────────────────┘
```

| Layer | Technologies | Description |
| :--- | :--- | :--- |
| **Frontend Client** | Vanilla JS (ES6 Modules), HTML5 | Zero-framework, lightweight DOM manipulation with global event delegation. |
| **Styling & Icons** | Tailwind CSS (v3), FontAwesome 6.4 | Modern responsive layout with built-in Dark Mode and Light Mode support. |
| **Avatar Engine** | Procedural Vector SVG | Dynamic SVG generation calculating trait seeds, facial aging, and hair phenotypes. |
| **Build & Bundling** | Vite 8.x | Lightning-fast HMR development server and minified production bundler. |
| **Authentication** | Auth0 SPA SDK (`auth0-spa-js`) | Secure token-based authentication supporting both Guest Mode and Cloud Profiles. |
| **Serverless Backend**| Vercel Serverless Functions (Node.js) | Microservice endpoints for state persistence, payments, and AI generation. |
| **Database** | Vercel Postgres (`@vercel/postgres`, `pg`) | Relational PostgreSQL database storing user profiles and compressed JSONB game states. |
| **AI Integration** | Google Gemini 2.5 Flash API | Generates contextual, 3-sentence biographical eulogies upon character death. |
| **Payments** | Stripe API (`stripe`) | Manages checkout sessions and webhook processing for store unlocks. |
| **Testing** | Jest, `jest-environment-jsdom` | 17+ comprehensive test suites testing game mechanics, business math, and state mutation. |

---

## 📁 Directory Structure

```
life_game/
├── api/                                # Vercel Serverless API Endpoints
│   ├── lib/
│   │   └── verifyAuth.js               # JWT & Auth0 token verification helper
│   ├── create-checkout-session.js      # Stripe checkout session generator
│   ├── generateEulogy.js               # Google Gemini 2.5 Flash AI eulogy endpoint
│   ├── getPurchases.js                 # Store purchases and entitlements retriever
│   ├── index.js                        # API status & health check endpoint
│   ├── load.js                         # Database game state retriever
│   ├── login.js                        # User profile sync & database upsert
│   ├── saveGame.js                     # JSONB state persistence endpoint
│   └── stripe-webhook.js               # Stripe webhook transaction handler
├── public/                             # Client-Side Assets & Source Code
│   ├── index.html                      # Primary application entry shell
│   ├── styles.css                      # Custom theme overrides, fonts & animations
│   ├── styles.bundle.css               # Compiled Tailwind CSS production bundle
│   ├── favicon.png                     # Application icon
│   └── src/
│       ├── auth/                       # Authentication & Cloud Login
│       │   ├── auth.js                 # Auth0 client wrapper & session manager
│       │   └── loginScreen.js          # Guest vs. Account login UI view
│       ├── core/                       # Core Game Engine & State
│       │   ├── avatarLogic.js          # Trait seeds, phenotype calculation & aging math
│       │   ├── gameLogic.js            # Master game engine, turn loop, & death engine
│       │   ├── main.js                 # Bootstrap initialization & event delegation router
│       │   ├── saveSlotManager.js      # Multi-slot local & cloud save management
│       │   ├── state.js                # Single source of truth state
│       │   └── timeMachine.js          # Turn rewind & state snapshot history
│       ├── ui/                         # UI Rendering & Utilities
│       │   ├── avatarRenderer.js       # Procedural SVG vector avatar rendering engine
│       │   ├── ui.js                   # Modal system, overlays, alerts, & DOM helpers
│       │   └── utils.js                # Currency, percentage & mathematical formatters
│       └── features/                   # Modular Feature Screens & Controllers
│           ├── assets/                 # Real estate, landlord screen, vehicles, & stocks/crypto
│           ├── business/               # Startup creation, VC dashboard, & P&L management
│           ├── career/                 # Job listings, promotions, special careers & mafia
│           ├── education/              # School management, degrees, & Instant Diploma
│           ├── more/                   # Casino minigames, crime, prison, & game settings
│           ├── player/                 # Character creation, main dashboard, & graveyard
│           ├── relationships/          # Dating, family tree, marriage, & funerals
│           └── store/                  # God Mode, VIP Lounge, & expansion pack purchases
├── tests/                              # Automated Unit Test Suites
│   ├── avatar.test.js                  # Avatar phenotype & SVG generation tests
│   ├── businessOverhaul.test.js        # Business valuation, revenue, & VC tests
│   ├── citySalaryScaling.test.js       # Location salary multiplier tests
│   ├── crimeSystem.test.js             # Crime formulas & arrest risk tests
│   ├── funeralScreen.test.js           # Eulogy formatting & funeral view tests
│   ├── gameLogic.test.js               # Master game loop & state mutation tests
│   ├── godModeEntitlements.test.js     # God mode permission tests
│   ├── graveyard.test.js               # Ancestral records & past life tests
│   ├── instantDiploma.test.js          # Academic shortcut tests
│   ├── prison.test.js                  # Prison sentences, escapes, & riot tests
│   ├── smartsAndLooks.test.js          # Stat calculation & modifier tests
│   ├── specialCareersAndMafia.test.js  # Syndicate ranks & special career tests
│   ├── store.test.js                   # Store entitlement tests
│   ├── timeMachineAndSaveSlots.test.js # Snapshot history & save slot tests
│   ├── utils.test.js                   # Utility & math formatter tests
│   └── vipSupporter.test.js            # Supporter badge & perk tests
├── package.json                        # Dependencies, build scripts & metadata
├── vercel.json                         # Vercel deployment & routing configuration
├── vite.config.js                      # Vite build configuration
└── .env.local                          # Local environment secrets & API keys
```

---

## 🔌 API Reference

| Endpoint | Method | Auth Required | Description |
| :--- | :---: | :---: | :--- |
| `/api/index` | `GET` | No | Health check and server status. |
| `/api/login` | `POST` | Yes (Auth0 JWT) | Synchronizes user profile with Postgres, initializes player record. |
| `/api/saveGame` | `POST` | Yes (Auth0 JWT) | Persists serialized JSONB game state to the database. |
| `/api/load` | `GET` | Yes (Auth0 JWT) | Fetches the latest saved game state for the authenticated user. |
| `/api/generateEulogy` | `POST` | No | Sends compressed life event logs to Google Gemini 2.5 Flash to generate a 3-sentence eulogy. |
| `/api/getPurchases` | `GET` | Yes (Auth0 JWT) | Retrieves active user pack purchases, VIP status, and entitlements. |
| `/api/create-checkout-session` | `POST` | Yes (Auth0 JWT) | Creates a Stripe checkout session for expansion packs or God Mode. |
| `/api/stripe-webhook` | `POST` | Stripe Signature | Listens for successful Stripe checkout events and credits entitlements to the user. |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or higher recommended)
- [npm](https://www.npmjs.com/) (version 9.x or higher)
- *(Optional)* [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`) for running serverless endpoints locally.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jgomez5437/life_game.git
   cd life_game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Environment Configuration

Create a `.env.local` file in the `life_game` directory with your API keys and credentials:

```env
# Auth0 Configuration
AUTH0_DOMAIN=your-auth0-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_AUDIENCE=https://your-api-audience/

# Database (Vercel Postgres)
POSTGRES_URL=postgres://user:password@hostname:5432/dbname
POSTGRES_PRISMA_URL=...
POSTGRES_URL_NON_POOLING=...

# AI Eulogies (Google Gemini)
GEMINI_API_KEY=your-google-gemini-api-key

# Stripe Microtransactions
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Development Scripts

Inside `life_game/`:

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the fast Vite development server for client-side gameplay (with HMR). |
| `npm run build` | Compiles and minifies production assets into the `dist/` folder. |
| `npm run preview` | Serves the production build locally to test minified output. |
| `npm test` | Runs the full Jest test suite with experimental VM modules. |
| `npm run build:css`| Builds standalone minified Tailwind CSS bundle. |
| `npx vercel dev` | Runs the full Vercel environment locally with serverless `/api` endpoints and static frontend. |

---

## 🎮 Core Systems & Mechanics

### 1. Centralized State Architecture
State is maintained strictly in `state.gameState` (`public/src/core/state.js`). All game mutations are orchestrated through pure and deterministic functions in `public/src/core/gameLogic.js`.

### 2. Declarative Event Delegation
The user interface does not attach inline `onclick` handlers. Instead, UI components render declarative HTML attributes:
```html
<button data-action="openRelationshipModal" data-args='{"id": "parent_mother"}'>
  Interact
</button>
```
The central dispatcher in `public/src/core/main.js` captures bubbled clicks, parses arguments safely, and routes actions cleanly.

### 3. Dual Persistence (Guest & Cloud)
- **Guest Mode**: All progress is automatically serialized to browser `localStorage` with multi-slot support via `public/src/core/saveSlotManager.js`.
- **Cloud Mode**: Authenticated users enjoy seamless background cloud sync to Vercel PostgreSQL with full cross-device resume capabilities.

---

## 🧪 Testing & Quality Assurance

The codebase includes an extensive automated test suite built with **Jest** and **JSDOM**.

To execute all tests:
```bash
cd life_game
npm test
```

### Test Coverage Highlights:
- **Game Loops & Turn Progression**: Age increments, stat degradation, illness engines, cause-of-death calculations (`tests/gameLogic.test.js`).
- **Business Simulation Math**: Revenue calculations, margin formulas, valuation multipliers, VC equity dilution (`tests/businessOverhaul.test.js`).
- **Crime & Prison Mechanics**: Arrest probabilities, lawyer impact calculations, sentence lengths, escape chances (`tests/crimeSystem.test.js`, `tests/prison.test.js`).
- **Procedural Avatar Rendering**: Deterministic SVG generation, seed stability, aging alterations (`tests/avatar.test.js`).
- **Time Machine & Save Slots**: State rewind integrity, snapshot serialization, save slot management (`tests/timeMachineAndSaveSlots.test.js`).

---

## 📐 Development Conventions

1. **State Mutation Safety**: Always modify `state.gameState` rather than creating disconnected state objects. Ensure default fallback values for newly added properties to preserve backwards compatibility with older save states.
2. **Event Delegation**: Never inject inline JavaScript handlers into dynamic HTML strings. Always use `data-action` and `data-args`.
3. **Modal System**: Use the centralized `UI.showModal({ title, content, buttons })` helper in `public/src/ui/ui.js` for dialogs and confirmations.
4. **Mandatory Testing for New Logic**: Any new algorithmic feature, stat calculation, or balance change must be accompanied by unit tests in the `tests/` directory.
5. **Documentation Maintenance**: When changing architecture, adding new feature modules, or refactoring state, always keep `CLAUDE.md` and `README.md` synchronized.

---

## 🌐 Deployment

The application is optimized for deployment on **Vercel**:

1. Connect the repository to Vercel.
2. Ensure the root directory is configured to `life_game`.
3. The build settings in `vercel.json` will automatically run:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. Add the required environment variables (`AUTH0_*`, `POSTGRES_*`, `GEMINI_API_KEY`, `STRIPE_*`) in your Vercel Project Settings.

---

## 📄 License

This project is licensed under the **ISC License**. See the `package.json` file for details.