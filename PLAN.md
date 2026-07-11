# Plan: Fix Business Module (Items 1–4) + Complete Business Sub-Game

## Context

The business/entrepreneur module in `public/src/features/business/` was built with a legacy global-variable pattern (`game`, `el`, `formatMoney`, `showModal`) that was never updated when the codebase migrated to ES modules. As a result:
- **`businessDashboard.js` crashes at runtime** — every state read and DOM operation references undefined globals.
- **The "Launch Company" button is wired to `showComingSoon`** — `initBusiness()` exists but is dead code.
- **Slider event handlers are silently broken** — inline `oninput=` strings can't reach module-scope functions.

Additionally, two files (`router.js`, `moreToDoScreen.js`) are confirmed-dead scaffolding with no imports anywhere.

The user wants to go beyond just fixing crashes — the business dashboard should become a **standalone sub-game** the player can spend time in: employee management, upgrades, random events, a quarterly P&L history, and a sell-company exit. It should also integrate with the main age-up loop.

**Item 5 (double save on death) is a false positive.** The `ageUp`'s `saveGame` call is bypassed by an early `return` when `handleDeath` fires. `renderDeathScreen` never calls `saveGame`. The two `saveGame` calls (`handleDeath` + `continueAsChild`) are intentional and correct. No fix needed.

---

## Step 1 — Delete Dead Files (Bugs 3 & 4)

Delete both files outright. Neither is imported anywhere (confirmed via grep).

- `public/src/core/router.js`
- `public/src/features/activities/moreToDoScreen.js`

---

## Step 2 — Extend `INDUSTRIES` in `main.js`

Add `capacityPerEmployee` to each industry entry. This field gates production scaling by employee count and is needed before the dashboard rewrite.

```js
tech:   { ..., capacityPerEmployee: 600  }   // 5 employees × 600 = 3,000 max (> 2,500 demand)
retail: { ..., capacityPerEmployee: 1200 }   // 5 × 1,200 = 6,000 max (> 5,000 demand)
auto:   { ..., capacityPerEmployee: 200  }   // 5 × 200 = 1,000 max (> 800 demand)
```

---

## Step 3 — Add Missing Business State Fields in `main.js`

Both `updateGameInfo` and `loadAndRenderGame` construct `state.gameState.user`. Add the following after the existing `hasBusiness` / `companyName` / `ceoSalary` lines (do not duplicate `ceoSalary` which already exists):

```js
industry:           savedUser.industry           || null,
compCash:           savedUser.compCash           || 0,
companyYear:        savedUser.companyYear         || 1,
companyQuarter:     savedUser.companyQuarter      || 1,
employees:          savedUser.employees           || 0,
businessReputation: savedUser.businessReputation  || 0,
inventory:          savedUser.inventory           || 0,
productionTarget:   savedUser.productionTarget    || 0,
sellingPrice:       savedUser.sellingPrice        || 0,
salaryOffer:        savedUser.salaryOffer         || 0,
supplierId:         savedUser.supplierId          || null,
businessHistory:    savedUser.businessHistory     || [],
businessUpgrades:   savedUser.businessUpgrades   || [],
```

For `loadAndRenderGame`, replace `savedUser.*` with `userData.*`. Non-business characters are unaffected because all values default to null/0/[].

---

## Step 4 — Rewrite `businessDashboard.js` (Bug 1)

### 4a. Fix all broken global references

| Old (broken) | New (correct) |
|---|---|
| `game.*` | `state.gameState.user.*` (hoist `const user = state.gameState.user`) |
| `el(id)` | `document.getElementById(id)` (define local `const get = id => document.getElementById(id)`) |
| `formatMoney(x)` | `Utils.formatMoney(x)` (add `import { Utils }` — already imported but unused) |
| `showModal(...)` | `UI.showModal(...)` (already imported but unused) |
| `isStudent()` | inline: `user.isStudent \|\| user.universityEnrolled \|\| user.gradSchoolEnrolled` |
| `game.bank` | `user.money` |
| `game.year` / `game.quarter` | `user.companyYear` / `user.companyQuarter` |

Add `Utils` to the existing import of `UI`:
```js
import { Utils } from '../../ui/utils.js';
```

### 4b. Fix slider event handlers

Remove all `oninput="syncFromSlider(...)"` and `oninput="syncFromInput(...)"` attributes from the rendered HTML. Delete the `syncFromSlider` and `syncFromInput` functions.

At the end of `renderBusinessDashboard()`, after `UI.renderScreen(html)`, call `attachSliderListeners()` then `updateCalculations()`:

```js
function attachSliderListeners() {
    ['prod', 'price', 'salary', 'ceo'].forEach(type => {
        const rng = document.getElementById(`rng-${type}`);
        const num = document.getElementById(`num-${type}`);
        if (rng) rng.addEventListener('input', () => { num.value = rng.value; updateCalculations(); });
        if (num) num.addEventListener('input', () => { rng.value = num.value; updateCalculations(); });
    });
}
```

### 4c. Export `renderBusinessDashboard`

Change from `function renderBusinessDashboard()` to `export function renderBusinessDashboard()` so `createBusinessScreen.js` can import it.

### 4d. Remove duplicate financial logic from `processQuarter`

Delete the `game.age++` line and the living-expense / student-loan deduction block inside `processQuarter`'s year-end branch. These are already handled by `handleFinances` in `mainScreen.js` and would double-bill the player if left in.

### 4e. Fix annual report modal signature

`UI.showModal` takes 3 args: `(title, message, onClose)`. The existing 4-arg call needs the custom button label dropped. The `onClose` callback should call `renderLifeDashboard(state.gameState)`.

### 4f. Add `BUSINESS_EVENTS` constant

Define at module level (exported for future testability):

```js
export const BUSINESS_EVENTS = [
    { id: 'viral_moment',       name: 'Viral Moment',        icon: 'fa-fire',                probability: 0.04, repDelta:  30, demandMult: 1.5, productionCapMult: 1.0, revenueFlat:  0, revenuePenaltyPct: 0.00 },
    { id: 'supplier_shortage',  name: 'Supplier Shortage',   icon: 'fa-exclamation-triangle', probability: 0.04, repDelta:   0, demandMult: 1.0, productionCapMult: 0.5, revenueFlat:  0, revenuePenaltyPct: 0.00 },
    { id: 'product_defect',     name: 'Product Defect',      icon: 'fa-bug',                  probability: 0.04, repDelta: -20, demandMult: 1.0, productionCapMult: 1.0, revenueFlat:  0, revenuePenaltyPct: 0.20 },
    { id: 'competitor_launch',  name: 'Competitor Launch',   icon: 'fa-building',             probability: 0.04, repDelta: -15, demandMult: 0.9, productionCapMult: 1.0, revenueFlat:  0, revenuePenaltyPct: 0.00 },
    { id: 'government_contract',name: 'Government Contract', icon: 'fa-landmark',             probability: 0.03, repDelta:  10, demandMult: 1.0, productionCapMult: 1.0, revenueFlat: 50000, revenuePenaltyPct: 0.00 },
    { id: 'employee_strike',    name: 'Employee Strike',     icon: 'fa-people-line',          probability: 0.03, repDelta:  -5, demandMult: 0.0, productionCapMult: 0.0, revenueFlat:  0, revenuePenaltyPct: 0.00 },
];
```

**Roll logic** (cumulative weighted draw — run once inside `processQuarter` after computing `actualDemand`):
```js
let activeEvent = null, cumulative = 0;
const roll = Math.random();
for (const ev of BUSINESS_EVENTS) {
    cumulative += ev.probability;
    if (roll < cumulative) { activeEvent = ev; break; }
}
```

Apply event modifiers before resolving sales:
```js
const effectiveProd = Math.min(user.productionTarget, maxProduction * (activeEvent?.productionCapMult ?? 1));
const effectiveDemand = Math.floor(actualDemand * (activeEvent?.demandMult ?? 1));
const sold = Math.min(user.inventory + effectiveProd, effectiveDemand);
let revenue = sold * user.sellingPrice + (activeEvent?.revenueFlat ?? 0);
if (activeEvent?.revenuePenaltyPct > 0) revenue = Math.floor(revenue * (1 - activeEvent.revenuePenaltyPct));
if (activeEvent?.repDelta) user.businessReputation = Math.max(0, Math.min(100, user.businessReputation + activeEvent.repDelta));
```

Store the event name on the history entry: `{ year, quarter, profit, revenue, event: activeEvent?.name ?? null }`.
Dashboard renders a yellow banner when the most-recent history entry has a non-null `event`.

### 4g. Add `BUSINESS_UPGRADES` constant + `purchaseUpgrade` function

```js
export const BUSINESS_UPGRADES = [
    { id: 'marketing',   name: 'Marketing Campaign',   icon: 'fa-bullhorn',      description: 'Immediately +10 Reputation.',               cost: 25000 },
    { id: 'warehouse',   name: 'Warehouse Expansion',  icon: 'fa-warehouse',     description: 'Doubles maximum inventory carry capacity.',  cost: 50000 },
    { id: 'rd',          name: 'R&D Investment',       icon: 'fa-flask',         description: 'Increases max selling price ceiling by 50%.', cost: 75000 },
    { id: 'hr_training', name: 'HR Training Program',  icon: 'fa-user-graduate', description: 'Reduces layoff severance cost by 50%.',      cost: 30000 },
];
```

**Passive effect call sites:**
- `warehouse`: after resolving `sold`, cap inventory: `const maxInventory = ind.baseDemand * (user.businessUpgrades.includes('warehouse') ? 2 : 1);`
- `rd`: in `renderBusinessDashboard`, price slider max: `Math.floor(ind.unitPrice * (user.businessUpgrades.includes('rd') ? 4.5 : 3.0))`
- `hr_training`: in `layoffEmployee`, severance multiplier: `user.businessUpgrades.includes('hr_training') ? 0.5 : 1.0`

**`purchaseUpgrade(upgradeId)`** (exported, registered in `routeHandlers`):
- Guard already-owned + insufficient `compCash` → `UI.showModal`
- Deduct cost from `user.compCash`
- Push `upgradeId` to `user.businessUpgrades`
- If `'marketing'`: apply `+10` rep immediately
- `addLog(...)` + `renderBusinessDashboard()`

### 4h. Add `hireEmployee` and `layoffEmployee` functions (both exported)

Production capacity: `const maxProduction = user.employees * ind.capacityPerEmployee` — used in both `processQuarter` and the live preview (`updateCalculations`).

```js
export function hireEmployee() {
    const user = state.gameState.user;
    const ind = INDUSTRIES[user.industry];
    const cost = ind.baseSalary * 2;
    if (user.compCash < cost) return UI.showModal('Cannot Hire', `Need ${Utils.formatMoney(cost)} in company cash.`);
    user.compCash -= cost;
    user.employees++;
    addLog(`Hired a new employee at ${user.companyName}. Team size: ${user.employees}.`, 'good');
    renderBusinessDashboard();
}

export function layoffEmployee() {
    const user = state.gameState.user;
    const ind = INDUSTRIES[user.industry];
    if (user.employees <= 1) return UI.showModal('Cannot Layoff', 'You must keep at least one employee.');
    const sevMult = user.businessUpgrades.includes('hr_training') ? 0.5 : 1.0;
    const severance = Math.floor(ind.baseSalary * sevMult);
    user.compCash -= severance;
    user.employees--;
    addLog(`Laid off an employee. Severance paid: ${Utils.formatMoney(severance)}.`, 'bad');
    renderBusinessDashboard();
}
```

### 4i. Add `sellBusiness` function (exported)

```js
export function sellBusiness() {
    const user = state.gameState.user;
    const ind = INDUSTRIES[user.industry];
    const recent = user.businessHistory.slice(-4);
    const avgRevenue = recent.length > 0 ? recent.reduce((sum, q) => sum + q.revenue, 0) / recent.length : 0;
    const salePrice = Math.max(Math.floor(avgRevenue * 4), Math.floor(ind.startupCost * 0.3));
    UI.showConfirm(
        'Sell Company',
        `Sell ${user.companyName} for ${Utils.formatMoney(salePrice)}?`,
        'Sell',
        () => {
            user.money += salePrice;
            addLog(`Sold ${user.companyName} for ${Utils.formatMoney(salePrice)}.`, 'major');
            user.hasBusiness = false; user.companyName = null; user.compCash = 0;
            user.companyYear = 1; user.companyQuarter = 1; user.employees = 0;
            user.businessReputation = 0; user.inventory = 0; user.productionTarget = 0;
            user.sellingPrice = 0; user.salaryOffer = 0; user.ceoSalary = 0;
            user.supplierId = null; user.industry = null; user.businessHistory = [];
            user.businessUpgrades = [];
            renderActivities();
        }
    );
}
```

### 4j. Add `autoProcessBusinessQuarter` function (exported)

Runs silently during age-up. Same math as `processQuarter` but no DOM reads and no modals.

```js
export function autoProcessBusinessQuarter(user) {
    const ind = INDUSTRIES[user.industry];
    const supplier = SUPPLIERS.find(s => s.id === user.supplierId);
    const maxProduction = user.employees * ind.capacityPerEmployee;
    const prodCost   = Math.min(user.productionTarget, maxProduction) * (ind.unitCost * supplier.costMod);
    const empWages   = user.employees * user.salaryOffer * 3;
    const ceoWages   = user.ceoSalary * 3;
    const fixedCosts = 10000;
    const totalExp   = prodCost + empWages + ceoWages + fixedCosts;

    // Soft bankruptcy — deduct what's available, log distress
    if (totalExp > user.compCash) {
        addLog(`${user.companyName} cannot cover Q${user.companyQuarter} expenses. Visit the office to restructure.`, 'bad');
    }
    user.compCash = Math.max(0, user.compCash - totalExp);
    user.money += ceoWages;

    // Event roll (same BUSINESS_EVENTS table)
    let activeEvent = null, cumulative = 0;
    const roll = Math.random();
    for (const ev of BUSINESS_EVENTS) {
        cumulative += ev.probability;
        if (roll < cumulative) { activeEvent = ev; break; }
    }
    if (activeEvent) {
        if (activeEvent.repDelta) user.businessReputation = Math.max(0, Math.min(100, user.businessReputation + activeEvent.repDelta));
        addLog(`${user.companyName}: ${activeEvent.name} — ${activeEvent.description}`, activeEvent.repDelta < 0 ? 'bad' : 'good');
    }

    // Resolve sales
    const priceFactor   = Math.pow((ind.unitPrice / user.sellingPrice), 1.5);
    const repFactor     = 0.5 + (user.businessReputation / 100);
    const volatility    = 1 + ((Math.random() - 0.5) * ind.volatility * 2);
    const actualDemand  = Math.floor(ind.baseDemand * repFactor * priceFactor * volatility);
    const effectiveProd = Math.min(user.productionTarget, maxProduction * (activeEvent?.productionCapMult ?? 1));
    const effectiveDemand = Math.floor(actualDemand * (activeEvent?.demandMult ?? 1));
    const available     = user.inventory + effectiveProd;
    const sold          = Math.min(available, effectiveDemand);
    const maxInventory  = ind.baseDemand * (user.businessUpgrades.includes('warehouse') ? 2 : 1);
    user.inventory      = Math.min(available - sold, maxInventory);

    let revenue = sold * user.sellingPrice + (activeEvent?.revenueFlat ?? 0);
    if (activeEvent?.revenuePenaltyPct > 0) revenue = Math.floor(revenue * (1 - activeEvent.revenuePenaltyPct));
    user.compCash += revenue;

    const profit = revenue - totalExp;
    if (sold < actualDemand) user.businessReputation = Math.max(0, user.businessReputation - 2);
    else user.businessReputation = Math.min(100, user.businessReputation + 1);

    user.businessHistory.push({ year: user.companyYear, quarter: user.companyQuarter, profit, revenue, event: activeEvent?.name ?? null });
    addLog(`${user.companyName} Q${user.companyQuarter}: Revenue ${Utils.formatMoney(revenue)}, Profit ${Utils.formatMoney(profit)}.`, profit >= 0 ? 'good' : 'bad');

    user.companyQuarter++;
    if (user.companyQuarter > 4) {
        user.companyQuarter = 1;
        user.companyYear++;
        const annualRevenue = user.businessHistory.slice(-4).reduce((s, q) => s + q.revenue, 0);
        addLog(`${user.companyName} fiscal year complete. Annual Revenue: ${Utils.formatMoney(annualRevenue)}.`, 'major');
    }
}
```

---

## Step 5 — Fix `createBusinessScreen.js` (Bug 2)

### 5a. Export and fix `initBusiness`

1. Export it: `export function initBusiness()`
2. Fix references: `showModal` → `UI.showModal`, `formatMoney` → `Utils.formatMoney`, `user.bank` → `user.money`
3. Import `renderBusinessDashboard` from `businessDashboard.js`
4. Add missing field initializations:
   ```js
   user.employees          = 5;
   user.businessReputation = 50;
   user.inventory          = 0;
   user.supplierId         = user.supplierId || 'standard';
   user.companyYear        = 1;
   user.companyQuarter     = 1;
   user.businessHistory    = [];
   user.businessUpgrades   = [];
   user.productionTarget   = Math.floor(ind.baseDemand * 0.8);
   user.sellingPrice       = ind.unitPrice;
   user.salaryOffer        = ind.baseSalary;
   ```
5. Change the final call to the now-exported `renderBusinessDashboard()`
6. Change the button: `data-action="showComingSoon"` → `data-action="initBusiness"`

### 5b. Add Supplier Selection UI

In `renderBusinessSetup`, after the industry cards section, add a supplier selection section using the same card pattern. Import `SUPPLIERS` (already imported).

Each card:
```html
<div id="sup-${s.id}" class="supplier-card border rounded-xl p-3 cursor-pointer ..."
     data-action="selectSupplier" data-args="'${s.id}'">
  <div>${s.name} — ${s.costMod}x cost, Quality ${s.quality}</div>
</div>
```

Add `export function selectSupplier(id)` mirroring `selectIndustry`. Default-select 'standard' at the bottom of `renderBusinessSetup`:
```js
selectSupplier('standard');
```

---

## Step 6 — Update `main.js` routeHandlers

Add imports and handlers for all new exported functions:

```js
import { ..., hireEmployee, layoffEmployee, sellBusiness, purchaseUpgrade } from '../features/business/businessDashboard.js';
import { ..., initBusiness, selectSupplier } from '../features/business/createBusinessScreen.js';
```

Add to `routeHandlers`:
```js
initBusiness, selectSupplier,
hireEmployee, layoffEmployee, sellBusiness, purchaseUpgrade,
```

---

## Step 7 — Update `mainScreen.js`

### 7a. Age-up integration

Add import at top:
```js
import { autoProcessBusinessQuarter } from '../business/businessDashboard.js';
```

In `handleFinances(user)`, add as the final block:
```js
// Business auto-quarter
if (user.hasBusiness) {
    autoProcessBusinessQuarter(user);
}
```

### 7b. Include `compCash` in death estate calculation

In `renderDeathScreen`, change `totalEstate` to:
```js
const companyCash = (user.hasBusiness && user.compCash > 0) ? user.compCash : 0;
const totalEstate = user.money + assetValue + companyCash;
```

---

## Dashboard UI Layout (What the Player Sees)

The completed dashboard should have these sections in order:

1. **Top bar** — back button, company name, `compCash` balance
2. **Event banner** — yellow, shows if the last quarter had a random event (hidden otherwise)
3. **Company stats row** — Fiscal Year, Quarter, Employees, Reputation
4. **Quarterly Projection box** — live revenue/cost/profit preview (updates on slider change)
5. **Slider controls** — Production (capped by employees × capacity), Price, Employee Salary, CEO Salary
6. **Action buttons row** — "Hire Employee" | "Layoff Employee" | "Sell Company" | "End Quarter"
7. **Upgrades section** — 4 upgrade cards; purchased ones show a checkmark and are disabled
8. **P&L Reports** — `<details>` collapsible, table of last 8 quarters from `user.businessHistory`

---

## Verification

1. **Smoke test**: Age to 18 → open occupation screen → navigate to business setup → confirm no console errors, industry + supplier cards render, default selections visible.
2. **Launch**: Enter name, click Launch Company → no "Coming Soon" modal, dashboard renders, all 4 sliders move and update live projection.
3. **Slider sync**: Drag each slider → paired number input updates. Type in number input → slider position updates.
4. **End Quarter**: Click through Q1–Q4 → Q4 fires annual report modal, then routes to life dashboard.
5. **Bankruptcy guard**: Maximize all salaries → End Quarter → modal fires, quarter does not advance.
6. **Hire/Layoff**: Test employee count changes, cost deductions, and the 1-employee floor.
7. **Upgrades**: Buy Marketing → rep increases. Buy R&D → price slider max changes. Purchased upgrades are disabled.
8. **Random events**: Run 10–20 quarters; at least one event should fire and display in banner + history table.
9. **Sell Business**: Confirm correct sale price formula, state resets, routes to Activities.
10. **Age-up integration**: Start business, stay on main dashboard, press Age Up 4× → life log shows 4 quarterly entries and then an annual summary.
11. **Death estate**: Force death while owning a business → death screen total includes `compCash`.
12. **Save/load**: After progressing business, save and reload → all business fields persist correctly.
13. **Dead code**: Grep for `router.js` and `moreToDoScreen.js` imports — zero results.
