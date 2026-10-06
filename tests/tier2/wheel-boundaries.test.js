import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playWheel } from '../helpers/game-engines/wheel-engine.js';
import { WHEEL_SEGMENTS } from '../../src/utils/constants.js';

describe('Tier 2: Wheel Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Wheel' };

  test('TC-WHEEL-B01: 10 segments high risk has 9 zero segments and 1 9.9x segment', () => {
    const list = WHEEL_SEGMENTS[10].high;
    const zeros = list.filter(m => m === 0);
    const nonZeros = list.filter(m => m > 0);

    assert.strictEqual(zeros.length, 9, 'Should have 9 zero multiplier segments');
    assert.strictEqual(nonZeros.length, 1, 'Should have 1 winning segment');
    assert.strictEqual(nonZeros[0], 9.9, 'Winning segment should be 9.9x');
  }, meta);

  test('TC-WHEEL-B02: 50 segments high risk has 49 zero segments and top 49.5x', () => {
    const list = WHEEL_SEGMENTS[50].high;
    const zeros = list.filter(m => m === 0);

    assert.strictEqual(zeros.length, 49, 'Should have 49 zero segments');
    assert.strictEqual(Math.max(...list), 49.5, 'Maximum segment should be 49.5x');
  }, meta);

  test('TC-WHEEL-B03: Segment index modulo prevents out-of-bounds access', () => {
    const result = playWheel({
      betAmount: 10,
      segments: 10,
      risk: 'low',
      segmentIndexOverride: 15 // should modulo to 5
    });

    assert.strictEqual(result.segmentIndex, 5, 'Segment index should wrap to 5');
    assert.ok(Number.isFinite(result.multiplier), 'Multiplier must be valid');
  }, meta);

  test('TC-WHEEL-B04: Unsupported segment configuration throws error', () => {
    assert.throws(() => {
      playWheel({ segments: 15 }); // unsupported
    }, 'Segments 15 must throw');
  }, meta);

  test('TC-WHEEL-B05: Unsupported risk tier throws error', () => {
    assert.throws(() => {
      playWheel({ risk: 'ultra' });
    }, 'Unsupported risk must throw');
  }, meta);
});
