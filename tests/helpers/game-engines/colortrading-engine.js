import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { COLOR_MAP } from '../../../src/utils/constants.js';

export function playColorTrading({
  betAmount = 10,
  betSelection = { type: 'color', value: 'green' }, // type: 'color' | 'number' | 'size'
  resultNumberOverride = null
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

  const resultNumber = resultNumberOverride !== null ? resultNumberOverride : Math.floor(Math.random() * 10);
  const colorData = COLOR_MAP[resultNumber];

  let multiplier = 0;
  if (betSelection.type === 'number') {
    if (betSelection.value === resultNumber) {
      multiplier = 9;
    }
  } else if (betSelection.type === 'color') {
    if (colorData.colors.includes(betSelection.value)) {
      multiplier = betSelection.value === 'violet' ? 4.5 : 2.0;
    }
  } else if (betSelection.type === 'size') {
    if (colorData.size === betSelection.value) {
      multiplier = 2.0;
    }
  }

  const won = multiplier > 0;
  const payout = parseFloat((betAmount * multiplier).toFixed(8));
  const profit = parseFloat((payout - betAmount).toFixed(8));

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'colortrading',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { resultNumber, colorData, betSelection }
  });

  return {
    success: true,
    won,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    resultNumber,
    colorData,
    balanceAfter: getBalance()
  };
}
