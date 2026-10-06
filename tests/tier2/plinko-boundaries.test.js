import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playPlinko } from '../helpers/game-engines/plinko-engine.js';
import { PLINKO_MULTIPLIERS } from '../../src/utils/constants.js';

describe('Tier 2: Plinko Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Plinko' };

  test('TC-PLINKO-B01: 8 rows low risk lowest volatility bounds (0.5x min, 5.6x max)', () => {
    const multipliers = PLINKO_MULTIPLIERS[8].low;
    const minMult = Math.min(...multipliers);
    const maxMult = Math.max(...multipliers);

    assert.strictEqual(minMult, 0.5, 'Minimum multiplier should be 0.5x');
    assert.strictEqual(maxMult, 5.6, 'Maximum multiplier should be 5.6x');
  }, meta);

  test('TC-PLINKO-B02: 16 rows high risk highest volatility bounds (0.2x min, 1000x max)', () => {
    const multipliers = PLINKO_MULTIPLIERS[16].high;
    const minMult = Math.min(...multipliers);
    const maxMult = Math.max(...multipliers);

    assert.strictEqual(minMult, 0.2, 'Minimum center multiplier should be 0.2x');
    assert.strictEqual(maxMult, 1000, 'Maximum jackpot multiplier should be 1000x');
  }, meta);

  test('TC-PLINKO-B03: Unsupported row count throws validation error', () => {
    assert.throws(() => {
      playPlinko({ rows: 10 }); // only 8, 12, 16 supported
    }, 'Row count 10 must throw');
  }, meta);

  test('TC-PLINKO-B04: Unsupported risk level throws validation error', () => {
    assert.throws(() => {
      playPlinko({ risk: 'extreme' });
    }, 'Unsupported risk level must throw');
  }, meta);

  test('TC-PLINKO-B05: Micro-bet (0.00000001 BTC) maintains exact 8-decimal accuracy', () => {
    const result = playPlinko({
      betAmount: 0.00000001,
      rows: 8,
      risk: 'low',
      pathOverride: [0, 0, 0, 0, 1, 1, 1, 1] // bin 4 (0.5x)
    });

    assert.strictEqual(result.payout, 0.00000001, 'Payout should round 0.000000005 up to 1 satoshi due to toFixed(8)');
  }, meta);
});
