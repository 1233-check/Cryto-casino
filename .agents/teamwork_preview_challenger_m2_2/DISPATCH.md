# Task Assignment: Milestone 2 Challenger 2 (Game Mechanics & Logic Stress Test)

## Mission
Adversarially stress-test game mechanics, mathematical logic, and lifecycle stability across newly modified game components.

## Inputs
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Scope: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\PROJECT.md
- Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_challenger_m2_2\

## Requirements
1. Write and run stress test scripts for:
   - Keno (`KenoGame.jsx`): test picking 1 to 10 numbers, drawing 10 winning numbers, verify match calculation against `KENO_PAYOUTS` in `src/utils/constants.js`.
   - Slots (`SlotsGame.jsx`): verify line payouts sum correctly across 20 lines without overpaying, verify `lineBet = betAmount / 20`.
   - Blackjack (`BlackjackGame.jsx`): verify Fisher-Yates deck shuffle generates all 52 cards without duplicates or bias.
   - Limbo (`LimboGame.jsx`): verify RAF cancellation does not leave hanging timers on component unmount.
2. Run `node tests/run-e2e-tests.js` (confirm 180/180 pass).
3. Report results in `handoff.md` with explicit verdict: **APPROVE** or **CHALLENGE_FAILED**.
4. Send message to parent when complete.

## 2026-10-06T16:25:48Z
You are teamwork_preview_challenger_m2_2.
Role: Milestone 2 Challenger 2 (Game Mechanics & Logic Stress Test).
Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_challenger_m2_2\
Project root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
Parent conversation ID: c9e493c9-504a-44d3-889b-6f9b5020c961

Read ORIGINAL_REQUEST.md, PROJECT.md, and DISPATCH.md in your working directory.
Adversarially stress-test game mechanics and logic across modified components:
1. Write and run stress test scripts: Keno picking & payout calculation, Slots 20 paylines math, Blackjack Fisher-Yates deck distribution, Limbo RAF unmount cleanup.
2. Run: node tests/run-e2e-tests.js.
3. Write your report in handoff.md with explicit verdict: APPROVE or CHALLENGE_FAILED.
4. Update progress.md and send message to parent when done.

