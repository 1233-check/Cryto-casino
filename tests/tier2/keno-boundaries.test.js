import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playKeno } from '../helpers/game-engines/keno-engine.js';

describe('Tier 2: Keno Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Keno' };

  test('TC-KENO-B01: 10 picks with 0 matches pays 0x (complete miss)', () => {
    const picks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const drawn = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20]; // 0 overlap

    const result = playKeno({
      betAmount: 10,
      picks,
      drawnNumbersOverride: drawn
    });

    assert.strictEqual(result.matchCount, 0, 'Match count should be 0');
    assert.strictEqual(result.multiplier, 0, 'Multiplier should be 0x');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
  }, meta);

  test('TC-KENO-B02: Duplicate picks in selection array are deduplicated', () => {
    // [5, 5, 5] should deduplicate to 1 pick
    const result = playKeno({
      betAmount: 10,
      picks: [5, 5, 5],
      drawnNumbersOverride: [5, 12, 15, 20, 22, 25, 28, 30, 35, 40]
    });

    assert.strictEqual(result.picks.length, 1, 'Picks array should deduplicate to 1 element');
    assert.strictEqual(result.matchCount, 1, 'Should match 1');
    assert.strictEqual(result.multiplier, 3.96, '1 of 1 pick pays 3.96x');
  }, meta);

  test('TC-KENO-B03: Picking number out of range (< 1 or > 40) throws validation error', () => {
    assert.throws(() => {
      playKeno({ picks: [0] });
    }, 'Pick 0 must throw');

    assert.throws(() => {
      playKeno({ picks: [41] });
    }, 'Pick 41 must throw');
  }, meta);

  test('TC-KENO-B04: Picking more than 10 numbers throws validation error', () => {
    assert.throws(() => {
      playKeno({ picks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] });
    }, '11 picks must throw');
  }, meta);

  test('TC-KENO-B05: Boundary picks: 1 pick (minimum) and 10 picks (maximum) both work correctly', () => {
    const minPick = playKeno({
      betAmount: 10,
      picks: [1],
      drawnNumbersOverride: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    });
    assert.strictEqual(minPick.won, true, '1 pick should execute');

    const maxPicks = playKeno({
      betAmount: 10,
      picks: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      drawnNumbersOverride: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    });
    assert.strictEqual(maxPicks.won, true, '10 picks should execute');
  }, meta);
});
