import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { SLOT_SYMBOLS, SLOT_PAYOUTS } from '../../../src/utils/constants.js';

export const PAYLINES = [
  [1, 1, 1, 1, 1], // 1: Middle
  [0, 0, 0, 0, 0], // 2: Top
  [2, 2, 2, 2, 2], // 3: Bottom
  [0, 1, 2, 1, 0], // 4: V
  [2, 1, 0, 1, 2], // 5: Inverted V
  [0, 0, 1, 2, 2], // 6: Top to bottom
  [2, 2, 1, 0, 0], // 7: Bottom to top
  [1, 2, 2, 2, 1], // 8: U-shape bottom
  [1, 0, 0, 0, 1], // 9: U-shape top
  [0, 1, 1, 1, 0], // 10: Top flat U
  [2, 1, 1, 1, 2], // 11: Bottom flat U
  [0, 1, 0, 1, 0], // 12: Zigzag top
  [2, 1, 2, 1, 2], // 13: Zigzag bottom
  [1, 0, 1, 0, 1], // 14: Zigzag middle-top
  [1, 2, 1, 2, 1], // 15: Zigzag middle-bottom
  [0, 2, 0, 2, 0], // 16: Deep zigzag top
  [2, 0, 2, 0, 2], // 17: Deep zigzag bottom
  [0, 0, 2, 0, 0], // 18
  [2, 2, 0, 2, 2], // 19
  [1, 1, 0, 1, 1]  // 20
];

export function evaluateSlotsGrid(grid, totalBet) {
  // grid is 5 reels x 3 rows: grid[reelIndex][rowIndex]
  const lineBet = totalBet / 20;
  let totalWin = 0;
  const winningLines = [];

  for (let l = 0; l < PAYLINES.length; l++) {
    const line = PAYLINES[l];
    const firstSymbol = grid[0][line[0]];
    let count = 1;

    for (let col = 1; col < 5; col++) {
      if (grid[col][line[col]] === firstSymbol) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 3 && SLOT_PAYOUTS[firstSymbol] && SLOT_PAYOUTS[firstSymbol][count]) {
      const mult = SLOT_PAYOUTS[firstSymbol][count];
      const winAmount = lineBet * mult;
      totalWin += winAmount;
      winningLines.push({
        lineIndex: l + 1,
        symbol: firstSymbol,
        count,
        mult,
        winAmount
      });
    }
  }

  return {
    totalWin: parseFloat(totalWin.toFixed(8)),
    winningLines
  };
}

export function playSlots({
  betAmount = 20,
  gridOverride = null
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

  let grid = gridOverride;
  if (!grid) {
    grid = Array.from({ length: 5 }, () =>
      Array.from({ length: 3 }, () => SLOT_SYMBOLS[Math.floor(Math.random() * SLOT_SYMBOLS.length)])
    );
  }

  const { totalWin, winningLines } = evaluateSlotsGrid(grid, betAmount);
  const payout = totalWin;
  const profit = parseFloat((payout - betAmount).toFixed(8));
  const won = payout > 0;

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'slots',
    bet: betAmount,
    payout,
    profit,
    multiplier: betAmount > 0 ? parseFloat((payout / betAmount).toFixed(2)) : 0,
    details: { winningLinesCount: winningLines.length }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier: betAmount > 0 ? parseFloat((payout / betAmount).toFixed(2)) : 0,
    grid,
    winningLines,
    balanceAfter: getBalance()
  };
}
