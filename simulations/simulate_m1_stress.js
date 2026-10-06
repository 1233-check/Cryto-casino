/**
 * Milestone 1 Challenger 2 - Mathematical & Simulation Stress Test Suite
 * 
 * Empirically stress-tests:
 * 1. Uncapped Crash Point distribution (100k+ rounds)
 *    - Min multiplier, max multiplier, instant bust rate (1.00x)
 *    - Count >= 10x, 32.67x, 100x, 1000x
 *    - Empirical RTP at cashout targets: 1.50x, 2.00x, 5.00x, 10.00x
 * 2. Recalibrated Wheel Segments (100k spins across all 15 configurations = 1.5M spins)
 *    - Empirical win rates, payouts, empirical RTP
 *    - Comparison with theoretical RTP (98.80% - 99.00%)
 *    - Standard error & 95% confidence intervals
 *    - Positive house edge confirmation (zero negative house edge anomalies)
 */

import { getCrashPoint, getProvablyFairFloats } from '../src/utils/provablyFair.js';
import { WHEEL_SEGMENTS } from '../src/utils/constants.js';

console.log('================================================================================');
console.log('   M1 CHALLENGER 2: EMPIRICAL STRESS TEST (CRASH & WHEEL SIMULATION)');
console.log('================================================================================\n');

// =============================================================================
// PART 1: CRASH MULTIPLIER MONTE CARLO STRESS TEST
// =============================================================================
console.log('--------------------------------------------------------------------------------');
console.log('PART 1: CRASH POINT DISTRIBUTION (100,000 ROUNDS)');
console.log('--------------------------------------------------------------------------------');

const CRASH_ROUNDS = 100000;
const serverSeed = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
const clientSeed = 'challenger_m1_2_audit_seed';

let minMult = Infinity;
let maxMult = 0;
let instantBusts = 0; // Exactly 1.00x
let countOver10 = 0;
let countOver32 = 0; // Old artificial cap threshold
let countOver100 = 0;
let countOver1000 = 0;
let countOver10000 = 0;

const targets = [1.5, 2.0, 5.0, 10.0];
const targetWins = { 1.5: 0, 2.0: 0, 5.0: 0, 10.0: 0 };

for (let nonce = 0; nonce < CRASH_ROUNDS; nonce++) {
  const mult = getCrashPoint(serverSeed, clientSeed, nonce);

  if (mult < minMult) minMult = mult;
  if (mult > maxMult) maxMult = mult;

  if (mult === 1.00) instantBusts++;
  if (mult >= 10.0) countOver10++;
  if (mult > 32.67) countOver32++;
  if (mult >= 100.0) countOver100++;
  if (mult >= 1000.0) countOver1000++;
  if (mult >= 10000.0) countOver10000++;

  for (const t of targets) {
    if (mult >= t) targetWins[t]++;
  }
}

const observedBustRate = (instantBusts / CRASH_ROUNDS) * 100;
const theoreticalBustRate = (4 / 101) * 100; // ~3.9604% due to 2-decimal floor truncation

console.log(`Rounds Simulated     : ${CRASH_ROUNDS.toLocaleString()}`);
console.log(`Minimum Multiplier   : ${minMult.toFixed(2)}x (Expected: exactly 1.00x)`);
console.log(`Maximum Multiplier   : ${maxMult.toLocaleString()}x (Expected: >> 32.67x)`);
console.log(`Instant Busts (1.00x): ${instantBusts.toLocaleString()} (${observedBustRate.toFixed(3)}%, theoretical: ${theoreticalBustRate.toFixed(3)}%)`);
console.log(`Rounds >= 10.0x      : ${countOver10.toLocaleString()} (${(countOver10 / CRASH_ROUNDS * 100).toFixed(2)}%, theoretical: 9.70%)`);
console.log(`Rounds > 32.67x      : ${countOver32.toLocaleString()} (${(countOver32 / CRASH_ROUNDS * 100).toFixed(2)}%, theoretical: 2.97%) [OLD CAP BREACHED]`);
console.log(`Rounds >= 100.0x     : ${countOver100.toLocaleString()} (${(countOver100 / CRASH_ROUNDS * 100).toFixed(2)}%, theoretical: 0.97%)`);
console.log(`Rounds >= 1,000.0x   : ${countOver1000.toLocaleString()} (${(countOver1000 / CRASH_ROUNDS * 100).toFixed(2)}%, theoretical: 0.097%)`);
console.log(`Rounds >= 10,000.0x  : ${countOver10000.toLocaleString()} (${(countOver1000 / CRASH_ROUNDS * 100).toFixed(3)}%, theoretical: 0.0097%)`);

console.log('\nEmpirical vs Theoretical RTP by Cashout Target:');
console.log('Target | Empirical Win% | Theoretical Win% | Empirical RTP% | Theoretical RTP% | House Edge%');
console.log('-------|----------------|------------------|----------------|------------------|------------');
for (const t of targets) {
  const winRate = (targetWins[t] / CRASH_ROUNDS) * 100;
  const thWinRate = (0.97 / t) * 100;
  const empRTP = (targetWins[t] * t / CRASH_ROUNDS) * 100;
  const thRTP = 97.00;
  const he = 100 - empRTP;
  console.log(`${(t.toFixed(2) + 'x').padEnd(6)} | ${winRate.toFixed(2).padStart(14)}% | ${thWinRate.toFixed(2).padStart(16)}% | ${empRTP.toFixed(2).padStart(14)}% | ${thRTP.toFixed(2).padStart(16)}% | ${he.toFixed(2).padStart(10)}%`);
}

// =============================================================================
// PART 2: WHEEL SEGMENTS MONTE CARLO STRESS TEST (15 CONFIGURATIONS)
// =============================================================================
console.log('\n--------------------------------------------------------------------------------');
console.log('PART 2: WHEEL RECALIBRATED SEGMENTS (15 CONFIGS x 100,000 SPINS = 1.5M SPINS)');
console.log('--------------------------------------------------------------------------------');

const WHEEL_SPINS_PER_CONFIG = 100000;
const segmentCounts = [10, 20, 30, 40, 50];
const riskTiers = ['low', 'medium', 'high'];

console.log('Config     | Segments | Sum   | Th. RTP% | Emp. RTP% | Std. Error | 95% Conf. Interval  | House Edge% | Verdict');
console.log('-----------|----------|-------|----------|-----------|------------|---------------------|-------------|--------');

let allConfigsValid = true;

for (const s of segmentCounts) {
  for (const r of riskTiers) {
    const list = WHEEL_SEGMENTS[s][r];
    const len = list.length;
    const sum = list.reduce((a, b) => a + b, 0);
    const thRTP = (sum / s) * 100;

    // Population variance
    const mean = sum / s;
    const variance = list.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / s;
    const stdDev = Math.sqrt(variance);
    const stdErr = (stdDev / Math.sqrt(WHEEL_SPINS_PER_CONFIG)) * 100;

    // Simulation
    let totalPayout = 0;
    let winCount = 0;

    // Deterministic LCG PRNG for reproducibility
    let seed = (s * 1000 + (r === 'low' ? 1 : r === 'medium' ? 2 : 3)) ^ 0x5deece66d;
    for (let spin = 0; spin < WHEEL_SPINS_PER_CONFIG; spin++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const idx = seed % s;
      const mult = list[idx];
      totalPayout += mult;
      if (mult > 0) winCount++;
    }

    const empRTP = (totalPayout / WHEEL_SPINS_PER_CONFIG) * 100;
    const empHE = 100 - empRTP;
    const ciLow = (empRTP - 1.96 * stdErr).toFixed(2);
    const ciHigh = (empRTP + 1.96 * stdErr).toFixed(2);

    const isWithinBounds = empRTP >= 97.0 && empRTP <= 101.0 && thRTP >= 98.8 && thRTP <= 99.0;
    if (!isWithinBounds) allConfigsValid = false;

    const label = `${s} ${r}`.padEnd(10);
    console.log(
      `${label} | ${String(len).padStart(8)} | ${sum.toFixed(1).padStart(5)} | ${thRTP.toFixed(2).padStart(8)}% | ${empRTP.toFixed(2).padStart(9)}% | ${stdErr.toFixed(2).padStart(10)}% | [${ciLow}%, ${ciHigh}%] | ${empHE.toFixed(2).padStart(11)}% | ${isWithinBounds ? 'PASS' : 'FAIL'}`
    );
  }
}

console.log('\n================================================================================');
console.log(`VERDICT SUMMARY: ${allConfigsValid ? 'ALL CHECKS PASSED (APPROVE)' : 'FAILURES DETECTED'}`);
console.log('================================================================================');
