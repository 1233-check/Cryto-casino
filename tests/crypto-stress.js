import crypto from 'node:crypto';
import {
  hmacSHA256,
  sha256Hex,
  getProvablyFairFloats,
  getCrashPoint,
  generateServerSeed,
  hashSeed
} from '../src/utils/provablyFair.js';

console.log('======================================================================');
console.log('   🔒 CRYPTOGRAPHIC & PROVABLY FAIR ADVERSARIAL STRESS TEST SUITE   ');
console.log('======================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assertEqual(actual, expected, testName) {
  totalTests++;
  if (actual === expected) {
    passedTests++;
    console.log(`  ✔ [PASS] ${testName}`);
    return true;
  } else {
    failedTests++;
    console.error(`  ✖ [FAIL] ${testName}`);
    console.error(`      Expected: ${expected}`);
    console.error(`      Actual:   ${actual}`);
    return false;
  }
}

function assertTrue(condition, testName, message = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ [PASS] ${testName}`);
    return true;
  } else {
    failedTests++;
    console.error(`  ✖ [FAIL] ${testName}: ${message}`);
    return false;
  }
}

// ----------------------------------------------------------------------
// 1. NIST SHA-256 Standard Vectors
// ----------------------------------------------------------------------
console.log('--- 1. NIST FIPS 180-4 SHA-256 Standard Test Vectors ---');

assertEqual(
  sha256Hex(''),
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  'SHA-256 Vector 1: Empty string'
);

assertEqual(
  sha256Hex('abc'),
  'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  'SHA-256 Vector 2: "abc"'
);

assertEqual(
  sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
  '248d6a61d20638b8e5c026930c3e6039a33ce45964ff21a7f7b70f074f232c1e',
  'SHA-256 Vector 3: 56-byte message'
);

const longA = 'a'.repeat(100000);
const nativeShaLong = crypto.createHash('sha256').update(longA).digest('hex');
assertEqual(
  sha256Hex(longA),
  nativeShaLong,
  'SHA-256 Vector 4: 100,000 repetitions of "a" vs native crypto'
);

// ----------------------------------------------------------------------
// 2. RFC 4231 HMAC-SHA-256 Test Vectors (Test Cases 1-7)
// ----------------------------------------------------------------------
console.log('\n--- 2. RFC 4231 HMAC-SHA-256 Test Vectors (Cases 1 - 7) ---');

// Case 1
const rfc1Key = Buffer.alloc(20, 0x0b);
const rfc1Data = 'Hi There';
assertEqual(
  hmacSHA256(rfc1Key, rfc1Data),
  'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
  'RFC 4231 Case 1: 20-byte key (0x0b), data "Hi There"'
);

// Case 2
const rfc2Key = 'Jefe';
const rfc2Data = 'what do ya want for nothing?';
assertEqual(
  hmacSHA256(rfc2Key, rfc2Data),
  '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
  'RFC 4231 Case 2: key "Jefe", data "what do ya want for nothing?"'
);

// Case 3
const rfc3Key = Buffer.alloc(20, 0xaa);
const rfc3Data = Buffer.alloc(50, 0xdd);
assertEqual(
  hmacSHA256(rfc3Key, rfc3Data),
  '773e35bb0566ece97f66325d88497741697228833878b2734a66a7ec9a5b67a9',
  'RFC 4231 Case 3: 20-byte key (0xaa), 50-byte data (0xdd)'
);

// Case 4
const rfc4Key = Buffer.from('0102030405060708090a0b0c0d0e0f10111213141516171819', 'hex');
const rfc4Data = Buffer.alloc(50, 0xcd);
assertEqual(
  hmacSHA256(rfc4Key, rfc4Data),
  '825588d381e37cc87710c9845dd04ebafd49149f6bfa9350906373a473ab0e10',
  'RFC 4231 Case 4: 25-byte key (0x01..0x19), 50-byte data (0xcd)'
);

// Case 5 (Full 256-bit digest verification)
const rfc5Key = Buffer.alloc(20, 0x0c);
const rfc5Data = 'Test With Truncation';
assertEqual(
  hmacSHA256(rfc5Key, rfc5Data),
  'a3b6167473100ee06e0c7943b4294f3d1b63ddce201fcbb6a846f7f5a73f6e76',
  'RFC 4231 Case 5: 20-byte key (0x0c), data "Test With Truncation"'
);

// Case 6 (Key > 64 bytes: 131 bytes)
const rfc6Key = Buffer.alloc(131, 0xaa);
const rfc6Data = 'Test Using Larger Than Block-Size Key - Hash Key First';
assertEqual(
  hmacSHA256(rfc6Key, rfc6Data),
  '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54',
  'RFC 4231 Case 6: 131-byte key (>64 bytes, hash key first)'
);

// Case 7 (Key > 64 bytes: 131 bytes & large message: 152 bytes)
const rfc7Key = Buffer.alloc(131, 0xaa);
const rfc7Data = 'This is a test using a larger than block-size key and a larger than block-size data. The key needs to be hashed before being used by the HMAC algorithm.';
assertEqual(
  hmacSHA256(rfc7Key, rfc7Data),
  '9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35cb',
  'RFC 4231 Case 7: 131-byte key & 152-byte message'
);

// ----------------------------------------------------------------------
// 3. Cryptographic Edge Cases vs Native Node Crypto
// ----------------------------------------------------------------------
console.log('\n--- 3. Cryptographic Boundary & Edge Cases vs Native Crypto ---');

function checkAgainstNative(key, message, label) {
  const custom = hmacSHA256(key, message);
  const native = crypto.createHmac('sha256', key).update(message).digest('hex');
  return assertEqual(custom, native, label);
}

checkAgainstNative('', '', 'Edge Case: Empty key ("") and Empty message ("")');
checkAgainstNative('', 'non-empty-message', 'Edge Case: Empty key ("") and non-empty message');
checkAgainstNative('secret-key', '', 'Edge Case: Non-empty key and Empty message ("")');

// Exact Block Boundary Tests (63, 64, 65 bytes)
checkAgainstNative(Buffer.alloc(63, 0x42), 'boundary-test', 'Boundary Case: Key length 63 bytes (1 byte < block size)');
checkAgainstNative(Buffer.alloc(64, 0x42), 'boundary-test', 'Boundary Case: Key length 64 bytes (exact block size)');
checkAgainstNative(Buffer.alloc(65, 0x42), 'boundary-test', 'Boundary Case: Key length 65 bytes (1 byte > block size, triggers hash)');

// Null Bytes
checkAgainstNative(
  Buffer.from('key\x00with\x00null\x00bytes', 'utf-8'),
  Buffer.from('msg\x00with\x00null\x00bytes', 'utf-8'),
  'Edge Case: Key and message containing null bytes (\\x00)'
);

// Unicode and Emoji
checkAgainstNative(
  '🔑🎰🎲🔥💎',
  'CasinoProvablyFairVerification_🚀🎯✨',
  'Edge Case: UTF-8 4-byte astral characters & emojis'
);

// Large Message (256 KB)
const largeMsg = Buffer.alloc(256 * 1024, 0x77);
checkAgainstNative(
  'large-payload-secret-key',
  largeMsg,
  'Edge Case: 256 KB message throughput test'
);

// ----------------------------------------------------------------------
// 4. Differential Fuzzing against Native Crypto (1,000 iterations)
// ----------------------------------------------------------------------
console.log('\n--- 4. Differential Fuzzing: 1,000 Random Key/Message Iterations ---');

let fuzzMismatches = 0;
const FUZZ_ITERATIONS = 1000;

for (let i = 0; i < FUZZ_ITERATIONS; i++) {
  const keyLen = Math.floor(Math.random() * 256); // 0 to 255 bytes
  const msgLen = Math.floor(Math.random() * 2048); // 0 to 2047 bytes
  const randKey = crypto.randomBytes(keyLen);
  const randMsg = crypto.randomBytes(msgLen);

  const customHex = hmacSHA256(randKey, randMsg);
  const nativeHex = crypto.createHmac('sha256', randKey).update(randMsg).digest('hex');

  if (customHex !== nativeHex) {
    fuzzMismatches++;
    console.error(`Differential fuzz mismatch at iteration ${i}: keyLen=${keyLen}, msgLen=${msgLen}`);
  }
}

assertEqual(
  fuzzMismatches,
  0,
  `Differential Fuzz: ${FUZZ_ITERATIONS} random vectors matched Node native crypto with 0 errors`
);

// ----------------------------------------------------------------------
// 5. Statistical Uniformity: 100,000 Provably Fair Floats
// ----------------------------------------------------------------------
console.log('\n--- 5. Statistical Uniformity of getProvablyFairFloats (100,000 Samples) ---');

const SAMPLE_SIZE = 100000;
const serverSeed = 'b794b6e8e7bb4a9c86cad939166f73519004f8508c4116c47834a6297188600d';
const clientSeed = 'empirical-challenger-stress-seed';

console.log(`Generating ${SAMPLE_SIZE} provably fair floats...`);
const t0 = performance.now();
const floats = getProvablyFairFloats(serverSeed, clientSeed, 0, SAMPLE_SIZE);
const genDurationMs = (performance.now() - t0).toFixed(2);
console.log(`Generation completed in ${genDurationMs}ms (${(SAMPLE_SIZE / (genDurationMs / 1000)).toFixed(0)} floats/sec)`);

assertEqual(floats.length, SAMPLE_SIZE, `Generated exactly ${SAMPLE_SIZE} floats`);

// Range check: strictly in [0, 1)
let outOfBounds = 0;
for (let i = 0; i < floats.length; i++) {
  if (floats[i] < 0 || floats[i] >= 1.0) {
    outOfBounds++;
  }
}
assertEqual(outOfBounds, 0, 'Range check: All 100,000 floats lie strictly in [0, 1)');

// Calculate empirical Mean and Variance
let sum = 0;
let sumSq = 0;
for (let i = 0; i < floats.length; i++) {
  const f = floats[i];
  sum += f;
  sumSq += f * f;
}
const empiricalMean = sum / SAMPLE_SIZE;
const empiricalVar = (sumSq / SAMPLE_SIZE) - (empiricalMean * empiricalMean);
const theoreticalMean = 0.5;
const theoreticalVar = 1 / 12; // ~0.0833333

console.log(`  Empirical Mean    : ${empiricalMean.toFixed(6)} (Theoretical: ${theoreticalMean.toFixed(6)})`);
console.log(`  Empirical Variance: ${empiricalVar.toFixed(6)} (Theoretical: ${theoreticalVar.toFixed(6)})`);

const meanDiff = Math.abs(empiricalMean - theoreticalMean);
assertTrue(
  meanDiff < 0.003,
  'First Moment: Empirical mean within ±0.003 of 0.500000',
  `Mean difference: ${meanDiff}`
);

const varDiff = Math.abs(empiricalVar - theoreticalVar);
assertTrue(
  varDiff < 0.003,
  'Second Moment: Empirical variance within ±0.003 of 1/12 (0.083333)',
  `Variance difference: ${varDiff}`
);

// Chi-Square Goodness-of-Fit Test (k = 100 bins)
const NUM_BINS = 100;
const bins = new Array(NUM_BINS).fill(0);
const expectedPerBin = SAMPLE_SIZE / NUM_BINS; // 1,000 per bin

for (let i = 0; i < floats.length; i++) {
  const binIndex = Math.min(NUM_BINS - 1, Math.floor(floats[i] * NUM_BINS));
  bins[binIndex]++;
}

let chiSquare = 0;
for (let i = 0; i < NUM_BINS; i++) {
  const diff = bins[i] - expectedPerBin;
  chiSquare += (diff * diff) / expectedPerBin;
}

// Critical values for degrees of freedom df = 99:
// α = 0.05: χ²_crit ≈ 123.23
// α = 0.01: χ²_crit ≈ 134.64
// α = 0.001: χ²_crit ≈ 148.23
console.log(`  Chi-Square (df=99): χ² = ${chiSquare.toFixed(4)} (Critical α=0.01: 134.64, α=0.05: 123.23)`);

assertTrue(
  chiSquare < 134.64,
  'Chi-Square Goodness of Fit Test: Uniformity accepted at α=0.01 significance level',
  `Observed χ² = ${chiSquare.toFixed(4)} exceeds 134.64`
);

// Kolmogorov-Smirnov (K-S) Maximum Distance Test
// For uniform distribution on [0, 1), F(x) = x.
// Sort a sub-sample of 10,000 to compute K-S distance efficiently
const ksSample = floats.slice(0, 10000).sort((a, b) => a - b);
let maxKS = 0;
for (let i = 0; i < ksSample.length; i++) {
  const empiricalCDF = (i + 1) / ksSample.length;
  const theoreticalCDF = ksSample[i];
  const d = Math.abs(empiricalCDF - theoreticalCDF);
  if (d > maxKS) maxKS = d;
}
// K-S critical threshold at α=0.01 for N=10,000 is 1.63 / sqrt(10000) = 0.0163
console.log(`  Kolmogorov-Smirnov Max Distance (N=10,000): D = ${maxKS.toFixed(5)} (Critical α=0.01: 0.01630)`);
assertTrue(
  maxKS < 0.0163,
  'Kolmogorov-Smirnov Test: D < 0.0163 at α=0.01 significance level',
  `Observed D = ${maxKS.toFixed(5)}`
);

// ----------------------------------------------------------------------
// 6. Crash Point Algorithm: 100,000 Rounds
// ----------------------------------------------------------------------
console.log('\n--- 6. Crash Point Distribution Verification (100,000 Rounds) ---');

let instantBustCount = 0;
let maxMultiplier = 0;
const crashMultipliers = [];

for (let nonce = 0; nonce < 100000; nonce++) {
  const mult = getCrashPoint(serverSeed, clientSeed, nonce);
  crashMultipliers.push(mult);
  if (mult === 1.00) {
    instantBustCount++;
  }
  if (mult > maxMultiplier) {
    maxMultiplier = mult;
  }
}

const instantBustRate = (instantBustCount / 100000) * 100;
console.log(`  Instant 1.00x Bust Rate: ${instantBustRate.toFixed(2)}% (Target: 3.00%)`);
console.log(`  Peak Multiplier Observed: ${maxMultiplier.toFixed(2)}x`);

assertTrue(
  instantBustRate >= 2.7 && instantBustRate <= 3.3,
  'Crash House Edge: Instant bust rate is 3.00% ± 0.30%',
  `Observed: ${instantBustRate.toFixed(2)}%`
);

assertTrue(
  maxMultiplier > 32.67,
  'Crash Multiplier Uncapped: Peak multiplier strictly exceeds legacy 32.67x artificial cap',
  `Observed: ${maxMultiplier.toFixed(2)}x`
);

// ----------------------------------------------------------------------
// Summary
// ----------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`  Total Tests Run : ${totalTests}`);
console.log(`  Total Passed    : ${passedTests}`);
console.log(`  Total Failed    : ${failedTests}`);
console.log('======================================================================\n');

if (failedTests === 0) {
  console.log('>>> VERDICT: APPROVE - ALL CRYPTOGRAPHIC STRESS TESTS PASSED WITH 100% SUCCESS <<<');
  process.exit(0);
} else {
  console.error(`>>> VERDICT: CHALLENGE_FAILED - ${failedTests} TEST(S) FAILED <<<`);
  process.exit(1);
}
