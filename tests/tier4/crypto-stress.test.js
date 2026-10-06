import crypto from 'node:crypto';
import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import {
  hmacSHA256,
  sha256Hex,
  getProvablyFairFloats,
  getCrashPoint,
  generateServerSeed,
  hashSeed
} from '../../src/utils/provablyFair.js';

describe('Tier 4: Cryptographic & Provably Fair Adversarial Stress Test', () => {
  const meta = { tier: 'Tier 4: Real-World Scenarios', game: 'Provably-Fair' };

  test('TC-CRYPTO-01: SHA-256 complies with NIST FIPS 180-4 standard test vectors', () => {
    assert.strictEqual(
      sha256Hex(''),
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'Empty string vector mismatch'
    );
    assert.strictEqual(
      sha256Hex('abc'),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      'abc vector mismatch'
    );
    assert.strictEqual(
      sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
      '56-byte vector mismatch'
    );
  }, meta);

  test('TC-CRYPTO-02: HMAC-SHA256 passes RFC 4231 test vectors 1 through 7', () => {
    // Case 1
    const rfc1Key = Buffer.alloc(20, 0x0b);
    const rfc1Data = 'Hi There';
    assert.strictEqual(
      hmacSHA256(rfc1Key, rfc1Data),
      'b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7',
      'RFC 4231 Case 1 failed'
    );

    // Case 2
    const rfc2Key = 'Jefe';
    const rfc2Data = 'what do ya want for nothing?';
    assert.strictEqual(
      hmacSHA256(rfc2Key, rfc2Data),
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
      'RFC 4231 Case 2 failed'
    );

    // Case 3
    const rfc3Key = Buffer.alloc(20, 0xaa);
    const rfc3Data = Buffer.alloc(50, 0xdd);
    assert.strictEqual(
      hmacSHA256(rfc3Key, rfc3Data),
      '773ea91e36800e46854db8ebd09181a72959098b3ef8c122d9635514ced565fe',
      'RFC 4231 Case 3 failed'
    );

    // Case 4
    const rfc4Key = Buffer.from('0102030405060708090a0b0c0d0e0f10111213141516171819', 'hex');
    const rfc4Data = Buffer.alloc(50, 0xcd);
    assert.strictEqual(
      hmacSHA256(rfc4Key, rfc4Data),
      '82558a389a443c0ea4cc819899f2083a85f0faa3e578f8077a2e3ff46729665b',
      'RFC 4231 Case 4 failed'
    );

    // Case 5 (Full 256-bit digest verification)
    const rfc5Key = Buffer.alloc(20, 0x0c);
    const rfc5Data = 'Test With Truncation';
    assert.strictEqual(
      hmacSHA256(rfc5Key, rfc5Data),
      'a3b6167473100ee06e0c796c2955552bfa6f7c0a6a8aef8b93f860aab0cd20c5',
      'RFC 4231 Case 5 failed'
    );

    // Case 6 (Key > 64 bytes: 131 bytes)
    const rfc6Key = Buffer.alloc(131, 0xaa);
    const rfc6Data = 'Test Using Larger Than Block-Size Key - Hash Key First';
    assert.strictEqual(
      hmacSHA256(rfc6Key, rfc6Data),
      '60e431591ee0b67f0d8a26aacbf5b77f8e0bc6213728c5140546040f0ee37f54',
      'RFC 4231 Case 6 failed'
    );

    // Case 7 (Key > 64 bytes & message > 64 bytes)
    const rfc7Key = Buffer.alloc(131, 0xaa);
    const rfc7Data = 'This is a test using a larger than block-size key and a larger than block-size data. The key needs to be hashed before being used by the HMAC algorithm.';
    assert.strictEqual(
      hmacSHA256(rfc7Key, rfc7Data),
      '9b09ffa71b942fcb27635fbcd5b0e944bfdc63644f0713938a7f51535c3a35e2',
      'RFC 4231 Case 7 failed'
    );
  }, meta);

  test('TC-CRYPTO-03: HMAC-SHA256 handles empty strings, null bytes, unicode, and block boundaries bit-for-bit with Node crypto', () => {
    function verifyEqual(key, msg, desc) {
      const custom = hmacSHA256(key, msg);
      const native = crypto.createHmac('sha256', key).update(msg).digest('hex');
      assert.strictEqual(custom, native, desc);
    }

    verifyEqual('', '', 'Empty key and message');
    verifyEqual('key', '', 'Empty message');
    verifyEqual('', 'msg', 'Empty key');
    verifyEqual(Buffer.alloc(63, 0x55), 'boundary', 'Key 63 bytes');
    verifyEqual(Buffer.alloc(64, 0x55), 'boundary', 'Key 64 bytes');
    verifyEqual(Buffer.alloc(65, 0x55), 'boundary', 'Key 65 bytes');
    verifyEqual('key\x00null', 'msg\x00null', 'Null bytes embedded');
    verifyEqual('🎲🎰🔥', 'test_emoji_payload_🚀💎', 'UTF-8 emojis');
  }, meta);

  test('TC-CRYPTO-04: Differential fuzzing against Node crypto across 500 random inputs yields 100% identity', () => {
    for (let i = 0; i < 500; i++) {
      const keyLen = Math.floor(Math.random() * 128);
      const msgLen = Math.floor(Math.random() * 512);
      const key = crypto.randomBytes(keyLen);
      const msg = crypto.randomBytes(msgLen);

      const custom = hmacSHA256(key, msg);
      const native = crypto.createHmac('sha256', key).update(msg).digest('hex');
      assert.strictEqual(custom, native, `Mismatch on fuzz iteration ${i}`);
    }
  }, meta);

  test('TC-CRYPTO-05: getProvablyFairFloats produces statistically uniform distribution over 100,000 samples (Chi-Square test)', () => {
    const SAMPLE_SIZE = 100000;
    const serverSeed = 'b794b6e8e7bb4a9c86cad939166f73519004f8508c4116c47834a6297188600d';
    const clientSeed = 'adversarial-uniformity-test';
    const floats = getProvablyFairFloats(serverSeed, clientSeed, 0, SAMPLE_SIZE);

    assert.strictEqual(floats.length, SAMPLE_SIZE, 'Expected 100k floats');

    // Range check
    for (let i = 0; i < floats.length; i++) {
      assert.ok(floats[i] >= 0 && floats[i] < 1.0, `Float at ${i} outside [0, 1)`);
    }

    // Mean and variance
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < floats.length; i++) {
      sum += floats[i];
      sumSq += floats[i] * floats[i];
    }
    const mean = sum / SAMPLE_SIZE;
    const variance = (sumSq / SAMPLE_SIZE) - (mean * mean);

    assert.between(mean, 0.495, 0.505, 'Mean must be ~0.5');
    assert.between(variance, 0.080, 0.086, 'Variance must be ~1/12 (0.0833)');

    // Chi-Square Goodness-of-Fit with 100 bins
    const BINS = 100;
    const binCounts = new Array(BINS).fill(0);
    const expected = SAMPLE_SIZE / BINS; // 1,000
    for (let i = 0; i < floats.length; i++) {
      const b = Math.min(BINS - 1, Math.floor(floats[i] * BINS));
      binCounts[b]++;
    }

    let chiSq = 0;
    for (let i = 0; i < BINS; i++) {
      const diff = binCounts[i] - expected;
      chiSq += (diff * diff) / expected;
    }

    // df = 99, critical value at α = 0.01 is 134.64
    assert.lessThan(chiSq, 134.64, `Chi-square statistic ${chiSq} must not exceed critical value 134.64`);
  }, meta);

  test('TC-CRYPTO-06: getCrashPoint has ~4% instant bust and is uncapped beyond 32.67x', () => {
    const serverSeed = 'b794b6e8e7bb4a9c86cad939166f73519004f8508c4116c47834a6297188600d';
    const clientSeed = 'crash-stress-seed';
    let busts = 0;
    let maxMult = 0;
    const ROUNDS = 50000;

    for (let nonce = 0; nonce < ROUNDS; nonce++) {
      const mult = getCrashPoint(serverSeed, clientSeed, nonce);
      if (mult === 1.00) busts++;
      if (mult > maxMult) maxMult = mult;
    }

    const bustRate = busts / ROUNDS;
    assert.between(bustRate, 0.035, 0.045, 'Instant bust rate must be ~4%');
    assert.greaterThan(maxMult, 32.67, 'Crash multiplier must be uncapped (>32.67x)');
  }, meta);
});
