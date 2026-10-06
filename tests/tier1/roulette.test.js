import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playRoulette } from '../helpers/game-engines/roulette-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Roulette Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Roulette' };

  test('TC-ROULETTE-01: Straight up bet on 17 wins 36x when 17 hits', () => {
    const initialBal = getBalance();
    const result = playRoulette({
      bets: { num_17: 10 },
      winningNumberOverride: 17
    });

    assert.strictEqual(result.won, true, 'Straight up 17 should win');
    assert.strictEqual(result.payout, 360.0, 'Payout should be 10 * 36 = 360.0');
    assert.strictEqual(result.profit, 350.0, 'Profit should be +350.0');
    assert.approxEqual(result.balanceAfter, initialBal + 350.0, 0.0001, 'Balance should increase by 350.0');
  }, meta);

  test('TC-ROULETTE-02: Color bet on red wins 2x when red number hits', () => {
    // 1 is red
    const result = playRoulette({
      bets: { color_red: 20 },
      winningNumberOverride: 1
    });

    assert.strictEqual(result.won, true, 'Red should win on number 1');
    assert.strictEqual(result.payout, 40.0, 'Payout should be 20 * 2 = 40.0');
    assert.strictEqual(result.profit, 20.0, 'Profit should be +20.0');
  }, meta);

  test('TC-ROULETTE-03: Outside bet on even wins 2x when even number hits', () => {
    // 14 is even
    const result = playRoulette({
      bets: { parity_even: 15 },
      winningNumberOverride: 14
    });

    assert.strictEqual(result.won, true, 'Even should win on 14');
    assert.strictEqual(result.payout, 30.0, 'Payout should be 15 * 2 = 30.0');
  }, meta);

  test('TC-ROULETTE-04: Number 0 outcome causes outside bets (red/black, even/odd) to lose', () => {
    const result = playRoulette({
      bets: { color_red: 10, parity_even: 10 },
      winningNumberOverride: 0
    });

    assert.strictEqual(result.won, false, 'Outside bets should lose on 0');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -20.0, 'Profit should be -20.0');
  }, meta);

  test('TC-ROULETTE-05: Multiple simultaneous bets correctly aggregate payouts', () => {
    // Bets: num_17: 5 (pays 180), color_black: 10 (17 is black, pays 20), dozen_2: 10 (17 is dozen 2, pays 30)
    // Total bet: 25. Total payout: 180 + 20 + 30 = 230.
    const result = playRoulette({
      bets: {
        num_17: 5,
        color_black: 10,
        dozen_2: 10
      },
      winningNumberOverride: 17
    });

    assert.strictEqual(result.won, true, 'Multi-bet should win');
    assert.strictEqual(result.payout, 230.0, 'Payout should aggregate: 180 + 20 + 30 = 230.0');
    assert.strictEqual(result.profit, 205.0, 'Profit should be 230 - 25 = 205.0');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'roulette', 'History game should be roulette');
    assert.strictEqual(history[0].details.winningNumber, 17, 'History should log winning number');
  }, meta);
});
