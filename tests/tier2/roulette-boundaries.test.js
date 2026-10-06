import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playRoulette, calculateRoulettePayout } from '../helpers/game-engines/roulette-engine.js';

describe('Tier 2: Roulette Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Roulette' };

  test('TC-ROULETTE-B01: Straight up bet on 0 wins 36x when 0 hits, loses on any 1-36', () => {
    const winResult = playRoulette({
      bets: { num_0: 10 },
      winningNumberOverride: 0
    });
    assert.strictEqual(winResult.won, true, 'Bet on 0 should win on 0');
    assert.strictEqual(winResult.payout, 360.0, 'Payout on 0 should be 360.0');

    const loseResult = playRoulette({
      bets: { num_0: 10 },
      winningNumberOverride: 15
    });
    assert.strictEqual(loseResult.won, false, 'Bet on 0 should lose on 15');
    assert.strictEqual(loseResult.payout, 0, 'Payout should be 0');
  }, meta);

  test('TC-ROULETTE-B02: Full 37 numbers coverage yields exact return of 36/37 of total wager', () => {
    // Bet 1 on all 37 numbers (total bet: 37). Any number hitting pays exactly 36.
    const allBets = {};
    for (let i = 0; i <= 36; i++) {
      allBets[`num_${i}`] = 1;
    }

    const result = playRoulette({
      bets: allBets,
      winningNumberOverride: 23
    });

    assert.strictEqual(result.bet, 37.0, 'Total bet should be 37.0');
    assert.strictEqual(result.payout, 36.0, 'Payout should be 36.0');
    assert.strictEqual(result.profit, -1.0, 'Loss should equal single number wager (-1.0)');
  }, meta);

  test('TC-ROULETTE-B03: Edge numbers in dozens (12 in dozen 1, 13 in dozen 2, 24 in dozen 2, 25 in dozen 3)', () => {
    assert.strictEqual(calculateRoulettePayout({ dozen_1: 10 }, 12), 30.0, '12 should win dozen 1');
    assert.strictEqual(calculateRoulettePayout({ dozen_2: 10 }, 12), 0, '12 should not win dozen 2');

    assert.strictEqual(calculateRoulettePayout({ dozen_2: 10 }, 13), 30.0, '13 should win dozen 2');
    assert.strictEqual(calculateRoulettePayout({ dozen_2: 10 }, 24), 30.0, '24 should win dozen 2');

    assert.strictEqual(calculateRoulettePayout({ dozen_3: 10 }, 25), 30.0, '25 should win dozen 3');
    assert.strictEqual(calculateRoulettePayout({ dozen_3: 10 }, 36), 30.0, '36 should win dozen 3');
  }, meta);

  test('TC-ROULETTE-B04: High column edges (numbers 34, 35, 36) map to columns 1, 2, 3', () => {
    assert.strictEqual(calculateRoulettePayout({ col_1: 10 }, 34), 30.0, '34 % 3 === 1 -> col 1');
    assert.strictEqual(calculateRoulettePayout({ col_2: 10 }, 35), 30.0, '35 % 3 === 2 -> col 2');
    assert.strictEqual(calculateRoulettePayout({ col_3: 10 }, 36), 30.0, '36 % 3 === 0 -> col 3');
  }, meta);

  test('TC-ROULETTE-B05: Insufficient balance rejects multi-bet ticket', () => {
    const result = playRoulette({
      bets: { num_1: 600000, num_2: 600000 }
    });
    assert.strictEqual(result.success, false, 'Should fail on excessive bet amount');
    assert.strictEqual(result.error, 'Insufficient balance', 'Error message matches');
  }, meta);
});
