import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { RANKS, createDeck } from '../../../src/utils/constants.js';

export function getCardRankValue(rank) {
  const idx = RANKS.indexOf(rank);
  if (idx === -1) throw new Error(`Unknown card rank: ${rank}`);
  return idx + 1; // 1 (A) to 13 (K)
}

export function getHiLoHigherMultiplier(rankValue) {
  if (rankValue >= 13) return 0;
  return parseFloat((0.99 * (13 / (14 - rankValue))).toFixed(4));
}

export function getHiLoLowerMultiplier(rankValue) {
  if (rankValue <= 1) return 0;
  return parseFloat((0.99 * (13 / (rankValue - 1))).toFixed(4));
}

export function playHiLo({
  betAmount = 10,
  initialCard = { rank: '7', suit: '♠' },
  guesses = ['higher'], // array of 'higher' | 'lower'
  drawnCardsOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
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

  let currentCard = initialCard;
  let cumulativeMultiplier = 1.0;
  let lost = false;
  let stepsCompleted = 0;
  const historySteps = [];

  const deck = drawnCardsOverride ? [...drawnCardsOverride] : createDeck(1);

  for (let i = 0; i < guesses.length; i++) {
    const guess = guesses[i];
    const currentVal = getCardRankValue(currentCard.rank);
    const stepMultiplier = guess === 'higher' ? getHiLoHigherMultiplier(currentVal) : getHiLoLowerMultiplier(currentVal);

    const nextCard = deck[i % deck.length];
    const nextVal = getCardRankValue(nextCard.rank);

    let isCorrect = false;
    if (guess === 'higher') {
      isCorrect = nextVal >= currentVal;
    } else if (guess === 'lower') {
      isCorrect = nextVal <= currentVal;
    }

    historySteps.push({
      step: i + 1,
      fromCard: currentCard,
      toCard: nextCard,
      guess,
      isCorrect,
      stepMultiplier
    });

    if (isCorrect) {
      cumulativeMultiplier *= stepMultiplier;
      currentCard = nextCard;
      stepsCompleted++;
    } else {
      lost = true;
      break;
    }
  }

  const won = !lost && stepsCompleted > 0;
  const finalMultiplier = won ? parseFloat(cumulativeMultiplier.toFixed(4)) : 0;
  const payout = won ? parseFloat((betAmount * finalMultiplier).toFixed(8)) : 0;
  const profit = parseFloat((payout - betAmount).toFixed(8));

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'hilo',
    bet: betAmount,
    payout,
    profit,
    multiplier: finalMultiplier,
    details: { stepsCompleted, lost, historySteps }
  });

  return {
    success: true,
    won,
    lost,
    bet: betAmount,
    payout,
    profit,
    multiplier: finalMultiplier,
    stepsCompleted,
    historySteps,
    balanceAfter: getBalance()
  };
}
