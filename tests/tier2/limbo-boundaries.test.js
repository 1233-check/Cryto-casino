import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playLimbo } from '../helpers/game-engines/limbo-engine.js';

describe('Tier 2: Limbo Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Limbo' };

  test('TC-LIMBO-B01: Target multiplier 1.01x (minimum valid multiplier) boundary executes accurately', () => {
    const result = playLimbo({
      betAmount: 50,
      targetMultiplier: 1.01,
      floatOverride: 0.50 // 0.99 / 0.5 = 1.98x
    });

    assert.strictEqual(result.won, true, 'Result 1.98x should beat 1.01x');
    assert.strictEqual(result.multiplier, 1.01, 'Multiplier should be 1.01');
    assert.strictEqual(result.payout, 50.50, 'Payout should be 50 * 1.01 = 50.50');
  }, meta);

  test('TC-LIMBO-B02: Target multiplier < 1.01 throws validation error', () => {
    assert.throws(() => {
      playLimbo({ targetMultiplier: 1.00 });
    }, 'Target multiplier 1.00 must throw');

    assert.throws(() => {
      playLimbo({ targetMultiplier: 0.5 });
    }, 'Target multiplier 0.5 must throw');
  }, meta);

  test('TC-LIMBO-B03: Extreme high multiplier target 1,000,000x computes without overflow', () => {
    const result = playLimbo({
      betAmount: 1,
      targetMultiplier: 1000000.0,
      floatOverride: 0.0000001 // result = 9,900,000x
    });

    assert.strictEqual(result.won, true, 'Should beat 1,000,000x target');
    assert.strictEqual(result.payout, 1000000.0, 'Payout should be 1,000,000.0');
  }, meta);

  test('TC-LIMBO-B04: Float approaching 0 produces huge multiplier without Infinity/NaN', () => {
    const result = playLimbo({
      betAmount: 10,
      targetMultiplier: 2.0,
      floatOverride: 0.00000001
    });

    assert.ok(Number.isFinite(result.resultMultiplier), 'Result multiplier must be a finite number');
    assert.ok(result.resultMultiplier > 1000000, 'Multiplier should be very large');
  }, meta);

  test('TC-LIMBO-B05: Float approaching 1.0 produces 1.00x minimum floor multiplier', () => {
    const result = playLimbo({
      betAmount: 10,
      targetMultiplier: 2.0,
      floatOverride: 0.999999
    });

    assert.strictEqual(result.resultMultiplier, 1.00, 'Result multiplier floor should be 1.00x');
    assert.strictEqual(result.won, false, '1.00x should lose against 2.00x');
  }, meta);
});
