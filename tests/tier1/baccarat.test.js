import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { playBaccarat } from '../helpers/game-engines/baccarat-engine.js';
import { getBalance, getHistory } from '../../src/utils/balance.js';

describe('Tier 1: Baccarat Feature Coverage', () => {
  const meta = { tier: 'Tier 1: Feature Coverage', game: 'Baccarat' };

  test('TC-BACCARAT-01: Player win (8 vs 6) pays 1:1 (2.0x total payout)', () => {
    const initialBal = getBalance();
    const result = playBaccarat({
      betAmount: 10,
      betType: 'player',
      playerCardsOverride: [{ rank: '8' }, { rank: 'K' }], // 8
      bankerCardsOverride: [{ rank: '6' }, { rank: '10' }]  // 6
    });

    assert.strictEqual(result.winner, 'player', 'Player should win');
    assert.strictEqual(result.won, true, 'Bet on player should win');
    assert.strictEqual(result.multiplier, 2.0, 'Multiplier should be 2.0x');
    assert.strictEqual(result.payout, 20.0, 'Payout should be 10 * 2.0 = 20.0');
    assert.strictEqual(result.profit, 10.0, 'Profit should be +10.0');
    assert.approxEqual(result.balanceAfter, initialBal + 10.0, 0.0001, 'Balance should increase by 10.0');
  }, meta);

  test('TC-BACCARAT-02: Banker win (7 vs 5) pays 1:1 minus 5% commission (1.95x payout)', () => {
    const result = playBaccarat({
      betAmount: 20,
      betType: 'banker',
      playerCardsOverride: [{ rank: '2' }, { rank: '3' }], // 5 (player draws)
      bankerCardsOverride: [{ rank: '3' }, { rank: '4' }], // 7 (banker stands)
      playerThirdCardOverride: { rank: 'K' } // player draws 0 -> total 5
    });

    assert.strictEqual(result.winner, 'banker', 'Banker should win (7 vs 5)');
    assert.strictEqual(result.won, true, 'Bet on banker should win');
    assert.strictEqual(result.multiplier, 1.95, 'Multiplier should be 1.95x');
    assert.strictEqual(result.payout, 39.0, 'Payout should be 20 * 1.95 = 39.0');
    assert.strictEqual(result.profit, 19.0, 'Profit should be +19.0');
  }, meta);

  test('TC-BACCARAT-03: Tie outcome (6 vs 6) pays 8:1 (9.0x total payout) on Tie bet', () => {
    const result = playBaccarat({
      betAmount: 10,
      betType: 'tie',
      playerCardsOverride: [{ rank: '6' }, { rank: '10' }], // 6
      bankerCardsOverride: [{ rank: '6' }, { rank: 'J' }]   // 6
    });

    assert.strictEqual(result.winner, 'tie', 'Result should be tie');
    assert.strictEqual(result.won, true, 'Tie bet should win');
    assert.strictEqual(result.multiplier, 9.0, 'Multiplier should be 9.0x');
    assert.strictEqual(result.payout, 90.0, 'Payout should be 10 * 9.0 = 90.0');
  }, meta);

  test('TC-BACCARAT-04: Tie outcome refunds Player and Banker bets (1.0x push)', () => {
    const initialBal = getBalance();
    const result = playBaccarat({
      betAmount: 15,
      betType: 'player',
      playerCardsOverride: [{ rank: '7' }, { rank: '10' }],
      bankerCardsOverride: [{ rank: '7' }, { rank: 'Q' }]
    });

    assert.strictEqual(result.winner, 'tie', 'Outcome is tie');
    assert.strictEqual(result.multiplier, 1.0, 'Player bet on tie pushes with 1.0x refund');
    assert.strictEqual(result.payout, 15.0, 'Payout equals bet amount');
    assert.strictEqual(result.profit, 0, 'Net profit is 0');
    assert.approxEqual(result.balanceAfter, initialBal, 0.0001, 'Balance unchanged');
  }, meta);

  test('TC-BACCARAT-05: Natural 9 ends round immediately without 3rd card draws', () => {
    const result = playBaccarat({
      betAmount: 10,
      betType: 'player',
      playerCardsOverride: [{ rank: '9' }, { rank: 'K' }], // 9 natural
      bankerCardsOverride: [{ rank: '4' }, { rank: '3' }]  // 7
    });

    assert.strictEqual(result.isNatural, true, 'Should be flagged as natural');
    assert.strictEqual(result.playerHand.length, 2, 'Player should draw no 3rd card');
    assert.strictEqual(result.bankerHand.length, 2, 'Banker should draw no 3rd card');

    const history = getHistory();
    assert.strictEqual(history[0].game, 'baccarat', 'History game should be baccarat');
  }, meta);
});
