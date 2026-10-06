import { resetTestEnvironment } from '../tests/helpers/env.js';
import { 
  playDice, playLimbo, playRoulette, playBlackjack, playBaccarat, 
  playPlinko, playSlots, playCrash, playMines, playTower, 
  playHiLo, playVideoPoker, playKeno, playColorTrading, playWheel
} from '../tests/helpers/game-engines/index.js';

const ROUNDS = 100000;

function runSim(name, gameFunc, configGen) {
  resetTestEnvironment(1000000000.0);
  let fakeBalance = '1000000000';
  globalThis.localStorage = {
    getItem: (k) => k === 'cryptobet_balance' ? fakeBalance : '[]',
    setItem: (k, v) => { if(k === 'cryptobet_balance') fakeBalance = v; },
    removeItem: () => {}, clear: () => {}
  };
  
  let wins = 0;
  let totalBet = 0;
  let totalPayout = 0;

  for (let i = 0; i < ROUNDS; i++) {
    const config = configGen();
    const res = gameFunc(config);
    if (res.success === false) {
      console.log(`Simulation stopped for ${name} at round ${i} due to:`, res.error);
      break;
    }
    
    const bet = res.bet || (config.betAmount !== undefined ? config.betAmount : 10);
    const payout = res.payout || 0;
    
    totalBet += bet;
    totalPayout += payout;
    if (res.won || payout > bet) wins++;
  }

  const winRate = (wins / ROUNDS) * 100;
  const rtp = (totalPayout / totalBet) * 100;
  console.log(`${name.padEnd(25)} | Win Rate: ${winRate.toFixed(2).padStart(6)}% | Emp RTP: ${rtp.toFixed(2).padStart(6)}% | House Edge: ${(100-rtp).toFixed(2).padStart(5)}%`);
}

console.log('Running Monte Carlo Simulations (100,000 Rounds Each)...');
console.log('-'.repeat(100));

const RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const randCard = () => ({ rank: RANKS[Math.floor(Math.random()*RANKS.length)] });

try {
  runSim('Dice (Target 50)', playDice, () => ({ betAmount: 10, target: 50.0, condition: 'over' }));
  runSim('Limbo (Target 2x)', playLimbo, () => ({ betAmount: 10, targetMultiplier: 2.0 }));
  runSim('Crash (Auto 2x)', playCrash, () => ({ betAmount: 10, autoCashout: 2.0 }));
  runSim('Plinko (16 High)', playPlinko, () => ({ betAmount: 10, rows: 16, risk: 'high' }));
  runSim('Roulette (Red)', playRoulette, () => ({ bets: { 'color_red': 10 }, winningNumberOverride: Math.floor(Math.random() * 37) }));
  
  runSim('Baccarat (Banker)', playBaccarat, () => ({ 
    betAmount: 10, betType: 'banker',
    playerCardsOverride: [randCard(), randCard()],
    bankerCardsOverride: [randCard(), randCard()],
    playerThirdCardOverride: randCard(),
    bankerThirdCardOverride: randCard()
  }));
  
  runSim('Blackjack (Basic)', playBlackjack, () => ({ 
    betAmount: 10, action: 'stand',
    playerCardsOverride: [randCard(), randCard()],
    dealerCardsOverride: [randCard(), randCard()]
  }));
  
  runSim('Video Poker (Jacks+)', playVideoPoker, () => ({ 
    betAmount: 10, holdIndices: [],
    handOverride: [randCard(), randCard(), randCard(), randCard(), randCard()],
    drawOverride: [randCard(), randCard(), randCard(), randCard(), randCard()]
  }));
  
  runSim('Slots (20 Lines)', playSlots, () => ({ betAmount: 20 }));
  runSim('Mines (3 Mines)', playMines, () => ({ betAmount: 10, minesCount: 3, tilePicks: [0] }));
  runSim('Tower (Medium)', playTower, () => ({ betAmount: 10, difficulty: 'medium', levelPicks: [0] }));
  runSim('Keno (3 Picks)', playKeno, () => ({ betAmount: 10, picks: [1, 2, 3] }));
  runSim('Wheel (50 High)', playWheel, () => ({ betAmount: 10, segments: 50, risk: 'high' }));
} catch (e) {
  console.error(e);
}
