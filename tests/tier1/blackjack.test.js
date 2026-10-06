import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playBlackjack, calculateBlackjackHandValue } from '../helpers/game-engines/blackjack-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Blackjack Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Blackjack' };

  test('TC-BJ-01: Natural Blackjack pays 3:2 (2.5x total payout)', () => {
    const initialBal = getBalance();
    const result = playBlackjack({
      betAmount: 10,
      playerCardsOverride: [{ rank: 'A', suit: '♠' }, { rank: 'K', suit: '♦' }],
      dealerCardsOverride: [{ rank: '10', suit: '♣' }, { rank: '8', suit: '♥' }]
    });

    assert.strictEqual(result.outcome, 'blackjack', 'Outcome should be blackjack');
    assert.strictEqual(result.multiplier, 2.5, 'Multiplier should be 2.5x');
    assert.strictEqual(result.payout, 25.0, 'Payout should be 10 * 2.5 = 25.0');
    assert.strictEqual(result.profit, 15.0, 'Profit should be +15.0 (3:2 return)');
    assert.approxEqual(result.balanceAfter, initialBal + 15.0, 0.0001, 'Balance should increase by 15.0');
  }, meta);

  test('TC-BJ-02: Player 20 beats Dealer 18 pays 1:1 (2.0x total payout)', () => {
    const result = playBlackjack({
      betAmount: 20,
      playerCardsOverride: [{ rank: '10', suit: '♠' }, { rank: '10', suit: '♦' }],
      dealerCardsOverride: [{ rank: '10', suit: '♣' }, { rank: '8', suit: '♥' }]
    });

    assert.strictEqual(result.outcome, 'win', 'Player should win');
    assert.strictEqual(result.multiplier, 2.0, 'Multiplier should be 2.0x');
    assert.strictEqual(result.payout, 40.0, 'Payout should be 20 * 2 = 40.0');
    assert.strictEqual(result.profit, 20.0, 'Profit should be +20.0');
  }, meta);

  test('TC-BJ-03: Player bust (>21) results in immediate loss', () => {
    const initialBal = getBalance();
    const result = playBlackjack({
      betAmount: 15,
      playerCardsOverride: [{ rank: '10', suit: '♠' }, { rank: '6', suit: '♦' }],
      dealerCardsOverride: [{ rank: '10', suit: '♣' }, { rank: '7', suit: '♥' }],
      action: 'hit',
      extraPlayerCards: [{ rank: '8', suit: '♠' }] // 10 + 6 + 8 = 24 bust
    });

    assert.strictEqual(result.outcome, 'bust', 'Player should bust');
    assert.strictEqual(result.won, false, 'Player loses');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.strictEqual(result.profit, -15.0, 'Profit should be -15.0');
    assert.approxEqual(result.balanceAfter, initialBal - 15.0, 0.0001, 'Balance should reduce by 15.0');
  }, meta);

  test('TC-BJ-04: Dealer bust (>21) pays player 1:1', () => {
    const result = playBlackjack({
      betAmount: 10,
      playerCardsOverride: [{ rank: '10', suit: '♠' }, { rank: '7', suit: '♦' }], // 17
      dealerCardsOverride: [{ rank: '10', suit: '♣' }, { rank: '6', suit: '♥' }], // 16
      extraDealerCards: [{ rank: '8', suit: '♦' }] // 16 + 8 = 24 dealer bust
    });

    assert.strictEqual(result.outcome, 'win_dealer_bust', 'Dealer should bust');
    assert.strictEqual(result.won, true, 'Player should win');
    assert.strictEqual(result.payout, 20.0, 'Payout should be 20.0');
  }, meta);

  test('TC-BJ-05: Push condition (19 === 19) refunds original bet (1.0x payout)', () => {
    const initialBal = getBalance();
    const result = playBlackjack({
      betAmount: 25,
      playerCardsOverride: [{ rank: '10', suit: '♠' }, { rank: '9', suit: '♦' }],
      dealerCardsOverride: [{ rank: 'K', suit: '♣' }, { rank: '9', suit: '♥' }]
    });

    assert.strictEqual(result.outcome, 'push', 'Should be a push');
    assert.strictEqual(result.multiplier, 1.0, 'Push pays 1.0x (refund)');
    assert.strictEqual(result.payout, 25.0, 'Payout should equal bet');
    assert.strictEqual(result.profit, 0, 'Profit should be 0');
    assert.approxEqual(result.balanceAfter, initialBal, 0.0001, 'Balance should remain unchanged');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'blackjack', 'History game should be blackjack');
    assert.strictEqual(history[0].details.outcome, 'push', 'Details should log push');
  }, meta);
});
