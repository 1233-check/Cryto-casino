import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { getCrashPoint, generateServerSeed } from '../../../src/utils/provablyFair.js';

export function playCrash({
  betAmount = 10,
  autoCashout = 2.0,
  manualCashout = null,
  serverSeed = null,
  clientSeed = 'client-seed-1',
  crashPointOverride = null
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

  const seed = serverSeed || generateServerSeed();
  const crashPoint = crashPointOverride !== null ? crashPointOverride : getCrashPoint(seed, clientSeed);

  const targetCashout = manualCashout !== null ? manualCashout : autoCashout;
  const won = targetCashout <= crashPoint;
  const multiplier = won ? targetCashout : 0;
  const payout = won ? parseFloat((betAmount * targetCashout).toFixed(8)) : 0;
  const profit = parseFloat((payout - betAmount).toFixed(8));

  if (won && payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'crash',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { crashPoint, targetCashout, serverSeed: seed, clientSeed }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    crashPoint,
    targetCashout,
    balanceAfter: getBalance()
  };
}
