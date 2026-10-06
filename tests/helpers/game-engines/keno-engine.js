import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { KENO_PAYOUTS } from '../../../src/utils/constants.js';
import { shuffleArray } from '../../../src/utils/provablyFair.js';

export function playKeno({
  betAmount = 10,
  picks = [1, 5, 10], // 1 to 10 numbers from 1 to 40
  drawnNumbersOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }

  const uniquePicks = Array.from(new Set(picks));
  if (uniquePicks.length < 1 || uniquePicks.length > 10) {
    throw new Error('Keno picks count must be between 1 and 10');
  }
  for (const p of uniquePicks) {
    if (p < 1 || p > 40) {
      throw new Error(`Keno pick out of range [1, 40]: ${p}`);
    }
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

  let drawnNumbers = drawnNumbersOverride;
  if (!drawnNumbers) {
    const pool = Array.from({ length: 40 }, (_, i) => i + 1);
    const shuffled = shuffleArray(pool);
    drawnNumbers = shuffled.slice(0, 10);
  }

  const matches = uniquePicks.filter(p => drawnNumbers.includes(p));
  const matchCount = matches.length;

  const pickPayTable = KENO_PAYOUTS[uniquePicks.length] || {};
  const multiplier = pickPayTable[matchCount] !== undefined ? pickPayTable[matchCount] : 0;

  const payout = parseFloat((betAmount * multiplier).toFixed(8));
  const profit = parseFloat((payout - betAmount).toFixed(8));
  const won = multiplier > 1.0;

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'keno',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { picksCount: uniquePicks.length, matchCount, matches }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    picks: uniquePicks,
    drawnNumbers,
    matches,
    matchCount,
    balanceAfter: getBalance()
  };
}
