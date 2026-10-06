# Dispatch: Worker M1 — Automated Browser Route Navigation & Health Check

## Objective
Implement bidirectional hash routing in `src/App.jsx`, install the zero-dependency automated browser verification runner in `scripts/verify-ui-routes.mjs`, and execute the automated browser test to verify that all 15 casino games mount cleanly in a real browser without fatal console errors.

## Mandatory Reading
- `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md` (specifically follow-up R1)
- `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_ui_1\handoff.md`

## Reference Implementations Provided by Explorer 1
- `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_ui_1\proposed_App.jsx`
- `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_ui_1\proposed_verify_ui_routes.mjs`

## File Ownership
- Exclusively owns: `src/App.jsx`, `scripts/verify-ui-routes.mjs`.

## Tasks
1. Read `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md`.
2. Inspect `src/App.jsx` and apply the hash-routing update from `proposed_App.jsx` so that URL hash (`#crash`, `#dice`, etc.) synchronizes with `activeView` and exposes `window.__cryptoCasinoNavigate(route)`.
3. Create `scripts/verify-ui-routes.mjs` with the complete zero-dependency Node CDP browser runner from `proposed_verify_ui_routes.mjs`.
4. Ensure `npm run build` succeeds cleanly with 0 errors.
5. Run the automated browser test script (`node scripts/verify-ui-routes.mjs`) against the dev server (or preview server), verifying all 15 game routes mount cleanly in a real browser with 0 fatal console errors.
6. Capture and document the complete console logs and verification summary.
7. Write `handoff.md` in your working directory (`c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_worker_ui_m1\handoff.md`) and notify orchestrator.

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-10-06T19:36:39Z
You are Worker UI M1: Automated Browser Route Navigation & Health Check.
Your working directory is: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_worker_ui_m1
Project root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino

MANDATORY: Read c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md first (specifically the latest follow-up request).
Also read your assignment in c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_worker_ui_m1\DISPATCH.md.

Read Explorer 1's handoff and files:
- c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_ui_1\handoff.md
- c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_ui_1\proposed_App.jsx
- c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_explorer_survey_ui_1\proposed_verify_ui_routes.mjs

Tasks:
1. Integrate bidirectional hash routing into src/App.jsx from proposed_App.jsx so that hashes like #crash, #dice, #mines, #limbo, #colortrading, #plinko, #tower, #hilo, #keno, #wheel, #roulette, #slots, #blackjack, #baccarat, #videopoker navigate to the corresponding games, and expose window.__cryptoCasinoNavigate(route).
2. Install scripts/verify-ui-routes.mjs from proposed_verify_ui_routes.mjs.
3. Run `npm run build` and ensure clean compilation.
4. Execute `node scripts/verify-ui-routes.mjs` against the frontend server. It will launch headless Edge or Chrome via CDP on port 9222 and systematically navigate to all 15 game routes in a real browser, verifying DOM/Canvas elements and asserting ZERO fatal console errors.
5. Capture full execution logs, verify passing status for all 15 games.
6. Write your complete handoff report to handoff.md in your working directory and notify the parent orchestrator via send_message.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

