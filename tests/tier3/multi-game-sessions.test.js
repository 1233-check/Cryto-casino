import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { getBalance, setBalance } from '../../src/utils/balance.js';
import {
  playCrash,
  playSlots,
  playRoulette,
  playDice,
  playMines,
  playLimbo,
  playPlinko,
  playBlackjack,
  playBaccarat
} from '../helpers/game-engines/index.js';

describe('Tier 3: Multi-Game Sessions & State Continuity', () => {
  const meta = { tier: 'Tier 3: Cross-Feature Combinations', game: 'Multi-Game' };

  test('TC-XFEAT-06: Continuous multi-game player session without state leakage', () => {
    setBalance(100.0);
    // 1. Play Crash
    const r1 = playCrash({ betAmount: 10, autoCashout: 1.5, crashPointOverride: 2.0 }); // win 15
    assert.strictEqual(r1.won, true, 'Crash step should win');

    // 2. Play Plinko with winnings
    const r2 = playPlinko({ betAmount: 15, rows: 8, risk: 'low', pathOverride: [0, 0, 0, 0, 0, 0, 0, 0] }); // win 84
    assert.strictEqual(r2.won, true, 'Plinko step should win');

    // 3. Play Blackjack with house edge
    const r3 = playBlackjack({
      betAmount: 20,
      playerCardsOverride: [{ rank: '10' }, { rank: '8' }], // 18
      dealerCardsOverride: [{ rank: '10' }, { rank: '9' }]  // 19 lose
    });
    assert.strictEqual(r3.won, false, 'Blackjack step should lose');

    // 4. Play Baccarat
    const r4 = playBaccarat({
      betAmount: 10,
      betType: 'player',
      playerCardsOverride: [{ rank: '9' }, { rank: 'K' }], // 9 natural
      bankerCardsOverride: [{ rank: '7' }, { rank: 'K' }]  // 7 win 20
    });
    assert.strictEqual(r4.won, true, 'Baccarat step should win');

    const expectedBal = 100.0 + r1.profit + r2.profit + r3.profit + r4.profit;
    assert.approxEqual(getBalance(), expectedBal, 0.0001, 'Balance after multi-game session should match sum of profits');
  }, meta);

  test('TC-XFEAT-07: Drawdown and recovery sequence across volatile titles', () => {
    setBalance(50.0);
    const r1 = playSlots({ betAmount: 20, gridOverride: [
      ['🍒', '💎', '🍉'],
      ['🍇', '💎', '🍋'],
      ['⭐', '⭐', '🔔'],
      ['🍒', '⭐', '🍊'],
      ['🍋', '⭐', '🍇']
    ]});
    assert.strictEqual(r1.won, false, 'Slots should lose');
    assert.strictEqual(getBalance(), 30.0, 'Balance down to 30.0');

    // Loss on Roulette
    const r2 = playRoulette({ bets: { num_5: 20 }, winningNumberOverride: 10 });
    assert.strictEqual(r2.won, false, 'Roulette should lose');
    assert.strictEqual(getBalance(), 10.0, 'Balance down to 10.0');

    // Recovery on Mines
    const r3 = playMines({ betAmount: 10, minesCount: 3, tilePicks: [0, 1, 2], minesPositionsOverride: [10, 11, 12] });
    assert.strictEqual(r3.won, true, 'Mines should win');
    assert.ok(getBalance() > 10.0, 'Balance recovered');
  }, meta);

  test('TC-XFEAT-08: Complete balance depletion stops subsequent betting across all games', () => {
    setBalance(10.0);
    // Bet all 10 on Dice and lose
    playDice({ betAmount: 10.0, target: 50, condition: 'over', rollOverride: 20 });
    assert.strictEqual(getBalance(), 0.0, 'Balance must be 0');

    // Try playing other games - all should return insufficient balance
    const crashRes = playCrash({ betAmount: 1 });
    assert.strictEqual(crashRes.success, false, 'Crash should fail with 0 balance');

    const limboRes = playLimbo({ betAmount: 1 });
    assert.strictEqual(limboRes.success, false, 'Limbo should fail with 0 balance');

    const plinkoRes = playPlinko({ betAmount: 1 });
    assert.strictEqual(plinkoRes.success, false, 'Plinko should fail with 0 balance');
  }, meta);

  test('TC-XFEAT-09: Profit tracking with low vs high volatility configurations', () => {
    setBalance(100.0);
    // Low vol: Plinko 8 low risk (center pays 0.5x, -5 profit)
    const lowVol = playPlinko({ betAmount: 10, rows: 8, risk: 'low', pathOverride: [0, 0, 0, 0, 1, 1, 1, 1] });
    assert.strictEqual(lowVol.profit, -5.0, 'Plinko low vol loss should be -5.0');

    // High vol: Limbo 100x hit (pays 1000, +990 profit)
    const highVol = playLimbo({ betAmount: 10, targetMultiplier: 100.0, floatOverride: 0.005 });
    assert.strictEqual(highVol.profit, 990.0, 'Limbo high vol profit should be +990.0');
  }, meta);

  test('TC-XFEAT-10: History entry metadata isolation between game instances', () => {
    setBalance(100.0);
    const crashRes = playCrash({ betAmount: 10, autoCashout: 2.0, crashPointOverride: 3.0 });
    const diceRes = playDice({ betAmount: 10, target: 40, condition: 'over', rollOverride: 50 });

    assert.ok(crashRes.crashPoint !== undefined, 'Crash result has crashPoint');
    assert.ok(diceRes.roll !== undefined, 'Dice result has roll');
    assert.strictEqual(diceRes.crashPoint, undefined, 'Dice result must not contain crashPoint');
  }, meta);
});
