import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { 
  hmacSHA256, 
  sha256Hex, 
  getProvablyFairFloats, 
  getCrashPoint, 
  generateServerSeed, 
  hashSeed, 
  getGameResult, 
  shuffleArray 
} from '../../src/utils/provablyFair.js';
import { WHEEL_SEGMENTS, COLORS } from '../../src/utils/constants.js';

console.log('====================================================');
console.log('MILESTONE 1 VERIFICATION: MATH & CRYPTOGRAPHY SUITE');
console.log('====================================================\n');

let failedChecks = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failedChecks++;
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

// -----------------------------------------------------------------------------
// CHECK 1: src/utils/provablyFair.js does not import Node 'crypto'
// -----------------------------------------------------------------------------
import { fileURLToPath } from 'node:url';

console.log('\n--- 1. Static Analysis of provablyFair.js ---');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pfSource = fs.readFileSync(path.resolve(__dirname, '../../src/utils/provablyFair.js'), 'utf8');
assert(!pfSource.includes("import crypto from 'crypto'"), 'Redundant "import crypto from \'crypto\'" removed');
assert(!pfSource.includes('Math.floor(h * 33) === 0'), 'Old 32.67x cap formula removed');

// -----------------------------------------------------------------------------
// CHECK 2: Cryptographic Soundness of HMAC-SHA256 and SHA-256
// -----------------------------------------------------------------------------
console.log('\n--- 2. Cryptographic Soundness (RFC Test Vectors & OpenSSL Comparison) ---');
const rfcVectors = [
  { key: 'key', data: 'The quick brown fox jumps over the lazy dog' },
  { key: 'Jefe', data: 'what do ya want for nothing?' },
  { key: Buffer.alloc(20, 0x0b), data: 'Hi There' },
  { key: Buffer.alloc(20, 0xaa), data: Buffer.alloc(50, 0xdd) },
  { key: Buffer.alloc(131, 0xaa), data: 'Test Using Larger Than Block-Size Key - Hash Key First' },
  { key: 'serverSeed_abc123', data: 'clientSeed_xyz:0:0' },
  { key: 'b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2', data: 'default:42:1' }
];

let allHmacMatch = true;
for (const [idx, tv] of rfcVectors.entries()) {
  const actual = hmacSHA256(tv.key, tv.data);
  const expected = crypto.createHmac('sha256', tv.key).update(tv.data).digest('hex');
  if (actual !== expected) {
    allHmacMatch = false;
    console.error(`HMAC mismatch on vector ${idx + 1}: expected ${expected}, got ${actual}`);
  }
}
assert(allHmacMatch, 'All HMAC-SHA256 outputs match OpenSSL / node:crypto reference implementation');

const shaVectors = ['', 'abc', 'message digest', '1234567890'];
let allShaMatch = true;
for (const s of shaVectors) {
  const actual = sha256Hex(s);
  const expected = crypto.createHash('sha256').update(s).digest('hex');
  if (actual !== expected) allShaMatch = false;
}
assert(allShaMatch, 'All SHA-256 hash outputs match OpenSSL / node:crypto reference implementation');

// -----------------------------------------------------------------------------
// CHECK 3: Crash Point Uncapped Distribution (100,000 Rounds Monte Carlo)
// -----------------------------------------------------------------------------
console.log('\n--- 3. Crash Point Distribution & Uncapped Scaling (100,000 Rounds) ---');
const N = 100000;
const testServerSeed = '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';
const testClientSeed = 'audit_verifier_client_seed';

let instantBusts = 0;
let countOver32 = 0;
let countOver100 = 0;
let countOver1000 = 0;
let maxMult = 0;
let winsAt2x = 0;

for (let nonce = 0; nonce < N; nonce++) {
  const mult = getCrashPoint(testServerSeed, testClientSeed, nonce);
  if (mult === 1.00) instantBusts++;
  if (mult > 32.67) countOver32++;
  if (mult >= 100) countOver100++;
  if (mult >= 1000) countOver1000++;
  if (mult > maxMult) maxMult = mult;
  if (mult >= 2.00) winsAt2x++;
}

const instantBustRate = (instantBusts / N) * 100;
const winRate2x = (winsAt2x / N) * 100;
const rtp2x = (winsAt2x * 2.0 / N) * 100;

console.log(`- Sample Size: ${N.toLocaleString()} rounds`);
console.log(`- Max Multiplier Observed: ${maxMult.toLocaleString()}x`);
console.log(`- Multipliers > 32.67x: ${countOver32.toLocaleString()} (${(countOver32 / N * 100).toFixed(2)}%)`);
console.log(`- Multipliers >= 100x: ${countOver100.toLocaleString()} (${(countOver100 / N * 100).toFixed(2)}%)`);
console.log(`- Multipliers >= 1000x: ${countOver1000.toLocaleString()} (${(countOver1000 / N * 100).toFixed(2)}%)`);
console.log(`- Multiplier 1.00x (Instant Bust): ${instantBusts.toLocaleString()} (${instantBustRate.toFixed(2)}%)`);
console.log(`- 2.00x Cashout Empirical Win Rate: ${winRate2x.toFixed(2)}% (theoretical: 48.50%)`);
console.log(`- 2.00x Cashout Empirical RTP: ${rtp2x.toFixed(2)}% (theoretical: 97.00%)`);

assert(countOver32 > 2000, `Multipliers scale beyond 32.67x (${countOver32} rounds > 32.67x)`);
assert(countOver100 > 500, `Multipliers reach >= 100x (${countOver100} rounds >= 100x)`);
assert(countOver1000 > 50, `Multipliers reach >= 1000x (${countOver1000} rounds >= 1000x)`);
assert(maxMult >= 1000, `Max multiplier scales to high levels (${maxMult}x observed)`);
assert(rtp2x >= 96.0 && rtp2x <= 98.0, `Empirical RTP (${rtp2x.toFixed(2)}%) aligns with 97.0% theoretical RTP`);

// -----------------------------------------------------------------------------
// CHECK 4: Wheel Segment RTP Calibration (All 15 Configurations)
// -----------------------------------------------------------------------------
console.log('\n--- 4. Wheel Segment Calibration & Theoretical House Edge ---');
let allWheelValid = true;
const segmentSizes = [10, 20, 30, 40, 50];
const riskTiers = ['low', 'medium', 'high'];

for (const s of segmentSizes) {
  for (const r of riskTiers) {
    const arr = WHEEL_SEGMENTS[s]?.[r];
    assert(Array.isArray(arr), `WHEEL_SEGMENTS[${s}][${r}] is defined`);
    const lenMatches = arr.length === s;
    assert(lenMatches, `WHEEL_SEGMENTS[${s}][${r}] has exact length ${s} (got ${arr?.length})`);
    
    const sum = arr.reduce((a, b) => a + b, 0);
    const rtp = (sum / s) * 100;
    const houseEdge = 100 - rtp;
    const rtpValid = rtp >= 98.0 && rtp <= 99.0;
    
    console.log(`  -> Segment ${s} ${r.padEnd(6)}: Sum=${sum.toFixed(2)}, RTP=${rtp.toFixed(2)}%, House Edge=${houseEdge.toFixed(2)}%`);
    assert(rtpValid, `WHEEL_SEGMENTS[${s}][${r}] RTP ${rtp.toFixed(2)}% is within [98.0%, 99.0%]`);
    if (!lenMatches || !rtpValid) allWheelValid = false;
  }
}
assert(allWheelValid, 'All 15 wheel configurations have strictly positive house edge (1.0% to 2.0%)');

// -----------------------------------------------------------------------------
// CHECK 5: COLORS Export
// -----------------------------------------------------------------------------
console.log('\n--- 5. COLORS Export Verification ---');
assert(typeof COLORS === 'object' && COLORS !== null, 'COLORS object exported');
assert(COLORS.accentGreen === '#00E701', 'COLORS.accentGreen is #00E701');
assert(COLORS.accentRed === '#E9113C', 'COLORS.accentRed is #E9113C');
assert(COLORS.accentBlue === '#0055FF', 'COLORS.accentBlue is #0055FF');
assert(COLORS.accentGold === '#F59E0B', 'COLORS.accentGold is #F59E0B');
assert(Boolean(COLORS.accentPurple), 'COLORS.accentPurple is defined');

// -----------------------------------------------------------------------------
// SUMMARY
// -----------------------------------------------------------------------------
console.log('\n====================================================');
if (failedChecks === 0) {
  console.log('🎯 ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
  console.log('====================================================\n');
  process.exit(0);
} else {
  console.error(`💥 ${failedChecks} VERIFICATION CHECKS FAILED!`);
  console.log('====================================================\n');
  process.exit(1);
}
