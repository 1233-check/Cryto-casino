import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { getGameResult } from '../../../src/utils/provablyFair.js';

export function playDice({
  betAmount = 10,
  target = 50.00,
  condition = 'over', // 'over' | 'under'
  rollOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  if (target <= 0 || target >= 100) {
    throw new Error('Target must be between 0 and 100');
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

  const winChance = condition === 'over' ? 100 - target : target;
  const multiplier = parseFloat((99 / winChance).toFixed(4));
  const roll = rollOverride !== null ? rollOverride : getGameResult(0, 100);

  const won = condition === 'over' ? roll > target : roll < target;
  const payout = won ? parseFloat((betAmount * multiplier).toFixed(8)) : 0;
  const profit = parseFloat((payout - betAmount).toFixed(8));

  if (won && payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'dice',
    bet: betAmount,
    payout,
    profit,
    multiplier: won ? multiplier : 0,
    details: { roll, target, condition, winChance }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    roll,
    target,
    condition,
    balanceAfter: getBalance()
  };
}
