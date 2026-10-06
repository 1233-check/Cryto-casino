import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { RED_NUMBERS, BLACK_NUMBERS, ROULETTE_SEQUENCE } from '../../../src/utils/constants.js';

export function calculateRoulettePayout(bets, winNum) {
  let payout = 0;
  for (const [key, amount] of Object.entries(bets)) {
    if (amount <= 0) continue;
    const parts = key.split('_');
    const type = parts[0];

    if (type === 'num') {
      if (parseInt(parts[1]) === winNum) payout += amount * 36;
    } else if (['split', 'street', 'corner', 'line'].includes(type)) {
      const numbers = parts.slice(1).map(n => parseInt(n));
      if (numbers.includes(winNum)) {
        if (type === 'split') payout += amount * 18;
        if (type === 'street') payout += amount * 12;
        if (type === 'corner') payout += amount * 9;
        if (type === 'line') payout += amount * 6;
      }
    } else if (type === 'col') {
      const col = parseInt(parts[1]);
      if (winNum !== 0 && (winNum % 3 === (col % 3))) payout += amount * 3;
    } else if (type === 'dozen') {
      const d = parseInt(parts[1]);
      if (winNum !== 0) {
        if (d === 1 && winNum >= 1 && winNum <= 12) payout += amount * 3;
        if (d === 2 && winNum >= 13 && winNum <= 24) payout += amount * 3;
        if (d === 3 && winNum >= 25 && winNum <= 36) payout += amount * 3;
      }
    } else if (type === 'half') {
      const h = parseInt(parts[1]);
      if (winNum !== 0) {
        if (h === 1 && winNum >= 1 && winNum <= 18) payout += amount * 2;
        if (h === 2 && winNum >= 19 && winNum <= 36) payout += amount * 2;
      }
    } else if (type === 'parity') {
      if (winNum !== 0) {
        if (parts[1] === 'even' && winNum % 2 === 0) payout += amount * 2;
        if (parts[1] === 'odd' && winNum % 2 !== 0) payout += amount * 2;
      }
    } else if (type === 'color') {
      if (parts[1] === 'red' && RED_NUMBERS.has(winNum)) payout += amount * 2;
      if (parts[1] === 'black' && BLACK_NUMBERS.has(winNum)) payout += amount * 2;
    }
  }
  return parseFloat(payout.toFixed(8));
}

export function playRoulette({
  bets = { num_17: 10 },
  winningNumberOverride = null
} = {}) {
  const totalBet = parseFloat(Object.values(bets).reduce((a, b) => a + Number(b), 0).toFixed(8));
  if (totalBet <= 0) {
    throw new Error('Total bet must be greater than 0');
  }

  const currentBal = getBalance();
  if (currentBal < totalBet) {
    const subtracted = subtractFromBalance(totalBet);
    return {
      success: false,
      error: 'Insufficient balance',
      subtracted
    };
  }

  subtractFromBalance(totalBet);

  const winningNumber = winningNumberOverride !== null
    ? winningNumberOverride
    : ROULETTE_SEQUENCE[Math.floor(Math.random() * ROULETTE_SEQUENCE.length)];

  const payout = calculateRoulettePayout(bets, winningNumber);
  const profit = parseFloat((payout - totalBet).toFixed(8));
  const won = payout > totalBet;

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'roulette',
    bet: totalBet,
    payout,
    profit,
    multiplier: totalBet > 0 ? parseFloat((payout / totalBet).toFixed(2)) : 0,
    details: { winningNumber, betsCount: Object.keys(bets).length }
  });

  return {
    success: true,
    won,
    bet: totalBet,
    payout,
    profit,
    multiplier: totalBet > 0 ? parseFloat((payout / totalBet).toFixed(2)) : 0,
    winningNumber,
    bets,
    balanceAfter: getBalance()
  };
}
