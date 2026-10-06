import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { WHEEL_SEGMENTS } from '../../../src/utils/constants.js';

export function playWheel({
  betAmount = 10,
  segments = 10,
  risk = 'low',
  segmentIndexOverride = null
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  if (!WHEEL_SEGMENTS[segments]) {
    throw new Error(`Invalid segments count: ${segments}. Supported: 10, 20, 30, 40, 50`);
  }
  if (!WHEEL_SEGMENTS[segments][risk]) {
    throw new Error(`Invalid risk: ${risk}. Supported: low, medium, high`);
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

  const segmentList = WHEEL_SEGMENTS[segments][risk];
  const segmentIndex = segmentIndexOverride !== null
    ? (segmentIndexOverride % segments + segments) % segments
    : Math.floor(Math.random() * segments);

  const multiplier = segmentList[segmentIndex];
  const payout = parseFloat((betAmount * multiplier).toFixed(8));
  const profit = parseFloat((payout - betAmount).toFixed(8));
  const won = multiplier > 1.0;

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'wheel',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { segments, risk, segmentIndex }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    segmentIndex,
    segments,
    risk,
    balanceAfter: getBalance()
  };
}
