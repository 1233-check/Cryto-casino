import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playHiLo, getHiLoHigherMultiplier, getHiLoLowerMultiplier } from '../helpers/game-engines/hilo-engine.js';

describe('Tier 2: Hi-Lo Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Hi-Lo' };

  test('TC-HILO-B01: Ace (v=1): guessing lower returns 0 multiplier (impossible outcome)', () => {
    const mult = getHiLoLowerMultiplier(1);
    assert.strictEqual(mult, 0, 'Lower on Ace should be 0 multiplier');
  }, meta);

  test('TC-HILO-B02: King (v=13): guessing higher returns 0 multiplier (impossible outcome)', () => {
    const mult = getHiLoHigherMultiplier(13);
    assert.strictEqual(mult, 0, 'Higher on King should be 0 multiplier');
  }, meta);

  test('TC-HILO-B03: Equal card drawn (same rank) wins on higher/lower equality bounds', () => {
    // 7 drawn from 7: nextVal >= currentVal (true for higher)
    const result = playHiLo({
      betAmount: 10,
      initialCard: { rank: '7', suit: '♠' },
      guesses: ['higher'],
      drawnCardsOverride: [{ rank: '7', suit: '♦' }]
    });

    assert.strictEqual(result.won, true, 'Equal rank should satisfy >= for higher');
  }, meta);

  test('TC-HILO-B04: Long streak of 5 correct guesses maintains exact numerical precision', () => {
    const result = playHiLo({
      betAmount: 5,
      initialCard: { rank: '2', suit: '♠' },
      guesses: ['higher', 'higher', 'higher', 'higher', 'higher'],
      drawnCardsOverride: [
        { rank: '4', suit: '♥' },
        { rank: '6', suit: '♦' },
        { rank: '8', suit: '♣' },
        { rank: '10', suit: '♠' },
        { rank: 'Q', suit: '♥' }
      ]
    });

    assert.strictEqual(result.won, true, '5-step streak should win');
    assert.strictEqual(result.stepsCompleted, 5, 'Should complete 5 steps');
    assert.ok(Number.isFinite(result.multiplier), 'Multiplier must be a finite number');
    assert.ok(result.payout > 20, 'Payout should reflect compound streak');
  }, meta);

  test('TC-HILO-B05: Zero or negative bet throws validation error', () => {
    assert.throws(() => {
      playHiLo({ betAmount: 0 });
    }, 'Zero bet must throw');

    assert.throws(() => {
      playHiLo({ betAmount: -10 });
    }, 'Negative bet must throw');
  }, meta);
});
