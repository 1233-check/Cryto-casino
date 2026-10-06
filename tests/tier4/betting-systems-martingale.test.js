import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { getBalance, setBalance } from '../../src/utils/balance.js';
import { playDice, playRoulette, playBaccarat } from '../helpers/game-engines/index.js';

describe('Tier 4: Realistic Betting Strategies Simulation', () => {
  const meta = { tier: 'Tier 4: Real-World Scenarios', game: 'Betting-Systems' };

  test('TC-BETSYS-01: Classic Martingale progression (double on loss, reset on win)', () => {
    setBalance(500.0);
    const baseBet = 5.0;
    let currentBet = baseBet;

    // Sequence of outcomes: Loss, Loss, Win
    // R1: Bet 5, loses (balance = 495, nextBet = 10)
    const r1 = playDice({ betAmount: currentBet, target: 50.0, condition: 'over', rollOverride: 30.0 });
    assert.strictEqual(r1.won, false, 'Round 1 should lose');
    currentBet *= 2;

    // R2: Bet 10, loses (balance = 485, nextBet = 20)
    const r2 = playDice({ betAmount: currentBet, target: 50.0, condition: 'over', rollOverride: 20.0 });
    assert.strictEqual(r2.won, false, 'Round 2 should lose');
    currentBet *= 2;

    // R3: Bet 20, wins at 1.98x (payout = 39.60, profit = +19.60)
    const r3 = playDice({ betAmount: currentBet, target: 50.0, condition: 'over', rollOverride: 75.0 });
    assert.strictEqual(r3.won, true, 'Round 3 should win');
    currentBet = baseBet;

    assert.strictEqual(currentBet, baseBet, 'Bet size resets to base after win');
    // Total spent: 5 + 10 + 20 = 35. Total return: 39.60. Net profit: +4.60.
    assert.approxEqual(getBalance(), 500.0 + 4.60, 0.001, 'Net Martingale profit should be +4.60');
  }, meta);

  test('TC-BETSYS-02: Martingale stop-loss when loss streak exhausts bankroll', () => {
    setBalance(30.0);
    let currentBet = 10.0;

    // R1: Bet 10 (balance 20)
    playDice({ betAmount: currentBet, target: 50, condition: 'over', rollOverride: 10 });
    currentBet *= 2; // 20

    // R2: Bet 20 (balance 0)
    playDice({ betAmount: currentBet, target: 50, condition: 'over', rollOverride: 10 });
    currentBet *= 2; // 40

    // R3: Next bet (40) exceeds remaining balance (0)
    const r3 = playDice({ betAmount: currentBet });
    assert.strictEqual(r3.success, false, 'Stop loss triggered: insufficient balance');
    assert.strictEqual(getBalance(), 0, 'Bankroll is exhausted');
  }, meta);

  test('TC-BETSYS-03: D\'Alembert system (+1 on loss, -1 on win) in Roulette', () => {
    setBalance(500.0);
    const unit = 2.0;
    let bet = 10.0;

    // Round 1: Bet 10 on Red, Black hits (lose) -> next bet = 12
    const r1 = playRoulette({ bets: { color_red: bet }, winningNumberOverride: 2 }); // 2 is black
    assert.strictEqual(r1.won, false, 'R1 loses');
    bet += unit;
    assert.strictEqual(bet, 12.0, 'Bet increases by 1 unit after loss');

    // Round 2: Bet 12 on Red, Red hits (win) -> next bet = 10
    const r2 = playRoulette({ bets: { color_red: bet }, winningNumberOverride: 1 }); // 1 is red
    assert.strictEqual(r2.won, true, 'R2 wins');
    bet = Math.max(unit, bet - unit);
    assert.strictEqual(bet, 10.0, 'Bet decreases by 1 unit after win');
  }, meta);

  test('TC-BETSYS-04: Paroli (Reverse Martingale) system (double on win up to 3 wins)', () => {
    setBalance(500.0);
    const baseBet = 5.0;
    let bet = baseBet;
    let streak = 0;

    // Win 1: Bet 5 (pays 10) -> streak 1, next bet 10
    const r1 = playBaccarat({ betAmount: bet, betType: 'player', playerCardsOverride: [{ rank: '9' }], bankerCardsOverride: [{ rank: '1' }] });
    assert.strictEqual(r1.won, true, 'Win 1');
    streak++;
    bet *= 2;

    // Win 2: Bet 10 (pays 20) -> streak 2, next bet 20
    const r2 = playBaccarat({ betAmount: bet, betType: 'player', playerCardsOverride: [{ rank: '9' }], bankerCardsOverride: [{ rank: '1' }] });
    assert.strictEqual(r2.won, true, 'Win 2');
    streak++;
    bet *= 2;

    // Win 3: Bet 20 (pays 40) -> streak 3, reset to base bet
    const r3 = playBaccarat({ betAmount: bet, betType: 'player', playerCardsOverride: [{ rank: '9' }], bankerCardsOverride: [{ rank: '1' }] });
    assert.strictEqual(r3.won, true, 'Win 3');
    streak = 0;
    bet = baseBet;

    assert.strictEqual(bet, baseBet, 'After 3 consecutive wins, Paroli resets to base bet');
    assert.ok(getBalance() > 500.0, 'Paroli streak yields high net profit');
  }, meta);

  test('TC-BETSYS-05: Dynamic bankroll sizing (betting fixed 2% of current balance)', () => {
    setBalance(100.0);
    for (let round = 1; round <= 5; round++) {
      const currentBal = getBalance();
      const betAmount = parseFloat((currentBal * 0.02).toFixed(4));
      assert.ok(betAmount > 0, 'Bet amount must be positive');

      playDice({
        betAmount,
        target: 50.0,
        condition: 'over',
        rollOverride: 60.0 // win
      });
    }

    assert.ok(getBalance() > 100.0, 'Compounded 2% stake bankroll should grow over winning rounds');
  }, meta);
});
