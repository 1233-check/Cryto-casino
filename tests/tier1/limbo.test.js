import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playLimbo } from '../helpers/game-engines/limbo-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Limbo Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Limbo' };

  test('TC-LIMBO-01: Target 2.00x wins when generated multiplier >= 2.00x', () => {
    const initialBal = getBalance();
    // float 0.25 -> 0.99 / 0.25 = 3.96x
    const result = playLimbo({
      betAmount: 10,
      targetMultiplier: 2.00,
      floatOverride: 0.25
    });

    assert.strictEqual(result.won, true, 'Result 3.96x should beat target 2.00x');
    assert.strictEqual(result.resultMultiplier, 3.96, 'Result multiplier should be 3.96');
    assert.strictEqual(result.payout, 20.00, 'Payout should be 10 * 2.00 = 20.00');
    assert.strictEqual(result.profit, 10.00, 'Profit should be +10.00');
    assert.approxEqual(result.balanceAfter, initialBal + 10.00, 0.0001, 'Balance should increase by 10.00');
  }, meta);

  test('TC-LIMBO-02: Target 2.00x loses when generated multiplier < 2.00x', () => {
    const initialBal = getBalance();
    // float 0.60 -> 0.99 / 0.60 = 1.65x
    const result = playLimbo({
      betAmount: 10,
      targetMultiplier: 2.00,
      floatOverride: 0.60
    });

    assert.strictEqual(result.won, false, 'Result 1.65x should lose against target 2.00x');
    assert.strictEqual(result.resultMultiplier, 1.65, 'Result multiplier should be 1.65');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -10.00, 'Profit should be -10.00');
    assert.approxEqual(result.balanceAfter, initialBal - 10.00, 0.0001, 'Balance should decrease by 10.00');
  }, meta);

  test('TC-LIMBO-03: High target 10.00x pays exactly 10x bet on win', () => {
    // float 0.05 -> 0.99 / 0.05 = 19.80x
    const result = playLimbo({
      betAmount: 5,
      targetMultiplier: 10.00,
      floatOverride: 0.05
    });

    assert.strictEqual(result.won, true, 'Result 19.80x should beat target 10.00x');
    assert.strictEqual(result.payout, 50.00, 'Payout should be 5 * 10.00 = 50.00');
    assert.strictEqual(result.multiplier, 10.00, 'Recorded multiplier should be target 10.00');
  }, meta);

  test('TC-LIMBO-04: Lowest target 1.01x wins with high probability', () => {
    // float 0.90 -> 0.99 / 0.90 = 1.10x
    const result = playLimbo({
      betAmount: 100,
      targetMultiplier: 1.01,
      floatOverride: 0.90
    });

    assert.strictEqual(result.won, true, 'Result 1.10x should beat 1.01x');
    assert.strictEqual(result.payout, 101.00, 'Payout should be 100 * 1.01 = 101.00');
  }, meta);

  test('TC-LIMBO-05: Transaction history records valid Limbo entry', () => {
    playLimbo({
      betAmount: 25,
      targetMultiplier: 3.00,
      floatOverride: 0.20 // result 4.95x
    });

    const history = getHistory();
    const entry = history[0];
    assert.strictEqual(entry.game, 'limbo', 'History game should be limbo');
    assert.strictEqual(entry.bet, 25, 'Bet should be 25');
    assert.strictEqual(entry.payout, 75, 'Payout should be 75');
    assert.strictEqual(entry.multiplier, 3.00, 'Multiplier should be 3.00');
    assert.strictEqual(entry.details.targetMultiplier, 3.00, 'Details targetMultiplier should be logged');
  }, meta);
});
