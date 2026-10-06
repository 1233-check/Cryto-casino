import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playTower, getTowerMultiplier } from '../helpers/game-engines/tower-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Tower Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Tower' };

  test('TC-TOWER-01: Easy mode Floor 1 safe pick yields 1.30x multiplier', () => {
    // floor(0.98 * (4/3)^1 * 100) / 100 = 1.30
    const mult = getTowerMultiplier('easy', 1);
    assert.strictEqual(mult, 1.30, 'Easy floor 1 should yield 1.30x');

    const result = playTower({
      betAmount: 10,
      difficulty: 'easy',
      floorPicks: [0],
      towerOverride: [1] // bomb is at col 1, picked 0 -> safe
    });

    assert.strictEqual(result.won, true, 'Picking safe col should win');
    assert.strictEqual(result.multiplier, 1.30, 'Multiplier should match formula');
    assert.strictEqual(result.payout, 13.0, 'Payout should be 10 * 1.30 = 13.0');
  }, meta);

  test('TC-TOWER-02: Advancing 3 floors compounds multiplier and allows cashout', () => {
    // floor(0.98 * (4/3)^3 * 100) / 100 = floor(0.98 * 2.37037 * 100) / 100 = 2.32
    const mult = getTowerMultiplier('easy', 3);
    assert.strictEqual(mult, 2.32, 'Easy floor 3 should yield 2.32x');

    const result = playTower({
      betAmount: 10,
      difficulty: 'easy',
      floorPicks: [0, 0, 0],
      towerOverride: [1, 1, 1] // all bombs at 1, picked 0
    });

    assert.strictEqual(result.clearedFloors, 3, 'Should clear 3 floors');
    assert.strictEqual(result.multiplier, 2.32, 'Multiplier should match');
    assert.strictEqual(result.payout, 23.20, 'Payout should be 23.20');
  }, meta);

  test('TC-TOWER-03: Stepping on a bomb causes game over with zero payout', () => {
    const initialBal = getBalance();
    const result = playTower({
      betAmount: 10,
      difficulty: 'easy',
      floorPicks: [2],
      towerOverride: [2] // bomb at col 2
    });

    assert.strictEqual(result.hitBomb, true, 'Should hit bomb');
    assert.strictEqual(result.won, false, 'Should lose');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -10, 'Profit should be -10');
    assert.approxEqual(result.balanceAfter, initialBal - 10, 0.0001, 'Balance should reduce by 10');
  }, meta);

  test('TC-TOWER-04: Hard mode (2 cols, 1 safe) calculates 1.96x multiplier on floor 1', () => {
    // floor(0.98 * (2/1)^1 * 100) / 100 = 1.96
    const mult = getTowerMultiplier('hard', 1);
    assert.strictEqual(mult, 1.96, 'Hard floor 1 should yield 1.96x');

    const result = playTower({
      betAmount: 5,
      difficulty: 'hard',
      floorPicks: [0],
      towerOverride: [1]
    });

    assert.strictEqual(result.won, true, 'Safe pick should win');
    assert.strictEqual(result.multiplier, 1.96, 'Multiplier should be 1.96x');
    assert.strictEqual(result.payout, 9.80, 'Payout should be 5 * 1.96 = 9.80');
  }, meta);

  test('TC-TOWER-05: Transaction history logs tower difficulty and cleared floors', () => {
    playTower({
      betAmount: 12,
      difficulty: 'medium',
      floorPicks: [0, 0],
      towerOverride: [1, 1]
    });

    const history = getHistory();
    const entry = history[0];
    assert.strictEqual(entry.game, 'tower', 'History game should be tower');
    assert.strictEqual(entry.bet, 12, 'Bet should be 12');
    assert.strictEqual(entry.details.difficulty, 'medium', 'Details should log medium difficulty');
    assert.strictEqual(entry.details.clearedFloors, 2, 'Details should log 2 cleared floors');
  }, meta);
});
