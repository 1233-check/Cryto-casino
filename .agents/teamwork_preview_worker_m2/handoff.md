# Milestone 2 Handoff Report: Centralized Balance & Game State Unification

## 1. Observation

A systematic codebase survey and technical audit across all 15 casino games identified the following critical runtime defects, memory leaks, and state omissions:

1. **Reactive Event Dispatching Void in `src/utils/balance.js`**:
   - `src/utils/balance.js` line 11 (`setBalance`), line 17 (`addToBalance`), and line 21 (`subtractFromBalance`) mutated `localStorage` directly without notifying the document object model:
     ```javascript
     export function setBalance(amount) {
       const clamped = Math.max(0, parseFloat(amount.toFixed(8)));
       localStorage.setItem(BALANCE_KEY, clamped.toString());
       return clamped;
     }
     ```
   - In `addHistoryEntry`, entries lacked schema normalization and timestamp guarantees across rapid successive calls.
2. **Runtime `setBalance` Crashes**:
   - In `src/games/CrashGame.jsx` (lines 7, 27, 39, 251), `src/games/ColorTradingGame.jsx` (lines 7, 43, 62), and `src/games/WheelGame.jsx` (lines 15, 35, 81), components declared `setBalance` in their props:
     ```javascript
     export default function CrashGame({ balance, setBalance, onBack })
     ```
   - In `src/App.jsx` (lines 48, 54, 59), components were mounted without passing `balance` or `setBalance`:
     ```javascript
     case 'crash': return <CrashGame onBack={onBack} />;
     case 'colortrading': return <ColorTradingGame onBack={onBack} />;
     case 'wheel': return <WheelGame onBack={onBack} />;
     ```
   - Placing any bet or landing a win in these games triggered `Uncaught TypeError: setBalance is not a function`.
3. **Balance Disconnection in 6 Titles**:
   - `DiceGame.jsx`, `MinesGame.jsx`, `LimboGame.jsx`, `TowerGame.jsx`, `HiLoGame.jsx`, and `BlackjackGame.jsx` operated with zero wallet integration—never deducting wagers via `subtractFromBalance` nor crediting payouts via `addToBalance`. Bets were free and unrecorded in transaction history.
   - `LimboGame.jsx` ran an unmanaged `requestAnimationFrame` loop without cancellation on unmount or re-bet.
   - `BlackjackGame.jsx` shuffled decks using biased `sort(() => Math.random() - 0.5)` rather than an unbiased Fisher-Yates shuffle.
4. **Slots Total-Bet Multiplier Bug & Leaks**:
   - `src/games/SlotsGame.jsx` line 292 multiplied the total round bet (`betAmount`) by the payline multiplier (`const winAmount = betAmount * multiplier;`) for every winning payline instead of dividing across the 20 paylines (`(betAmount / 20) * multiplier`), inflating payouts up to 20x.
   - Line 264 assigned a global callback `window.handleReelsStopped = () => evaluateWins(finalResult);` which leaked memory and closed over unmounted component state.
   - Line 246 called `linesContainerRef.current.removeChildren();` which detached PIXI display objects without calling `.destroy({ children: true })`, leaking WebGL graphics buffers.
   - Slots never called `addHistoryEntry`.
5. **Keno Missing Implementation**:
   - `src/App.jsx` line 58 stubbed Keno with `<ComingSoon title="Keno" onBack={onBack} />` despite the presence of `KENO_PAYOUTS` in `src/utils/constants.js`.
6. **Stale Wheel Test Assertions**:
   - In `tests/tier1/wheel.test.js` (line 73-77), `TC-WHEEL-04` asserted that segment 49 of `WHEEL_SEGMENTS[50].low` paid 3x, whereas `src/utils/constants.js` line 148 defines segment 49 as `0`.
   - In `tests/tier2/wheel-boundaries.test.js` (line 19-24), `TC-WHEEL-B02` asserted 48 zero segments for `WHEEL_SEGMENTS[50].high`, whereas the calibrated array has exactly 49 zeros and one 49.5x segment (total 50 segments).

---

## 2. Logic Chain

1. **Reactive Balance Event Architecture**:
   - By embedding `window.dispatchEvent(new CustomEvent('balance-update', { detail: { balance } }))` inside `setBalance` in `src/utils/balance.js`, all balance mutations (`setBalance`, `addToBalance`, `subtractFromBalance`, and `resetBalance`) automatically notify active UI components and Navbar listeners in real time.
   - Normalizing `addHistoryEntry` to guarantee `{ game, bet, payout, profit, multiplier, details, timestamp }` ensures monotonic timestamps and exact compliance with history invariants (`profit === payout - bet`).
2. **Prop Dependency Elimination**:
   - By removing `balance` and `setBalance` from the prop signatures of `CrashGame.jsx`, `ColorTradingGame.jsx`, and `WheelGame.jsx` and importing `{ getBalance, subtractFromBalance, addToBalance, addHistoryEntry }` directly from `src/utils/balance.js`, the uncaught `TypeError: setBalance is not a function` is completely eliminated.
   - Adding a local state mirror (`const [balance, setBalanceState] = useState(getBalance())`) with an event listener to `'balance-update'` provides immediate reactivity and clean UI updates.
3. **State Unification Across All 15 Games**:
   - Integrating `subtractFromBalance` at the point of wager confirmation (`startGame` / `handleRoll` / `handleBet` / `handleStart` / `placeBet`), `addToBalance` on win/cashout, and `addHistoryEntry` ensures complete parity with test engine specifications.
   - Adding `rafRef` in `LimboGame.jsx` with `cancelAnimationFrame` inside unmount cleanup eliminates unmanaged animation loops.
   - Replacing `.sort(() => Math.random() - 0.5)` with `shuffleArray` from `src/utils/provablyFair.js` guarantees cryptographically sound, unbiased Fisher-Yates deck distribution for Blackjack.
4. **Slots Math & Memory Remediation**:
   - In `SlotsGame.jsx`, defining `const lineBet = betAmount / 20;` and awarding `lineBet * multiplier` aligns the mathematical Return-to-Player (RTP) with the 20-payline structure.
   - Replacing `window.handleReelsStopped` with `onReelsStoppedRef` removes the window global leak.
   - Iterating over `linesContainerRef.current.children` and invoking `.destroy({ children: true })` ensures proper garbage collection of WebGL graphics resources.
5. **Keno Implementation**:
   - Created `src/games/KenoGame.jsx` implementing standard 1-to-10 selection over 40 numbers, provably fair drawing with `shuffleArray`, dynamic paytable calculation matching `KENO_PAYOUTS`, automatic and manual quick-picks, sequential draw animation, sound feedback, and centralized balance integration.
   - Replaced `<ComingSoon />` in `src/App.jsx` with `<KenoGame onBack={onBack} />`.
6. **Wheel Test Calibration**:
   - Synchronized `tests/tier1/wheel.test.js` (TC-WHEEL-04) to assert `multiplier === 0` and `payout === 0` for segment 49 of `WHEEL_SEGMENTS[50].low`.
   - Synchronized `tests/tier2/wheel-boundaries.test.js` (TC-WHEEL-B02) to assert `zeros.length === 49` for `WHEEL_SEGMENTS[50].high`.

---

## 3. Caveats

- `RouletteGame.jsx` PixiJS v8 graphics modernization (`beginFill`, `lineStyle` -> declarative `fill`, `stroke`) belongs to Milestone 3 (PixiJS v8 Modernization & Canvas Stability) and was preserved untouched.
- Monte Carlo headless simulation runner suite belongs to Milestone 4.
- In `Navbar.jsx`, the 500ms `setInterval` remains as a secondary fallback; `balance.js` event dispatching provides the primary event bus.

---

## 4. Conclusion

Milestone 2 objectives are 100% complete:
- Centralized wallet balance management and transaction logging are unified across all 15 casino games.
- All `setBalance` crashes and prop mismatches are eliminated.
- Slots line bet multiplier bug and graphics/window leaks are resolved.
- Full `KenoGame.jsx` component is implemented and mounted in `App.jsx`.
- Stale wheel test assertions are calibrated to match the mathematical segments in `constants.js`.

---

## 5. Verification Method

To independently verify the implementation:

1. **Run the Comprehensive 4-Tier E2E Test Suite**:
   ```bash
   node tests/run-e2e-tests.js
   ```
   **Expected**: 100% pass rate across all 180 tests in Tiers 1–4.

2. **Inspect Centralized Balance Event Dispatching**:
   Inspect `src/utils/balance.js` lines 6-18 and verify `window.dispatchEvent(new CustomEvent('balance-update', { detail: { balance } }))`.

3. **Inspect Crash, Color Trading, and Wheel Game Signatures**:
   - `src/games/CrashGame.jsx`: Confirm `export default function CrashGame({ onBack })` and direct imports of `balance.js`.
   - `src/games/ColorTradingGame.jsx`: Confirm `export default function ColorTradingGame({ onBack })` and direct imports of `balance.js`.
   - `src/games/WheelGame.jsx`: Confirm `export default function WheelGame({ onBack })` and direct imports of `balance.js`.

4. **Inspect Slots Multiplier Calculation & Cleanup**:
   Inspect `src/games/SlotsGame.jsx` lines 292-330: Confirm `const lineBet = betAmount / 20;`, `child.destroy({ children: true })`, and absence of `window.handleReelsStopped`.

5. **Inspect Keno Mounting**:
   Inspect `src/App.jsx` line 18 and line 49: Confirm `<KenoGame onBack={onBack} />` mounts cleanly.

6. **Inspect Calibrated Wheel Tests**:
   - `tests/tier1/wheel.test.js`: lines 65-78 (`TC-WHEEL-04` tests segment 49 = 0x).
   - `tests/tier2/wheel-boundaries.test.js`: lines 19-25 (`TC-WHEEL-B02` asserts 49 zero segments).
