import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playVideoPoker, evaluatePokerHand, PAYTABLE } from '../helpers/game-engines/videopoker-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Video Poker Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Video Poker' };

  test('TC-POKER-01: Royal Flush evaluates to 800x multiplier', () => {
    const hand = [
      { rank: '10', suit: '♠' },
      { rank: 'J', suit: '♠' },
      { rank: 'Q', suit: '♠' },
      { rank: 'K', suit: '♠' },
      { rank: 'A', suit: '♠' }
    ];
    const evaluated = evaluatePokerHand(hand);
    assert.strictEqual(evaluated, PAYTABLE.ROYAL_FLUSH, 'Should evaluate to Royal Flush');

    const result = playVideoPoker({
      betAmount: 5,
      initialHand: hand,
      holdMask: [true, true, true, true, true]
    });

    assert.strictEqual(result.won, true, 'Royal flush should win');
    assert.strictEqual(result.multiplier, 800, 'Multiplier should be 800x');
    assert.strictEqual(result.payout, 4000.0, 'Payout should be 5 * 800 = 4000.0');
  }, meta);

  test('TC-POKER-02: Full House evaluates to 9x multiplier', () => {
    const hand = [
      { rank: 'K', suit: '♠' },
      { rank: 'K', suit: '♥' },
      { rank: 'K', suit: '♦' },
      { rank: '8', suit: '♣' },
      { rank: '8', suit: '♠' }
    ];
    const evaluated = evaluatePokerHand(hand);
    assert.strictEqual(evaluated, PAYTABLE.FULL_HOUSE, 'Should evaluate to Full House');

    const result = playVideoPoker({
      betAmount: 10,
      initialHand: hand,
      holdMask: [true, true, true, true, true]
    });

    assert.strictEqual(result.multiplier, 9, 'Multiplier should be 9x');
    assert.strictEqual(result.payout, 90.0, 'Payout should be 90.0');
  }, meta);

  test('TC-POKER-03: Flush evaluates to 6x multiplier', () => {
    const hand = [
      { rank: '2', suit: '♥' },
      { rank: '5', suit: '♥' },
      { rank: '8', suit: '♥' },
      { rank: 'J', suit: '♥' },
      { rank: 'K', suit: '♥' }
    ];
    const evaluated = evaluatePokerHand(hand);
    assert.strictEqual(evaluated, PAYTABLE.FLUSH, 'Should evaluate to Flush');

    const result = playVideoPoker({
      betAmount: 10,
      initialHand: hand,
      holdMask: [true, true, true, true, true]
    });

    assert.strictEqual(result.multiplier, 6, 'Multiplier should be 6x');
    assert.strictEqual(result.payout, 60.0, 'Payout should be 60.0');
  }, meta);

  test('TC-POKER-04: Jacks or Better (pair of Kings) evaluates to 1x multiplier', () => {
    const hand = [
      { rank: 'K', suit: '♠' },
      { rank: 'K', suit: '♦' },
      { rank: '4', suit: '♣' },
      { rank: '7', suit: '♥' },
      { rank: '9', suit: '♠' }
    ];
    const evaluated = evaluatePokerHand(hand);
    assert.strictEqual(evaluated, PAYTABLE.JACKS_OR_BETTER, 'Should evaluate to Jacks or Better');

    const result = playVideoPoker({
      betAmount: 15,
      initialHand: hand,
      holdMask: [true, true, true, true, true]
    });

    assert.strictEqual(result.multiplier, 1, 'Multiplier should be 1x');
    assert.strictEqual(result.payout, 15.0, 'Payout should be 15.0');
  }, meta);

  test('TC-POKER-05: Low pair (pair of 8s) evaluates to Nothing and zero payout', () => {
    const initialBal = getBalance();
    const hand = [
      { rank: '8', suit: '♠' },
      { rank: '8', suit: '♦' },
      { rank: '2', suit: '♣' },
      { rank: '5', suit: '♥' },
      { rank: '9', suit: '♠' }
    ];
    const evaluated = evaluatePokerHand(hand);
    assert.strictEqual(evaluated, PAYTABLE.NONE, 'Should evaluate to Nothing');

    const result = playVideoPoker({
      betAmount: 10,
      initialHand: hand,
      holdMask: [true, true, true, true, true]
    });

    assert.strictEqual(result.won, false, 'Should lose');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.approxEqual(result.balanceAfter, initialBal - 10, 0.0001, 'Balance should reduce by 10');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'videopoker', 'History game should be videopoker');
  }, meta);
});
