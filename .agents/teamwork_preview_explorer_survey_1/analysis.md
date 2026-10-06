# Technical Analysis: Frontend & PixiJS Architecture Survey

- **Auditor**: `teamwork_preview_explorer_survey_1` (Frontend & PixiJS Explorer)
- **Target Project**: Crypto Casino (`c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino`)
- **PixiJS Version Installed**: `^8.1.0` (PixiJS v8.1.0)
- **Framework & Libraries**: React 18.2.0, Vite 5.2.0, Framer Motion 11.1.7, Howler 2.2.4, Tailwind CSS 3.4.3
- **Date**: 2026-10-06

---

## 1. Executive Summary

A comprehensive architectural and rendering survey across all 15 casino games in the codebase revealed the following key findings:
1. **PixiJS v8 Graphics API Deprecations**: `RouletteGame.jsx` contains 17 instances of PixiJS v7 Graphics API calls (`beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, `endFill`) that are completely deprecated or removed in PixiJS v8. In contrast, `CrashGame.jsx` and `SlotsGame.jsx` have already been migrated to v8 Graphics primitives (`rect`, `circle`, `poly`, `stroke`, `fill`).
2. **WebGL / Canvas Mounting & Unmounting Lifecycle Hazards**:
   - `RouletteGame.jsx` lacks an unmount cancellation flag (`isDestroyed`), causing potential detached DOM element injections and unhandled promise rejections on fast unmounts.
   - `SlotsGame.jsx` leaks a global callback `window.handleReelsStopped` onto `window`, which closes over component state and triggers unmounted state updates. Furthermore, its winning line redraw loop leaks unmanaged `PIXI.Graphics` instances without calling `.destroy()`.
   - `LimboGame.jsx` creates an unmanaged `requestAnimationFrame` loop without cancellation on unmount.
   - `BlackjackGame.jsx` and `BaccaratGame.jsx` execute multi-second async `setTimeout` / promise chains that lack unmount guard checks.
3. **Severe Wallet Balance Fragmentation & Runtime Crashes**:
   - Three games (`CrashGame.jsx`, `WheelGame.jsx`, `ColorTradingGame.jsx`) define prop signatures expecting `({ balance, setBalance, onBack })`, but `src/App.jsx` never passes `balance` or `setBalance`. Placing any bet or winning a round throws a fatal uncaught `TypeError: setBalance is not a function`, crashing the UI.
   - Seven games (`DiceGame.jsx`, `MinesGame.jsx`, `LimboGame.jsx`, `TowerGame.jsx`, `HiLoGame.jsx`, `BlackjackGame.jsx`) have **zero wallet balance integration** — neither deducting wagers nor crediting payouts.
   - Only 4 games (`RouletteGame.jsx`, `SlotsGame.jsx`, `BaccaratGame.jsx`, `VideoPokerGame.jsx`) properly implement the centralized `src/utils/balance.js` API (`getBalance`, `subtractFromBalance`, `addToBalance`, `addHistoryEntry`).
4. **Missing Export in Constants Crashing Wheel**: `WheelGame.jsx` imports `COLORS` from `../utils/constants`, which does not exist, throwing a fatal `TypeError` inside the animation frame loop when displaying win results.
5. **Keno Implementation Gap**: Keno is stubbed as a `ComingSoon` placeholder in `App.jsx`, despite having full payout tables in `src/utils/constants.js`.

---

## 2. Comprehensive Survey of All 15 Games

| Game | File Path | Rendering Pipeline | Balance Integration Status | Lifecycle & Memory Safety | PixiJS Status |
|---|---|---|---|---|---|
| **Roulette** | `src/games/RouletteGame.jsx` | PixiJS v8 (Canvas/WebGL) | Centralized (`balance.js`) | ⚠️ Unmount race condition (no `isDestroyed` flag) | ❌ **17 v7 deprecated calls** (`beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, `endFill`) |
| **Crash** | `src/games/CrashGame.jsx` | PixiJS v8 (Canvas/WebGL) | ❌ **Broken props** (`setBalance is not a function`) | ✅ Protected (`isDestroyed`, canvas cleanup) | ✅ Pure v8 API (`stroke`, `fill`, `circle`) |
| **Slots** | `src/games/SlotsGame.jsx` | PixiJS v8 (Canvas/WebGL) | Partial (`balance.js`, no history) | ⚠️ **Memory leak** (`window.handleReelsStopped`, orphan Graphics) | ✅ Pure v8 API (`roundRect`, `rect`, `stroke`, `fill`) |
| **Plinko** | `src/games/PlinkoGame.jsx` | HTML5 Canvas 2D | Centralized (`balance.js`) | ✅ Managed RAF with unmount cancel | N/A (Canvas2D) |
| **Wheel** | `src/games/WheelGame.jsx` | HTML5 Canvas 2D | ❌ **Broken props** (`setBalance is not a function`) | ❌ **Runtime crash**: missing `COLORS` import in constants | N/A (Canvas2D) |
| **Dice** | `src/games/DiceGame.jsx` | DOM + Framer Motion | ❌ **Zero balance logic** (infinite free bets) | ✅ Clean React state | N/A (DOM) |
| **Mines** | `src/games/MinesGame.jsx` | DOM + Framer Motion | ❌ **Zero balance logic** (infinite free bets) | ✅ Clean React state | N/A (DOM) |
| **Limbo** | `src/games/LimboGame.jsx` | DOM (Odometer) | ❌ **Zero balance logic** (infinite free bets) | ⚠️ Unmanaged `requestAnimationFrame` loop | N/A (DOM) |
| **Color Trading** | `src/games/ColorTradingGame.jsx` | DOM + Framer Motion | ❌ **Broken props** (`setBalance is not a function`) | ✅ Managed `setInterval` with unmount cleanup | N/A (DOM) |
| **Tower** | `src/games/TowerGame.jsx` | DOM + CSS Grid | ❌ **Zero balance logic** (infinite free bets) | ✅ Clean React state | N/A (DOM) |
| **Hi-Lo** | `src/games/HiLoGame.jsx` | DOM + CSS Flex/Scroll | ❌ **Zero balance logic** (infinite free bets) | ✅ Clean React state | N/A (DOM) |
| **Blackjack** | `src/games/BlackjackGame.jsx` | DOM 3D Flip (Framer Motion) | ❌ **Zero balance logic** (infinite free bets) | ⚠️ Unmanaged async dealer `setTimeout` chains | N/A (DOM) |
| **Baccarat** | `src/games/BaccaratGame.jsx` | DOM Cards + Bead Plate | Centralized (`balance.js`) | ⚠️ Async deal `setTimeout` chain without cancel guard | N/A (DOM) |
| **Video Poker** | `src/games/VideoPokerGame.jsx` | DOM 3D Flip (Framer Motion) | Centralized (`balance.js`) | ✅ Clean React state | N/A (DOM) |
| **Keno** | `src/App.jsx` | Stubbed (`ComingSoon`) | N/A (Stub) | N/A | N/A |

---

## 3. PixiJS v8 Graphics API Deprecation Audit: `RouletteGame.jsx`

In PixiJS v8, the legacy v7 "set style -> draw shape -> end style" paradigm (`beginFill()`, `lineStyle()`, `draw*()`, `endFill()`) was completely redesigned into a modern, declarative "shape-then-style" architecture (`rect()`, `circle()`, `poly()`, followed by `.fill()` and `.stroke()`).

### 3.1 Inventory of Deprecated Calls in `RouletteGame.jsx`

```
Location: src/games/RouletteGame.jsx
--------------------------------------------------------------------------------
Lines 71-74:  Outer Rim
  71: rim.beginFill(0x0F212E);
  72: rim.lineStyle(4, 0xFFD700);
  73: rim.drawCircle(0, 0, wheelRadius + 20);
  74: rim.endFill();

Lines 83-87:  Wheel Pockets (Loop over 37 sectors)
  83: slice.beginFill(color);
  84: slice.lineStyle(1, 0xFFFFFF, 0.2);
  85: slice.moveTo(0, 0);
  86: slice.arc(0, 0, wheelRadius, i * arc, (i + 1) * arc);
  87: slice.endFill();

Lines 106-109: Center Dome
  106: center.beginFill(0x213743);
  107: center.lineStyle(2, 0xFFD700);
  108: center.drawCircle(0, 0, wheelRadius * 0.3);
  109: center.endFill();

Lines 114-116: Pointer Triangle
  114: pointer.beginFill(0xFFFFFF);
  115: pointer.drawPolygon([-10, 0, 10, 0, 0, 20]);
  116: pointer.endFill();

Lines 123-125: Ball Graphic
  123: ball.beginFill(0xFFFFFF);
  124: ball.drawCircle(0, 0, 6);
  125: ball.endFill();
```

### 3.2 Exact PixiJS v8 Migration Code Mapping

#### Component 1: Outer Rim
**Before (v7)**:
```javascript
const rim = new PIXI.Graphics();
rim.beginFill(0x0F212E);
rim.lineStyle(4, 0xFFD700);
rim.drawCircle(0, 0, wheelRadius + 20);
rim.endFill();
wheel.addChild(rim);
```
**After (v8)**:
```javascript
const rim = new PIXI.Graphics();
rim.circle(0, 0, wheelRadius + 20)
   .fill(0x0F212E)
   .stroke({ width: 4, color: 0xFFD700 });
wheel.addChild(rim);
```

#### Component 2: Wheel Slices (Pockets)
**Before (v7)**:
```javascript
const slice = new PIXI.Graphics();
slice.beginFill(color);
slice.lineStyle(1, 0xFFFFFF, 0.2);
slice.moveTo(0, 0);
slice.arc(0, 0, wheelRadius, i * arc, (i + 1) * arc);
slice.endFill();
wheel.addChild(slice);
```
**After (v8)**:
```javascript
const slice = new PIXI.Graphics();
slice.moveTo(0, 0)
     .arc(0, 0, wheelRadius, i * arc, (i + 1) * arc)
     .closePath()
     .fill(color)
     .stroke({ width: 1, color: 0xFFFFFF, alpha: 0.2 });
wheel.addChild(slice);
```
*Note*: Adding `.closePath()` ensures the wedge contour explicitly closes from the arc endpoint back to origin `(0, 0)`.

#### Component 3: Center Dome
**Before (v7)**:
```javascript
const center = new PIXI.Graphics();
center.beginFill(0x213743);
center.lineStyle(2, 0xFFD700);
center.drawCircle(0, 0, wheelRadius * 0.3);
center.endFill();
wheel.addChild(center);
```
**After (v8)**:
```javascript
const center = new PIXI.Graphics();
center.circle(0, 0, wheelRadius * 0.3)
      .fill(0x213743)
      .stroke({ width: 2, color: 0xFFD700 });
wheel.addChild(center);
```

#### Component 4: Pointer Indicator
**Before (v7)**:
```javascript
const pointer = new PIXI.Graphics();
pointer.beginFill(0xFFFFFF);
pointer.drawPolygon([-10, 0, 10, 0, 0, 20]);
pointer.endFill();
```
**After (v8)**:
```javascript
const pointer = new PIXI.Graphics();
pointer.poly([-10, 0, 10, 0, 0, 20])
       .fill(0xFFFFFF);
```

#### Component 5: Roulette Ball
**Before (v7)**:
```javascript
const ball = new PIXI.Graphics();
ball.beginFill(0xFFFFFF);
ball.drawCircle(0, 0, 6);
ball.endFill();
```
**After (v8)**:
```javascript
const ball = new PIXI.Graphics();
ball.circle(0, 0, 6)
    .fill(0xFFFFFF);
```

#### Component 6: Pocket Number Text Labels
**Before (v7)**:
```javascript
const text = new PIXI.Text(num.toString(), {
  fontFamily: 'system-ui',
  fontSize: wheelRadius * 0.1,
  fill: 0xFFFFFF,
  fontWeight: 'bold'
});
```
**After (v8)**:
```javascript
const text = new PIXI.Text({
  text: num.toString(),
  style: {
    fontFamily: 'system-ui',
    fontSize: wheelRadius * 0.1,
    fill: 0xFFFFFF,
    fontWeight: 'bold'
  }
});
```

---

## 4. Canvas Lifecycle & Memory Leak Inspection

### 4.1 PixiJS Application Lifecycle Comparison

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       PixiJS Async Init & Mount Flow                        │
└─────────────────────────────────────────────────────────────────────────────┘
  Component Mount (useEffect)
       │
       ▼
  const app = new PIXI.Application();
       │
       ▼
  await app.init({ resizeTo: canvasRef.current, ... }); ◄── [ASYNC RESOLUTION]
       │
       ├──► IF Component Unmounted During Init:
       │      ├─ Roulette: ❌ Crashes or appends canvas to unmounted container!
       │      ├─ Crash:    ✅ if (isDestroyed) { app.destroy(); return; }
       │      └─ Slots:    ✅ if (isDestroyed) { app.destroy(); return; }
       │
       ▼
  canvasRef.current.appendChild(app.canvas);
  appRef.current = app;
       │
       ▼
  Active Frame Loop (app.ticker.add / addOnce)
       │
       ├──► Roulette: Eased spin tick (addOnce recursively)
       ├──► Crash:    Continuous scene redraw with particle emission
       └──► Slots:    Continuous reel spinning & window.handleReelsStopped (!)
       │
  Component Unmount (cleanup function)
       │
       ▼
  Roulette: appRef.current.destroy(true, { children: true })
            (Fails if init is still pending!)
  Crash:    Removes canvas DOM node + app.destroy(true, { children: true })
  Slots:    app.destroy(true, { children: true })
            (Leaves window.handleReelsStopped and orphan Graphics in memory!)
```

### 4.2 Lifecycle Analysis by Component

#### 1. `RouletteGame.jsx`
- **Race Condition**: `useEffect` begins `initPixi()` as an asynchronous task. If the user navigates away before `await app.init()` finishes:
  1. The unmount cleanup runs, but `appRef.current` is `null`, so `app.destroy()` is skipped.
  2. The `app.init()` promise resolves and calls `canvasRef.current.appendChild(app.canvas)`. Since `canvasRef.current` is now `null`, this throws `TypeError: Cannot read properties of null (reading 'appendChild')`.
  3. The WebGL context and GPU resources leak permanently for the tab session.
- **Recommended Remediation**:
  ```javascript
  useEffect(() => {
    let app;
    let isDestroyed = false;

    const initPixi = async () => {
      app = new PIXI.Application();
      await app.init({
        resizeTo: canvasRef.current,
        backgroundAlpha: 0,
        antialias: true
      });
      if (isDestroyed) {
        app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
        return;
      }
      canvasRef.current?.appendChild(app.canvas);
      appRef.current = app;
      // ... build wheel ...
    };

    initPixi();

    return () => {
      isDestroyed = true;
      if (appRef.current) {
        appRef.current.destroy({ removeView: true, releaseGlobalResources: true }, { children: true });
        appRef.current = null;
      }
    };
  }, []);
  ```

#### 2. `CrashGame.jsx`
- **Lifecycle Strength**: Implements `isDestroyed` checking and DOM node detachment (`canvas.parentNode.removeChild`).
- **Rendering Inefficiency**: Every tick in `drawScene()` invokes `.clear()` and re-tessellates the curve geometry and particle circles. While acceptable for a few dozen points, best practice in Pixi v8 is pre-allocating reusable shapes or updating transforms on a Sprite particle container.

#### 3. `SlotsGame.jsx`
- **Critical Memory Leak (`window.handleReelsStopped`)**:
  ```javascript
  // Line 264:
  window.handleReelsStopped = () => {
    evaluateWins(finalResult);
  };
  // Line 223:
  if (allStopped && isPlaying) {
    if (window.handleReelsStopped) {
      window.handleReelsStopped();
      window.handleReelsStopped = null;
    }
  }
  ```
  Attaching the reel stop listener to global `window` creates a cross-game state collision. If a user spins and navigates to another game, `evaluateWins` remains bound in global scope, referencing unmounted React state setters.
  *Fix*: Replace `window.handleReelsStopped` with a component-scoped `useRef` (`reelsStoppedCallbackRef.current`).
- **Graphics Object Accumulation**:
  ```javascript
  // Line 246 & 310:
  linesContainerRef.current.removeChildren();
  const graphics = new PIXI.Graphics();
  linesContainerRef.current.addChild(graphics);
  ```
  `removeChildren()` detaches child display objects without destroying them or freeing their GPU `GraphicsContext` tessellation buffers.
  *Fix*:
  ```javascript
  const container = linesContainerRef.current;
  while (container.children.length > 0) {
    const child = container.children[0];
    container.removeChild(child);
    child.destroy({ children: true, context: true });
  }
  ```

#### 4. `WheelGame.jsx`
- **Fatal Runtime Exception**:
  ```javascript
  // Line 4:
  import { WHEEL_SEGMENTS, COLORS } from '../utils/constants';
  // Lines 193-194:
  if (winResult > 1) ctx.fillStyle = COLORS.accentGreen;
  else if (winResult === 0) ctx.fillStyle = COLORS.accentRed;
  ```
  `COLORS` is **undefined** because it was never exported from `src/utils/constants.js`. When the spin completes and `winResult !== null`, the canvas render loop throws:
  `TypeError: Cannot read properties of undefined (reading 'accentGreen')`
  This halts all canvas rendering and crashes the game display.
  *Fix*: Export `COLORS` from `constants.js` or use hex literal strings (`'#00E701'` and `'#ED4163'`).

#### 5. `LimboGame.jsx`
- **Unmanaged Animation Frame**:
  ```javascript
  // Line 37 & 45:
  requestAnimationFrame(animate);
  ```
  `LimboGame` launches a high-frequency odometer spin loop using `requestAnimationFrame`, but stores no reference and provides no `useEffect` cleanup hook. If the player triggers a bet and leaves the screen, the callback fires asynchronously against an unmounted component.
  *Fix*: Store the RAF ID in `const animFrameRef = useRef(null)` and call `cancelAnimationFrame(animFrameRef.current)` in cleanup.

---

## 5. Wallet Balance Integration Failure Matrix

Centralized balance management is housed in `src/utils/balance.js`:
- `getBalance()`
- `subtractFromBalance(amount)` -> returns new balance or `null` if insufficient
- `addToBalance(amount)` -> returns new balance
- `addHistoryEntry({ game, bet, payout, ... })`

### Audit of All 15 Games Against `balance.js`:

| Game | Uses `balance.js` | Deducts Bet? | Adds Win? | Records History? | Severity |
|---|---|---|---|---|---|
| **Roulette** | Yes | Yes (`subtractFromBalance`) | Yes (`addToBalance`) | Yes (`addHistoryEntry`) | ✅ Compliant |
| **Crash** | No (`balance, setBalance` props) | Broken (Crashes on bet) | Broken | No | 🔴 Critical Runtime Crash |
| **Slots** | Yes | Yes (`subtractFromBalance`) | Yes (`addToBalance`) | No | 🟡 Missing History |
| **Plinko** | Yes | Yes (`subtractFromBalance`) | Yes (`addToBalance`) | Yes (`addHistoryEntry`) | ✅ Compliant |
| **Wheel** | No (`balance, setBalance` props) | Broken (Crashes on bet) | Broken | No | 🔴 Critical Runtime Crash |
| **Dice** | No | ❌ No deduction | ❌ No payout | No | 🔴 Infinite Free Play (No Balance) |
| **Mines** | No | ❌ No deduction | ❌ No payout | No | 🔴 Infinite Free Play (No Balance) |
| **Limbo** | No | ❌ No deduction | ❌ No payout | No | 🔴 Infinite Free Play (No Balance) |
| **Color Trading** | No (`balance, setBalance` props) | Broken (Crashes on bet) | Broken | No | 🔴 Critical Runtime Crash |
| **Tower** | No | ❌ No deduction | ❌ No payout | No | 🔴 Infinite Free Play (No Balance) |
| **Hi-Lo** | No | ❌ No deduction | ❌ No payout | No | 🔴 Infinite Free Play (No Balance) |
| **Blackjack** | No | ❌ No deduction | ❌ No payout | No | 🔴 Infinite Free Play (No Balance) |
| **Baccarat** | Yes | Yes (`subtractFromBalance`) | Yes (`addToBalance`) | Yes (`addHistoryEntry`) | ✅ Compliant |
| **Video Poker** | Yes | Yes (`subtractFromBalance`) | Yes (`addToBalance`) | Yes (`addHistoryEntry`) | ✅ Compliant |
| **Keno** | N/A | N/A | N/A | N/A | ⚪ Stubbed Component |

---

## 6. Implementation Remediation Blueprint

### Priority 1: PixiJS v8 Deprecation Fix (`RouletteGame.jsx`)
Update lines 70–129 in `src/games/RouletteGame.jsx` with the verified v8 syntax:
- Replace `rim.beginFill(...).lineStyle(...).drawCircle(...).endFill()` with `rim.circle(...).fill(...).stroke(...)`.
- Replace `slice.beginFill(...).lineStyle(...).moveTo(...).arc(...).endFill()` with `slice.moveTo(...).arc(...).closePath().fill(...).stroke(...)`.
- Replace `center.beginFill(...).lineStyle(...).drawCircle(...).endFill()` with `center.circle(...).fill(...).stroke(...)`.
- Replace `pointer.beginFill(...).drawPolygon(...).endFill()` with `pointer.poly(...).fill(...)`.
- Replace `ball.beginFill(...).drawCircle(...).endFill()` with `ball.circle(...).fill(...)`.
- Add `isDestroyed` guard and update `app.destroy({ removeView: true, releaseGlobalResources: true }, { children: true })`.

### Priority 2: Runtime Crash Fixes (`CrashGame`, `WheelGame`, `ColorTradingGame`)
- Refactor `CrashGame.jsx`, `WheelGame.jsx`, and `ColorTradingGame.jsx` to remove reliance on `balance` and `setBalance` props.
- Import `getBalance`, `subtractFromBalance`, `addToBalance`, and `addHistoryEntry` from `../utils/balance`.
- Fix missing `COLORS` export in `src/utils/constants.js`:
  ```javascript
  export const COLORS = {
    accentGreen: '#00E701',
    accentRed: '#ED4163',
    accentBlue: '#1475E1',
    accentPurple: '#B388FF'
  };
  ```

### Priority 3: Balance Unification for Zero-Balance Games
- Implement `subtractFromBalance(betAmount)` and `addToBalance(payout)` in `DiceGame.jsx`, `MinesGame.jsx`, `LimboGame.jsx`, `TowerGame.jsx`, `HiLoGame.jsx`, and `BlackjackGame.jsx`.

### Priority 4: Memory Leak Fixes in `SlotsGame` and `LimboGame`
- In `SlotsGame.jsx`: remove `window.handleReelsStopped` and destroy orphaned winning line `Graphics` children.
- In `LimboGame.jsx`: store RAF ID and cancel on unmount.

### Priority 5: Keno Implementation
- Implement full `KenoGame.jsx` utilizing existing `KENO_PAYOUTS` and `shuffleArray` from `provablyFair.js`.
