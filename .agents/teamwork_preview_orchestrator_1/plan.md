# Project Master Plan: Crypto Casino Audit and Technical Remediation

## Objective
Deliver a comprehensive functional and mathematical audit of all 15 games in Crypto Casino, remediate all identified bugs (PixiJS v8 deprecations, centralized balance unification, provably fair cryptography & uncapped Crash multiplier, build fixes), execute >=100,000 round Monte Carlo simulations per game, benchmark against Stake/Roobet/BC.Game, and deliver an exhaustive `AUDIT_REPORT.md` with zero build errors.

## Phase 0: Survey & Discovery (Top-Level Parallel Exploration)
- Dispatch 3 parallel exploratory agents:
  1. `teamwork_preview_explorer` (Frontend/Rendering & PixiJS v8):
     - Inspect `RouletteGame.jsx`, `Crash`, `Slots`, `Plinko`, Canvas2D, SVG/DOM rendering.
     - Identify all deprecated PixiJS v7/v8 Graphics API calls (`beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, `endFill`, etc.).
     - Map component mount/unmount and lifecycle behaviors.
  2. `teamwork_preview_explorer` (Architecture, State Machines & Balance):
     - Inspect `src/utils/balance.js` and all game implementations (`Crash`, `Dice`, `Mines`, `Limbo`, `Plinko`, `Color Trading`, `Tower`, `Hi-Lo`, `Wheel`, `Roulette`, `Slots`, `Blackjack`, `Baccarat`, `Video Poker`, `Keno`).
     - Map current balance read/write practices and identify fragmentation / bypasses of `src/utils/balance.js`.
     - Inspect `src/utils/provablyFair.js` for pseudo-hash implementation, seed handling, and 32.67x artificial crash multiplier cap.
     - Inspect project build setup (`package.json`, Vite/Webpack configuration, linting, dependencies).
  3. `teamwork_preview_spec_miner` (Math Specifications, Simulation & Market Benchmarking):
     - Document mathematical models for all 15 games (paytables, odds, theoretical RTP, house edges, volatility).
     - Formulate requirements for headless Monte Carlo simulation harness (>=100,000 iterations per game).
     - Map benchmark data from market leaders (Stake.com, Roobet, BC.Game).
- Aggregate findings and compile `PROJECT.md` with Feature Inventory and milestones.

## Phase 1: Core Mathematical & Cryptographic Remediation (Milestone 1)
- Implement cryptographically sound SHA-256 / Web Crypto HMAC in `src/utils/provablyFair.js`.
- Remove artificial 32.67x multiplier cap in Crash game logic, adhering strictly to Bustabit/Stake provably fair formula:
  $$\text{multiplier} = \max\left(1.00, \left\lfloor \frac{100 \times E - H}{E - H} \right\rfloor / 100\right)$$ with 1% instant crash probability.
- Worker implements, Reviewers review, Challenger stress tests math & seeds, Auditor conducts integrity audit.

## Phase 2: Centralized Balance Management Unification (Milestone 2)
- Refactor all 15 games to strictly utilize `src/utils/balance.js` functions:
  `getBalance`, `subtractFromBalance`, `addToBalance`, `addHistoryEntry`.
- Eliminate local state balance caching or bypasses.
- Ensure atomic bet placement, win payout, and history recording.
- Worker implements, Reviewers review, Challenger stress tests concurrent/rapid betting, Auditor checks integrity.

## Phase 3: PixiJS v8 Graphics Modernization & UI Remediation (Milestone 3)
- Modernize `RouletteGame.jsx` and any other PixiJS components to PixiJS v8 Graphics API.
  Replace `beginFill` / `endFill` / `lineStyle` with v8 chaining (`fill`, `stroke`, `circle`, `poly`, etc.).
- Fix canvas rendering crashes, resize handling, and cleanup on unmount.
- Worker implements, Reviewers review, Challenger tests lifecycle/rendering, Auditor verifies integrity.

## Phase 4: Headless Monte Carlo Simulation Suite (Milestone 4)
- Create automated headless simulation harness capable of running >=100,000 iterations per game configuration.
- Capture:
  - Total Wagered, Total Payout, Net Profit
  - Win Count, Loss Count, Empirical Win Rate (%)
  - Empirical RTP (%), Theoretical House Edge (%), Theoretical RTP (%)
  - Standard Error, Volatility index, and Max Multiplier observed.
- Run simulations across all 15 games and key risk/row/line configurations.
- Worker builds and runs harness, Reviewers verify statistical validity, Challenger cross-verifies results with independent generator, Auditor audits integrity.

## Phase 5: Market Benchmarking & Final Comprehensive Audit Report (Milestone 5)
- Contrast Crypto Casino against Stake Originals, Roobet, and BC.Game.
- Compile exhaustive `AUDIT_REPORT.md` at project root including:
  - Executive Summary
  - Game-by-Game detailed audit breakdown tables
  - Bug remediation registry (before/after)
  - Full Monte Carlo simulation results table (>=100k rounds per game)
  - Market Comparison Matrix
  - Architectural & security recommendations.
- Worker drafts report, Reviewers critique completeness, Challenger verifies data tables, Auditor verifies data integrity.

## Phase 6: Build Verification & Final Acceptance Gate (Milestone 6)
- Verify `npm run build` compiles with 0 errors and zero warnings.
- Verify all acceptance criteria in `ORIGINAL_REQUEST.md`.
- Final audit pass.
- Orchestrator handoff & report to Sentinel.
