import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playBaccarat, calculateBaccaratHandValue } from '../helpers/game-engines/baccarat-engine.js';

describe('Tier 2: Baccarat Boundary & Corner Cases', () => {
  const meta = { tier: 'Tier 2: Boundary & Corner Cases', game: 'Baccarat' };

  test('TC-BACCARAT-B01: Face cards and 10s have 0 value (10 + J + Q = 0 baccarat)', () => {
    const hand = [{ rank: '10' }, { rank: 'J' }, { rank: 'Q' }];
    assert.strictEqual(calculateBaccaratHandValue(hand), 0, '10 + J + Q should evaluate to 0');
  }, meta);

  test('TC-BACCARAT-B02: Both hands natural 8 or 9 ends round without 3rd card draws', () => {
    const result = playBaccarat({
      betAmount: 10,
      betType: 'player',
      playerCardsOverride: [{ rank: '8' }, { rank: '10' }], // 8
      bankerCardsOverride: [{ rank: '9' }, { rank: 'K' }]   // 9
    });

    assert.strictEqual(result.isNatural, true, 'Should be natural');
    assert.strictEqual(result.playerHand.length, 2, 'Player length must be 2');
    assert.strictEqual(result.bankerHand.length, 2, 'Banker length must be 2');
    assert.strictEqual(result.winner, 'banker', 'Banker 9 beats Player 8');
  }, meta);

  test('TC-BACCARAT-B03: Player stands on 6 or 7; Banker on 5 must draw 3rd card', () => {
    const result = playBaccarat({
      betAmount: 10,
      betType: 'banker',
      playerCardsOverride: [{ rank: '6' }, { rank: 'K' }], // 6 stands
      bankerCardsOverride: [{ rank: '5' }, { rank: '10' }], // 5 draws
      bankerThirdCardOverride: { rank: '3' } // 5 + 3 = 8
    });

    assert.strictEqual(result.playerHand.length, 2, 'Player should stand on 6');
    assert.strictEqual(result.bankerHand.length, 3, 'Banker should draw on 5');
    assert.strictEqual(result.bVal, 8, 'Banker should reach 8');
    assert.strictEqual(result.winner, 'banker', 'Banker should win (8 vs 6)');
  }, meta);

  test('TC-BACCARAT-B04: Banker 6 draws if Player 3rd card is 6/7, stands if 8', () => {
    // Player 3rd card is 6: Banker with 6 draws
    const drawRes = playBaccarat({
      betAmount: 10,
      betType: 'banker',
      playerCardsOverride: [{ rank: '3' }, { rank: '2' }], // 5 draws
      bankerCardsOverride: [{ rank: '6' }, { rank: 'K' }], // 6
      playerThirdCardOverride: { rank: '6' }, // 3rd card is 6
      bankerThirdCardOverride: { rank: '2' }
    });
    assert.strictEqual(drawRes.bankerHand.length, 3, 'Banker with 6 should draw when Player draws 6');

    // Player 3rd card is 8: Banker with 6 stands
    const standRes = playBaccarat({
      betAmount: 10,
      betType: 'banker',
      playerCardsOverride: [{ rank: '3' }, { rank: '2' }], // 5 draws
      bankerCardsOverride: [{ rank: '6' }, { rank: 'K' }], // 6
      playerThirdCardOverride: { rank: '8' } // 3rd card is 8
    });
    assert.strictEqual(standRes.bankerHand.length, 2, 'Banker with 6 should stand when Player draws 8');
  }, meta);

  test('TC-BACCARAT-B05: Banker win commission calculation (100 bet -> 195 payout)', () => {
    const result = playBaccarat({
      betAmount: 100,
      betType: 'banker',
      playerCardsOverride: [{ rank: '2' }, { rank: '2' }], // 4
      bankerCardsOverride: [{ rank: '9' }, { rank: '10' }] // 9 natural
    });

    assert.strictEqual(result.winner, 'banker', 'Banker should win');
    assert.strictEqual(result.multiplier, 1.95, 'Multiplier must be 1.95x');
    assert.strictEqual(result.payout, 195.0, 'Payout must be 195.0');
    assert.strictEqual(result.profit, 95.0, 'Net profit must be 95.0');
  }, meta);
});
