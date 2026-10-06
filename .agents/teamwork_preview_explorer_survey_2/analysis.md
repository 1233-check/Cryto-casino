# Technical Survey: State Management, Cryptography, and Build Architecture Audit

**Target System**: Crypto Casino (`c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino`)  
**Auditor**: Teamwork Explorer (State & Cryptography Specialist)  
**Date**: October 6, 2026  
**Scope**: `src/utils/balance.js`, `src/utils/provablyFair.js`, all 15 casino titles in `src/games/` & `src/App.jsx`, and project build configuration.

---

## 1. Executive Summary

This investigation conducted a deep technical audit of state management, cryptographic mechanics, and build readiness across the Crypto Casino application. Key architectural findings include:

1. **State Fragmentation & Runtime Crashes**:
   - `src/utils/balance.js` provides centralized balance management (`getBalance`, `subtractFromBalance`, `addToBalance`, `addHistoryEntry`) backed by `localStorage`, but **only 4 of 15 games** properly integrate with it (`Plinko`, `Roulette`, `Baccarat`, `Video Poker`).
   - 1 game (`Slots`) partially integrates with balance operations but fails to record history entries (`addHistoryEntry`).
   - 3 games (`Crash`, `Color Trading`, `Wheel`) attempt to invoke a `setBalance` callback passed via props. However, `src/App.jsx` **never passes** `balance` or `setBalance` to any child component. Consequently, placing a bet in `Crash`, `Color Trading`, or `Wheel` immediately throws an uncaught `TypeError: setBalance is not a function`, locking the game UI.
   - 6 games (`Dice`, `Mines`, `Limbo`, `Tower`, `Hi-Lo`, `Blackjack`) do not interface with `balance.js` or props at all; bets are completely fictitious/free, and winnings/losses never alter the wallet balance.
   - 1 game (`Keno`) is entirely missing—it is stubbed with a generic `<ComingSoon />` component in `src/App.jsx`.
   - `src/components/Navbar.jsx` polls `getBalance()` via an uncoordinated 500ms `setInterval`, lacking any reactive event dispatching or state subscription system.

2. **Provably Fair Algorithm Vulnerabilities**:
   - `src/utils/provablyFair.js` claims to implement HMAC-SHA256, but its internal `hmacSHA256` function is an insecure pseudo-hash combining a 32-bit polynomial rolling hash (`hashCode`) with a Linear Congruential Generator (LCG). It possesses zero cryptographic collision resistance or one-way security.
   - **Mathematical Cap in Crash**: The Crash multiplier in `getCrashPoint` is mathematically capped at exactly **32.67x**. Due to lines 56 and 58, any random float $h < 1/33$ (~$0.0303$) is intercepted by `Math.floor(h * 33) === 0` and forced to return $1.00$ (instant crash). For any $h \ge 1/33$, the multiplier formula is $0.99 / h$, whose maximum value occurs at the minimal allowed $h = 1/33$: $0.99 / (1/33) = 32.67x$. Multipliers above 32.67x are mathematically impossible.
   - Seed commitment is non-functional: `hashSeed` is never invoked, client seeds are hardcoded to `'default'`, and server seeds are regenerated per round rather than committed upfront.

3. **Build System & Deprecations**:
   - `src/utils/provablyFair.js` imports Node's built-in `crypto` (`import crypto from 'crypto'`), which is unused in the file and triggers Vite bundling warnings/externalization issues in browser targets.
   - `src/games/RouletteGame.jsx` invokes deprecated PixiJS v7 Graphics APIs (`beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, `endFill`), conflicting with the installed PixiJS v8 package (`pixi.js: ^8.1.0`).

---

## 2. Comprehensive Game-by-Game Balance & State Survey

### 2.1 Audit of `src/utils/balance.js`

`src/utils/balance.js` defines the following API:
- `getBalance()`: Reads key `'cryptobet_balance'` from `localStorage`. Defaults to `1.00000000` BTC.
- `setBalance(amount)`: Clamps amount to $\ge 0$ at 8 decimal places and serializes to string.
- `addToBalance(amount)`: Adds `amount` to current balance via `setBalance(getBalance() + amount)`.
- `subtractFromBalance(amount)`: Checks if `amount > current`. If insufficient, returns `null`. Otherwise updates balance and returns new balance.
- `resetBalance()`: Resets balance to `1.00000000`.
- `getHistory()`: Reads key `'cryptobet_history'` from `localStorage` (parsed JSON).
- `addHistoryEntry(entry)`: Unshifts `{ ...entry, timestamp: Date.now() }`, truncating at 100 entries.

**Critical Architectural Limitations of `balance.js`**:
1. **Lack of Event Notification / Reactive Store**: Neither `setBalance` nor `addHistoryEntry` dispatches a custom DOM event (`window.dispatchEvent(new CustomEvent('balance-update'))`) or notifies subscribers. Components that need real-time updates are forced to poll `localStorage` using `setInterval` (as seen in `Navbar.jsx`).
2. **Race Conditions in Concurrent Operations**: Calling `addToBalance` and `subtractFromBalance` rapidly or across concurrent animations reads `getBalance()` from `localStorage` synchronously. Without a single in-memory mutex or state dispatcher, rapid successive calls can suffer read-modify-write race conditions.
3. **No Schema Validation on History**: Different games push inconsistent history shapes (e.g., `Plinko` pushes `{ game, bet, payout, multiplier }`, `Baccarat` pushes `{ game, bet, won, target, result }`, `Roulette` pushes `{ game, bet, payout, result }`).

---

### 2.2 Game State Breakdown (All 15 Titles)

#### Title 1: Crash (`src/games/CrashGame.jsx`)
- **Props Expected**: `{ balance, setBalance, onBack }` (Line 7).
- **Props Passed by `App.jsx`**: `<CrashGame onBack={onBack} />` (Line 48).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: Line 251: `setBalance(b => b - betAmount)`.
- **Win Payout**: Line 132 (ticker auto-cashout): `setBalanceRef.current(b => b + winAmt)`; Line 258 (manual cashout): `setBalance(b => b + winAmt)`.
- **History Tracking**: None. Does NOT call `addHistoryEntry`.
- **Defects & State Locks**:
  - `setBalance` is `undefined`. Clicking "Place Bet" immediately throws `Uncaught TypeError: setBalance is not a function`.
  - Default bet is initialized to `10`, whereas `balance.js` default balance is `1.00000000` BTC.
  - Provably fair multiplier is capped at 32.67x.

#### Title 2: Dice (`src/games/DiceGame.jsx`)
- **Props Expected**: `{ balance, onBack }` (Line 8).
- **Props Passed by `App.jsx`**: `<DiceGame onBack={onBack} />` (Line 49).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: None. Line 21 (`handleRoll`) executes with zero balance check or deduction.
- **Win Payout**: None. Calculates `profitOnWin` only for display, never credits user wallet.
- **History Tracking**: Local React state only (`setHistory(prev => [...].slice(0, 8))`). Never calls `addHistoryEntry`.
- **Defects & State Locks**: Bets and wins are purely cosmetic. Wallet balance is never touched.

#### Title 3: Mines (`src/games/MinesGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 27).
- **Props Passed by `App.jsx`**: `<MinesGame onBack={onBack} />` (Line 50).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: None. Line 41 (`startGame`) sets local flags but deducts 0 balance.
- **Win Payout**: None. Line 85 (`handleCashout`) sets `setLastWinAmount(winAmt)` in local state, never credits wallet.
- **History Tracking**: None.
- **Defects & State Locks**: Complete detachment from wallet. Unlimited free plays.

#### Title 4: Limbo (`src/games/LimboGame.jsx`)
- **Props Expected**: `{ balance, onBack }` (Line 6).
- **Props Passed by `App.jsx`**: `<LimboGame onBack={onBack} />` (Line 51).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: None. Line 16 (`handleBet`) runs without deducting wager.
- **Win Payout**: None. Shows `+${(betAmount * targetMultiplier).toFixed(2)}` on screen, zero wallet credit.
- **History Tracking**: None.
- **Defects & State Locks**: Completely cosmetic gameplay.

#### Title 5: Color Trading (`src/games/ColorTradingGame.jsx`)
- **Props Expected**: `{ balance, setBalance, onBack }` (Line 7).
- **Props Passed by `App.jsx`**: `<ColorTradingGame onBack={onBack} />` (Line 54).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: Line 62: `setBalance(b => b - betAmount)`.
- **Win Payout**: Line 43 (timer resolution): `setBalance(b => b + winAmount)`.
- **History Tracking**: Local state only (`history` array of numbers). Never calls `addHistoryEntry`.
- **Defects & State Locks**:
  - `setBalance` is `undefined`. Placing a bet throws `Uncaught TypeError: setBalance is not a function`.
  - Timer result generated via non-provably-fair `Math.floor(Math.random() * 10)` (Line 28).

#### Title 6: Plinko (`src/games/PlinkoGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 8).
- **Props Passed by `App.jsx`**: `<PlinkoGame onBack={onBack} />` (Line 55).
- **Balance Import**: Correctly imports `{ getBalance, subtractFromBalance, addToBalance, addHistoryEntry }` (Line 5).
- **Bet Deduction**: Line 30: `subtractFromBalance(betAmount)` with balance sufficiency check.
- **Win Payout**: Line 71 (when ball finishes path): `addToBalance(ball.payout)`.
- **History Tracking**: Line 74: Calls `addHistoryEntry({ game: 'Plinko', bet, payout, multiplier })`.
- **Defects & State Locks**:
  - Correct implementation. Maintains a local state mirror (`balance`) refreshed via `updateBalance(getBalance())`.

#### Title 7: Tower (`src/games/TowerGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 19).
- **Props Passed by `App.jsx`**: `<TowerGame onBack={onBack} />` (Line 56).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: None. Line 27 (`startGame`) deducts 0 balance.
- **Win Payout**: None. Line 42 (`handleCashout`) sets local `profit` state, does not call `addToBalance`.
- **History Tracking**: None.
- **Defects & State Locks**: Bets and payouts are mock/free. Tower bombs generated via `Math.random()`.

#### Title 8: Hi-Lo (`src/games/HiLoGame.jsx`)
- **Props Expected**: `{ balance, onBack }` (Line 39).
- **Props Passed by `App.jsx`**: `<HiLoGame onBack={onBack} />` (Line 57).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: None. Line 67 (`handleStart`) sets local states, deducts 0.
- **Win Payout**: None. Line 103 (`handleCashout`) does not credit wallet.
- **History Tracking**: None.
- **Defects & State Locks**: Free betting; deck drawn using `Math.random()`.

#### Title 9: Wheel (`src/games/WheelGame.jsx`)
- **Props Expected**: `{ balance, setBalance, onBack }` (Line 15).
- **Props Passed by `App.jsx`**: `<WheelGame onBack={onBack} />` (Line 59).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: Line 35: `setBalance(b => b - betAmount)`.
- **Win Payout**: Line 81: `setBalance(b => b + betAmount * mult)`.
- **History Tracking**: None.
- **Defects & State Locks**:
  - `setBalance` is `undefined`. Clicking Spin throws `Uncaught TypeError: setBalance is not a function`.
  - Wheel spin index generated via `Math.floor(Math.random() * segments)` (Line 40).

#### Title 10: Roulette (`src/games/RouletteGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 11).
- **Props Passed by `App.jsx`**: `<RouletteGame onBack={onBack} />` (Line 62).
- **Balance Import**: Correctly imports `{ getBalance, subtractFromBalance, addToBalance, addHistoryEntry }` (Line 5).
- **Bet Deduction**: Line 187: `subtractFromBalance(totalBet)` with insufficient balance clearing.
- **Win Payout**: Line 252: `addToBalance(payout)`.
- **History Tracking**: Line 257: `addHistoryEntry({ game: 'roulette', bet: totalBet, payout, result: winNum })`.
- **Defects & State Locks**:
  - Balance handling is complete and correct.
  - Graphics rendering contains deprecated PixiJS v7 calls (`beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, `endFill`) on a PixiJS v8 runtime.

#### Title 11: Slots (`src/games/SlotsGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 38).
- **Props Passed by `App.jsx`**: `<SlotsGame onBack={onBack} />` (Line 63).
- **Balance Import**: Partial: imports `{ getBalance, subtractFromBalance, addToBalance }` (Line 7), but NOT `addHistoryEntry`.
- **Bet Deduction**: Line 243: `subtractFromBalance(betAmount)` with sufficiency guard.
- **Win Payout**: Line 302: `addToBalance(totalWin)`.
- **History Tracking**: None. Missing `addHistoryEntry`.
- **Defects & State Locks**:
  - Symbols generated via `Math.random()` rather than provably fair RNG.
  - History entries are never recorded for slots spins.

#### Title 12: Blackjack (`src/games/BlackjackGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 56).
- **Props Passed by `App.jsx`**: `<BlackjackGame onBack={onBack} />` (Line 66).
- **Balance Import**: Does NOT import `src/utils/balance.js`.
- **Bet Deduction**: None. Line 80 (`startGame`) deducts 0. Line 170 (`doubleDown`) doubles `activeBet` locally without deducting balance.
- **Win Payout**: None. Line 111 (`endGame`) displays result message without crediting balance.
- **History Tracking**: None.
- **Defects & State Locks**: Completely cosmetic/free gameplay. Deck shuffled via biased `sort(() => Math.random() - 0.5)`.

#### Title 13: Baccarat (`src/games/BaccaratGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 73).
- **Props Passed by `App.jsx`**: `<BaccaratGame onBack={onBack} />` (Line 67).
- **Balance Import**: Correctly imports `{ getBalance, subtractFromBalance, addToBalance, addHistoryEntry }` (Line 5).
- **Bet Deduction**: Line 91: `subtractFromBalance(betAmount)`.
- **Win Payout**: Line 172: `addToBalance(wonAmount)` on win; Line 176: `addToBalance(betAmount)` to return bet on tie.
- **History Tracking**: Line 184: Calls `addHistoryEntry`.
- **Defects & State Locks**: Correct balance and history integration. Cards generated via `Math.random()`.

#### Title 14: Video Poker (`src/games/VideoPokerGame.jsx`)
- **Props Expected**: `{ onBack }` (Line 141).
- **Props Passed by `App.jsx`**: `<VideoPokerGame onBack={onBack} />` (Line 68).
- **Balance Import**: Correctly imports `{ getBalance, subtractFromBalance, addToBalance, addHistoryEntry }` (Line 5).
- **Bet Deduction**: Line 157: `subtractFromBalance(betAmount)`.
- **Win Payout**: Line 241: `addToBalance(winAmount)`.
- **History Tracking**: Lines 242 & 251: Calls `addHistoryEntry` for both wins and losses.
- **Defects & State Locks**: Correct balance and history integration. Deck shuffled via `Math.random()`.

#### Title 15: Keno (`src/App.jsx` line 58)
- **Props Expected**: `{ title, onBack }` (ComingSoon stub).
- **Props Passed by `App.jsx`**: `<ComingSoon title="Keno" onBack={onBack} />`.
- **Balance Import**: N/A (Game component does not exist).
- **Bet Deduction**: None.
- **Win Payout**: None.
- **History Tracking**: None.
- **Defects & State Locks**: Complete omission of game implementation despite navigation presence in Sidebar and GameGrid.

---

### 2.3 Synthesis Matrix of All 15 Titles

| # | Game | Component Path | Imports `balance.js` | Deducts Bet (`subtractFromBalance`) | Credits Win (`addToBalance`) | Logs History (`addHistoryEntry`) | Provably Fair Seed Engine | Primary Architectural Defect |
|---|---|---|:---:|:---:|:---:|:---:|:---:|---|
| 1 | **Crash** | `src/games/CrashGame.jsx` | ❌ No | ❌ Broken (`setBalance`) | ❌ Broken (`setBalance`) | ❌ No | ⚠️ Capped (32.67x) | `TypeError: setBalance is not a function`; 32.67x artificial multiplier cap |
| 2 | **Dice** | `src/games/DiceGame.jsx` | ❌ No | ❌ No | ❌ No | ❌ No | ⚠️ `getGameResult` | Zero wallet deduction/addition; fictitious betting |
| 3 | **Mines** | `src/games/MinesGame.jsx` | ❌ No | ❌ No | ❌ No | ❌ No | ⚠️ `shuffleArray` | Zero wallet deduction/addition; fictitious betting |
| 4 | **Limbo** | `src/games/LimboGame.jsx` | ❌ No | ❌ No | ❌ No | ❌ No | ⚠️ `getGameResult` | Zero wallet deduction/addition; fictitious betting |
| 5 | **Color Trading** | `src/games/ColorTradingGame.jsx` | ❌ No | ❌ Broken (`setBalance`) | ❌ Broken (`setBalance`) | ❌ No | ❌ `Math.random()` | `TypeError: setBalance is not a function`; unverified RNG |
| 6 | **Plinko** | `src/games/PlinkoGame.jsx` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ `getProvablyFairFloats` | None (functional baseline) |
| 7 | **Tower** | `src/games/TowerGame.jsx` | ❌ No | ❌ No | ❌ No | ❌ No | ❌ `Math.random()` | Zero wallet deduction/addition; fictitious betting |
| 8 | **Hi-Lo** | `src/games/HiLoGame.jsx` | ❌ No | ❌ No | ❌ No | ❌ No | ❌ `Math.random()` | Zero wallet deduction/addition; fictitious betting |
| 9 | **Wheel** | `src/games/WheelGame.jsx` | ❌ No | ❌ Broken (`setBalance`) | ❌ Broken (`setBalance`) | ❌ No | ❌ `Math.random()` | `TypeError: setBalance is not a function`; unverified RNG |
| 10 | **Roulette** | `src/games/RouletteGame.jsx` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ `getGameResult` | PixiJS v7 deprecated API calls on v8 runtime |
| 11 | **Slots** | `src/games/SlotsGame.jsx` | ⚠️ Partial | ✅ Yes | ✅ Yes | ❌ No | ❌ `Math.random()` | Missing `addHistoryEntry`; unverified RNG |
| 12 | **Blackjack** | `src/games/BlackjackGame.jsx` | ❌ No | ❌ No | ❌ No | ❌ No | ❌ `Math.random()` | Zero wallet deduction/addition; biased deck shuffle |
| 13 | **Baccarat** | `src/games/BaccaratGame.jsx` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ `Math.random()` | Unverified RNG |
| 14 | **Video Poker** | `src/games/VideoPokerGame.jsx` | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ `Math.random()` | Unverified RNG |
| 15 | **Keno** | `src/App.jsx` (stub) | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A | ❌ N/A | Missing game component; renders Coming Soon |

---

## 3. Provably Fair Cryptography & Math Audit (`src/utils/provablyFair.js`)

### 3.1 Pseudo-Hash vs Cryptographic SHA-256 / Web Crypto

In `src/utils/provablyFair.js`, lines 22–41 implement the following pseudo-hash under the misleading comment `// Browser-compatible HMAC-SHA256 using SubtleCrypto`:

```javascript
// Browser-compatible HMAC-SHA256 using SubtleCrypto
function hmacSHA256(key, message) {
  // For client-side, we use a simple hash simulation
  // In production, use SubtleCrypto or a proper HMAC library
  let hash = 0;
  const combined = key + message;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Generate 64 hex chars from the hash
  let result = '';
  let seed = Math.abs(hash);
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    result += (seed % 16).toString(16);
  }
  return result;
}
```

#### Vulnerability Analysis:
1. **Polynomial Rolling Hash (Java `hashCode`)**:
   `((hash << 5) - hash) + char` is identical to $hash \times 31 + char$. This compresses an arbitrary string into a signed 32-bit integer.
2. **Entropy Bottleneck**:
   Because `hash` is 32-bit, the initial compression discards almost all entropy. There are at most $2^{31} \approx 2.14 \times 10^9$ possible initial seeds.
3. **Linear Congruential Generator (LCG) Expansion**:
   `seed = (seed * 1103515245 + 12345) & 0x7fffffff; result += (seed % 16).toString(16);`
   This is the standard glibc LCG. An LCG is linearly predictable: observing just a few hex digits allows complete algebraic recovery of the internal state.
4. **Zero Cryptographic Security**:
   This algorithm is neither one-way nor collision-resistant. A client or adversary can trivially invert outcomes or brute-force any server seed within milliseconds. It violates the core definition of Provably Fair.

---

### 3.2 Mathematical Proof of the 32.67x Crash Multiplier Cap

In `src/utils/provablyFair.js`, lines 51–59 define `getCrashPoint`:

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

#### Step-by-Step Mathematical Derivation:

1. **Input Range**:
   `h` is a uniform float in the continuous interval $[0, 1)$.

2. **The Truncation Condition (Line 56)**:
   The instant crash check is:
   $$\lfloor h \times 33 \rfloor = 0$$
   For any non-negative real $x$, $\lfloor x \rfloor = 0 \iff 0 \le x < 1$.
   Therefore:
   $$0 \le h \times 33 < 1 \iff 0 \le h < \frac{1}{33} \approx 0.03030303...$$
   Whenever $h \in [0, \frac{1}{33})$, the function immediately returns $1.00$ (instant crash).

3. **Domain of the Multiplier Function (Line 58)**:
   Line 58 is reached **if and only if** the guard on Line 56 evaluated to false. That is:
   $$h \ge \frac{1}{33}$$
   Hence, the domain over which the multiplier is evaluated is strictly:
   $$h \in \left[\frac{1}{33}, 1\right)$$

4. **Monotonicity of the Payout Curve**:
   The multiplier formula on Line 58 is:
   $$M(h) = \frac{0.99}{h}$$
   Taking the first derivative with respect to $h$:
   $$\frac{dM}{dh} = -\frac{0.99}{h^2} < 0 \quad \forall h > 0$$
   Because $\frac{dM}{dh}$ is strictly negative everywhere on $(0, 1)$, $M(h)$ is a **strictly decreasing function** of $h$.

5. **Maximum Evaluation**:
   Since $M(h)$ is strictly decreasing on $[\frac{1}{33}, 1)$, its global maximum occurs at the minimum boundary point of its domain, $h_{min} = \frac{1}{33}$:
   $$M_{max} = M\left(\frac{1}{33}\right) = \frac{0.99}{\frac{1}{33}} = 0.99 \times 33 = 32.67$$
   Applying the rounding `Math.floor(32.67 * 100) / 100`:
   $$\lfloor 3267 \rfloor / 100 = 32.67$$

6. **Behavior at the Upper Tail**:
   For any $h > 0.99$, $0.99 / h < 1.00$, which `Math.max(1.00, ...)` clamps back to $1.00$.
   Hence:
   $$\text{Range of } \text{getCrashPoint} = [1.00, 32.67]$$

#### Conclusion:
**It is mathematically impossible for `getCrashPoint` to ever generate a multiplier exceeding 32.67x.**
Any random outcome that mathematically corresponds to a large multiplier (which requires small $h$) falls into $[0, 1/33)$ and is erroneously converted into an instant bust at $1.00x$.

#### The Correct Bustabit / Stake Formulation:
In the authentic Bustabit and Stake provably fair specification, large multipliers correspond to $h \to 1$ or are evaluated using independent house edge tests:
- **Approach A (Stake-style with uniform float)**:
  Instant crash test: if $h < 0.03$ (3% house edge, or $0.01$ for 1%), return $1.00$.
  Otherwise, map the surviving range $[0.03, 1)$ to $[1.00, \infty)$ using:
  $$\text{multiplier} = \max\left(1.00, \left\lfloor \frac{0.99}{1 - h} \times 100 \right\rfloor \Big/ 100\right)$$
  As $h \to 1$, $1 - h \to 0$, causing multiplier $\to \infty$. (e.g., $h = 0.999 \implies 990x$).
- **Approach B (Bustabit 52-bit integer modulus)**:
  Compute an independent 52-bit integer from the first 13 hex characters.
  Instant crash occurs if $r \pmod{33} === 0$ (a uniform 1 in 33 chance, decoupled from magnitude).
  Multiplier: $\lfloor (2^{52} \times 0.99) / (r + 1) \times 100 \rfloor / 100$.

---

### 3.3 Seed Generation & Verification Flow Audit

1. **`generateServerSeed()` (Lines 62–66)**:
   Uses `window.crypto.getRandomValues(new Uint8Array(32))` and formats to 64 hex characters. This correctly produces 256 bits of CSPRNG entropy.
2. **`hashSeed()` (Lines 69–74)**:
   Correctly implements asynchronous SHA-256 hashing via `window.crypto.subtle.digest('SHA-256', data)`.
   **Critical Defect**: `hashSeed` is never imported, invoked, or rendered anywhere in the application. There is zero public hash commitment before a round starts.
3. **Hardcoded Client Seed**:
   `getGameResult` (Line 79) and `shuffleArray` (Line 88) hardcode `clientSeed = 'default'`. Players cannot configure or verify their custom client seeds.
4. **Per-Round Seed Regeneration**:
   Instead of maintaining a continuous seed chain or persistent active server seed, `getGameResult` generates a brand new server seed on every single bet. Without seed commitment or rotation, fair verification is impossible.

---

## 4. Build System & Dependency Audit

### 4.1 Dependency & Configuration Overview
- **Build Tool**: Vite `^5.2.0` (`@vitejs/plugin-react: ^4.2.1`).
- **Framework**: React `^18.2.0`, React DOM `^18.2.0`.
- **CSS Engine**: Tailwind CSS `^3.4.3`, PostCSS `^8.4.38`, Autoprefixer `^10.4.19`.
- **Installed Runtime Dependencies**:
  - `pixi.js`: `^8.1.0` (PixiJS version 8)
  - `lucide-react`: `^0.378.0`
  - `howler`: `^2.2.4`
  - `framer-motion`: `^11.1.7`

### 4.2 Potential Build Failure Points & Compilation Warnings

1. **Node Built-in Import in Browser Bundle (`src/utils/provablyFair.js`)**:
   - Line 1: `import crypto from 'crypto';`
   - In standard Vite client bundling, Vite flags Node built-ins with warnings or errors:
     `Module "crypto" has been externalized for browser compatibility. Cannot access "crypto.xxx" in client code.`
   - Because `crypto` is never referenced in `provablyFair.js` (lines 64 and 72 use `window.crypto`), this import is completely redundant and must be eliminated.

2. **PixiJS v8 Breaking API Deprecations in `RouletteGame.jsx`**:
   - `package.json` installs `pixi.js: ^8.1.0`.
   - In PixiJS v8, the legacy v7 `Graphics` drawing API was replaced. Methods such as:
     - `rim.beginFill(0x0F212E)`
     - `rim.lineStyle(4, 0xFFD700)`
     - `rim.drawCircle(0, 0, wheelRadius + 20)`
     - `rim.endFill()`
     - `pointer.drawPolygon([...])`
   - In PixiJS v8, graphics must use the chainable API:
     - `.circle(x, y, radius).fill(color).stroke({ color, width })`
     - `.poly([...]).fill(color)`
   - Invoking v7 methods at runtime causes `TypeError: rim.beginFill is not a function` on v8 builds where legacy graphics adaptors are disabled.

3. **ESLint / Unused Directives**:
   - `package.json` defines script `"lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0"`.
   - `update_graphics.js` and `test_pixi.jsx` in the root directory contain hardcoded paths or test scripts that would fail standard lint rules if scanned.

---

## 5. Technical Remediation Blueprint

To achieve complete health and compliance with R1–R4, the following concrete modifications are recommended for subsequent phases:

### Phase A: Centralized Balance & Event Bus (`src/utils/balance.js`)
1. Add custom DOM event dispatching to `src/utils/balance.js`:
   ```javascript
   function notifyBalance(newBalance) {
     if (typeof window !== 'undefined') {
       window.dispatchEvent(new CustomEvent('balance-change', { detail: { balance: newBalance } }));
     }
   }
   ```
2. Export a React hook `useBalance()` or state subscriber so all components (including `Navbar` and game controls) automatically react without polling intervals.
3. Standardize `addHistoryEntry` with a uniform schema across all 15 games:
   `{ id, game, bet, payout, profit, multiplier, details, timestamp }`.

### Phase B: Game-Level Balance Unification
1. Refactor `Crash`, `Dice`, `Mines`, `Limbo`, `Color Trading`, `Tower`, `Hi-Lo`, `Wheel`, `Slots`, and `Blackjack` to directly import `{ getBalance, subtractFromBalance, addToBalance, addHistoryEntry }` from `src/utils/balance.js`.
2. Eliminate all broken `setBalance` prop assumptions in `CrashGame.jsx`, `ColorTradingGame.jsx`, and `WheelGame.jsx`.
3. Implement `KenoGame.jsx` to replace the `ComingSoon` stub in `src/App.jsx`.

### Phase C: Provably Fair Overhaul (`src/utils/provablyFair.js`)
1. Remove `import crypto from 'crypto';`.
2. Implement synchronous or WebCrypto HMAC-SHA256 (or standard pure-JS SHA-256 / HMAC implementation) to generate true cryptographic hash hexes.
3. Fix `getCrashPoint` formula to eliminate the 32.67x cap:
   ```javascript
   export function getCrashPoint(serverSeed, clientSeed, nonce = 0) {
     const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
     const h = floats[0];
     // 3% house edge: 1 in 33 chance of instant crash
     if (h < 0.03) return 1.00;
     // Multiplier curve with unlimited theoretical cap:
     const multiplier = Math.floor((0.97 / (1 - h)) * 100) / 100;
     return Math.max(1.00, multiplier);
   }
   ```
4. Expose seed management state (server seed commitment hash, client seed input, nonce counter).

### Phase D: PixiJS v8 Graphic API Fix (`src/games/RouletteGame.jsx`)
Replace all `beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, and `endFill` calls with PixiJS v8 `.circle()`, `.poly()`, `.fill()`, and `.stroke()`.
