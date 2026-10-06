import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playDice } from '../helpers/game-engines/dice-engine.js';
import { getBalance, setBalance } from '../../src/utils/balance.js';

describe('Tier 2: Dice Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Dice' };

  test('TC-DICE-B01: Target 99.00 on over yields maximum 99.00x multiplier (1% win chance)', () => {
    const result = playDice({
      betAmount: 1,
      target: 99.00,
      condition: 'over',
      rollOverride: 99.50
    });

    assert.strictEqual(result.won, true, 'Roll 99.50 should win over 99.00');
    assert.strictEqual(result.multiplier, 99.00, 'Multiplier should be 99.00x');
    assert.strictEqual(result.payout, 99.00, 'Payout should be 1 * 99 = 99.00');
  }, meta);

  test('TC-DICE-B02: Target 1.00 on under yields minimum 1.00x multiplier (99% win chance)', () => {
    const result = playDice({
      betAmount: 10,
      target: 1.00,
      condition: 'under',
      rollOverride: 0.50
    });

    assert.strictEqual(result.won, true, 'Roll 0.50 should win under 1.00');
    assert.strictEqual(result.multiplier, 99.0, 'Multiplier on 1 under is 99/1 = 99.0x or inverted');
  }, meta);

  test('TC-DICE-B03: Exact tie on target (roll === target) loses on strict inequality', () => {
    const overResult = playDice({
      betAmount: 10,
      target: 50.00,
      condition: 'over',
      rollOverride: 50.00
    });
    assert.strictEqual(overResult.won, false, 'Roll === target should not win over');

    const underResult = playDice({
      betAmount: 10,
      target: 50.00,
      condition: 'under',
      rollOverride: 50.00
    });
    assert.strictEqual(underResult.won, false, 'Roll === target should not win under');
  }, meta);

  test('TC-DICE-B04: Invalid target values throw validation errors', () => {
    assert.throws(() => {
      playDice({ target: 0.0 });
    }, 'Target 0 must throw');

    assert.throws(() => {
      playDice({ target: 100.0 });
    }, 'Target 100 must throw');

    assert.throws(() => {
      playDice({ target: -10.0 });
    }, 'Negative target must throw');
  }, meta);

  test('TC-DICE-B05: All-in wager with exact wallet balance depletes balance to 0 on loss', () => {
    setBalance(50.00);
    const result = playDice({
      betAmount: 50.00,
      target: 50.00,
      condition: 'over',
      rollOverride: 20.00 // loss
    });

    assert.strictEqual(result.won, false, 'Should lose');
    assert.strictEqual(result.balanceAfter, 0, 'Balance after all-in loss should be 0.00000000');
    assert.strictEqual(getBalance(), 0, 'Wallet balance should be 0');
  }, meta);
});
