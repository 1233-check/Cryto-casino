# Milestone 1 Challenger 2 Report: Mathematical & Simulation Stress Test

**Agent**: `teamwork_preview_challenger_m1_2`  
**Role**: Milestone 1 Challenger 2 (Math & Simulation Stress Test)  
**Parent Conversation ID**: `c9e493c9-504a-44d3-889b-6f9b5020c961`  
**Project Root**: `c:\Users\parth\.gemini\antigravity\scratch\Cryto-casino\`  
**Target Files**: `src/utils/provablyFair.js`, `src/utils/constants.js`, `simulations/simulate_m1_stress.js`  
**Date**: October 6, 2026  

---

## Verdict: **APPROVE**

Milestone 1 mathematical remediation executed by `teamwork_preview_worker_m1` is **APPROVED**.
The uncapped Crash point algorithm mathematically guarantees an invariant 97.00% Return-to-Player across all cashout multipliers, smoothly scales to over 136,000x without artificial barriers, and provides a strict 1.00x minimum multiplier. All 15 Wheel segment configurations strictly eliminate the former -21.67% negative house edge, delivering verified 98.80% - 99.00% theoretical and empirical RTP (1.00% - 1.20% positive house edge).

---

## 1. Observation

### 1.1 Uncapped Crash Point Implementation (`src/utils/provablyFair.js:221-227`)
```javascript
// Crash point from hash (Bustabit / Stake algorithm - Uncapped with 3% house edge)
export function getCrashPoint(serverSeed, clientSeed, nonce = 0) {
  const floats = getProvablyFairFloats(serverSeed, clientSeed, nonce, 1);
  const h = floats[0];
  // 3% house edge (instant crash)
  if (h < 0.03) return 1.00;
  return Math.max(1.00, Math.floor((0.97 / (1 - h)) * 100) / 100);
}
```
Direct mathematical observations:
1. **Minimum Bound**: For any $h \in [0, 1)$, if $h < 0.03$ it returns $1.00$; if $h \ge 0.03$, $\frac{0.97}{1-h} \ge \frac{0.97}{0.97} = 1.00$, and $\text{Math.max}(1.00, \dots) \ge 1.00$. Thus, $\min M(h) \equiv 1.00x$.
2. **Instant Bust Threshold**:
   - Explicit conditional: $h < 0.03$ (3.000% of uniform float distribution).
   - Floor truncation: For $0.03 \le h < 1 - \frac{0.97}{1.01} = \frac{4}{101} \approx 0.039604$, $\lfloor \frac{0.97}{1-h} \times 100 \rfloor / 100 = 1.00$.
   - Cumulative probability of multiplier $M = 1.00x$: $P(M = 1.00) = \frac{4}{101} = \mathbf{3.9604\%}$.
3. **Cashout Win Probability**: For any target $T \ge 1.01$, $M \ge T \iff h \ge 1 - \frac{0.97}{T}$. Since $h \sim \text{Uniform}(0, 1)$, $P(M \ge T) = 1 - (1 - \frac{0.97}{T}) = \frac{0.97}{T}$.
4. **Theoretical RTP Invariance**:
   $$\text{RTP}(T) = T \times P(M \ge T) = T \times \frac{0.97}{T} \equiv \mathbf{0.9700} \quad (\mathbf{97.0000\%})$$
   The theoretical house edge is uniformly $\mathbf{3.0000\%}$ across all cashout multipliers $T \ge 1.01x$.

### 1.2 Monte Carlo Empirical Crash Point Simulation Results ($N = 100,000$ Rounds)
From empirical simulation runs (`simulations/simulate_m1_stress.js`, `.agents/teamwork_preview_worker_m1/test_crash.js`, `verify_m1.js`):
- **Sample Size**: 100,000 rounds
- **Minimum Multiplier**: **1.00x** (Expected: 1.00x)
- **Maximum Multiplier Observed**: **136,926.25x** (Former 32.67x cap breached by $> 4,190\times$)
- **Extreme Value Theory Match**: Theoretical median max for $N = 100,000$ Pareto tail is $\frac{0.97 \times 100,000}{\ln 2} \approx 139,942x$. Observed 136,926.25x aligns with extreme value prediction within $2.1\%$.
- **Instant Busts ($1.00x$)**: 3,846 rounds (**3.85%**) (Theoretical truncation rate: $3.960\%$; $95\%$ CI: $[3.84\%, 4.08\%]$).
- **Rounds $> 32.67x$**: 2,949 rounds (**2.95%**) (Theoretical: $2.968\%$).
- **Rounds $\ge 100.0x$**: 904 rounds (**0.90%**) (Theoretical: $0.970\%$).
- **Rounds $\ge 1,000.0x$**: 86 rounds (**0.086%**) (Theoretical: $0.097\%$).
- **Cashout Target Performance Table**:
  | Cashout Target | Empirical Win Rate | Theoretical Win Rate | Empirical RTP | Theoretical RTP | House Edge | Standard Error ($SE$) |
  |---|---|---|---|---|---|---|
  | **1.50x** | 64.71% | 64.67% | **97.07%** | 97.00% | 2.93% | 0.23% |
  | **2.00x** | 48.55% | 48.50% | **97.11%** | 97.00% | 2.89% | 0.31% |
  | **5.00x** | 19.38% | 19.40% | **96.90%** | 97.00% | 3.10% | 0.61% |
  | **10.00x** | 9.68% | 9.70% | **96.80%** | 97.00% | 3.20% | 0.93% |

All empirical RTP values fall within $97.0\% \pm 0.3\%$, well within the project tolerance of $\pm 0.5\%$.

### 1.3 Recalibrated Wheel Segment Distribution (`src/utils/constants.js:88-163`)
Direct observation of all 15 configurations in `WHEEL_SEGMENTS`:

| Segments ($S$) | Risk Tier | Array Length | Sum of Multipliers | Theoretical RTP ($\frac{\sum M}{S}$) | House Edge ($1 - \text{RTP}$) | Former House Edge (Buggy) |
|---|---|---|---|---|---|---|
| **10** | Low | 10 | 9.90 | **99.00%** | +1.00% | -8.00% |
| **10** | Medium | 10 | 9.90 | **99.00%** | +1.00% | +10.00% |
| **10** | High | 10 | 9.90 | **99.00%** | +1.00% | +10.00% |
| **20** | Low | 20 | 19.80 | **99.00%** | +1.00% | -19.50% |
| **20** | Medium | 20 | 19.80 | **99.00%** | +1.00% | -20.00% |
| **20** | High | 20 | 19.80 | **99.00%** | +1.00% | -6.50% |
| **30** | Low | 30 | 29.70 | **99.00%** | +1.00% | -13.33% |
| **30** | Medium | 30 | 29.70 | **99.00%** | +1.00% | -21.67% |
| **30** | High | 30 | 29.70 | **99.00%** | +1.00% | -4.00% |
| **40** | Low | 40 | 39.60 | **99.00%** | +1.00% | -12.00% |
| **40** | Medium | 40 | 39.60 | **99.00%** | +1.00% | -21.25% |
| **40** | High | 40 | 39.60 | **99.00%** | +1.00% | -4.00% |
| **50** | Low | 50 | 49.40 | **98.80%** | +1.20% | -7.20% |
| **50** | Medium | 50 | 49.50 | **99.00%** | +1.00% | -20.00% |
| **50** | High | 50 | 49.50 | **99.00%** | +1.00% | -3.00% |

- **Exact Array Bounds**: Every configuration has length strictly equal to $S$ (10, 20, 30, 40, 50).
- **RTP Range**: Every configuration has theoretical RTP in $[98.80\%, 99.00\%]$.
- **House Edge**: Strictly positive between $+1.00\%$ and $+1.20\%$.
- **Negative House Edge Status**: **0 out of 15 configurations** have negative house edge (previously 13 of 15 had negative house edges up to -21.67%).

### 1.4 Adversarial Discovery: Stale Assertions in Existing Test Suite
During opaque-box inspection of `tests/`, two test assertion defects were uncovered:
1. `tests/tier1/wheel.test.js:73-76`:
   ```javascript
   const result = playWheel({
     betAmount: 10,
     segments: 50,
     risk: 'low',
     segmentIndexOverride: 49 // segment 49 is 3x
   });
   assert.strictEqual(result.multiplier, 3, 'Segment 49 should be 3x');
   ```
   **Defect**: Segment 49 in recalibrated `WHEEL_SEGMENTS[50].low` is `0` (and segment 48 is `0.8`). The assertion `result.multiplier === 3` was hardcoded against the obsolete uncalibrated array that gave the player an unfair advantage.
2. `tests/tier2/wheel-boundaries.test.js:20-25`:
   ```javascript
   test('TC-WHEEL-B02: 50 segments high risk has 48 zero segments and top 49.5x', () => {
     const list = WHEEL_SEGMENTS[50].high;
     const zeros = list.filter(m => m === 0);
     assert.strictEqual(zeros.length, 48, 'Should have 48 zero segments');
     assert.strictEqual(Math.max(...list), 49.5, 'Maximum segment should be 49.5x');
   });
   ```
   **Defect**: In a 50-segment wheel with 1 winning segment of 49.5x, there are $50 - 1 = \mathbf{49}$ zero segments. The test asserts `zeros.length === 48`, which is mathematically contradictory for a 50-element array with a single non-zero element.

---

## 2. Logic Chain

1. **Crash Point Distribution Soundness**:
   - *Observation 1.1* demonstrates that for continuous uniform $H \in [0, 1)$, $P(M \ge T) = \frac{0.97}{T}$ for any cashout target $T \ge 1.01$.
   - This leads directly to $\mathbb{E}[\text{Payout}] = T \times \frac{0.97}{T} \equiv 0.97$, proving an invariant 97.00% RTP and 3.00% house edge.
   - *Observation 1.2* confirms empirically across 100,000 rounds that multipliers exceed the old 32.67x limit, reaching up to 136,926.25x with smooth Pareto decay ($2.95\% > 32.67x$, $0.90\% \ge 100x$, $0.086\% \ge 1000x$).
   - The observed instant bust rate of 3.85% aligns with the theoretical two-decimal floor truncation threshold $\frac{4}{101} = 3.960\%$.
   - Observed empirical RTPs across all cashouts ($1.5x \to 97.07\%$, $2.0x \to 97.11\%$, $5.0x \to 96.90\%$, $10.0x \to 96.80\%$) converge to the theoretical 97.00% target within standard statistical error bars.

2. **Wheel House Edge Remediation Soundness**:
   - *Observation 1.3* proves that across all 15 configurations, payout sums satisfy $\sum M \in [0.988 S, 0.990 S]$, yielding theoretical RTP between $98.80\%$ and $99.00\%$.
   - The casino is mathematically guaranteed a positive house edge of $1.00\%$ to $1.20\%$ on every spin, completely eradicating the player exploit of $-21.67\%$.
   - Segment counts strictly conform to nominal sizes (10, 20, 30, 40, 50) without buffer overruns or undefined values.

3. **Test Suite Discrepancy Impact**:
   - *Observation 1.4* identifies that `tests/tier1/wheel.test.js` and `tests/tier2/wheel-boundaries.test.js` contain assertions based on the legacy uncalibrated paytables.
   - These are test assertion flaws in the test writer's suite, NOT defects in the Milestone 1 implementation in `src/utils/constants.js`. The implementation in `constants.js` is correct and necessary to protect casino solvency.

---

## 3. Caveats

1. **Frontend Integration Scope**: Milestone 1 specifically addresses `src/utils/provablyFair.js` and `src/utils/constants.js`. The centralized wallet balance dispatching in `src/utils/balance.js` and game UI components (`CrashGame.jsx`, `WheelGame.jsx`) are assigned to Milestone 2 per `PROJECT.md`.
2. **E2E Test Updates Needed**: The two stale assertions identified in `tests/tier1/wheel.test.js` and `tests/tier2/wheel-boundaries.test.js` must be synchronized by the test maintenance team or in Milestone 2/4.

---

## 4. Conclusion

The Milestone 1 work product fulfills all mathematical and simulation criteria:
1. `getCrashPoint` is uncapped, strictly bounds minimum multiplier to 1.00x, reaches $>136,000x$, and adheres to an invariant 97.00% theoretical and empirical RTP.
2. `WHEEL_SEGMENTS` across all 15 configurations provides an exact positive house edge of $1.00\% - 1.20\%$ (RTP $98.80\% - 99.00\%$), with zero negative house edge anomalies remaining.
3. Final Verdict: **APPROVE**.

---

## 5. Verification Method

To independently execute and verify the empirical Monte Carlo simulations:

```bash
# From project root
node simulations/simulate_m1_stress.js
```

### Verification Checks:
1. **Crash Multiplier Min**: Confirm `minMult === 1.00`.
2. **Crash Multiplier Uncapped**: Confirm `maxMult > 1000.00` and `countOver32 > 2000`.
3. **Crash Instant Bust**: Confirm `instantBustRate` is approximately $3.9\% \pm 0.3\%$.
4. **Crash RTP**: Confirm empirical RTP for cashout targets 1.5x, 2.0x, 5.0x, 10.0x is $97.0\% \pm 0.5\%$.
5. **Wheel RTP**: Confirm all 15 entries in `WHEEL_SEGMENTS` have `sum / segments` equal to `0.988` or `0.990`.
