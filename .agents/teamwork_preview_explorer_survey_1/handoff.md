# Handoff Report: Frontend & PixiJS Explorer Survey

- **Agent**: `teamwork_preview_explorer_survey_1`
- **Role**: Frontend & PixiJS Explorer
- **Milestone**: Milestone 1 - Architectural & Component Survey
- **Target Files**:
  - `src/games/RouletteGame.jsx`
  - `src/games/CrashGame.jsx`
  - `src/games/SlotsGame.jsx`
  - `src/games/PlinkoGame.jsx`
  - `src/games/WheelGame.jsx`
  - All 15 casino game components
- **Detailed Findings Document**: `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_1\analysis.md`

---

## 1. Observation

### Observation 1.1: PixiJS v8 Deprecated Graphics API in `RouletteGame.jsx`
Direct inspection of `src/games/RouletteGame.jsx` revealed 17 occurrences of legacy PixiJS v7 Graphics calls:
- Lines 71–74:
  ```javascript
  rim.beginFill(0x0F212E);
  rim.lineStyle(4, 0xFFD700);
  rim.drawCircle(0, 0, wheelRadius + 20);
  rim.endFill();
  ```
- Lines 83–87:
  ```javascript
  slice.beginFill(color);
  slice.lineStyle(1, 0xFFFFFF, 0.2);
  slice.moveTo(0, 0);
  slice.arc(0, 0, wheelRadius, i * arc, (i + 1) * arc);
  slice.endFill();
  ```
- Lines 106–109:
  ```javascript
  center.beginFill(0x213743);
  center.lineStyle(2, 0xFFD700);
  center.drawCircle(0, 0, wheelRadius * 0.3);
  center.endFill();
  ```
- Lines 114–116:
  ```javascript
  pointer.beginFill(0xFFFFFF);
  pointer.drawPolygon([-10, 0, 10, 0, 0, 20]);
  pointer.endFill();
  ```
- Lines 123–125:
  ```javascript
  ball.beginFill(0xFFFFFF);
  ball.drawCircle(0, 0, 6);
  ball.endFill();
  ```
In PixiJS v8 (`package.json`: `"pixi.js": "^8.1.0"`), `beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, and `endFill` are removed/deprecated in favor of the shape-then-style API (`circle`, `poly`, `fill`, `stroke`).

### Observation 1.2: PixiJS Canvas Lifecycle Hazards
1. **`RouletteGame.jsx` (Lines 51–60, 133–136)**:
   ```javascript
   const initPixi = async () => {
     const app = new PIXI.Application();
     await app.init({ ... });
     canvasRef.current.appendChild(app.canvas);
     appRef.current = app;
   };
   ...
   return () => {
     if (appRef.current) appRef.current.destroy(true, { children: true });
   };
   ```
   Lacks an `isDestroyed` guard. If unmounted before `await app.init()` finishes, `canvasRef.current.appendChild` runs against `null`, throwing a `TypeError` and permanently leaking GPU resources.
2. **`SlotsGame.jsx` (Lines 223–226, 264–266)**:
   ```javascript
   window.handleReelsStopped = () => { evaluateWins(finalResult); };
   ...
   if (allStopped && isPlaying) {
     if (window.handleReelsStopped) {
       window.handleReelsStopped();
       window.handleReelsStopped = null;
     }
   }
   ```
   Attaches a state callback to the global `window` object. If the component unmounts mid-spin, the callback remains in memory and can invoke React state updates on an unmounted component.
3. **`SlotsGame.jsx` (Lines 246, 310–312)**:
   `linesContainerRef.current.removeChildren()` is called before adding new `PIXI.Graphics` instances, which detaches old Graphics without destroying them or reclaiming GPU geometries.

### Observation 1.3: Runtime Crashes Due to Unpassed Props
1. **`CrashGame.jsx` (Lines 7, 249–251)**:
   ```javascript
   export default function CrashGame({ balance, setBalance, onBack })
   ...
   setBalance(b => b - betAmount);
   ```
   In `src/App.jsx` (Line 48): `<CrashGame onBack={onBack} />` — `balance` and `setBalance` are `undefined`. Clicking bet throws `TypeError: setBalance is not a function`.
2. **`WheelGame.jsx` (Lines 15, 35)**:
   ```javascript
   export default function WheelGame({ balance, setBalance, onBack })
   ...
   setBalance(b => b - betAmount);
   ```
   In `src/App.jsx` (Line 59): `<WheelGame onBack={onBack} />` — `setBalance` is `undefined`. Clicking spin throws `TypeError: setBalance is not a function`.
3. **`ColorTradingGame.jsx` (Lines 7, 62)**:
   ```javascript
   export default function ColorTradingGame({ balance, setBalance, onBack })
   ...
   setBalance(b => b - betAmount);
   ```
   In `src/App.jsx` (Line 54): `<ColorTradingGame onBack={onBack} />` — `setBalance` is `undefined`. Clicking bet throws `TypeError: setBalance is not a function`.

### Observation 1.4: Missing Export in `src/utils/constants.js` Crashing `WheelGame.jsx`
- `WheelGame.jsx` (Line 4): `import { WHEEL_SEGMENTS, COLORS } from '../utils/constants';`
- `WheelGame.jsx` (Lines 193–194):
  ```javascript
  if (winResult > 1) ctx.fillStyle = COLORS.accentGreen;
  else if (winResult === 0) ctx.fillStyle = COLORS.accentRed;
  ```
- Search in `src/utils/constants.js` confirms `COLORS` is not exported. At win evaluation, `COLORS.accentGreen` throws `TypeError: Cannot read properties of undefined (reading 'accentGreen')` inside `requestAnimationFrame(render)`, freezing the canvas.

### Observation 1.5: Missing Balance Integration in 7 Games
Inspection of `DiceGame.jsx`, `MinesGame.jsx`, `LimboGame.jsx`, `TowerGame.jsx`, `HiLoGame.jsx`, `BlackjackGame.jsx` confirms zero calls to `subtractFromBalance()` or `addToBalance()`. Players can play indefinitely without wagers or balances changing.

### Observation 1.6: Build Status
Execution of `npm run build`:
- Exited with code 0.
- Warning noted: `Module "crypto" has been externalized for browser compatibility, imported by "src/utils/provablyFair.js"` (unused import at line 1 of `provablyFair.js`).

---

## 2. Logic Chain

1. **Premise 1**: PixiJS v8 dropped support for v7 Graphics drawing pipelines (`beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, `endFill`).
   - *From Observation 1.1*: `RouletteGame.jsx` uses all 5 of these deprecated methods in 17 distinct locations.
   - *Inference*: Running Roulette invokes deprecated calls that will fail or trigger console deprecation warnings, and must be rewritten into v8 shape-then-style syntax (`circle().fill().stroke()`).

2. **Premise 2**: React async effects require unmount cancellation to prevent state updates and DOM operations on unmounted nodes.
   - *From Observation 1.2*: `RouletteGame.jsx` lacks `isDestroyed` guards during `app.init()`, while `SlotsGame.jsx` leaks callbacks on `window` and fails to destroy child Graphics.
   - *Inference*: Rapid route switching in `App.jsx` leads to unhandled rejections, DOM attachment errors, and memory leaks.

3. **Premise 3**: JavaScript throws runtime `TypeError` when invoking `undefined` as a function.
   - *From Observation 1.3*: `CrashGame`, `WheelGame`, and `ColorTradingGame` invoke `setBalance()` from props, but `App.jsx` renders them without `balance` or `setBalance`.
   - *Inference*: Clicking "Bet" or "Spin" in these games results in immediate runtime crashes (`setBalance is not a function`).

4. **Premise 4**: Property access on `undefined` causes fatal unhandled exceptions.
   - *From Observation 1.4*: `COLORS` is undefined in `WheelGame.jsx` and accessed inside `requestAnimationFrame`.
   - *Inference*: Any win in `WheelGame` terminates the canvas animation loop with an uncaught `TypeError`.

5. **Premise 5**: Centralized balance architecture mandates that all casino games integrate with `src/utils/balance.js`.
   - *From Observation 1.5*: 7 games do not call `subtractFromBalance` or `addToBalance`.
   - *Inference*: The casino wallet state is desynchronized across nearly half of the library.

---

## 3. Caveats

- **No Caveats Regarding Deprecations**: The exact deprecations in `RouletteGame.jsx` were confirmed against the official PixiJS v8 documentation embedded directly in `node_modules/pixi.js/skills/pixijs-scene-graphics/SKILL.md`.
- **Headless Simulations**: Headless Monte Carlo mathematical simulations are scoped to the math/simulation agents and were not executed by this agent.
- **Keno Architecture**: Keno is currently a `ComingSoon` stub; its visual design and mechanics remain to be authored.

---

## 4. Conclusion

The Crypto Casino frontend codebase contains specific, actionable defects across rendering, lifecycle, and state:
1. `RouletteGame.jsx` must be refactored to PixiJS v8 Graphics API and provided with an `isDestroyed` mounting guard.
2. `CrashGame.jsx`, `WheelGame.jsx`, and `ColorTradingGame.jsx` must be decoupled from nonexistent props and migrated to `src/utils/balance.js`.
3. `WheelGame.jsx` requires definition and export of `COLORS` in `src/utils/constants.js`.
4. `SlotsGame.jsx` requires removing `window.handleReelsStopped` and destroying previous `Graphics` children during line redraws.
5. `DiceGame`, `MinesGame`, `LimboGame`, `TowerGame`, `HiLoGame`, and `BlackjackGame` must integrate `subtractFromBalance()` on bet and `addToBalance()` on cashout/win.
6. The unused `import crypto from 'crypto'` in `src/utils/provablyFair.js` should be removed to eliminate the Vite browser externalization warning.

---

## 5. Verification Method

To independently verify the survey findings:

1. **Verify PixiJS v8 Deprecations in Roulette**:
   Inspect `src/games/RouletteGame.jsx` lines 70–126 and compare against `node_modules/pixi.js/skills/pixijs-scene-graphics/SKILL.md` (lines 438–489).
2. **Verify Runtime Prop Crashes in Crash, Wheel, and Color Trading**:
   Inspect `src/App.jsx` lines 48, 54, 59:
   - Line 48: `<CrashGame onBack={onBack} />` (No `balance` or `setBalance` passed)
   - Line 54: `<ColorTradingGame onBack={onBack} />` (No `balance` or `setBalance` passed)
   - Line 59: `<WheelGame onBack={onBack} />` (No `balance` or `setBalance` passed)
   Observe `CrashGame.jsx` line 251, `ColorTradingGame.jsx` line 62, and `WheelGame.jsx` line 35 invoking `setBalance()`.
3. **Verify Missing `COLORS` Export**:
   Run pattern search for `COLORS` in `src/utils/constants.js`. Observe zero exported symbols named `COLORS`.
4. **Verify Build**:
   Run `npm run build` in PowerShell from the project root. Observe exit code 0 and notice the Vite `crypto` warning.
5. **Invalidation Conditions**:
   If `RouletteGame.jsx` is updated with `circle().fill().stroke()`, `poly().fill()`, and `app.init()` unmount guards, the deprecation observations are resolved.
