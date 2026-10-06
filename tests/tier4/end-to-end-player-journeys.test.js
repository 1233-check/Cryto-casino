import { describe, test } from '../helpers/test-harness.js';
import { assert } from '../helpers/assert.js';
import { getBalance, setBalance, getHistory } from '../../src/utils/balance.js';
import {
  playCrash,
  playSlots,
  playRoulette,
  playBlackjack,
  playBaccarat,
  playVideoPoker,
  playKeno,
  playPlinko,
  playMines
} from '../helpers/game-engines/index.js';
import { generateServerSeed, hashSeed, getCrashPoint } from '../../src/utils/provablyFair.js';

describe('Tier 4: End-to-End Real-World Player Journeys', () => {
  const meta = { tier: 'Tier 4: Real-World Scenarios', game: 'Player-Journeys' };

  test('TC-JOURNEY-01: Full casino player onboarding journey with deposit and multi-game session', () => {
    // 1. Initial Deposit of 1.00000000 BTC
    setBalance(1.00000000);
    assert.strictEqual(getBalance(), 1.0, 'Wallet initialized with 1.0 BTC');

    // 2. Play Slots trial (spin with 20 paylines)
    const slotRes = playSlots({ betAmount: 0.00020000 });
    assert.strictEqual(slotRes.success, true, 'Slots play executed');

    // 3. Play Blackjack hand
    const bjRes = playBlackjack({
      betAmount: 0.01000000,
      playerCardsOverride: [{ rank: '10' }, { rank: 'A' }], // Natural 21
      dealerCardsOverride: [{ rank: '10' }, { rank: '7' }]
    });
    assert.strictEqual(bjRes.outcome, 'blackjack', 'Player hits natural blackjack');

    // 4. Play Roulette on outside red
    const rltRes = playRoulette({
      bets: { color_red: 0.00500000 },
      winningNumberOverride: 1 // red
    });
    assert.strictEqual(rltRes.won, true, 'Roulette red wins');

    // 5. Cashout on Crash at 2.0x
    const crashRes = playCrash({
      betAmount: 0.01000000,
      autoCashout: 2.0,
      crashPointOverride: 3.5
    });
    assert.strictEqual(crashRes.won, true, 'Crash cashout succeeds');

    // 6. Verify full transaction history audit trail
    const history = getHistory();
    assert.strictEqual(history.length, 4, 'All 4 games logged in history');
    assert.strictEqual(history[0].game, 'crash', 'Most recent game is crash');
    assert.strictEqual(history[1].game, 'roulette', 'Second game is roulette');
    assert.strictEqual(history[2].game, 'blackjack', 'Third game is blackjack');
    assert.strictEqual(history[3].game, 'slots', 'Fourth game is slots');
  }, meta);

  test('TC-JOURNEY-02: High-roller VIP journey across high-limit tables', () => {
    setBalance(100.0);

    // Max bet on Baccarat Banker
    const baccRes = playBaccarat({
      betAmount: 25.0,
      betType: 'banker',
      playerCardsOverride: [{ rank: '2' }, { rank: '2' }], // 4
      bankerCardsOverride: [{ rank: '9' }, { rank: 'K' }]  // 9
    });
    assert.strictEqual(baccRes.won, true, 'VIP Banker bet wins');

    // Max bet on Video Poker
    const pokerRes = playVideoPoker({
      betAmount: 10.0,
      initialHand: [
        { rank: '10', suit: '♠' },
        { rank: 'J', suit: '♠' },
        { rank: 'Q', suit: '♠' },
        { rank: 'K', suit: '♠' },
        { rank: 'A', suit: '♠' }
      ],
      holdMask: [true, true, true, true, true]
    });
    assert.strictEqual(pokerRes.multiplier, 800, 'Royal Flush pays 800x');
    assert.strictEqual(pokerRes.payout, 8000.0, 'VIP payout equals 8000.0');
  }, meta);

  test('TC-JOURNEY-03: Micro-stakes satoshi grinder journey (0.00000010 BTC)', () => {
    setBalance(0.00010000);
    const microBet = 0.00000010;

    // Keno micro-bet
    const kenoRes = playKeno({
      betAmount: microBet,
      picks: [5],
      drawnNumbersOverride: [5, 10, 15, 20, 25, 30, 35, 40, 1, 2]
    });
    assert.strictEqual(kenoRes.won, true, 'Keno micro bet wins');

    // Plinko micro-bet
    const plinkoRes = playPlinko({
      betAmount: microBet,
      rows: 8,
      risk: 'low',
      pathOverride: [0, 0, 0, 0, 0, 0, 0, 0] // 5.6x
    });
    assert.strictEqual(plinkoRes.won, true, 'Plinko micro bet wins');

    // Mines micro-bet
    const minesRes = playMines({
      betAmount: microBet,
      minesCount: 1,
      tilePicks: [0],
      minesPositionsOverride: [24]
    });
    assert.strictEqual(minesRes.won, true, 'Mines micro bet wins');

    assert.ok(getBalance() > 0.00010000, 'Micro-stakes grinder profit accumulated');
  }, meta);

  test('TC-JOURNEY-04: Multi-hand Blackjack session applying Basic Strategy', () => {
    setBalance(200.0);

    // Hand 1: Hard 18 stands against dealer 17 -> win
    const h1 = playBlackjack({
      betAmount: 10,
      playerCardsOverride: [{ rank: '10' }, { rank: '8' }],
      dealerCardsOverride: [{ rank: '10' }, { rank: '7' }],
      action: 'stand'
    });
    assert.strictEqual(h1.outcome, 'win', 'Hand 1 wins');

    // Hand 2: 11 doubles down against dealer 6 -> win
    const h2 = playBlackjack({
      betAmount: 10,
      playerCardsOverride: [{ rank: '5' }, { rank: '6' }], // 11
      dealerCardsOverride: [{ rank: '6' }, { rank: '10' }], // 16
      action: 'double',
      extraPlayerCards: [{ rank: '9' }], // 20
      extraDealerCards: [{ rank: '8' }]  // 24 bust
    });
    assert.strictEqual(h2.outcome, 'win_dealer_bust', 'Hand 2 double wins');

    // Hand 3: Stiff 12 hits against dealer 10 -> catches 9 = 21 -> win
    const h3 = playBlackjack({
      betAmount: 10,
      playerCardsOverride: [{ rank: '10' }, { rank: '2' }], // 12
      dealerCardsOverride: [{ rank: '10' }, { rank: '9' }], // 19
      action: 'hit',
      extraPlayerCards: [{ rank: '9' }] // 21
    });
    assert.strictEqual(h3.outcome, 'win', 'Hand 3 hit to 21 wins');
  }, meta);

  test('TC-JOURNEY-05: Post-game provably fair audit verification pipeline', async () => {
    // 1. Casino generates and publishes seed hash
    const serverSeed = generateServerSeed();
    const publishedHash = await hashSeed(serverSeed);

    // 2. Player supplies client seed
    const clientSeed = 'verified-player-client-seed';

    // 3. Round is executed
    const crashMultiplier = getCrashPoint(serverSeed, clientSeed);

    // 4. Post-game audit: reveal server seed, check hash matches
    const auditedHash = await hashSeed(serverSeed);
    assert.strictEqual(auditedHash, publishedHash, 'Revealed seed hash must match published commitment');

    // 5. Recompute crash multiplier independently
    const auditedMultiplier = getCrashPoint(serverSeed, clientSeed);
    assert.strictEqual(auditedMultiplier, crashMultiplier, 'Audited multiplier must match round outcome');
  }, meta);
});
