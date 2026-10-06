import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playSlots } from '../helpers/game-engines/slots-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Slots Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Slots' };

  test('TC-SLOTS-01: 3 matching diamonds on Payline 1 pays 50x line bet', () => {
    // Total bet: 20 -> line bet: 1.
    // Payline 1 is middle row (row 1 across all reels).
    const grid = [
      ['🍒', '💎', '🍊'], // reel 0
      ['🍇', '💎', '🍋'], // reel 1
      ['⭐', '💎', '🔔'], // reel 2
      ['🍒', '🔔', '🍊'], // reel 3
      ['🍋', '⭐', '🍇']  // reel 4
    ];

    const result = playSlots({
      betAmount: 20,
      gridOverride: grid
    });

    assert.strictEqual(result.won, true, '3 diamonds should trigger a win');
    assert.strictEqual(result.payout, 50.0, 'Payout should be 1 * 50 = 50.0');
    assert.strictEqual(result.profit, 30.0, 'Profit should be 50 - 20 = 30.0');
  }, meta);

  test('TC-SLOTS-02: 5 matching diamonds on Payline 1 pays 1000x line bet jackpot', () => {
    // Total bet: 20 -> line bet: 1. 5 diamonds = 1000x line bet.
    const grid = [
      ['🍒', '💎', '🍒'],
      ['🍒', '💎', '🍒'],
      ['🍒', '💎', '🍒'],
      ['🍒', '💎', '🍒'],
      ['🍒', '💎', '🍒']
    ];

    const result = playSlots({
      betAmount: 20,
      gridOverride: grid
    });

    assert.strictEqual(result.won, true, '5 diamonds should win');
    // Payline 1 has 5 diamonds -> 1000x. Other paylines might also have combinations.
    assert.ok(result.payout >= 1000, 'Payout should be at least 1000');
  }, meta);

  test('TC-SLOTS-03: Multi-line win aggregates winning lines', () => {
    // Top row (payline 2) has 3 7️⃣ (25x), Middle row (payline 1) has 3 🔔 (15x)
    const grid = [
      ['7️⃣', '🔔', '🍒'],
      ['7️⃣', '🔔', '🍒'],
      ['7️⃣', '🔔', '🍒'],
      ['🍇', '🍊', '🍒'],
      ['🍋', '⭐', '🍒']
    ];

    const result = playSlots({
      betAmount: 20,
      gridOverride: grid
    });

    assert.strictEqual(result.won, true, 'Multi-line should win');
    assert.ok(result.winningLines.length >= 2, 'At least 2 lines should win');
    // Line bet = 1. Payline 2 (7️⃣x3 = 25) + Payline 1 (🔔x3 = 15) = 40.
    assert.ok(result.payout >= 40, 'Payout should be at least 40');
  }, meta);

  test('TC-SLOTS-04: Non-matching spin results in 0 payout and negative profit', () => {
    const initialBal = getBalance();
    const grid = [
      ['🍒', '💎', '⭐'],
      ['🔔', '🍊', '🍋'],
      ['🍇', '7️⃣', '🍒'],
      ['💎', '🔔', '⭐'],
      ['🍊', '🍇', '🍋']
    ];

    const result = playSlots({
      betAmount: 20,
      gridOverride: grid
    });

    assert.strictEqual(result.won, false, 'No match should lose');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -20.0, 'Profit should be -20');
    assert.approxEqual(result.balanceAfter, initialBal - 20, 0.0001, 'Balance should reduce by 20');
  }, meta);

  test('TC-SLOTS-05: Transaction history logs slots game details', () => {
    playSlots({
      betAmount: 40
    });

    const history = getHistory();
    const entry = history[0];
    assert.strictEqual(entry.game, 'slots', 'History game should be slots');
    assert.strictEqual(entry.bet, 40, 'Bet should match');
  }, meta);
});
