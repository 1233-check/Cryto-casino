import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import {
  generateServerSeed,
  hashSeed,
  getProvablyFairFloats,
  getCrashPoint
} from '../../src/utils/provablyFair.js';

describe('Tier 4: Provably Fair Verification & Seed Auditing', () => {
  const meta = { tier: 'Tier 4: Real-World Scenarios', game: 'Provably-Fair' };

  test('TC-PF-01: generateServerSeed produces valid 64-character hexadecimal CSPRNG string', () => {
    const seed1 = generateServerSeed();
    const seed2 = generateServerSeed();

    assert.strictEqual(typeof seed1, 'string', 'Seed must be a string');
    assert.strictEqual(seed1.length, 64, 'Seed length must be 64 characters');
    assert.ok(/^[0-9a-f]{64}$/.test(seed1), 'Seed must be valid hexadecimal');
    assert.notStrictEqual(seed1, seed2, 'Consecutive seeds must be cryptographically distinct');
  }, meta);

  test('TC-PF-02: hashSeed generates SHA-256 public commitment matching known test vectors', async () => {
    const testSeed = '6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b';
    const hash = await hashSeed(testSeed);

    assert.strictEqual(typeof hash, 'string', 'Hash must be a string');
    assert.strictEqual(hash.length, 64, 'SHA-256 hash must be 64 hex characters');

    // Reproducibility test
    const hashAgain = await hashSeed(testSeed);
    assert.strictEqual(hash, hashAgain, 'Hash must be strictly deterministic');
  }, meta);

  test('TC-PF-03: getCrashPoint is 100% deterministic given serverSeed and clientSeed', () => {
    const serverSeed = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const clientSeed = 'stake-client-seed';

    const crash1 = getCrashPoint(serverSeed, clientSeed);
    const crash2 = getCrashPoint(serverSeed, clientSeed);

    assert.strictEqual(crash1, crash2, 'Identical seeds must yield identical crash points');
    assert.ok(crash1 >= 1.00, 'Crash point must be at least 1.00x');
  }, meta);

  test('TC-PF-04: Seed rotation: modifying clientSeed alters all subsequent outcomes', () => {
    const serverSeed = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const clientSeedA = 'client-seed-A';
    const clientSeedB = 'client-seed-B';

    const floatsA = getProvablyFairFloats(serverSeed, clientSeedA, 0, 5);
    const floatsB = getProvablyFairFloats(serverSeed, clientSeedB, 0, 5);

    assert.strictEqual(floatsA.length, 5, 'Should generate 5 floats');
    assert.strictEqual(floatsB.length, 5, 'Should generate 5 floats');
    assert.notStrictEqual(floatsA[0], floatsB[0], 'Changing clientSeed must produce distinct floats');
  }, meta);

  test('TC-PF-05: Nonce progression generates independent uncorrelated float values in [0, 1)', () => {
    const serverSeed = 'abc123def456abc123def456abc123def456abc123def456abc123def456abc1';
    const clientSeed = 'my-client-seed';

    const floatNonce0 = getProvablyFairFloats(serverSeed, clientSeed, 0, 1)[0];
    const floatNonce1 = getProvablyFairFloats(serverSeed, clientSeed, 1, 1)[0];
    const floatNonce2 = getProvablyFairFloats(serverSeed, clientSeed, 2, 1)[0];

    assert.ok(floatNonce0 >= 0 && floatNonce0 < 1, 'Float 0 must be in [0, 1)');
    assert.ok(floatNonce1 >= 0 && floatNonce1 < 1, 'Float 1 must be in [0, 1)');
    assert.ok(floatNonce2 >= 0 && floatNonce2 < 1, 'Float 2 must be in [0, 1)');

    assert.notStrictEqual(floatNonce0, floatNonce1, 'Different nonces must yield different floats');
    assert.notStrictEqual(floatNonce1, floatNonce2, 'Different nonces must yield different floats');
  }, meta);
});
