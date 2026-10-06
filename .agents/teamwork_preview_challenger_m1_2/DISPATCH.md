# Task Assignment: Milestone 1 Challenger 2 (Mathematical & Simulation Stress Test)

## Mission
Empirically stress-test the uncapped Crash point distribution and recalibrated Wheel segments.

## Inputs
- Project Root: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\
- Scope: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\PROJECT.md
- Working Directory: c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\.agents\teamwork_preview_challenger_m1_2\

## Requirements
1. Write and execute an independent empirical simulation script:
   - Run 100,000+ rounds of `getCrashPoint(serverSeed, clientSeed, nonce)`:
     - Check: Is minimum multiplier exactly 1.00x?
     - Check: Do multipliers exceed 32.67x? (Record max multiplier, count >= 10x, 100x, 1000x).
     - Check: Instant bust rate at $1.00x$ (should be approximately 3.0%).
     - Check: Calculate empirical RTP for cashout at $1.50x$, $2.00x$, $5.00x$, and $10.00x$. Does empirical RTP match $97.0\% \pm 0.5\%$?
   - Simulate all 15 configurations of `WHEEL_SEGMENTS`:
     - Run 100,000 spins per configuration.
     - Check: Are all empirical RTPs between $98.0\%$ and $99.5\%$?
     - Check: Are there ANY negative house edge anomalies remaining?
2. Report findings in `handoff.md` with explicit verdict: **APPROVE** or **CHALLENGE_FAILED**.
3. Send message to parent when done.

## 2026-10-06T15:38:48Z
Task Assignment received: Empirical stress-testing of uncapped Crash point distribution and recalibrated Wheel segments.
