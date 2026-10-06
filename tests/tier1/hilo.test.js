import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playHiLo, getHiLoHigherMultiplier, getHiLoLowerMultiplier } from '../helpers/game-engines/hilo-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Hi-Lo Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Hi-Lo' };

  test('TC-HILO-01: Starting card 7 guessing higher wins when next card is 9', () => {
    // 7 is value 7. Higher multiplier = 0.99 * (13 / 7) = 1.8385 -> 1.8386
    const mult = getHiLoHigherMultiplier(7);
    assert.approxEqual(mult, 1.8386, 0.001, 'Higher multiplier on 7 should be ~1.8386');

    const result = playHiLo({
      betAmount: 10,
      initialCard: { rank: '7', suit: '♠' },
      guesses: ['higher'],
      drawnCardsOverride: [{ rank: '9', suit: '♥' }]
    });

    assert.strictEqual(result.won, true, 'Guess higher (9 > 7) should win');
    assert.strictEqual(result.stepsCompleted, 1, 'Should complete 1 step');
    assert.approxEqual(result.multiplier, mult, 0.001, 'Multiplier should match formula');
    assert.approxEqual(result.payout, 10 * mult, 0.01, 'Payout should be 10 * mult');
  }, meta);

  test('TC-HILO-02: Starting card 7 guessing lower wins when next card is 4', () => {
    // Lower multiplier = 0.99 * (13 / 6) = 2.145
    const mult = getHiLoLowerMultiplier(7);
    assert.approxEqual(mult, 2.145, 0.001, 'Lower multiplier on 7 should be ~2.145');

    const result = playHiLo({
      betAmount: 10,
      initialCard: { rank: '7', suit: '♠' },
      guesses: ['lower'],
      drawnCardsOverride: [{ rank: '4', suit: '♦' }]
    });

    assert.strictEqual(result.won, true, 'Guess lower (4 < 7) should win');
    assert.approxEqual(result.multiplier, mult, 0.001, 'Multiplier should match');
  }, meta);

  test('TC-HILO-03: High card King (v=13) guessing lower has high win probability', () => {
    // Lower on K (13): 0.99 * (13 / 12) = 1.0725
    const mult = getHiLoLowerMultiplier(13);
    assert.approxEqual(mult, 1.0725, 0.001, 'Lower on King should be ~1.0725x');

    const result = playHiLo({
      betAmount: 20,
      initialCard: { rank: 'K', suit: '♠' },
      guesses: ['lower'],
      drawnCardsOverride: [{ rank: '10', suit: '♣' }]
    });

    assert.strictEqual(result.won, true, 'Lower on King when 10 hits should win');
    assert.approxEqual(result.payout, 20 * mult, 0.01, 'Payout should be 20 * mult');
  }, meta);

  test('TC-HILO-04: Multi-round streak compounds cumulative multiplier across 2 guesses', () => {
    const result = playHiLo({
      betAmount: 10,
      initialCard: { rank: '5', suit: '♠' }, // v=5
      guesses: ['higher', 'higher'], // from 5 -> 8 -> J
      drawnCardsOverride: [
        { rank: '8', suit: '♥' }, // v=8
        { rank: 'J', suit: '♦' }  // v=11
      ]
    });

    assert.strictEqual(result.won, true, 'Streak of 2 correct guesses should win');
    assert.strictEqual(result.stepsCompleted, 2, 'Should complete 2 steps');
    assert.ok(result.multiplier > 1.5, 'Cumulative multiplier should be compounded');
    assert.ok(result.payout > 15, 'Payout should reflect compound multiplier');
  }, meta);

  test('TC-HILO-05: Incorrect guess terminates streak with loss and zero payout', () => {
    const initialBal = getBalance();
    const result = playHiLo({
      betAmount: 15,
      initialCard: { rank: '5', suit: '♠' },
      guesses: ['higher'],
      drawnCardsOverride: [{ rank: '2', suit: '♣' }] // 2 is lower, so higher loses
    });

    assert.strictEqual(result.lost, true, 'Should be flagged as lost');
    assert.strictEqual(result.won, false, 'Won should be false');
    assert.strictEqual(result.payout, 0, 'Payout should be 0');
    assert.approxEqual(result.balanceAfter, initialBal - 15, 0.0001, 'Balance should reduce by 15');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'hilo', 'History game should be hilo');
    assert.strictEqual(history[0].profit, -15, 'History profit should be -15');
  }, meta);
});
