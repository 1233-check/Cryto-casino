import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playDice } from '../helpers/game-engines/dice-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Dice Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Dice' };

  test('TC-DICE-01: Roll over 50.00 wins when outcome exceeds target', () => {
    const initialBal = getBalance();
    const result = playDice({
      betAmount: 10,
      target: 50.00,
      condition: 'over',
      rollOverride: 75.50
    });

    assert.strictEqual(result.won, true, 'Roll of 75.50 should win over 50.00');
    assert.strictEqual(result.multiplier, 1.98, '50% win chance should yield 99/50 = 1.98x');
    assert.strictEqual(result.payout, 19.80, 'Payout should be 10 * 1.98');
    assert.approxEqual(result.balanceAfter, initialBal + 9.80, 0.0001, 'Balance should increase by 9.80');
  }, meta);

  test('TC-DICE-02: Roll under 50.00 wins when outcome is below target', () => {
    const result = playDice({
      betAmount: 10,
      target: 50.00,
      condition: 'under',
      rollOverride: 24.30
    });

    assert.strictEqual(result.won, true, 'Roll of 24.30 should win under 50.00');
    assert.strictEqual(result.multiplier, 1.98, 'Multiplier should be 1.98x');
    assert.strictEqual(result.payout, 19.80, 'Payout should be 19.80');
  }, meta);

  test('TC-DICE-03: Low win chance (10%) calculates 9.90x multiplier and pays correctly on win', () => {
    const result = playDice({
      betAmount: 5,
      target: 90.00,
      condition: 'over',
      rollOverride: 95.00
    });

    assert.strictEqual(result.won, true, 'Roll 95 should win over 90');
    assert.strictEqual(result.multiplier, 9.90, '10% chance should yield 99/10 = 9.90x');
    assert.strictEqual(result.payout, 49.50, 'Payout should be 5 * 9.90 = 49.50');
  }, meta);

  test('TC-DICE-04: High win chance (90%) calculates 1.10x multiplier and pays on win', () => {
    const result = playDice({
      betAmount: 20,
      target: 90.00,
      condition: 'under',
      rollOverride: 42.00
    });

    assert.strictEqual(result.won, true, 'Roll 42 should win under 90');
    assert.strictEqual(result.multiplier, 1.10, '90% chance should yield 99/90 = 1.10x');
    assert.strictEqual(result.payout, 22.00, 'Payout should be 20 * 1.10 = 22.00');
  }, meta);

  test('TC-DICE-05: Losing roll deducts balance and appends negative profit history', () => {
    const initialBal = getBalance();
    const result = playDice({
      betAmount: 15,
      target: 50.00,
      condition: 'over',
      rollOverride: 32.10
    });

    assert.strictEqual(result.won, false, 'Roll 32.10 should lose over 50.00');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -15, 'Profit should be -15');
    assert.approxEqual(result.balanceAfter, initialBal - 15, 0.0001, 'Balance should decrease by 15');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'dice', 'History game should be dice');
    assert.strictEqual(history[0].profit, -15, 'History profit should be -15');
  }, meta);
});
