import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playKeno } from '../helpers/game-engines/keno-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';
import { KENO_PAYOUTS } from '../../src/utils/constants.js';

describe('Tier 1: Keno Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Keno' };

  test('TC-KENO-01: 1 pick matching 1 number pays 3.96x bet', () => {
    const initialBal = getBalance();
    const result = playKeno({
      betAmount: 10,
      picks: [7],
      drawnNumbersOverride: [7, 12, 15, 20, 22, 25, 28, 30, 35, 40]
    });

    assert.strictEqual(result.won, true, 'Matching 1 pick should win');
    assert.strictEqual(result.matchCount, 1, 'Match count should be 1');
    assert.strictEqual(result.multiplier, 3.96, 'Multiplier should be 3.96x');
    assert.strictEqual(result.payout, 39.60, 'Payout should be 10 * 3.96 = 39.60');
    assert.approxEqual(result.balanceAfter, initialBal + 29.60, 0.0001, 'Balance should increase by 29.60');
  }, meta);

  test('TC-KENO-02: 2 picks matching 2 numbers pays 9x bet', () => {
    const result = playKeno({
      betAmount: 10,
      picks: [3, 18],
      drawnNumbersOverride: [1, 2, 3, 18, 20, 25, 30, 31, 32, 33]
    });

    assert.strictEqual(result.matchCount, 2, 'Should match both picks');
    assert.strictEqual(result.multiplier, 9, '2 of 2 matches should pay 9x');
    assert.strictEqual(result.payout, 90.0, 'Payout should be 90.0');
  }, meta);

  test('TC-KENO-03: 3 picks matching 3 numbers pays 26x bet', () => {
    const result = playKeno({
      betAmount: 5,
      picks: [5, 15, 25],
      drawnNumbersOverride: [5, 15, 25, 1, 2, 3, 4, 6, 7, 8]
    });

    assert.strictEqual(result.matchCount, 3, 'Should match 3 picks');
    assert.strictEqual(result.multiplier, 26, '3 of 3 should pay 26x');
    assert.strictEqual(result.payout, 130.0, 'Payout should be 5 * 26 = 130.0');
  }, meta);

  test('TC-KENO-04: 5 picks paytable verification (3 matches = 3x, 5 matches = 200x)', () => {
    // 3 matches
    const res3 = playKeno({
      betAmount: 10,
      picks: [1, 2, 3, 4, 5],
      drawnNumbersOverride: [1, 2, 3, 10, 11, 12, 13, 14, 15, 16]
    });
    assert.strictEqual(res3.matchCount, 3, 'Match count should be 3');
    assert.strictEqual(res3.multiplier, 3, '3 matches out of 5 should pay 3x');
    assert.strictEqual(res3.payout, 30.0, 'Payout should be 30.0');

    // 5 matches
    const res5 = playKeno({
      betAmount: 10,
      picks: [1, 2, 3, 4, 5],
      drawnNumbersOverride: [1, 2, 3, 4, 5, 10, 11, 12, 13, 14]
    });
    assert.strictEqual(res5.matchCount, 5, 'Match count should be 5');
    assert.strictEqual(res5.multiplier, 200, '5 matches out of 5 should pay 200x');
    assert.strictEqual(res5.payout, 2000.0, 'Payout should be 2000.0');
  }, meta);

  test('TC-KENO-05: 10 picks matching 10 numbers pays maximum jackpot 50,000x', () => {
    const picks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = playKeno({
      betAmount: 2,
      picks,
      drawnNumbersOverride: picks
    });

    assert.strictEqual(result.matchCount, 10, 'All 10 picks matched');
    assert.strictEqual(result.multiplier, 50000, '10 of 10 matches pays 50,000x');
    assert.strictEqual(result.payout, 100000.0, 'Payout should be 2 * 50000 = 100,000.0');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'keno', 'History game should be keno');
    assert.strictEqual(history[0].multiplier, 50000, 'History should log 50,000x jackpot');
  }, meta);
});
