# BRIEFING — 2026-10-06T16:21:00Z

## Mission
Unify centralized balance management (src/utils/balance.js) across all 15 casino games, eliminate all broken setBalance crashes, fix Slots line bet multiplier bug & memory leaks, implement src/games/KenoGame.jsx, mount it in src/App.jsx, and calibrate stale wheel tests.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa
- Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_worker_m2\
- Original parent: c9e493c9-504a-44d3-889b-6f9b5020c961
- Milestone: M2 (Centralized Balance & Game State Unification)

## 🔒 Key Constraints
- Write Ownership exclusively restricted to:
  - src/utils/balance.js
  - src/games/CrashGame.jsx
  - src/games/DiceGame.jsx
  - src/games/MinesGame.jsx
  - src/games/LimboGame.jsx
  - src/games/ColorTradingGame.jsx
  - src/games/TowerGame.jsx
  - src/games/HiLoGame.jsx
  - src/games/WheelGame.jsx
  - src/games/SlotsGame.jsx
  - src/games/BlackjackGame.jsx
  - src/games/KenoGame.jsx
  - src/App.jsx
  - tests/tier1/wheel.test.js
  - tests/tier2/wheel-boundaries.test.js
- Integrity Mandate: Genuine logic, no hardcoded test shortcuts or facades.
- All 180 E2E tests must pass.
- Minimal change principle on existing files; follow existing conventions.

## Current Parent
- Conversation ID: c9e493c9-504a-44d3-889b-6f9b5020c961
- Updated: 2026-10-06T16:21:00Z

## Task Summary
- **What to build**:
  1. `src/utils/balance.js`: Custom event `balance-update` dispatching, proper formatting and timestamping in `addHistoryEntry`.
  2. Fix `setBalance` crashes: `CrashGame.jsx`, `ColorTradingGame.jsx`, `WheelGame.jsx` (remove props dependency, use `balance.js`).
  3. Balance unification: `DiceGame.jsx`, `MinesGame.jsx`, `LimboGame.jsx`, `TowerGame.jsx`, `HiLoGame.jsx`, `BlackjackGame.jsx`. Deduct bet, credit win/cashout, call `addHistoryEntry`.
  4. Fix Limbo unmanaged RAF with cancellation on unmount and re-bet.
  5. Fix Blackjack Fisher-Yates deck shuffle using `shuffleArray`.
  6. Fix SlotsGame.jsx: line bet multiplier `(betAmount / 20) * multiplier`, add `addHistoryEntry`, remove `window.handleReelsStopped` leak, destroy old Graphics in `linesContainerRef`.
  7. Implement `KenoGame.jsx` with 1-10 picks out of 40 numbers, provably fair draw, paytable matching `KENO_PAYOUTS`, `balance.js` integration. Mount in `src/App.jsx`.
  8. Calibrate `tests/tier1/wheel.test.js` (TC-WHEEL-04) and `tests/tier2/wheel-boundaries.test.js` (TC-WHEEL-B02) to match calibrated `WHEEL_SEGMENTS`.
- **Success criteria**: All requirements addressed with genuine code modifications, zero runtime crashes, clean balance integration across all 15 titles.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Change Tracker
- **Files modified**:
  - `src/utils/balance.js`: Added `balance-update` CustomEvent dispatch on balance mutations, enhanced `addHistoryEntry` with validation, timestamping, formatting, and max 100 ring buffer capping.
  - `src/games/CrashGame.jsx`: Removed `setBalance` prop expectation; integrated `balance.js`; added history logging on cashouts and crashes.
  - `src/games/ColorTradingGame.jsx`: Removed `setBalance` prop expectation; integrated `balance.js`; added history logging.
  - `src/games/WheelGame.jsx`: Removed `setBalance` prop expectation; integrated `balance.js`; added history logging.
  - `src/games/DiceGame.jsx`: Deducts bet on roll; credits win payout; logs transaction history.
  - `src/games/MinesGame.jsx`: Deducts bet on start; credits cashout payout; logs transaction history.
  - `src/games/LimboGame.jsx`: Deducts bet on roll; credits win; logs transaction history; manages RAF with cancellation.
  - `src/games/TowerGame.jsx`: Deducts bet on start; credits cashout; logs transaction history.
  - `src/games/HiLoGame.jsx`: Deducts bet on start; credits cashout; logs transaction history.
  - `src/games/BlackjackGame.jsx`: Deducts bet on deal/double; credits win/push; logs transaction history; shuffles deck with Fisher-Yates `shuffleArray`.
  - `src/games/SlotsGame.jsx`: Divides betAmount across 20 paylines for line payouts; logs transaction history; removes `window.handleReelsStopped` global leak; properly destroys old Graphics in `linesContainerRef`.
  - `src/games/KenoGame.jsx`: Created complete, functional component with 1-10 picks, provably fair draw, dynamic paytable, and `balance.js` integration.
  - `src/App.jsx`: Mounted `KenoGame` replacing `ComingSoon`.
  - `tests/tier1/wheel.test.js`: Calibrated TC-WHEEL-04 assertion to match calibrated `WHEEL_SEGMENTS[50].low[49] === 0`.
  - `tests/tier2/wheel-boundaries.test.js`: Calibrated TC-WHEEL-B02 assertion to 49 zero segments for `WHEEL_SEGMENTS[50].high`.
- **Build status**: Ready for verification
- **Pending issues**: None

## Quality Status
- **Build/test result**: All 15 games integrated with centralized balance store and audited against 4-tier test specifications
- **Lint status**: Clean
- **Tests added/modified**: `tests/tier1/wheel.test.js`, `tests/tier2/wheel-boundaries.test.js`

## Key Decisions Made
- Used `window.dispatchEvent(new CustomEvent('balance-update', { detail: { balance } }))` with fallback object check for headless/SSR environments.
- Maintained exact transaction schema `{ game, bet, payout, profit, multiplier, details, timestamp }` matching test engines and `balance.js` contracts.
- Completely removed global window mutations in `SlotsGame.jsx` and replaced with component refs.

## Artifact Index
- `.agents/teamwork_preview_worker_m2/BRIEFING.md` — Persistent agent memory
- `.agents/teamwork_preview_worker_m2/progress.md` — Liveness heartbeat and milestone tracker
- `.agents/teamwork_preview_worker_m2/handoff.md` — 5-component completion handoff report
