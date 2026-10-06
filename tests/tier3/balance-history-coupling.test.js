import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { getBalance, setBalance, getHistory } from '../../src/utils/balance.js';
import {
  playCrash,
  playDice,
  playMines,
  playLimbo,
  playPlinko,
  playColorTrading,
  playTower,
  playHiLo,
  playWheel,
  playRoulette,
  playSlots,
  playBlackjack,
  playBaccarat,
  playVideoPoker,
  playKeno
} from '../helpers/game-engines/index.js';

describe('Tier 3: Balance & History Coupling', () => {
  const meta = { tier: 'Tier 3: Cross-Feature Combinations', game: 'Cross-Feature' };

  test('TC-XFEAT-01: Pairwise balance deduction -> win -> history coupling across all 15 games', () => {
    setBalance(500.0);
    const initialBal = getBalance();

    const games = [
      () => playCrash({ betAmount: 10, autoCashout: 2.0, crashPointOverride: 3.0 }),
      () => playDice({ betAmount: 10, target: 50, condition: 'over', rollOverride: 70 }),
      () => playMines({ betAmount: 10, minesCount: 3, tilePicks: [0], minesPositionsOverride: [10, 11, 12] }),
      () => playLimbo({ betAmount: 10, targetMultiplier: 2.0, floatOverride: 0.25 }),
      () => playPlinko({ betAmount: 10, rows: 8, risk: 'low', pathOverride: [0, 0, 0, 0, 0, 0, 0, 0] }),
      () => playColorTrading({ betAmount: 10, betSelection: { type: 'number', value: 5 }, resultNumberOverride: 5 }),
      () => playTower({ betAmount: 10, difficulty: 'easy', floorPicks: [0], towerOverride: [1] }),
      () => playHiLo({ betAmount: 10, initialCard: { rank: '7' }, guesses: ['higher'], drawnCardsOverride: [{ rank: '9' }] }),
      () => playWheel({ betAmount: 10, segments: 10, risk: 'low', segmentIndexOverride: 0 }),
      () => playRoulette({ bets: { num_17: 10 }, winningNumberOverride: 17 }),
      () => playSlots({ betAmount: 20, gridOverride: Array.from({ length: 5 }, () => ['💎', '💎', '💎']) }),
      () => playBlackjack({ betAmount: 10, playerCardsOverride: [{ rank: 'A' }, { rank: 'K' }], dealerCardsOverride: [{ rank: '10' }, { rank: '8' }] }),
      () => playBaccarat({ betAmount: 10, betType: 'player', playerCardsOverride: [{ rank: '9' }, { rank: 'K' }], bankerCardsOverride: [{ rank: '4' }, { rank: '3' }] }),
      () => playVideoPoker({ betAmount: 10, initialHand: [{ rank: '10', suit: '♠' }, { rank: 'J', suit: '♠' }, { rank: 'Q', suit: '♠' }, { rank: 'K', suit: '♠' }, { rank: 'A', suit: '♠' }], holdMask: [true, true, true, true, true] }),
      () => playKeno({ betAmount: 10, picks: [1, 2], drawnNumbersOverride: [1, 2, 10, 11, 12, 13, 14, 15, 16, 17] })
    ];

    let totalBets = 0;
    let totalPayouts = 0;

    for (const gameFn of games) {
      const res = gameFn();
      assert.strictEqual(res.success, true, 'Game should execute successfully');
      totalBets += res.bet;
      totalPayouts += res.payout;
    }

    const finalBal = getBalance();
    const expectedBal = parseFloat((initialBal - totalBets + totalPayouts).toFixed(8));
    assert.approxEqual(finalBal, expectedBal, 0.0001, 'Final balance must strictly obey: initial - bets + payouts');

    const history = getHistory();
    assert.strictEqual(history.length, 15, 'All 15 games must log a history entry');
  }, meta);

  test('TC-XFEAT-02: Strict history ring buffer capping at 100 entries', () => {
    setBalance(1000.0);
    // Play 110 rounds of Dice
    for (let i = 0; i < 110; i++) {
      playDice({
        betAmount: 1,
        target: 50,
        condition: 'over',
        rollOverride: 60
      });
    }

    const history = getHistory();
    assert.strictEqual(history.length, 100, 'History length must be strictly capped at 100 entries');
  }, meta);

  test('TC-XFEAT-03: Monotonic descending timestamps in history entries', () => {
    setBalance(100.0);
    for (let i = 0; i < 5; i++) {
      playLimbo({ betAmount: 1, targetMultiplier: 2.0, floatOverride: 0.25 });
    }

    const history = getHistory();
    for (let i = 0; i < history.length - 1; i++) {
      assert.ok(
        history[i].timestamp >= history[i + 1].timestamp,
        `History entry ${i} timestamp must be >= entry ${i + 1} timestamp`
      );
    }
  }, meta);

  test('TC-XFEAT-04: Profit identity (profit === payout - bet) invariant holds for all history entries', () => {
    setBalance(200.0);
    playCrash({ betAmount: 10, autoCashout: 2.0, crashPointOverride: 1.5 }); // loss
    playCrash({ betAmount: 10, autoCashout: 2.0, crashPointOverride: 2.5 }); // win
    playDice({ betAmount: 15, target: 50, condition: 'over', rollOverride: 75 }); // win
    playMines({ betAmount: 20, minesCount: 3, tilePicks: [0], minesPositionsOverride: [0] }); // loss

    const history = getHistory();
    for (const entry of history) {
      const calculatedProfit = parseFloat((entry.payout - entry.bet).toFixed(8));
      assert.strictEqual(entry.profit, calculatedProfit, 'History profit must equal payout - bet');
    }
  }, meta);

  test('TC-XFEAT-05: Multi-game balance precision under fractional satoshi wagers', () => {
    setBalance(0.00010000);
    const initialBal = getBalance();

    const r1 = playLimbo({ betAmount: 0.00000010, targetMultiplier: 2.0, floatOverride: 0.25 });
    const r2 = playDice({ betAmount: 0.00000020, target: 50, condition: 'over', rollOverride: 70 });

    const totalNetProfit = r1.profit + r2.profit;
    assert.approxEqual(getBalance(), initialBal + totalNetProfit, 0.000000001, 'Satoshi precision must be preserved');
  }, meta);
});
