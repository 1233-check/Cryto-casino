import { subtractFromBalance, addToBalance, addHistoryEntry, getBalance } from '../../../src/utils/balance.js';
import { TOWER_CONFIGS } from '../../../src/utils/constants.js';

export function getTowerMultiplier(difficulty, level) {
  if (level === 0) return 1.00;
  const cfg = TOWER_CONFIGS[difficulty];
  if (!cfg) throw new Error(`Unknown difficulty: ${difficulty}`);
  const val = 0.98 * Math.pow(cfg.cols / cfg.safe, level);
  return Math.floor(val * 100) / 100;
}

export function playTower({
  betAmount = 10,
  difficulty = 'easy',
  floorPicks = [0], // picked col for each floor
  towerOverride = null, // array of bombIndex per floor
  cashoutFloor = null // floor index to cashout after
} = {}) {
  if (betAmount <= 0) {
    throw new Error('Bet amount must be greater than 0');
  }
  const cfg = TOWER_CONFIGS[difficulty];
  if (!cfg) {
    throw new Error(`Invalid difficulty: ${difficulty}`);
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

  // Generate tower floors (10 floors)
  const tower = towerOverride || Array.from({ length: 10 }, () => {
    return Math.floor(Math.random() * cfg.cols); // single bomb col or bomb cols
  });

  let hitBomb = false;
  let clearedFloors = 0;

  const targetFloors = cashoutFloor !== null ? Math.min(floorPicks.length, cashoutFloor) : floorPicks.length;

  for (let f = 0; f < targetFloors; f++) {
    const pick = floorPicks[f];
    if (pick < 0 || pick >= cfg.cols) {
      throw new Error(`Invalid column pick ${pick} for difficulty ${difficulty} (cols: ${cfg.cols})`);
    }
    const bombIndex = tower[f];
    if (pick === bombIndex) {
      hitBomb = true;
      break;
    }
    clearedFloors++;
  }

  const won = !hitBomb && clearedFloors > 0;
  const multiplier = won ? getTowerMultiplier(difficulty, clearedFloors) : 0;
  const payout = won ? parseFloat((betAmount * multiplier).toFixed(8)) : 0;
  const profit = parseFloat((payout - betAmount).toFixed(8));

  if (payout > 0) {
    addToBalance(payout);
  }

  addHistoryEntry({
    game: 'tower',
    bet: betAmount,
    payout,
    profit,
    multiplier,
    details: { difficulty, clearedFloors, hitBomb, targetFloors }
  });

  return {
    success: true,
    won,
    hitBomb,
    bet: betAmount,
    payout,
    profit,
    multiplier,
    clearedFloors,
    difficulty,
    balanceAfter: getBalance()
  };
}
