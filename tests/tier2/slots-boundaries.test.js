import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playSlots, evaluateSlotsGrid } from '../helpers/game-engines/slots-engine.js';
import { SLOT_PAYOUTS } from '../../src/utils/constants.js';

describe('Tier 2: Slots Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Slots' };

  test('TC-SLOTS-B01: 5 cherries (lowest paying symbol) pays 15x line bet', () => {
    assert.strictEqual(SLOT_PAYOUTS['🍒'][5], 15, '5 cherries pays 15x');
  }, meta);

  test('TC-SLOTS-B02: 2 matching symbols is below minimum threshold and pays 0x', () => {
    // 2 diamonds on payline 1 (middle row)
    const grid = [
      ['🍊', '💎', '🍉'],
      ['🍇', '💎', '🍋'],
      ['⭐', '⭐', '🔔'],
      ['🍒', '⭐', '🍊'],
      ['🍋', '⭐', '🍇']
    ];

    const { totalWin, winningLines } = evaluateSlotsGrid(grid, 20);
    assert.strictEqual(totalWin, 0, '2 matching symbols should pay 0');
    assert.strictEqual(winningLines.length, 0, 'Winning lines count should be 0');
  }, meta);

  test('TC-SLOTS-B03: Matching symbols not starting on reel 0 pays 0x (left-to-right rule)', () => {
    // 3 diamonds on reels 1, 2, 3 (middle row), but reel 0 has a lemon
    const grid = [
      ['🍊', '🍋', '🍉'], // reel 0
      ['🍇', '💎', '🍋'], // reel 1
      ['⭐', '💎', '🔔'], // reel 2
      ['🍒', '💎', '🍊'], // reel 3
      ['🍋', '🍊', '🍇']  // reel 4
    ];

    const { totalWin } = evaluateSlotsGrid(grid, 20);
    assert.strictEqual(totalWin, 0, 'Must start on reel 0 from left to right');
  }, meta);

  test('TC-SLOTS-B04: Full screen diamond jackpot hits all 20 paylines with 1000x line bets', () => {
    // All 15 cells are 💎
    const grid = Array.from({ length: 5 }, () => ['💎', '💎', '💎']);
    const { totalWin, winningLines } = evaluateSlotsGrid(grid, 20);

    // 20 paylines * 1000x line bet (line bet = 1) = 20,000 payout
    assert.strictEqual(winningLines.length, 20, 'All 20 paylines should trigger');
    assert.strictEqual(totalWin, 20000.0, 'Full screen diamonds should pay 20,000.0');
  }, meta);

  test('TC-SLOTS-B05: Single satoshi line bet (0.00000020 total bet) maintains satoshi accuracy', () => {
    const result = playSlots({
      betAmount: 0.00000020
    });

    assert.strictEqual(result.bet, 0.00000020, 'Bet amount should match');
    assert.ok(result.balanceAfter >= 0, 'Balance should remain non-negative');
  }, meta);
});
