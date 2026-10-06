import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playMines, getMinesMultiplier } from '../helpers/game-engines/mines-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Mines Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Mines' };

  test('TC-MINES-01: Revealing 1 safe tile in 3-mine game yields 1.07x multiplier', () => {
    // 25 tiles, 3 mines. Safe tiles = 22. Multiplier = floor(0.99 * (25/22) * 100) / 100 = 1.12 in general or 1.12
    const mult = getMinesMultiplier(3, 1);
    assert.strictEqual(mult, 1.12, '1 safe tile with 3 mines should yield 1.12x');

    const result = playMines({
      betAmount: 10,
      minesCount: 3,
      tilePicks: [0],
      minesPositionsOverride: [10, 11, 12]
    });

    assert.strictEqual(result.won, true, 'Picking safe tile 0 should win');
    assert.strictEqual(result.multiplier, 1.12, 'Multiplier should match formula');
    assert.strictEqual(result.payout, 11.20, 'Payout should be 10 * 1.12 = 11.20');
  }, meta);

  test('TC-MINES-02: Revealing 3 consecutive safe tiles compounds multiplier and allows cashout', () => {
    const mult = getMinesMultiplier(3, 3);
    // numerator = 25*24*23 / 6 = 2300. denominator = 22*21*20 / 6 = 1540. 0.99 * 2300/1540 = 1.478 -> 1.47
    assert.strictEqual(mult, 1.47, '3 safe tiles with 3 mines should yield 1.47x');

    const result = playMines({
      betAmount: 10,
      minesCount: 3,
      tilePicks: [0, 1, 2],
      minesPositionsOverride: [10, 11, 12]
    });

    assert.strictEqual(result.won, true, 'Picking 3 safe tiles should win');
    assert.strictEqual(result.safeRevealed, 3, 'Safe tiles revealed should be 3');
    assert.strictEqual(result.multiplier, 1.47, 'Multiplier should be 1.47x');
    assert.strictEqual(result.payout, 14.70, 'Payout should be 14.70');
  }, meta);

  test('TC-MINES-03: Hitting a mine results in immediate game over with zero payout', () => {
    const initialBal = getBalance();
    const result = playMines({
      betAmount: 10,
      minesCount: 3,
      tilePicks: [5],
      minesPositionsOverride: [5, 10, 15] // 5 is a mine
    });

    assert.strictEqual(result.hitMine, true, 'Should flag mine hit');
    assert.strictEqual(result.won, false, 'Should be marked as loss');
    assert.strictEqual(result.payout, 0, 'Payout must be 0');
    assert.strictEqual(result.profit, -10, 'Profit must be -10');
    assert.approxEqual(result.balanceAfter, initialBal - 10, 0.0001, 'Balance should reduce by bet amount');
  }, meta);

  test('TC-MINES-04: High mine density (24 mines, 1 safe tile) yields 24.75x multiplier', () => {
    const mult = getMinesMultiplier(24, 1);
    // 0.99 * 25 / 1 = 24.75
    assert.strictEqual(mult, 24.75, '24 mines with 1 safe pick should yield 24.75x');

    const result = playMines({
      betAmount: 4,
      minesCount: 24,
      tilePicks: [7], // pick the only safe tile
      minesPositionsOverride: Array.from({ length: 25 }, (_, i) => i).filter(i => i !== 7)
    });

    assert.strictEqual(result.won, true, 'Jackpot safe pick should win');
    assert.strictEqual(result.multiplier, 24.75, 'Multiplier should be 24.75x');
    assert.strictEqual(result.payout, 99.00, 'Payout should be 4 * 24.75 = 99.00');
  }, meta);

  test('TC-MINES-05: Transaction history logs mines game details accurately', () => {
    playMines({
      betAmount: 20,
      minesCount: 5,
      tilePicks: [1, 2],
      minesPositionsOverride: [20, 21, 22, 23, 24]
    });

    const history = getHistory();
    const entry = history[0];
    assert.strictEqual(entry.game, 'mines', 'History game should be mines');
    assert.strictEqual(entry.bet, 20, 'Bet amount should match');
    assert.ok(entry.payout > 20, 'Payout should be greater than bet');
    assert.strictEqual(entry.details.minesCount, 5, 'Details should log mines count');
    assert.strictEqual(entry.details.safeRevealed, 2, 'Details should log safe revealed count');
  }, meta);
});
