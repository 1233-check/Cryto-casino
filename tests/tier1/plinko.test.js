import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playPlinko } from '../helpers/game-engines/plinko-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';
import { PLINKO_MULTIPLIERS } from '../../src/utils/constants.js';

describe('Tier 1: Plinko Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Plinko' };

  test('TC-PLINKO-01: 8 rows low risk center bin pays 0.5x and edge bin pays 5.6x', () => {
    // Center bin for 8 rows is index 4 (4 left, 4 right)
    const centerPath = [0, 0, 0, 0, 1, 1, 1, 1];
    const centerResult = playPlinko({
      betAmount: 10,
      rows: 8,
      risk: 'low',
      pathOverride: centerPath
    });

    assert.strictEqual(centerResult.binIndex, 4, 'Bin index should be 4');
    assert.strictEqual(centerResult.multiplier, 0.5, 'Center bin should pay 0.5x');
    assert.strictEqual(centerResult.payout, 5.0, 'Payout should be 10 * 0.5 = 5.0');

    // Edge bin index 0 (all left 0)
    const edgePath = [0, 0, 0, 0, 0, 0, 0, 0];
    const edgeResult = playPlinko({
      betAmount: 10,
      rows: 8,
      risk: 'low',
      pathOverride: edgePath
    });

    assert.strictEqual(edgeResult.binIndex, 0, 'Bin index should be 0');
    assert.strictEqual(edgeResult.multiplier, 5.6, 'Edge bin should pay 5.6x');
    assert.strictEqual(edgeResult.payout, 56.0, 'Payout should be 10 * 5.6 = 56.0');
  }, meta);

  test('TC-PLINKO-02: 12 rows medium risk calculates correct bin and payout', () => {
    // Sum of path = 6 (bin 6)
    const path = [1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0];
    const result = playPlinko({
      betAmount: 20,
      rows: 12,
      risk: 'medium',
      pathOverride: path
    });

    assert.strictEqual(result.binIndex, 6, 'Bin index should be 6');
    const expectedMult = PLINKO_MULTIPLIERS[12].medium[6]; // 0.3
    assert.strictEqual(result.multiplier, expectedMult, 'Multiplier should match constants');
    assert.strictEqual(result.payout, 20 * expectedMult, 'Payout should match bet * mult');
  }, meta);

  test('TC-PLINKO-03: 16 rows high risk extreme bin pays 1000x jackpot', () => {
    const allRightPath = Array(16).fill(1); // bin 16
    const result = playPlinko({
      betAmount: 5,
      rows: 16,
      risk: 'high',
      pathOverride: allRightPath
    });

    assert.strictEqual(result.binIndex, 16, 'Bin index should be 16');
    assert.strictEqual(result.multiplier, 1000, 'Extreme bin should pay 1000x');
    assert.strictEqual(result.payout, 5000, 'Payout should be 5 * 1000 = 5000');
  }, meta);

  test('TC-PLINKO-04: Balance accurately reflects bet deduction and payout addition', () => {
    const initialBal = getBalance();
    const result = playPlinko({
      betAmount: 10,
      rows: 8,
      risk: 'low',
      pathOverride: [0, 0, 0, 0, 0, 0, 0, 0] // 5.6x
    });

    // Net profit = 56 - 10 = +46
    assert.approxEqual(result.balanceAfter, initialBal + 46, 0.0001, 'Balance should increase by 46');
  }, meta);

  test('TC-PLINKO-05: Transaction history logs Plinko configuration and outcome', () => {
    playPlinko({
      betAmount: 15,
      rows: 12,
      risk: 'low',
      pathOverride: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1] // bin 6
    });

    const history = getHistory();
    const entry = history[0];
    assert.strictEqual(entry.game, 'plinko', 'Game should be plinko');
    assert.strictEqual(entry.bet, 15, 'Bet should match');
    assert.strictEqual(entry.details.rows, 12, 'Details should record rows');
    assert.strictEqual(entry.details.risk, 'low', 'Details should record risk');
    assert.strictEqual(entry.details.binIndex, 6, 'Details should record binIndex');
  }, meta);
});
