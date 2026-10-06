import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playVideoPoker, evaluatePokerHand, PAYTABLE } from '../helpers/game-engines/videopoker-engine.js';

describe('Tier 2: Video Poker Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Video Poker' };

  test('TC-POKER-B01: Ace-low straight (Wheel straight: A-2-3-4-5) evaluates as valid Straight', () => {
    const wheelStraight = [
      { rank: 'A', suit: '♠' },
      { rank: '2', suit: '♥' },
      { rank: '3', suit: '♦' },
      { rank: '4', suit: '♣' },
      { rank: '5', suit: '♠' }
    ];

    const result = evaluatePokerHand(wheelStraight);
    assert.strictEqual(result, PAYTABLE.STRAIGHT, 'A-2-3-4-5 must evaluate as Straight (4x)');
  }, meta);

  test('TC-POKER-B02: Ace-high straight (Broadway: 10-J-Q-K-A) evaluates as valid Straight', () => {
    const broadway = [
      { rank: '10', suit: '♠' },
      { rank: 'J', suit: '♥' },
      { rank: 'Q', suit: '♦' },
      { rank: 'K', suit: '♣' },
      { rank: 'A', suit: '♠' }
    ];

    const result = evaluatePokerHand(broadway);
    assert.strictEqual(result, PAYTABLE.STRAIGHT, '10-J-Q-K-A must evaluate as Straight (4x)');
  }, meta);

  test('TC-POKER-B03: Pair of 10s evaluates as Nothing (does not trigger Jacks or Better)', () => {
    const tens = [
      { rank: '10', suit: '♠' },
      { rank: '10', suit: '♥' },
      { rank: '2', suit: '♦' },
      { rank: '5', suit: '♣' },
      { rank: '8', suit: '♠' }
    ];

    const result = evaluatePokerHand(tens);
    assert.strictEqual(result, PAYTABLE.NONE, 'Pair of 10s is below Jacks threshold, should pay Nothing (0x)');
  }, meta);

  test('TC-POKER-B04: Hold all 5 cards retains original hand without modifications', () => {
    const original = [
      { rank: 'K', suit: '♠' },
      { rank: 'K', suit: '♥' },
      { rank: 'K', suit: '♦' },
      { rank: 'K', suit: '♣' },
      { rank: '2', suit: '♠' }
    ];

    const result = playVideoPoker({
      betAmount: 10,
      initialHand: original,
      holdMask: [true, true, true, true, true]
    });

    assert.strictEqual(result.multiplier, 25, 'Four of a Kind should be retained and pay 25x');
    assert.strictEqual(result.finalHand.length, 5, 'Final hand must contain 5 cards');
  }, meta);

  test('TC-POKER-B05: Hold 0 cards replaces all 5 cards from draw pool', () => {
    const junk = [
      { rank: '2', suit: '♠' },
      { rank: '4', suit: '♥' },
      { rank: '6', suit: '♦' },
      { rank: '8', suit: '♣' },
      { rank: '10', suit: '♠' }
    ];
    const replacements = [
      { rank: 'A', suit: '♠' },
      { rank: 'A', suit: '♥' },
      { rank: 'A', suit: '♦' },
      { rank: 'A', suit: '♣' },
      { rank: 'K', suit: '♠' }
    ];

    const result = playVideoPoker({
      betAmount: 10,
      initialHand: junk,
      holdMask: [false, false, false, false, false],
      replacementCards: replacements
    });

    assert.strictEqual(result.multiplier, 25, 'Replaced hand should form Four of a Kind (25x)');
  }, meta);
});
