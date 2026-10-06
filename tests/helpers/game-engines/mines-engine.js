import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { shuffleArray } from '../../../src/utils/provablyFair.js';

export function comb(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

export function getMinesMultiplier(mines, revealedSafe) {
  if (revealedSafe === 0) return 1.00;
  const totalSafe = 25 - mines;
  const numerator = comb(25, revealedSafe);
  const denominator = comb(totalSafe, revealedSafe);
  const multiplier = (0.99 * numerator) / denominator;
  return Math.floor(multiplier * 100) / 100;
}

export function playMines({
  betAmount = 10,
  minesCount = 3,
  tilePicks = [0],
  minesPositionsOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  if (minesCount < 1 || minesCount > 24) {
    throw new Error('Mines count must be between 1 and 24');
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

  let minesPositions = minesPositionsOverride;
  if (!minesPositions) {
    const arr = Array.from({ length: 25 }, (_, i) => i);
    const shuffled = shuffleArray(arr);
    minesPositions = shuffled.slice(0, minesCount);
  }

  let hitMine = false;
  let safeRevealed = 0;
  const uniquePicks = Array.from(new Set(tilePicks));

  for (const pick of uniquePicks) {
    if (pick < 0 || pick >= 25) {
      throw new Error(`Invalid tile pick: ${pick}`);
    }
    if (minesPositions.includes(pick)) {
      hitMine = true;
      break;
    }
    safeRevealed++;
  }

  const won = !hitMine && safeRevealed > 0;
  const multiplier = won ? getMinesMultiplier(minesCount, safeRevealed) : 0;
  const payout = won ? parseFloat((betAmount * multiplier).toFixed(8)) : 0;
  const profit = parseFloat((payout - betAmount).toFixed(8));

  if (won && payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'mines',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { minesCount, safeRevealed, hitMine, picksCount: uniquePicks.length }
  });

  return {
    success: true,
    won,
    hitMine,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    safeRevealed,
    minesPositions,
    balanceAfter: getBalance()
  };
}
