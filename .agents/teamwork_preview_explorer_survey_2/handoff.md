# Handoff Report: State Management, Cryptography & Build Configuration Audit

**From**: `teamwork_preview_explorer_survey_2` (State & Cryptography Explorer)  
**To**: `teamwork_preview_orchestrator_1` (Conv ID: `c9e493c9-504a-44d3-889b-6f9b5020c961`)  
**Timestamp**: 2026-10-06T15:15:00Z  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

### Obs 1: Balance Management Disconnect & Runtime Crashes
- `src/utils/balance.js` exports `getBalance`, `setBalance`, `addToBalance`, `subtractFromBalance`, and `addHistoryEntry`.
- In `src/App.jsx` (lines 45–69), games are mounted as:
  ```jsx
  case 'crash': return <CrashGame onBack={onBack} />;
  case 'dice': return <DiceGame onBack={onBack} />;
  case 'mines': return <MinesGame onBack={onBack} />;
  case 'limbo': return <LimboGame onBack={onBack} />;
  case 'colortrading': return <ColorTradingGame onBack={onBack} />;
  case 'wheel': return <WheelGame onBack={onBack} />;
  ```
  Neither `balance` nor `setBalance` is passed to any child component.
- In `src/games/CrashGame.jsx`:
  - Line 7: `export default function CrashGame({ balance, setBalance, onBack })`
  - Line 251: `setBalance(b => b - betAmount);`
  - Line 132: `setBalanceRef.current(b => b + winAmt);`
  - Invoking `placeBet()` when `setBalance` is `undefined` throws verbatim error: `TypeError: setBalance is not a function`.
- In `src/games/ColorTradingGame.jsx`:
  - Line 7: `export default function ColorTradingGame({ balance, setBalance, onBack })`
  - Line 62: `setBalance(b => b - betAmount);`
  - Throws `TypeError: setBalance is not a function`.
- In `src/games/WheelGame.jsx`:
  - Line 15: `export default function WheelGame({ balance, setBalance, onBack })`
  - Line 35: `setBalance(b => b - betAmount);`
  - Throws `TypeError: setBalance is not a function`.
- In `src/games/DiceGame.jsx`, `MinesGame.jsx`, `LimboGame.jsx`, `TowerGame.jsx`, `HiLoGame.jsx`, `BlackjackGame.jsx`:
  - Zero imports from `src/utils/balance.js`.
  - Zero balance deductions on bet, zero additions on win, zero loss entries. Bets are completely free/fictitious.
- In `src/games/SlotsGame.jsx`:
  - Line 7 imports `{ getBalance, subtractFromBalance, addToBalance }`, but does NOT import or call `addHistoryEntry`.
- In `src/App.jsx`:
  - Line 18: `// Keno was omitted in my agent calls above, I'll stub it`
  - Line 58: `case 'keno': return <ComingSoon title="Keno" onBack={onBack} />;`
  - There is no `KenoGame.jsx` component in `src/games/`.
- Only 4 games properly integrate full balance operations and history logging: `PlinkoGame.jsx`, `RouletteGame.jsx`, `BaccaratGame.jsx`, and `VideoPokerGame.jsx`.

### Obs 2: Pseudo-Hash & Artificial 32.67x Crash Cap in `src/utils/provablyFair.js`
- Line 1: `import crypto from 'crypto';` (unused Node built-in import).
- Lines 23–41: `hmacSHA256(key, message)` uses a 32-bit Java `String.hashCode` simulation (`((hash << 5) - hash) + char`) expanded with a standard glibc LCG (`(seed * 1103515245 + 12345) & 0x7fffffff`). It does not use Web Crypto SubtleCrypto or true SHA-256.
- Lines 51–59 in `src/utils/provablyFair.js`:
  ```javascript
  51: // Crash point from hash (Bustabit algorithm)
  52: export function getCrashPoint(serverSeed, clientSeed) {
  53:   const floats = getProvablyFairFloats(serverSeed, clientSeed, 0, 1);
  54:   const h = floats[0];
  55:   // 1 in 33 chance of instant crash (house edge)
  56:   if (Math.floor(h * 33) === 0) return 1.00;
  57:   const e = 1;
  58:   return Math.max(1.00, Math.floor((0.99 / h) * 100) / 100);
  59: }
  ```
  - Line 56: `Math.floor(h * 33) === 0` holds for all $h \in [0, 1/33)$. All such inputs return $1.00$.
  - Line 58: For all remaining $h \in [1/33, 1)$, the multiplier is $\lfloor (0.99 / h) \times 100 \rfloor / 100$.
  - The maximum value of $0.99 / h$ on $[1/33, 1)$ occurs at $h = 1/33$:
    $$0.99 / (1/33) = 0.99 \times 33 = 32.67$$
  - Multipliers exceeding 32.67x are mathematically impossible to generate.
- Line 69: `export async function hashSeed(seed)` is defined but never called anywhere across `src/`.
- Lines 79 & 88: Client seeds are hardcoded to `'default'`.

### Obs 3: Build & Rendering Deprecations
- `package.json` specifies `"pixi.js": "^8.1.0"`.
- `src/games/RouletteGame.jsx` invokes PixiJS v7 drawing calls:
  - Line 71: `rim.beginFill(0x0F212E);`
  - Line 72: `rim.lineStyle(4, 0xFFD700);`
  - Line 73: `rim.drawCircle(0, 0, wheelRadius + 20);`
  - Line 75: `rim.endFill();`
  - Line 83: `slice.beginFill(color);`
  - Line 87: `slice.endFill();`
  - Line 114: `pointer.beginFill(0xFFFFFF); pointer.drawPolygon([...]); pointer.endFill();`
  These calls violate PixiJS v8 API standards.

---

## 2. Logic Chain

1. **Premise 1 (State Breakdown)**: From Obs 1, `App.jsx` passes only `onBack` to all game components. `CrashGame`, `ColorTradingGame`, and `WheelGame` execute `setBalance(...)` upon bet placement. Because `setBalance` is undefined, any bet attempt in these three games produces an unhandled `TypeError`, crashing the game loop.
2. **Premise 2 (Ghost Betting)**: From Obs 1, 6 games (`Dice`, `Mines`, `Limbo`, `Tower`, `Hi-Lo`, `Blackjack`) do not interface with `balance.js`. Therefore, their betting interfaces are cosmetic and completely detached from the user's persistent wallet.
3. **Premise 3 (Audit Omission)**: From Obs 1, `Keno` has no implementation file and is rendered as a placeholder.
4. **Premise 4 (Crash Cap Proof)**: From Obs 2, `getCrashPoint` uses $M(h) = 0.99 / h$ on the domain $h \in [1/33, 1)$. Because $M'(h) = -0.99 / h^2 < 0$, $M(h)$ is strictly decreasing. Its maximum is attained at $h = 1/33$, yielding $M(1/33) = 32.67$. For all $h < 1/33$, Line 56 forces the return value to $1.00$. Hence, the maximum possible multiplier is strictly bounded by $32.67x$, creating an artificial cap that decimates game RTP and diverges from real-world Crash games (Stake/Bustabit).
5. **Premise 5 (Provably Fair Insecurity)**: From Obs 2, `hmacSHA256` reduces all seed and nonce combinations to a 32-bit integer via Java `hashCode` and expands it via a glibc LCG. An adversary can invert or brute-force this in milliseconds, violating provable fairness.
6. **Premise 6 (Build & Runtime Fragility)**: From Obs 3, `RouletteGame.jsx` calls removed/deprecated PixiJS v7 methods on PixiJS v8. In addition, `provablyFair.js` imports Node's built-in `crypto` which is unused and unsupported in standard browser bundling without polyfills.

---

## 3. Caveats

- **No Live Headless Build Execution in This Subturn**: Running terminal commands (`npm run build`) in this environment requires interactive user approval which timed out. Analysis was performed through exhaustive static AST and code analysis.
- **Audio Autoplay Constraints**: Procedural audio (`src/utils/audio.js`) relies on `Howler.ctx`, which may be blocked by browser autoplay policies until user interaction occurs.
- **Floating-Point Precision in Storage**: `src/utils/balance.js` parses float strings (`parseFloat(amount.toFixed(8))`). While 8 decimals match Bitcoin satoshi precision, binary floating-point representation can introduce tiny roundoff artifacts without BigInt or decimal arithmetic libraries.

---

## 4. Conclusion

The application exhibits deep state fragmentation and cryptographic flaws:
1. **Balance Unification Needed**: 11 out of 15 games either crash (`Crash`, `Color Trading`, `Wheel`), operate entirely free without wallet balance (`Dice`, `Mines`, `Limbo`, `Tower`, `Hi-Lo`, `Blackjack`), miss history logging (`Slots`), or are not implemented (`Keno`).
2. **Cryptographic Remediation Needed**: `src/utils/provablyFair.js` must replace its pseudo-hash with WebCrypto / SHA-256 and rewrite `getCrashPoint` to eliminate the 32.67x multiplier cap by implementing the proper Stake/Bustabit formula: $0.97 / (1 - h)$ or independent modulus testing.
3. **PixiJS v8 Compatibility Needed**: `RouletteGame.jsx` must replace v7 graphics methods with v8 `.circle()`, `.poly()`, `.fill()`, and `.stroke()`.

All root causes, affected file paths, line numbers, and remediation specifications have been fully documented in `analysis.md`.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Crash Multiplier Cap**:
   - Inspect `src/utils/provablyFair.js` lines 53–58.
   - Run a 100,000-iteration evaluation of `getCrashPoint(generateServerSeed(), 'test')`:
     `console.assert(Math.max(...results) <= 32.67)` will never fail.
2. **Verify Undefined `setBalance` Runtime Crash**:
   - Inspect `src/App.jsx` line 48 (`<CrashGame onBack={onBack} />`) vs `src/games/CrashGame.jsx` lines 7 & 251.
   - Mounting `CrashGame` and triggering `placeBet()` executes `setBalance(b => b - betAmount)` where `setBalance === undefined`, throwing `TypeError`.
3. **Verify PixiJS v7 Calls in Roulette**:
   - Inspect `src/games/RouletteGame.jsx` lines 71–75, 83–87, 106–107, 114, 123.
   - Compare with PixiJS v8 API docs: `beginFill`, `lineStyle`, `drawCircle`, and `endFill` are deprecated/removed from v8 `Graphics`.
4. **Verify History Entry Omission in Slots**:
   - Inspect `src/games/SlotsGame.jsx` line 7 and lines 299–307. Confirm `addHistoryEntry` is never imported or called.
