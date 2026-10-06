import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';

export const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const PAYTABLE = {
  ROYAL_FLUSH: { name: 'Royal Flush', multi: 800 },
  STRAIGHT_FLUSH: { name: 'Straight Flush', multi: 50 },
  FOUR_OF_A_KIND: { name: 'Four of a Kind', multi: 25 },
  FULL_HOUSE: { name: 'Full House', multi: 9 },
  FLUSH: { name: 'Flush', multi: 6 },
  STRAIGHT: { name: 'Straight', multi: 4 },
  THREE_OF_A_KIND: { name: 'Three of a Kind', multi: 3 },
  TWO_PAIR: { name: 'Two Pair', multi: 2 },
  JACKS_OR_BETTER: { name: 'Jacks or Better', multi: 1 },
  NONE: { name: 'Nothing', multi: 0 }
};

export function evaluatePokerHand(hand) {
  const ranks = hand.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  const suits = hand.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  let isStraight = false;
  if (ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5) {
    isStraight = true;
  } else if (ranks.join(',') === '2,3,4,5,14') {
    // Wheel straight A-2-3-4-5
    isStraight = true;
  }

  const rankCounts = {};
  for (const r of ranks) {
    rankCounts[r] = (rankCounts[r] || 0) + 1;
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  if (isFlush && isStraight) {
    if (ranks[0] === 10 && ranks[4] === 14) return PAYTABLE.ROYAL_FLUSH;
    return PAYTABLE.STRAIGHT_FLUSH;
  }

  if (counts[0] === 4) return PAYTABLE.FOUR_OF_A_KIND;
  if (counts[0] === 3 && counts[1] === 2) return PAYTABLE.FULL_HOUSE;
  if (isFlush) return PAYTABLE.FLUSH;
  if (isStraight) return PAYTABLE.STRAIGHT;
  if (counts[0] === 3) return PAYTABLE.THREE_OF_A_KIND;
  if (counts[0] === 2 && counts[1] === 2) return PAYTABLE.TWO_PAIR;

  if (counts[0] === 2) {
    const pairRanks = Object.keys(rankCounts).filter(r => rankCounts[r] === 2).map(Number);
    if (pairRanks.some(r => r >= 11)) {
      return PAYTABLE.JACKS_OR_BETTER;
    }
  }

  return PAYTABLE.NONE;
}

export function playVideoPoker({
  betAmount = 10,
  initialHand = null,
  holdMask = [true, true, true, true, true], // 5 booleans
  replacementCards = []
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

  const baseHand = initialHand || [
    { rank: 'J', suit: '♠' },
    { rank: 'J', suit: '♥' },
    { rank: '4', suit: '♦' },
    { rank: '7', suit: '♣' },
    { rank: '9', suit: '♠' }
  ];

  const finalHand = [];
  let repIdx = 0;
  for (let i = 0; i < 5; i++) {
    if (holdMask[i]) {
      finalHand.push(baseHand[i]);
    } else {
      if (repIdx < replacementCards.length) {
        finalHand.push(replacementCards[repIdx++]);
      } else {
        finalHand.push({ rank: '2', suit: '♠' });
      }
    }
  }

  const handResult = evaluatePokerHand(finalHand);
  const multiplier = handResult.multi;
  const payout = parseFloat((betAmount * multiplier).toFixed(8));
  const profit = parseFloat((payout - betAmount).toFixed(8));
  const won = multiplier > 0;

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'videopoker',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { handRank: handResult.name, holdCount: holdMask.filter(Boolean).length }
  });

  return {
    success: true,
    won,
    handName: handResult.name,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    finalHand,
    balanceAfter: getBalance()
  };
}
