// Mathematical verification script for Crypto Casino games
import { PLINKO_MULTIPLIERS, WHEEL_SEGMENTS, SLOT_PAYOUTS, KENO_PAYOUTS, TOWER_CONFIGS, COLOR_MAP } from '../../src/utils/constants.js';

// Helper combinations
function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

console.log("=== 1. PLINKO THEORETICAL RTP ===");
for (const rows of [8, 12, 16]) {
  for (const risk of ['low', 'medium', 'high']) {
    const mults = PLINKO_MULTIPLIERS[rows][risk];
    let expectedReturn = 0;
    const totalComb = Math.pow(2, rows);
    for (let j = 0; j <= rows; j++) {
      const prob = nCr(rows, j) / totalComb;
      expectedReturn += prob * mults[j];
    }
    console.log(`Rows: ${rows}, Risk: ${risk.padEnd(6)} -> RTP: ${(expectedReturn * 100).toFixed(4)}% | House Edge: ${(100 - expectedReturn * 100).toFixed(4)}% | Max Mult: ${Math.max(...mults)}x`);
  }
}

console.log("\n=== 2. WHEEL THEORETICAL RTP ===");
for (const seg of [10, 20, 30, 40, 50]) {
  for (const risk of ['low', 'medium', 'high']) {
    const mults = WHEEL_SEGMENTS[seg][risk];
    const sum = mults.reduce((a, b) => a + b, 0);
    const rtp = (sum / seg) * 100;
    console.log(`Segments: ${seg}, Risk: ${risk.padEnd(6)} -> RTP: ${rtp.toFixed(4)}% | House Edge: ${(100 - rtp).toFixed(4)}% | Max Mult: ${Math.max(...mults)}x`);
  }
}

console.log("\n=== 3. SLOTS THEORETICAL RTP ===");
let expectedReturnPerLine = 0;
for (const [sym, payouts] of Object.entries(SLOT_PAYOUTS)) {
  const p3 = (1 / 512) * (7 / 8);
  const p4 = (1 / 4096) * (7 / 8);
  const p5 = 1 / 32768;
  const ret = (payouts[3] || 0) * p3 + (payouts[4] || 0) * p4 + (payouts[5] || 0) * p5;
  expectedReturnPerLine += ret;
}
console.log(`Expected Return per line (relative to line bet): ${(expectedReturnPerLine * 100).toFixed(4)}%`);
console.log(`If total bet = betAmount and payline pays betAmount * multi:`);
console.log(`Total RTP = ${(20 * expectedReturnPerLine * 100).toFixed(4)}% | House Edge: ${(100 - 20 * expectedReturnPerLine * 100).toFixed(4)}%`);
console.log(`If line bet = betAmount / 20:`);
console.log(`Normal RTP = ${(expectedReturnPerLine * 100).toFixed(4)}%`);

console.log("\n=== 4. COLOR TRADING THEORETICAL RTP ===");
console.log(`Number bet (0-9): Win Prob: 10.00%, Multiplier: 9x -> RTP: 90.00% | House Edge: 10.00%`);
console.log(`Color Green: Win Prob: 50.00%, Multiplier: 2x -> RTP: 100.00% | House Edge: 0.00%`);
console.log(`Color Red:   Win Prob: 50.00%, Multiplier: 2x -> RTP: 100.00% | House Edge: 0.00%`);
console.log(`Color Violet: Win Prob: 20.00%, Multiplier: 4.5x -> RTP: 90.00% | House Edge: 10.00%`);

console.log("\n=== 5. TOWER THEORETICAL RTP ===");
for (const diff of ['easy', 'medium', 'hard']) {
  const cfg = { easy: { cols: 4, safe: 3 }, medium: { cols: 3, safe: 2 }, hard: { cols: 2, safe: 1 } }[diff];
  console.log(`Difficulty: ${diff.toUpperCase()}`);
  for (let lvl = 1; lvl <= 10; lvl++) {
    const prob = Math.pow(cfg.safe / cfg.cols, lvl);
    const unflooredMult = 0.98 * Math.pow(cfg.cols / cfg.safe, lvl);
    const flooredMult = Math.floor(unflooredMult * 100) / 100;
    const rtp = prob * flooredMult * 100;
    console.log(`  Floor ${lvl.toString().padStart(2)}: Prob: ${(prob * 100).toFixed(4)}% | Mult: ${flooredMult}x (raw: ${unflooredMult.toFixed(3)}) | RTP: ${rtp.toFixed(4)}%`);
  }
}

console.log("\n=== 6. KENO THEORETICAL RTP (40 numbers, 10 drawn) ===");
for (let pick = 1; pick <= 10; pick++) {
  const payouts = KENO_PAYOUTS[pick];
  let rtp = 0;
  for (let match = 0; match <= pick; match++) {
    const prob = (nCr(pick, match) * nCr(40 - pick, 10 - match)) / nCr(40, 10);
    const mult = payouts[match] || 0;
    rtp += prob * mult;
  }
  console.log(`Picks: ${pick.toString().padStart(2)} -> RTP: ${(rtp * 100).toFixed(4)}% | House Edge: ${(100 - rtp * 100).toFixed(4)}%`);
}

console.log("\n=== 7. MINES THEORETICAL RTP SAMPLES ===");
for (const m of [1, 3, 5, 10, 20]) {
  const safe = 25 - m;
  console.log(`Mines: ${m} (Safe: ${safe}):`);
  for (let k of [1, Math.floor(safe / 2), safe]) {
    if (k < 1) continue;
    const prob = nCr(safe, k) / nCr(25, k);
    const rawMult = (0.99 * nCr(25, k)) / nCr(safe, k);
    const flooredMult = Math.floor(rawMult * 100) / 100;
    const rtp = prob * flooredMult * 100;
    console.log(`  Tiles: ${k} -> Prob: ${(prob * 100).toFixed(4)}% | Mult: ${flooredMult}x | RTP: ${rtp.toFixed(4)}%`);
  }
}
