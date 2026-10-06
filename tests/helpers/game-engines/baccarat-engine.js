import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';

export function getBaccaratCardValue(rank) {
  if (rank === 'A') return 1;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank);
}

export function calculateBaccaratHandValue(hand) {
  return hand.reduce((sum, card) => sum + getBaccaratCardValue(card.rank), 0) % 10;
}

export function playBaccarat({
  betAmount = 10,
  betType = 'player', // 'player' | 'banker' | 'tie'
  playerCardsOverride = null,
  bankerCardsOverride = null,
  playerThirdCardOverride = null,
  bankerThirdCardOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  if (!['player', 'banker', 'tie'].includes(betType)) {
    throw new Error(`Invalid baccarat bet type: ${betType}`);
  }

  const currentBal = getBalance();
  if (currentBal < betAmount) {
    const subtracted = subtractFromBalance(betAmount);
    return {
      success: false,
      error: 'Insufficient balance',
      subtracted
    };
  }

  subtractFromBalance(betAmount);

  const playerHand = playerCardsOverride ? [...playerCardsOverride] : [{ rank: '9' }, { rank: 'A' }]; // 0 default
  const bankerHand = bankerCardsOverride ? [...bankerCardsOverride] : [{ rank: '8' }, { rank: 'K' }]; // 8 default

  let pVal = calculateBaccaratHandValue(playerHand);
  let bVal = calculateBaccaratHandValue(bankerHand);

  // Check Naturals
  const isNatural = pVal >= 8 || bVal >= 8;

  let playerThirdCard = null;
  let bankerThirdCard = null;

  if (!isNatural) {
    // Player draws on 0..5, stands on 6, 7
    if (pVal <= 5) {
      playerThirdCard = playerThirdCardOverride || { rank: '5' };
      playerHand.push(playerThirdCard);
      pVal = calculateBaccaratHandValue(playerHand);
    }

    // Banker tableau
    if (playerThirdCard === null) {
      // Player stood: Banker draws on 0..5, stands on 6, 7
      if (bVal <= 5) {
        bankerThirdCard = bankerThirdCardOverride || { rank: '5' };
        bankerHand.push(bankerThirdCard);
        bVal = calculateBaccaratHandValue(bankerHand);
      }
    } else {
      // Player drew 3rd card
      const p3Val = getBaccaratCardValue(playerThirdCard.rank);
      let bankerDraws = false;

      if (bVal <= 2) bankerDraws = true;
      else if (bVal === 3 && p3Val !== 8) bankerDraws = true;
      else if (bVal === 4 && [2, 3, 4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
      else if (bVal === 5 && [4, 5, 6, 7].includes(p3Val)) bankerDraws = true;
      else if (bVal === 6 && [6, 7].includes(p3Val)) bankerDraws = true;

      if (bankerDraws) {
        bankerThirdCard = bankerThirdCardOverride || { rank: '5' };
        bankerHand.push(bankerThirdCard);
        bVal = calculateBaccaratHandValue(bankerHand);
      }
    }
  }

  let winner = 'tie';
  if (pVal > bVal) winner = 'player';
  else if (bVal > pVal) winner = 'banker';

  let multiplier = 0;
  if (winner === 'tie') {
    if (betType === 'tie') {
      multiplier = 9.0; // 8:1 payout + original bet returned
    } else {
      multiplier = 1.0; // Push on Player and Banker bets
    }
  } else if (winner === betType) {
    if (betType === 'player') {
      multiplier = 2.0; // 1:1 payout
    } else if (betType === 'banker') {
      multiplier = 1.95; // 1:1 payout minus 5% house commission
    }
  }

  const payout = parseFloat((betAmount * multiplier).toFixed(8));
  const profit = parseFloat((payout - betAmount).toFixed(8));
  const won = multiplier > 1.0;

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'baccarat',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { winner, betType, pVal, bVal, isNatural }
  });

  return {
    success: true,
    won,
    winner,
    betType,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    playerHand,
    bankerHand,
    pVal,
    bVal,
    isNatural,
    balanceAfter: getBalance()
  };
}
