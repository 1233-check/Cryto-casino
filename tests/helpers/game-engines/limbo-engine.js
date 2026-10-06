import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { getGameResult } from '../../../src/utils/provablyFair.js';

export function playLimbo({
  betAmount = 10,
  targetMultiplier = 2.00,
  floatOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  if (targetMultiplier < 1.01) {
    throw new Error('Target multiplier must be at least 1.01');
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

  const float = floatOverride !== null ? floatOverride : getGameResult(0, 1);
  const safeFloat = Math.max(0.00000001, float);
  const resultMultiplier = Math.max(1.00, Math.floor((0.99 / safeFloat) * 100) / 100);

  const won = resultMultiplier >= targetMultiplier;
  const payout = won ? parseFloat((betAmount * targetMultiplier).toFixed(8)) : 0;
  const profit = parseFloat((payout - betAmount).toFixed(8));

  if (won && payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'limbo',
    bet: betAmount,
    payout,
    profit,
    multiplier: won ? targetMultiplier : 0,
    details: { targetMultiplier, resultMultiplier, float: safeFloat }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier: targetMultiplier,
    resultMultiplier,
    balanceAfter: getBalance()
  };
}
