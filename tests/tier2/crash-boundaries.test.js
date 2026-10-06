import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playCrash } from '../helpers/game-engines/crash-engine.js';
import { getBalance } from '../../src/utils/balance.js';

describe('Tier 2: Crash Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Crash' };

  test('TC-CRASH-B01: Crash point exactly 1.00x causes instant bust for any target > 1.00x', () => {
    const result = playCrash({
      betAmount: 10,
      autoCashout: 1.01,
      crashPointOverride: 1.00
    });

    assert.strictEqual(result.won, false, 'Should lose on instant crash 1.00x');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -10.0, 'Profit should be -10.0');
  }, meta);

  test('TC-CRASH-B02: Zero or negative bet is rejected with validation error', () => {
    assert.throws(() => {
      playCrash({ betAmount: 0 });
    }, 'Zero bet must throw');

    assert.throws(() => {
      playCrash({ betAmount: -5 });
    }, 'Negative bet must throw');
  }, meta);

  test('TC-CRASH-B03: Insufficient balance fails gracefully without deducting balance', () => {
    const initialBal = getBalance();
    const result = playCrash({
      betAmount: initialBal + 500
    });

    assert.strictEqual(result.success, false, 'Operation should fail');
    assert.strictEqual(result.error, 'Insufficient balance', 'Error should indicate insufficient balance');
    assert.strictEqual(getBalance(), initialBal, 'Balance should remain unchanged');
  }, meta);

  test('TC-CRASH-B04: Satoshi-level precision bet (0.00000001 BTC) preserves 8 decimal places', () => {
    const result = playCrash({
      betAmount: 0.00000001,
      autoCashout: 2.0,
      crashPointOverride: 3.0
    });

    assert.strictEqual(result.won, true, 'Satoshi bet should win');
    assert.strictEqual(result.payout, 0.00000002, 'Payout should be 0.00000002 BTC');
    assert.strictEqual(result.profit, 0.00000001, 'Profit should be 0.00000001 BTC');
  }, meta);

  test('TC-CRASH-B05: High multiplier crash point (10,000x) computes exact payout without overflow', () => {
    const result = playCrash({
      betAmount: 0.1,
      autoCashout: 10000.0,
      crashPointOverride: 15000.0
    });

    assert.strictEqual(result.won, true, '10,000x cashout should win');
    assert.strictEqual(result.payout, 1000.0, 'Payout should be 0.1 * 10,000 = 1000.0');
  }, meta);
});
