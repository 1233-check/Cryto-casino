# Original User Request

## Initial Request — 2026-10-06T14:54:34Z

Deploy a parallel multi-agent team to conduct a comprehensive functional and mathematical audit of all games in the Crypto Casino project, run large-scale simulations to establish win ratios and Return-to-Player (RTP), benchmark every title against existing market leaders (Stake.com, Roobet, BC.Game), fix all identified bugs across all games, and deliver an exhaustive audit report.

Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino
Integrity mode: development

## Requirements

### R1. Comprehensive Functional Audit & Health Check
Verify end-to-end functionality for every game in the casino library (`Crash`, `Dice`, `Mines`, `Limbo`, `Plinko`, `Color Trading`, `Tower`, `Hi-Lo`, `Wheel`, `Roulette`, `Slots`, `Blackjack`, `Baccarat`, `Video Poker`, and `Keno`). Inspect rendering pipelines (PixiJS v8 compatibility, Canvas2D, DOM/SVG), user betting state machines, wallet balance integration (`src/utils/balance.js`), provably fair seed generation, and audio feedback. Document every bug, runtime crash, uncaught exception, or missing game state.

### R2. Empirical & Theoretical Win Ratio Analysis (Monte Carlo Simulation)
Construct and execute high-volume Monte Carlo simulations (minimum 100,000 rounds per game) using headless simulation harnesses. For each game and supported configuration (e.g., Plinko rows/risk tiers, Mines count, Limbo multipliers, Dice targets, Roulette bet types, Blackjack optimal strategy, Baccarat player/banker/tie, Video Poker paytable, Slots paylines, Wheel segments):
- Calculate empirical Win Rate (%)
- Calculate empirical Return-to-Player (RTP %)
- Calculate theoretical House Edge (%) and compare with observed variance
- Analyze volatility profile (Low / Medium / High / Extreme) and maximum multiplier distribution

### R3. Market Comparison Benchmark
Benchmark every game against industry standards from market leaders:
- **Stake Originals** (Crash, Dice, Mines, Limbo, Plinko, Hi-Lo, Wheel, Keno, Roulette, Blackjack, Baccarat, Video Poker)
- **Roobet** (Crash, Mines, Towers, Dice, Roulette)
- **BC.Game** (Classic Dice, Crash, Plinko, Limbo, Hash Dice)
Compare house edges, RTP formulas, payout curves, provably fair transparency, animations/UX smoothness, and betting mechanics.

### R4. Technical Remediation & Bug Fixes
Fix all identified architectural and implementation bugs:
1. Fix PixiJS v8 Graphics API deprecations in `RouletteGame.jsx` (`beginFill`, `lineStyle`, `drawCircle`, `drawPolygon`, `endFill` replaced with v8 API).
2. Unify centralized balance management across all games (`Crash`, `Dice`, `Mines`, `Limbo`, `Tower`, `Hi-Lo`, `Wheel`, `Blackjack`, `Color Trading`) using `src/utils/balance.js` (`getBalance`, `subtractFromBalance`, `addToBalance`, `addHistoryEntry`).
3. Fix Bustabit/Stake provably fair crash algorithm in `src/utils/provablyFair.js` to eliminate artificial 32.67x multiplier cap and replace pseudo-hash with cryptographically sound SHA-256 / Web Crypto.
4. Ensure `npm run build` compiles cleanly with zero errors.

### R5. Comprehensive Audit Report Delivery
Produce an exhaustive markdown audit report (`AUDIT_REPORT.md` in the project root) containing executive summary, game-by-game breakdown tables (status, theoretical RTP, simulated RTP, win ratio, house edge, volatility, bugs found and resolved), market comparison matrices, and actionable recommendations.

## Acceptance Criteria

### Functional Verification & Fixes
- [ ] Every game mounts, accepts bets, handles win/loss states, and updates wallet balances accurately using `src/utils/balance.js`.
- [ ] PixiJS v8 compatibility is resolved and verified for all canvas games (`Crash`, `Slots`, `Roulette`, `Plinko`).
- [ ] Zero unhandled runtime exceptions or state locks across all 14 games.
- [ ] `npm run build` runs with 0 errors.

### Simulation & Math Verification
- [ ] Headless simulation harness executes >= 100,000 iterations per game configuration without crashes.
- [ ] Simulation output records: Total Wagered, Total Payout, Net Profit, Win Count, Loss Count, Win Ratio (%), Empirical RTP (%), Theoretical RTP (%), and Standard Error.
- [ ] Mathematical alignment between game formulas and industry RTP targets verified.

### Benchmark & Deliverables
- [ ] Detailed market comparison table contrasting Crypto Casino games with Stake, Roobet, and BC.Game across RTP, house edge, maximum multiplier, and provably fair architecture.
- [ ] Final `AUDIT_REPORT.md` generated and saved in `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\AUDIT_REPORT.md`, including all simulation raw data, bug remediation logs, and mathematical proofs.

## Follow-up — 2026-10-06T19:23:16Z

Visually and functionally test the frontend UI of all 15 casino games (graphics, game options, betting options) and compare the user experience against market leaders.

Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino
Integrity mode: demo

## Requirements

### R1. Frontend UI Execution & Inspection
Start the frontend development server and systematically navigate to and inspect the user interface of all 15 games (`Crash`, `Dice`, `Mines`, `Limbo`, `Plinko`, `Color Trading`, `Tower`, `Hi-Lo`, `Wheel`, `Roulette`, `Slots`, `Blackjack`, `Baccarat`, `Video Poker`, `Keno`). The team must evaluate the rendered graphics, interactive elements (bet controls, game boards), and visual feedback mechanisms. The team may decide the best methodology (e.g., browser automation, DOM inspection, or visual analysis).

### R2. Market UX Comparison
Compare the specific UI components, game configurations, and betting options (e.g., Auto-bet, hotkeys, animation smoothness) of each game against market standards (Stake, Roobet, BC.Game).

### R3. Comprehensive UX Report
Produce a detailed Markdown report (`FRONTEND_UX_REPORT.md`) documenting the UI health, graphics quality, and market comparison for each game.

## Acceptance Criteria

### Verification & Deliverables
- [ ] An automated script or tool successfully mounts/navigates to all 15 game routes in a browser environment without generating fatal console errors.
- [ ] The `FRONTEND_UX_REPORT.md` is generated in the project root.
- [ ] The report contains a dedicated section for each of the 15 games, detailing its specific UI components, graphics approach (e.g., Canvas vs. DOM), and a direct UX comparison to at least one market leader.
- [ ] The report explicitly identifies any missing standard UI features (e.g., missing max bet buttons, missing auto-play configuration) compared to Stake/Roobet.

