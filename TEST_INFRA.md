# Test Infrastructure Specification (Dual-Track Architecture)

## Overview
This document specifies the dual-track testing infrastructure for the **Crypto Casino** project. The test architecture provides comprehensive, deterministic, and opaque-box validation across all 15 casino titles, shared financial utilities, and cryptographic provably fair algorithms.

---

## Dual-Track Testing Architecture

```
                    ┌────────────────────────────────────────────────────────┐
                    │               Crypto Casino Test Harness               │
                    └────────────────────────────────────────────────────────┘
                                   │                           │
                   ┌───────────────┴───────────────┐           │
                   ▼                               ▼           ▼
      ┌──────────────────────────┐   ┌─────────────────────────────────────────┐
      │         TRACK 1          │   │                 TRACK 2                 │
      │  Unit & Component Track  │   │        Opaque-Box E2E Test Track        │
      │   (Stateless Contracts)  │   │        (4-Tier Full Simulation)         │
      └──────────────────────────┘   └─────────────────────────────────────────┘
                   │                                           │
         ┌─────────┴─────────┐              ┌──────────────────┼──────────────────┐
         ▼                   ▼              ▼                  ▼                  ▼
    provablyFair          balance        Tier 1: Feature     Tier 2: Boundary   Tier 3/4: Real-World
      (Crypto)            (Store)           Coverage              Cases              Scenarios
```

### Track 1: Unit & Cryptographic Contract Track
- **Focus**: Pure deterministic validation of isolated mathematical engines and utilities:
  - Cryptographic HMAC-SHA256 float generators and seed hashing in `src/utils/provablyFair.js`.
  - Transactional persistence and event dispatching in `src/utils/balance.js`.
  - Paytables, wheel segments, and card distributions in `src/utils/constants.js`.
- **Environment**: Node.js ESM runtime with in-memory storage polyfills.

### Track 2: 4-Tier Opaque-Box E2E Test Track
- **Focus**: End-to-end betting lifecycle, balance reconciliation, transaction history, state machine transitions, and real-world player sessions across all 15 games.
- **Tiers**:
  1. **Tier 1 — Feature Coverage**: Happy-path validation for every game title ($\ge 5$ tests per game = 75 tests).
  2. **Tier 2 — Boundary & Corner Cases**: Stress boundaries, minimum/maximum multipliers, edge odds, decimal precision, zero bets, and out-of-bounds conditions ($\ge 5$ tests per game = 75 tests).
  3. **Tier 3 — Cross-Feature Combinations**: Pairwise couplings (deduct $\to$ win $\to$ history), multi-game continuous sessions, balance conservation laws, and rapid betting concurrency (15 tests).
  4. **Tier 4 — Real-World Scenarios**: Betting systems (Martingale, D'Alembert, Paroli), high-roller vs. satoshi micro-stakes journeys, and cryptographic provably fair seed audit verification (15 tests).
- **Total Tests**: **180 automated tests** across all 15 games.

---

## Directory Structure

```
tests/
├── run-e2e-tests.js                    # Unified CLI runner (Node.js ESM)
├── helpers/
│   ├── env.js                          # In-memory localStorage & WebCrypto polyfills
│   ├── assert.js                       # Lightweight zero-dependency assertion library
│   ├── test-harness.js                 # Suite registry, execution runner, and reporter
│   └── game-engines/                   # Opaque-box betting adapters for all 15 titles
│       ├── crash-engine.js
│       ├── dice-engine.js
│       ├── mines-engine.js
│       ├── limbo-engine.js
│       ├── plinko-engine.js
│       ├── colortrading-engine.js
│       ├── tower-engine.js
│       ├── hilo-engine.js
│       ├── wheel-engine.js
│       ├── roulette-engine.js
│       ├── slots-engine.js
│       ├── blackjack-engine.js
│       ├── baccarat-engine.js
│       ├── videopoker-engine.js
│       ├── keno-engine.js
│       └── index.js
├── tier1/                              # Feature Coverage (>=5 tests per game)
│   ├── crash.test.js
│   ├── dice.test.js
│   ├── mines.test.js
│   ├── limbo.test.js
│   ├── plinko.test.js
│   ├── colortrading.test.js
│   ├── tower.test.js
│   ├── hilo.test.js
│   ├── wheel.test.js
│   ├── roulette.test.js
│   ├── slots.test.js
│   ├── blackjack.test.js
│   ├── baccarat.test.js
│   ├── videopoker.test.js
│   └── keno.test.js
├── tier2/                              # Boundary & Corner Cases (>=5 tests per game)
│   ├── crash-boundaries.test.js
│   ├── dice-boundaries.test.js
│   ├── mines-boundaries.test.js
│   ├── limbo-boundaries.test.js
│   ├── plinko-boundaries.test.js
│   ├── colortrading-boundaries.test.js
│   ├── tower-boundaries.test.js
│   ├── hilo-boundaries.test.js
│   ├── wheel-boundaries.test.js
│   ├── roulette-boundaries.test.js
│   ├── slots-boundaries.test.js
│   ├── blackjack-boundaries.test.js
│   ├── baccarat-boundaries.test.js
│   ├── videopoker-boundaries.test.js
│   └── keno-boundaries.test.js
├── tier3/                              # Cross-Feature Combinations
│   ├── balance-history-coupling.test.js
│   ├── multi-game-sessions.test.js
│   └── rapid-betting-concurrency.test.js
└── tier4/                              # Real-World Scenarios & Betting Systems
    ├── provably-fair-verification.test.js
    ├── betting-systems-martingale.test.js
    └── end-to-end-player-journeys.test.js
```

---

## Execution Guide

### How to Run the Comprehensive E2E Test Suite
The entire test suite executes via Node.js with zero external test runner dependencies:

```bash
node tests/run-e2e-tests.js
```

### Exit Codes & CI Integration
- **`0`**: All 180 tests executed and passed.
- **`1`**: One or more assertions failed or uncaught error encountered.

---

## Supported Game Matrix (15 Titles)

| # | Game Title | Engine Module | Tier 1 (Coverage) | Tier 2 (Boundaries) | Total Specific Tests |
|---|------------|---------------|-------------------|---------------------|----------------------|
| 1 | Crash | `crash-engine.js` | 5 tests | 5 tests | 10 tests |
| 2 | Dice | `dice-engine.js` | 5 tests | 5 tests | 10 tests |
| 3 | Mines | `mines-engine.js` | 5 tests | 5 tests | 10 tests |
| 4 | Limbo | `limbo-engine.js` | 5 tests | 5 tests | 10 tests |
| 5 | Plinko | `plinko-engine.js` | 5 tests | 5 tests | 10 tests |
| 6 | Color Trading | `colortrading-engine.js` | 5 tests | 5 tests | 10 tests |
| 7 | Tower | `tower-engine.js` | 5 tests | 5 tests | 10 tests |
| 8 | Hi-Lo | `hilo-engine.js` | 5 tests | 5 tests | 10 tests |
| 9 | Wheel | `wheel-engine.js` | 5 tests | 5 tests | 10 tests |
| 10 | Roulette | `roulette-engine.js` | 5 tests | 5 tests | 10 tests |
| 11 | Slots | `slots-engine.js` | 5 tests | 5 tests | 10 tests |
| 12 | Blackjack | `blackjack-engine.js` | 5 tests | 5 tests | 10 tests |
| 13 | Baccarat | `baccarat-engine.js` | 5 tests | 5 tests | 10 tests |
| 14 | Video Poker | `videopoker-engine.js` | 5 tests | 5 tests | 10 tests |
| 15 | Keno | `keno-engine.js` | 5 tests | 5 tests | 10 tests |
| - | **Cross-Feature (Tier 3)** | Cross-Engine | — | — | 15 tests |
| - | **Real-World Scenarios (Tier 4)** | Multi-Session | — | — | 15 tests |
| **TOTAL** | **All 15 Titles** | | **75 tests** | **75 tests** | **180 tests** |

---

## Key Invariants & Verification Guarantees

1. **Balance Strict Conservation Law**:
   $$\text{FinalBalance} = \text{InitialBalance} - \sum \text{Bets} + \sum \text{Payouts}$$
   Verified across single-round, multi-game, and 50+ rapid betting loops.
2. **Deterministic Provably Fair Cryptography**:
   Verified HMAC-SHA256 commitment: $\text{hashSeed}(\text{serverSeed}) \equiv \text{publishedHash}$, with deterministic crash multiplier reproduction.
3. **History Ring Buffer Invariant**:
   Maximum of 100 historical records retained, ordered with non-increasing timestamps, and strictly preserving $\text{profit} = \text{payout} - \text{bet}$.
4. **Fractional Precision Guarantee**:
   All transactions support satoshi-level precision ($10^{-8}$ BTC) without floating point truncation or rounding drift.
