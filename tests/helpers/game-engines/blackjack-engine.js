import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { createDeck } from '../../../src/utils/constants.js';

export function calculateBlackjackHandValue(cards) {
  let sum = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.rank === 'A') {
      aces++;
      sum += 11;
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      sum += 10;
    } else {
      sum += parseInt(card.rank);
    }
  }
  while (sum > 21 && aces > 0) {
    sum -= 10;
    aces--;
  }
  return sum;
}

export function isBlackjack(cards) {
  return cards.length === 2 && calculateBlackjackHandValue(cards) === 21;
}

export function playBlackjack({
  betAmount = 10,
  playerCardsOverride = null,
  dealerCardsOverride = null,
  action = 'stand', // 'stand' | 'hit' | 'double'
  extraPlayerCards = [],
  extraDealerCards = []
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }

  let totalBet = betAmount;
  if (action === 'double') {
    totalBet = betAmount * 2;
  }

  const currentBal = getBalance();
  if (currentBal < totalBet) {
    const subtracted = subtractFromBalance(totalBet);
    return {
      success: false,
      error: 'Insufficient balance',
      subtracted
    };
  }

  subtractFromBalance(totalBet);

  const deck = createDeck(6);
  // Default deal if not overridden
  const playerCards = playerCardsOverride ? [...playerCardsOverride] : [deck[0], deck[1]];
  const dealerCards = dealerCardsOverride ? [...dealerCardsOverride] : [deck[2], deck[3]];

  if (action === 'double' && extraPlayerCards.length > 0) {
    playerCards.push(extraPlayerCards[0]);
  } else if (action === 'hit') {
    playerCards.push(...extraPlayerCards);
  }

  dealerCards.push(...extraDealerCards);

  const playerTotal = calculateBlackjackHandValue(playerCards);
  const dealerTotal = calculateBlackjackHandValue(dealerCards);

  const playerBJ = isBlackjack(playerCards);
  const dealerBJ = isBlackjack(dealerCards);

  let payoutMultiplier = 0;
  let outcome = 'lose';

  if (playerBJ && dealerBJ) {
    outcome = 'push';
    payoutMultiplier = 1.0;
  } else if (playerBJ) {
    outcome = 'blackjack';
    payoutMultiplier = 2.5; // 3:2 win + bet return
  } else if (playerTotal > 21) {
    outcome = 'bust';
    payoutMultiplier = 0;
  } else if (dealerBJ) {
    outcome = 'dealer_blackjack';
    payoutMultiplier = 0;
  } else if (dealerTotal > 21) {
    outcome = 'win_dealer_bust';
    payoutMultiplier = 2.0;
  } else if (playerTotal > dealerTotal) {
    outcome = 'win';
    payoutMultiplier = 2.0;
  } else if (playerTotal === dealerTotal) {
    outcome = 'push';
    payoutMultiplier = 1.0;
  } else {
    outcome = 'lose';
    payoutMultiplier = 0;
  }

  const payout = parseFloat((totalBet * payoutMultiplier).toFixed(8));
  const profit = parseFloat((payout - totalBet).toFixed(8));

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'blackjack',
    bet: totalBet,
    payout,
    profit,
    multiplier: payoutMultiplier,
    details: { playerTotal, dealerTotal, outcome, action }
  });

  return {
    success: true,
    outcome,
    won: outcome === 'win' || outcome === 'blackjack' || outcome === 'win_dealer_bust',
    bet: totalBet,
    payout,
    profit,
    multiplier: payoutMultiplier,
    playerTotal,
    dealerTotal,
    playerCards,
    dealerCards,
    balanceAfter: getBalance()
  };
}
