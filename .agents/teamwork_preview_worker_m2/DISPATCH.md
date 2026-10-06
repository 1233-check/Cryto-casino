## 2026-10-06T15:49:32Z

# Task Assignment: Milestone 2 Worker (Centralized Balance & Game State Unification)

## Mission
Unify centralized balance management (`src/utils/balance.js`) across all casino games, eliminate all broken `setBalance` crashes, fix Slots line bet multiplier bug & memory leaks, implement `src/games/KenoGame.jsx`, mount it in `src/App.jsx`, and calibrate stale wheel tests.

## Inputs & Context
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Project Scope: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\PROJECT.md
- Original Request: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md
- Survey Analysis Reports:
  - `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_1\analysis.md`
  - `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_2\analysis.md`
  - `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_spec_miner_survey_3\analysis.md`
- Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_worker_m2\

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership
You EXCLUSIVELY own:
- `src/utils/balance.js`
- `src/games/CrashGame.jsx`
- `src/games/DiceGame.jsx`
- `src/games/MinesGame.jsx`
- `src/games/LimboGame.jsx`
- `src/games/ColorTradingGame.jsx`
- `src/games/TowerGame.jsx`
- `src/games/HiLoGame.jsx`
- `src/games/WheelGame.jsx`
- `src/games/SlotsGame.jsx`
- `src/games/BlackjackGame.jsx`
- `src/games/KenoGame.jsx` (create new component)
- `src/App.jsx`
- `tests/tier1/wheel.test.js`
- `tests/tier2/wheel-boundaries.test.js`

## Specific Requirements
1. **`src/utils/balance.js`**:
   - Add custom event dispatching (`window.dispatchEvent(new CustomEvent('balance-update', { detail: { balance } }))`) on every `setBalance`, `addToBalance`, and `subtractFromBalance`.
   - Ensure `addHistoryEntry` formats timestamps and persists valid entries.
2. **Fix `setBalance` Runtime Crashes**:
   - In `CrashGame.jsx`, `ColorTradingGame.jsx`, and `WheelGame.jsx`: remove expectations of `setBalance` from props. Import and use `{ getBalance, subtractFromBalance, addToBalance, addHistoryEntry }` directly from `src/utils/balance.js`.
3. **Unify Balance Across All Other Games**:
   - In `DiceGame.jsx`: deduct bet on roll, add win on payout, call `addHistoryEntry`.
   - In `MinesGame.jsx`: deduct bet on game start, add payout on cashout, call `addHistoryEntry`.
   - In `LimboGame.jsx`: deduct bet on start, add payout on win, call `addHistoryEntry`. Clean unmanaged RAF.
   - In `TowerGame.jsx`: deduct bet on start, add payout on cashout, call `addHistoryEntry`.
   - In `HiLoGame.jsx`: deduct bet on start, add payout on cashout, call `addHistoryEntry`.
   - In `BlackjackGame.jsx`: deduct bet on deal / double, add payout on win/push, call `addHistoryEntry`. Use Fisher-Yates deck shuffle.
4. **Fix Slots Game (`SlotsGame.jsx`)**:
   - Fix total-bet multiplier bug: divide `betAmount` across the 20 paylines (`(betAmount / 20) * multiplier`) so total payout reflects line payouts instead of multiplying total bet by each winning line.
   - Import and call `addHistoryEntry`.
   - Eliminate `window.handleReelsStopped` global leak.
   - Properly destroy previous PIXI Graphics in `linesContainerRef`.
5. **Implement `KenoGame.jsx`**:
   - Create complete, functional `src/games/KenoGame.jsx`.
   - Allow player to select 1 to 10 numbers from 1 to 40 (or 80), place bet with `subtractFromBalance`, draw winning numbers with provably fair RNG, calculate matches against `KENO_PAYOUTS` in `src/utils/constants.js`, credit winnings with `addToBalance`, and log history with `addHistoryEntry`.
   - In `src/App.jsx`: replace `<ComingSoon title="Keno" onBack={onBack} />` with `<KenoGame onBack={onBack} />`.
6. **Update Stale Wheel Tests**:
   - In `tests/tier1/wheel.test.js` and `tests/tier2/wheel-boundaries.test.js`, update segment assertions to match the newly calibrated `WHEEL_SEGMENTS` in `src/utils/constants.js`.
7. **Verification**:
   - Run `node tests/run-e2e-tests.js` and verify all 180 E2E tests pass 100%.
   - Run verification script to confirm every single one of the 15 games can deduct bets and record history in `balance.js`.
8. **Deliverables**:
   - Write comprehensive report in `handoff.md`.
   - Update `progress.md`.
   - Notify parent via `send_message`.
