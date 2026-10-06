# Task Assignment: E2E Test Suite Orchestrator & Test Writer

## Mission
Design and implement the comprehensive, opaque-box E2E test suite derived from `ORIGINAL_REQUEST.md` covering all 15 games across Tiers 1-4, test runner infrastructure, and publish `TEST_INFRA.md` and `TEST_READY.md`.

## Context & Inputs
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Original User Request: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\ORIGINAL_REQUEST.md
- Project Scope: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\PROJECT.md
- Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_test_writer_e2e_1\

## Write Ownership
You EXCLUSIVELY own:
- `tests/` directory (create if needed)
- `TEST_INFRA.md` at project root
- `TEST_READY.md` at project root
Do NOT touch `src/` files.

## 4-Tier Test Suite Requirements
Derive tests directly from user requirements (R1, R2, R3, R4) across all 15 games (`Crash`, `Dice`, `Mines`, `Limbo`, `Plinko`, `Color Trading`, `Tower`, `Hi-Lo`, `Wheel`, `Roulette`, `Slots`, `Blackjack`, `Baccarat`, `Video Poker`, `Keno`):
- **Tier 1: Feature Coverage (>=5 per feature/game)**:
  Happy-path functional tests verifying game rules, bets, payouts, balance updates, and math outputs.
- **Tier 2: Boundary & Corner Cases (>=5 per feature/game)**:
  Zero bet, max bet, minimum multiplier (1.00x), extreme odds, invalid seeds, edge conditions.
- **Tier 3: Cross-Feature Combinations**:
  Pairwise interactions: balance deduction -> win -> history recording; rapid repeated spins; multi-round state continuity.
- **Tier 4: Real-World Scenarios**:
  Realistic betting sessions, multi-game user workflows, verification of provably fair hashes and seed rotation.

## Deliverables
1. Test suite runner executable with Node.js (`node tests/run-e2e-tests.js`).
2. Complete `TEST_INFRA.md` at project root following the standard template.
3. Once all test cases are implemented and runner is verified, publish `TEST_READY.md` at project root summarizing total test count by tier and feature checklist.
4. Write `handoff.md` and update `progress.md` in your working directory.

## 2026-10-06T15:14:18Z
You are teamwork_preview_test_writer_e2e_1.
Role: E2E Test Suite Orchestrator & Test Writer.
Working directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_test_writer_e2e_1\
Project root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
Parent conversation ID: c9e493c9-504a-44d3-889b-6f9b5020c961

Read ORIGINAL_REQUEST.md, PROJECT.md, and DISPATCH.md in your working directory.
Your task:
Design and implement the comprehensive 4-tier opaque-box E2E test suite covering all 15 games in Crypto Casino:
- Tier 1: Feature Coverage (>=5 tests per game)
- Tier 2: Boundary & Corner Cases (>=5 tests per game)
- Tier 3: Cross-Feature Combinations (pairwise interactions, balance, history)
- Tier 4: Real-World Scenarios (betting workflows, provably fair seed verification)

Write Ownership:
You EXCLUSIVELY own:
- tests/ directory
- TEST_INFRA.md at project root
- TEST_READY.md at project root

Specific requirements:
1. Build test runner: tests/run-e2e-tests.js that executes all tiers and outputs pass/fail counts.
2. Build test cases covering Crash, Dice, Mines, Limbo, Plinko, Color Trading, Tower, Hi-Lo, Wheel, Roulette, Slots, Blackjack, Baccarat, Video Poker, and Keno.
3. Generate TEST_INFRA.md following the dual-track standard template.
4. Execute the test runner (node tests/run-e2e-tests.js) to confirm test runner sanity.
5. Publish TEST_READY.md at project root with complete tier summary and feature checklist.
6. Write handoff.md and update progress.md.
7. Send a message to parent (c9e493c9-504a-44d3-889b-6f9b5020c961) when done.
