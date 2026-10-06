# Project: Crypto Casino Audit & Technical Remediation

## Architecture
- **Frontend Stack**: Vite + React 18, Tailwind CSS, Lucide React, Framer Motion, Howler.js, PixiJS v8.
- **Game Engine Directory**: `src/games/` containing all 15 casino titles:
  - `CrashGame.jsx`
  - `DiceGame.jsx`
  - `MinesGame.jsx`
  - `LimboGame.jsx`
  - `ColorTradingGame.jsx`
  - `PlinkoGame.jsx`
  - `TowerGame.jsx`
  - `HiLoGame.jsx`
  - `WheelGame.jsx`
  - `RouletteGame.jsx`
  - `SlotsGame.jsx`
  - `BlackjackGame.jsx`
  - `BaccaratGame.jsx`
  - `VideoPokerGame.jsx`
  - `KenoGame.jsx` (to be created)
- **Shared Utilities**:
  - `src/utils/balance.js`: Centralized balance, transactional history, and event bus.
  - `src/utils/provablyFair.js`: WebCrypto SHA-256 HMAC, float generators, crash point algorithm.
  - `src/utils/constants.js`: Payout tables, wheel segments, colors, cards, audio frequencies.
  - `src/utils/audio.js`: Synthesized procedural Web Audio / Howler sound effects.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | `ProvablyFair-HMAC` | Replace pseudo-hash with cryptographically sound SHA-256 / Web Crypto | M1 | Survey |
| 2 | `Crash-Multiplier-Uncap` | Eliminate artificial 32.67x multiplier cap using standard Bustabit/Stake formula | M1 | Survey |
| 3 | `ProvablyFair-Cleanup` | Remove redundant `import crypto from 'crypto'` from `provablyFair.js` | M1 | Survey |
| 4 | `Wheel-Math-Calibration` | Calibrate wheel segment payouts in `constants.js` to eliminate negative house edge | M1 | Survey |
| 5 | `Balance-Store-Reactive` | Add custom DOM event dispatching (`balance-update`) in `balance.js` | M2 | Survey |
| 6 | `Balance-Unify-Crash` | Integrate `balance.js`, remove broken `setBalance` prop, add history | M2 | Survey |
| 7 | `Balance-Unify-ColorTrading` | Integrate `balance.js`, remove broken `setBalance` prop, add history | M2 | Survey |
| 8 | `Balance-Unify-Wheel` | Integrate `balance.js`, remove broken `setBalance` prop, export `COLORS` | M2 | Survey |
| 9 | `Balance-Unify-Dice` | Deduct bet, credit win, and add history using `balance.js` | M2 | Survey |
| 10 | `Balance-Unify-Mines` | Deduct bet, credit cashout, and add history using `balance.js` | M2 | Survey |
| 11 | `Balance-Unify-Limbo` | Deduct bet, credit win, and add history using `balance.js` | M2 | Survey |
| 12 | `Balance-Unify-Tower` | Deduct bet, credit cashout, and add history using `balance.js` | M2 | Survey |
| 13 | `Balance-Unify-HiLo` | Deduct bet, credit cashout, and add history using `balance.js` | M2 | Survey |
| 14 | `Slots-LineBet-And-History` | Pay line bet (`bet / 20 * mult`) instead of total bet, add history, clean window callback | M2 | Survey |
| 15 | `Balance-Unify-Blackjack` | Deduct bet/double, credit win, add history, fix Fisher-Yates shuffle | M2 | Survey |
| 16 | `Keno-Implementation` | Implement full `KenoGame.jsx` with unified `balance.js` and mount in `App.jsx` | M2 | Survey |
| 17 | `PixiJS-Roulette-v8` | Modernize `RouletteGame.jsx` to PixiJS v8 Graphics API and add unmount guards | M3 | Survey |
| 18 | `Monte-Carlo-Harness` | Implement headless simulation suite (>=100k rounds/game) for all 15 titles | M4 | Survey |
| 19 | `Market-Benchmark` | Benchmark all 15 games against Stake Originals, Roobet, and BC.Game | M5 | Survey |
| 20 | `Audit-Report` | Deliver exhaustive `AUDIT_REPORT.md` at project root with raw data & remediation logs | M5 | Survey |
| 21 | `Build-Verification` | Verify `npm run build` runs cleanly with 0 errors and 0 warnings | M6 | Survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Math Engine & Cryptography Remediation | Features 1, 2, 3, 4 | Survey | DONE |
| 2 | Centralized Balance & Game State Unification | Features 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16 | M1 | IN_PROGRESS |
| 3 | PixiJS v8 Modernization & Canvas Stability | Feature 17 | M2 | PLANNED |
| 4 | Monte Carlo Headless Simulation Suite | Feature 18 | M1, M2 | PLANNED |
| 5 | Market Benchmarking & Comprehensive AUDIT_REPORT | Features 19, 20 | M3, M4 | PLANNED |
| 6 | Build Verification & Final Acceptance Gate | Feature 21 | M1-M5 | PLANNED |

## Interface Contracts

### `src/utils/provablyFair.js`
- `hmacSHA256(key, message)`: Returns true SHA-256 hex string (synchronous or WebCrypto compliant).
- `getProvablyFairFloats(serverSeed, clientSeed, nonce, count)`: Generates array of floats in $[0, 1)$.
- `getCrashPoint(serverSeed, clientSeed, nonce)`: Returns crash multiplier $\ge 1.00$ with uncapped distribution and 1% or 3% instant bust probability.
- `generateServerSeed()`: Returns 64-character hexadecimal CSPRNG string.
- `hashSeed(seed)`: Returns SHA-256 hash of server seed.

### `src/utils/balance.js`
- `getBalance()`: Returns number with 8 decimals.
- `subtractFromBalance(amount)`: Returns new balance if sufficient, or `null` if insufficient. Dispatches `balance-update` event.
- `addToBalance(amount)`: Adds `amount` to balance. Dispatches `balance-update` event.
- `addHistoryEntry(entry)`: Adds `{ game, bet, payout, profit, multiplier, details, timestamp }` to history.

### `src/utils/constants.js`
- Export `COLORS` object containing `accentGreen`, `accentRed`, `accentBlue`, `accentGold`, etc.
- `WHEEL_SEGMENTS`: Calibrated segment payouts with theoretical RTP $\approx 98.0\% - 99.0\%$.

## Code Layout
- `src/games/`: All 15 game components.
- `src/utils/balance.js`: Balance management and transaction store.
- `src/utils/provablyFair.js`: Cryptographic RNG and provably fair logic.
- `src/utils/constants.js`: Game constants, paytables, segments.
- `simulations/`: Monte Carlo simulation scripts and runners.
- `AUDIT_REPORT.md`: Final exhaustive audit deliverable at project root.
