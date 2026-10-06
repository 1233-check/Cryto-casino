import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playTower, getTowerMultiplier } from '../helpers/game-engines/tower-engine.js';

describe('Tier 2: Tower Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Tower' };

  test('TC-TOWER-B01: Clearing top floor 10 wins maximum difficulty multiplier', () => {
    // Easy floor 10: floor(0.98 * (4/3)^10 * 100) / 100 = 17.40
    const mult10 = getTowerMultiplier('easy', 10);
    assert.ok(mult10 > 15, 'Floor 10 easy multiplier should be > 15x');

    const result = playTower({
      betAmount: 1,
      difficulty: 'easy',
      floorPicks: Array(10).fill(0),
      towerOverride: Array(10).fill(1) // all bombs at col 1
    });

    assert.strictEqual(result.clearedFloors, 10, 'Should clear all 10 floors');
    assert.strictEqual(result.multiplier, mult10, 'Multiplier should match top floor');
    assert.strictEqual(result.payout, mult10, 'Payout should be 1 * mult10');
  }, meta);

  test('TC-TOWER-B02: Out-of-bounds column pick throws validation error', () => {
    assert.throws(() => {
      playTower({
        difficulty: 'easy', // cols: 4 (0, 1, 2, 3)
        floorPicks: [4]     // out of bounds
      });
    }, 'Col 4 on easy mode must throw');

    assert.throws(() => {
      playTower({
        difficulty: 'hard', // cols: 2 (0, 1)
        floorPicks: [2]
      });
    }, 'Col 2 on hard mode must throw');
  }, meta);

  test('TC-TOWER-B03: Master difficulty has 4.00x multiplier scale per floor', () => {
    // cols: 4, safe: 1. (4/1)^1 = 4. 0.98 * 4 = 3.92
    const mult = getTowerMultiplier('master', 1);
    assert.strictEqual(mult, 3.92, 'Master floor 1 should yield 3.92x');
  }, meta);

  test('TC-TOWER-B04: Cashout on floor 0 (no floors cleared) yields 0 payout', () => {
    const result = playTower({
      betAmount: 10,
      difficulty: 'easy',
      floorPicks: [],
      cashoutFloor: 0
    });

    assert.strictEqual(result.clearedFloors, 0, '0 floors cleared');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
  }, meta);

  test('TC-TOWER-B05: Invalid difficulty name throws validation error', () => {
    assert.throws(() => {
      playTower({ difficulty: 'impossible' });
    }, 'Invalid difficulty must throw');
  }, meta);
});
