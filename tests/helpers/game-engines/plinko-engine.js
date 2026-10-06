import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { PLINKO_MULTIPLIERS } from '../../../src/utils/constants.js';
import { getProvablyFairFloats, generateServerSeed } from '../../../src/utils/provablyFair.js';

export function playPlinko({
  betAmount = 10,
  rows = 12,
  risk = 'medium',
  pathOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  if (!PLINKO_MULTIPLIERS[rows]) {
    throw new Error(`Unsupported Plinko rows: ${rows}. Supported: 8, 12, 16`);
  }
  if (!PLINKO_MULTIPLIERS[rows][risk]) {
    throw new Error(`Unsupported Plinko risk: ${risk}. Supported: low, medium, high`);
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

  let path;
  if (pathOverride) {
    path = pathOverride;
  } else {
    const floats = getProvablyFairFloats(generateServerSeed(), 'plinko', Date.now(), rows);
    path = floats.map(f => (f > 0.5 ? 1 : 0));
  }

  const binIndex = path.reduce((a, b) => a + b, 0);
  const multipliersList = PLINKO_MULTIPLIERS[rows][risk];
  const multiplier = multipliersList[binIndex];
  const payout = parseFloat((betAmount * multiplier).toFixed(8));
  const profit = parseFloat((payout - betAmount).toFixed(8));
  const won = multiplier > 1.0;

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'plinko',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { rows, risk, binIndex, pathLength: path.length }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    binIndex,
    rows,
    risk,
    balanceAfter: getBalance()
  };
}
