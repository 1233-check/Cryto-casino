import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playColorTrading } from '../helpers/game-engines/colortrading-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Color Trading Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Color Trading' };

  test('TC-COLOR-01: Number bet exact match pays 9x bet amount', () => {
    const initialBal = getBalance();
    const result = playColorTrading({
      betAmount: 10,
      betSelection: { type: 'number', value: 7 },
      resultNumberOverride: 7
    });

    assert.strictEqual(result.won, true, 'Number match should win');
    assert.strictEqual(result.multiplier, 9, 'Multiplier should be 9x');
    assert.strictEqual(result.payout, 90.0, 'Payout should be 90.0');
    assert.approxEqual(result.balanceAfter, initialBal + 80.0, 0.0001, 'Balance should increase by 80.0');
  }, meta);

  test('TC-COLOR-02: Number bet mismatch yields 0 payout and full loss', () => {
    const initialBal = getBalance();
    const result = playColorTrading({
      betAmount: 10,
      betSelection: { type: 'number', value: 3 },
      resultNumberOverride: 4
    });

    assert.strictEqual(result.won, false, 'Number mismatch should lose');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -10.0, 'Profit should be -10.0');
    assert.approxEqual(result.balanceAfter, initialBal - 10.0, 0.0001, 'Balance should decrease by 10.0');
  }, meta);

  test('TC-COLOR-03: Color bet green on pure green number (1, 3, 7, 9) pays 2.0x', () => {
    const result = playColorTrading({
      betAmount: 15,
      betSelection: { type: 'color', value: 'green' },
      resultNumberOverride: 1
    });

    assert.strictEqual(result.won, true, 'Green on 1 should win');
    assert.strictEqual(result.multiplier, 2.0, 'Multiplier should be 2.0x');
    assert.strictEqual(result.payout, 30.0, 'Payout should be 15 * 2.0 = 30.0');
  }, meta);

  test('TC-COLOR-04: Color bet violet on number 0 or 5 pays 4.5x', () => {
    const result = playColorTrading({
      betAmount: 10,
      betSelection: { type: 'color', value: 'violet' },
      resultNumberOverride: 0
    });

    assert.strictEqual(result.won, true, 'Violet on 0 should win');
    assert.strictEqual(result.multiplier, 4.5, 'Multiplier should be 4.5x');
    assert.strictEqual(result.payout, 45.0, 'Payout should be 10 * 4.5 = 45.0');
  }, meta);

  test('TC-COLOR-05: Size bet big on number 7 pays 2.0x', () => {
    const result = playColorTrading({
      betAmount: 20,
      betSelection: { type: 'size', value: 'big' },
      resultNumberOverride: 7
    });

    assert.strictEqual(result.won, true, 'Big on 7 should win');
    assert.strictEqual(result.multiplier, 2.0, 'Multiplier should be 2.0x');
    assert.strictEqual(result.payout, 40.0, 'Payout should be 20 * 2.0 = 40.0');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'colortrading', 'History game should be colortrading');
  }, meta);
});
