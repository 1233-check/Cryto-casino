# Scope: Frontend UI & UX Market Audit for Crypto Casino (15 Games)

## Architecture & Technology Stack
- **Frontend Stack**: Vite + React 18, Tailwind CSS, Lucide React, Framer Motion, Howler.js, PixiJS v8.
- **15 Casino Games**:
  1. `Crash`: PixiJS v8 WebGL Canvas, particle emitter, dynamic curve
  2. `Dice`: DOM + Framer Motion, dual-track slider, roll history pills
  3. `Mines`: DOM + SVG + Framer Motion, 5x5 grid, 1-24 mines
  4. `Limbo`: DOM + requestAnimationFrame odometer, target multiplier
  5. `Plinko`: HTML5 Canvas2D, procedural peg pyramid, multi-ball physics
  6. `Color Trading`: DOM + SVG countdown, color cards, 0-9 number grid
  7. `Tower`: DOM + SVG, 10-floor climb, 4 difficulties
  8. `Hi-Lo`: DOM + 3D card layout, dynamic odds calculation
  9. `Wheel`: HTML5 Canvas2D, flapper deflection physics, 10-50 segments
  10. `Roulette`: PixiJS v8 WebGL wheel & ball spiral + DOM European betting table
  11. `Slots`: PixiJS v8 WebGL 5x3 reels, BlurFilter, 20 paylines, sound integration
  12. `Blackjack`: DOM + 3D CSS flip + Framer Motion deal, hit/stand/double
  13. `Baccarat`: DOM + 3D CSS flip, Punto Banco rules, Bead Plate history
  14. `Video Poker`: DOM + 3D CSS flip, interactive paytable, sound integration
  15. `Keno`: DOM + Framer Motion, 40-number grid, quick picks, sound integration

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Hash-Routing-Deep-Linking | Add bidirectional hash routing (`#crash`, `#dice`, etc.) and `window.__cryptoCasinoNavigate` in `App.jsx` | M1 | Survey 1 | DONE |
| 2 | Automated-Browser-Test-Runner | Zero-dependency CDP Node runner (`scripts/verify-ui-routes.mjs`) driving real browser across all 15 routes | M1 | Survey 1 | DONE |
| 3 | Route-Mount-Zero-Fatal-Errors | Execute automated test asserting all 15 games mount without fatal exceptions or console errors | M1 | R1 AC | DONE |
| 4 | Deep-UI-Graphics-Catalog | Exhaustive audit of rendering pipelines, bet controls, visual feedback, and audio across all 15 games | M2 | Survey 2 | DONE |
| 5 | Market-UX-Benchmarking-Matrix | Comprehensive comparative matrix of all 15 games vs Stake Originals, Roobet, and BC.Game | M2 | Survey 3 | DONE |
| 6 | Missing-Features-Identification | Explicit catalog of missing standard features (Auto-bet, Min/Max buttons, hotkeys, ribbons, modals) | M2 | Survey 2 & 3 | DONE |
| 7 | FRONTEND_UX_REPORT-Delivery | Authoritative `FRONTEND_UX_REPORT.md` delivered at project root with dedicated sections for all 15 games | M2 | R3 AC | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status | Output |
|---|------|-------|-------------|--------|--------|
| 1 | Automated Browser Route Navigation & Verification | Features 1, 2, 3 | Survey Complete | DONE | `src/App.jsx`, `scripts/verify-ui-routes.mjs`, `scripts/in-browser-test-harness.js` |
| 2 | Comprehensive FRONTEND_UX_REPORT Delivery & Gating | Features 4, 5, 6, 7 | M1 | DONE | `FRONTEND_UX_REPORT.md` (894 lines, 78 KB) |

## Acceptance Criteria
- [x] Dev server starts and automated script drives browser through all 15 game routes sequentially.
- [x] 0 fatal console errors or uncaught exceptions across all 15 routes.
- [x] `FRONTEND_UX_REPORT.md` generated at project root.
- [x] Dedicated section for each of the 15 games with UI components, graphics approach, market comparison, and missing standard features.
- [x] Gating passes with Reviewer APPROVE, Challenger verified, and Auditor CLEAN.
