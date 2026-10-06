import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playCrash } from '../helpers/game-engines/crash-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Crash Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Crash' };

  test('TC-CRASH-01: Cashout below crash point produces win and increases balance', () => {
    const initialBal = getBalance();
    const result = playCrash({
      betAmount: 10,
      autoCashout: 2.0,
      crashPointOverride: 3.50
    });

    assert.strictEqual(result.won, true, 'Bet should be won');
    assert.strictEqual(result.payout, 20.0, 'Payout should be 10 * 2.0 = 20.0');
    assert.strictEqual(result.profit, 10.0, 'Profit should be +10.0');
    assert.strictEqual(result.balanceAfter, initialBal + 10.0, 'Balance should increase by profit');
  }, meta);

  test('TC-CRASH-02: Crash point below target cashout results in loss and zero payout', () => {
    const initialBal = getBalance();
    const result = playCrash({
      betAmount: 10,
      autoCashout: 2.50,
      crashPointOverride: 1.80
    });

    assert.strictEqual(result.won, false, 'Bet should be lost');
    assert.strictEqual(result.payout, 0, 'Payout should be 0 on bust');
    assert.strictEqual(result.profit, -10.0, 'Profit should be -10.0');
    assert.strictEqual(result.balanceAfter, initialBal - 10.0, 'Balance should decrease by bet amount');
  }, meta);

  test('TC-CRASH-03: Auto-cashout executes exactly at configured target multiplier', () => {
    const result = playCrash({
      betAmount: 5,
      autoCashout: 1.50,
      crashPointOverride: 2.00
    });

    assert.strictEqual(result.targetCashout, 1.50, 'Target cashout should match configured value');
    assert.strictEqual(result.payout, 7.50, 'Payout should match 5 * 1.50');
    assert.strictEqual(result.multiplier, 1.50, 'Multiplier should match autoCashout');
  }, meta);

  test('TC-CRASH-04: High multiplier cashout (5.00x) calculates exact fractional payout', () => {
    const result = playCrash({
      betAmount: 2.5,
      autoCashout: 5.00,
      crashPointOverride: 8.20
    });

    assert.strictEqual(result.won, true, 'High multiplier bet should win');
    assert.strictEqual(result.payout, 12.50, 'Payout should be 2.5 * 5.00 = 12.50');
    assert.strictEqual(result.profit, 10.00, 'Profit should be 10.00');
  }, meta);

  test('TC-CRASH-05: Transaction history logs valid game record with metadata', () => {
    playCrash({
      betAmount: 15,
      autoCashout: 2.0,
      crashPointOverride: 2.5
    });

    const history = getHistory();
    assert.ok(history.length > 0, 'History should contain at least one entry');
    const entry = history[0];
    assert.strictEqual(entry.game, 'crash', 'History entry game should be crash');
    assert.strictEqual(entry.bet, 15, 'Bet should be logged');
    assert.strictEqual(entry.payout, 30, 'Payout should be logged');
    assert.strictEqual(entry.multiplier, 2.0, 'Multiplier should be logged');
    assert.ok(entry.timestamp > 0, 'Timestamp should be recorded');
  }, meta);
});
