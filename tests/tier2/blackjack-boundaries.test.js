import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playBlackjack, calculateBlackjackHandValue } from '../helpers/game-engines/blackjack-engine.js';
import { getBalance, setBalance } from '../../src/utils/balance.js';

describe('Tier 2: Blackjack Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Blackjack' };

  test('TC-BJ-B01: Soft hand Ace conversion (A + 6 = 17, hit 5 = 12)', () => {
    // A + 6 = 17 soft
    const hand1 = [{ rank: 'A' }, { rank: '6' }];
    assert.strictEqual(calculateBlackjackHandValue(hand1), 17, 'A + 6 should be 17');

    // A + 6 + 5 = 12 hard (Ace converts from 11 to 1)
    const hand2 = [{ rank: 'A' }, { rank: '6' }, { rank: '5' }];
    assert.strictEqual(calculateBlackjackHandValue(hand2), 12, 'A + 6 + 5 should convert Ace to 1, total 12');
  }, meta);

  test('TC-BJ-B02: Multiple Aces (A + A + 9 = 21, not 31)', () => {
    const hand = [{ rank: 'A' }, { rank: 'A' }, { rank: '9' }];
    assert.strictEqual(calculateBlackjackHandValue(hand), 21, 'A + A + 9 should count one Ace as 11, one Ace as 1');
  }, meta);

  test('TC-BJ-B03: Three Aces in hand (A + A + A = 13)', () => {
    const hand = [{ rank: 'A' }, { rank: 'A' }, { rank: 'A' }];
    assert.strictEqual(calculateBlackjackHandValue(hand), 13, 'A + A + A should be 11 + 1 + 1 = 13');
  }, meta);

  test('TC-BJ-B04: Double down draws exactly 1 card and doubles wager', () => {
    const result = playBlackjack({
      betAmount: 10,
      action: 'double',
      playerCardsOverride: [{ rank: '5' }, { rank: '6' }], // 11
      dealerCardsOverride: [{ rank: '7' }, { rank: '10' }], // 17
      extraPlayerCards: [{ rank: '9' }] // 11 + 9 = 20
    });

    assert.strictEqual(result.bet, 20.0, 'Total bet should double to 20.0');
    assert.strictEqual(result.playerTotal, 20, 'Player total should be 20');
    assert.strictEqual(result.outcome, 'win', 'Player 20 beats dealer 17');
    assert.strictEqual(result.payout, 40.0, 'Payout should be 20 * 2.0 = 40.0');
  }, meta);

  test('TC-BJ-B05: Double down with insufficient balance is rejected', () => {
    setBalance(15.00);
    // Bet 10, double requires 20, but balance is only 15
    const result = playBlackjack({
      betAmount: 10,
      action: 'double'
    });

    assert.strictEqual(result.success, false, 'Should reject double when balance < 2 * bet');
    assert.strictEqual(result.error, 'Insufficient balance', 'Error message matches');
  }, meta);
});
