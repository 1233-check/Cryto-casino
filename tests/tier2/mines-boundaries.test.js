import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playMines, getMinesMultiplier } from '../helpers/game-engines/mines-engine.js';

describe('Tier 2: Mines Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Mines' };

  test('TC-MINES-B01: Minimum mines (1 mine) has 24 safe tiles and 1.03x initial multiplier', () => {
    // 1 mine, 1 safe tile: floor(0.99 * (25/24) * 100) / 100 = 1.03
    const mult = getMinesMultiplier(1, 1);
    assert.strictEqual(mult, 1.03, '1 mine with 1 safe tile yields 1.03x');

    const result = playMines({
      betAmount: 10,
      minesCount: 1,
      tilePicks: [0],
      minesPositionsOverride: [24]
    });
    assert.strictEqual(result.multiplier, 1.03, 'Multiplier should match');
  }, meta);

  test('TC-MINES-B02: Maximum mines (24 mines) has exactly 1 safe tile and 24.75x multiplier', () => {
    const mult = getMinesMultiplier(24, 1);
    assert.strictEqual(mult, 24.75, '24 mines with 1 safe tile yields 24.75x');

    const allMinesExceptZero = Array.from({ length: 25 }, (_, i) => i).filter(i => i !== 0);
    const result = playMines({
      betAmount: 10,
      minesCount: 24,
      tilePicks: [0],
      minesPositionsOverride: allMinesExceptZero
    });
    assert.strictEqual(result.won, true, 'Picking the single safe tile should win');
    assert.strictEqual(result.payout, 247.50, 'Payout should be 10 * 24.75 = 247.50');
  }, meta);

  test('TC-MINES-B03: Duplicate tile picks in same round are deduplicated idempotently', () => {
    // Picking [0, 0, 0] should count as 1 safe pick, not 3
    const result = playMines({
      betAmount: 10,
      minesCount: 3,
      tilePicks: [0, 0, 0],
      minesPositionsOverride: [10, 11, 12]
    });

    assert.strictEqual(result.safeRevealed, 1, 'Duplicate picks should deduplicate to 1');
    assert.strictEqual(result.multiplier, 1.12, 'Multiplier should be for 1 safe pick (1.12x)');
  }, meta);

  test('TC-MINES-B04: Out-of-bounds tile pick (< 0 or >= 25) throws validation error', () => {
    assert.throws(() => {
      playMines({ tilePicks: [-1] });
    }, 'Negative tile pick must throw');

    assert.throws(() => {
      playMines({ tilePicks: [25] });
    }, 'Tile pick 25 must throw');
  }, meta);

  test('TC-MINES-B05: Invalid mine counts (< 1 or > 24) throw validation error', () => {
    assert.throws(() => {
      playMines({ minesCount: 0 });
    }, '0 mines must throw');

    assert.throws(() => {
      playMines({ minesCount: 25 });
    }, '25 mines must throw');
  }, meta);
});
