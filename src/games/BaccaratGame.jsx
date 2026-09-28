import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const getCardValue = (rank) => {
  if (rank === 'A') return 1;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank);
};

const getHandValue = (hand) => {
  return hand.reduce((sum, card) => sum + getCardValue(card.rank), 0) % 10;
};

const getRandomCard = () => {
  const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
  const rank = RANKS[Math.floor(Math.random() * RANKS.length)];
  return { suit, rank, id: Math.random().toString(36).substr(2, 9) };
};

const Card = ({ card }) => {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const getSuitSymbol = (suit) => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };

  return (
    <div className="w-16 h-24 md:w-24 md:h-36 bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col justify-between p-2 relative shrink-0 border border-slate-200">
      <div className={`text-sm md:text-xl font-bold leading-none ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        {card.rank}
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-3xl md:text-5xl ${isRed ? 'text-red-600' : 'text-slate-800'}`}>
        {getSuitSymbol(card.suit)}
      </div>
      <div className={`text-sm md:text-xl font-bold leading-none ${isRed ? 'text-red-600' : 'text-slate-800'} rotate-180 self-end`}>
        {card.rank}
      </div>
    </div>
  );
};

const BeadPlate = ({ history }) => {
  return (
    <div className="bg-black/20 p-2 md:p-3 rounded-xl w-full max-w-lg mt-8">
      <h3 className="text-white/50 text-[10px] md:text-xs font-semibold mb-2 uppercase text-center tracking-wider">Bead Plate History</h3>
      <div className="flex flex-wrap justify-center gap-1">
        {history.map((result, i) => (
          <div
            key={i}
            className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold text-white
              ${result === 'player' ? 'bg-blue-500' : result === 'banker' ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {result === 'player' ? 'P' : result === 'banker' ? 'B' : 'T'}
          </div>
        ))}
        {history.length === 0 && <span className="text-white/30 text-xs py-1">No games played yet</span>}
      </div>
    </div>
  );
};

export default function BaccaratGame({ onBack }) {
  const [betAmount, setBetAmount] = useState(10);
  const [betTarget, setBetTarget] = useState('player'); // 'player', 'banker', 'tie'
  const [isDealing, setIsDealing] = useState(false);
  const [playerHand, setPlayerHand] = useState([]);
  const [bankerHand, setBankerHand] = useState([]);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const handleDeal = async () => {
    if (isDealing) return;
    
    const currentBalance = getBalance();
    if (betAmount > currentBalance) {
      alert("Insufficient balance!");
      return;
    }
    
    subtractFromBalance(betAmount);
    setIsDealing(true);
    setMessage('');
    setPlayerHand([]);
    setBankerHand([]);
    
    const pHand = [getRandomCard(), getRandomCard()];
    const bHand = [getRandomCard(), getRandomCard()];
    
    setPlayerHand([pHand[0]]);
    await new Promise(r => setTimeout(r, 400));
    
    setBankerHand([bHand[0]]);
    await new Promise(r => setTimeout(r, 400));
    
    setPlayerHand([pHand[0], pHand[1]]);
    await new Promise(r => setTimeout(r, 400));
    
    setBankerHand([bHand[0], bHand[1]]);
    await new Promise(r => setTimeout(r, 800));
    
    const pVal1 = getHandValue(pHand);
    const bVal1 = getHandValue(bHand);
    
    let finalPHand = [...pHand];
    let finalBHand = [...bHand];
    
    if (pVal1 >= 8 || bVal1 >= 8) {
      determineWinner(finalPHand, finalBHand);
      return;
    }
    
    let pDrawsThird = false;
    let pThirdCard = null;
    
    if (pVal1 <= 5) {
      pDrawsThird = true;
      pThirdCard = getRandomCard();
      finalPHand.push(pThirdCard);
      setPlayerHand([...finalPHand]);
      await new Promise(r => setTimeout(r, 800));
    }
    
    let bDrawsThird = false;
    if (!pDrawsThird) {
      if (bVal1 <= 5) bDrawsThird = true;
    } else {
      const p3Val = getCardValue(pThirdCard.rank);
      if (bVal1 <= 2) bDrawsThird = true;
      else if (bVal1 === 3 && p3Val !== 8) bDrawsThird = true;
      else if (bVal1 === 4 && p3Val >= 2 && p3Val <= 7) bDrawsThird = true;
      else if (bVal1 === 5 && p3Val >= 4 && p3Val <= 7) bDrawsThird = true;
      else if (bVal1 === 6 && (p3Val === 6 || p3Val === 7)) bDrawsThird = true;
    }
    
    if (bDrawsThird) {
      finalBHand.push(getRandomCard());
      setBankerHand([...finalBHand]);
      await new Promise(r => setTimeout(r, 800));
    }
    
    determineWinner(finalPHand, finalBHand);
  };
  
  const determineWinner = (pHand, bHand) => {
    const pVal = getHandValue(pHand);
    const bVal = getHandValue(bHand);
    
    let result = '';
    if (pVal > bVal) result = 'player';
    else if (bVal > pVal) result = 'banker';
    else result = 'tie';
    
    let wonAmount = 0;
    let returnedBet = 0;
    
    if (result === betTarget) {
      if (result === 'player') wonAmount = betAmount * 2;
      else if (result === 'banker') wonAmount = betAmount * 1.95; // 5% commission
      else if (result === 'tie') wonAmount = betAmount * 9; // 8:1 payout (9x total return)
      
      addToBalance(wonAmount);
      setMessage(`You won $${wonAmount.toFixed(2)}!`);
    } else {
      if (result === 'tie' && betTarget !== 'tie') {
        addToBalance(betAmount);
        setMessage('Tie! Bet returned.');
        returnedBet = betAmount;
      } else {
        setMessage(result === 'tie' ? 'Tie! You lost.' : 'You lost.');
      }
    }
    
    addHistoryEntry({
      game: 'baccarat',
      bet: betAmount,
      won: wonAmount > 0 ? wonAmount - betAmount : returnedBet > 0 ? 0 : -betAmount,
      target: betTarget,
      result: result
    });
    
    setHistory(prev => [...prev, result].slice(-60));
    setIsDealing(false);
  };

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={isDealing}
        maxBet={getBalance()}
      />
      
      <div className="space-y-2">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase px-3 block">Place Bet</label>
        
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setBetTarget('player')}
            disabled={isDealing}
            className={`py-3 rounded-lg font-bold text-sm transition-all border ${
              betTarget === 'player' ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-[#0F212E] border-transparent text-[#B1BAD3] hover:bg-[#213743]'
            }`}
          >
            Player <span className="text-xs font-normal opacity-75 ml-1">1:1</span>
          </button>
          
          <button
            onClick={() => setBetTarget('tie')}
            disabled={isDealing}
            className={`py-3 rounded-lg font-bold text-sm transition-all border ${
              betTarget === 'tie' ? 'bg-green-500/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : 'bg-[#0F212E] border-transparent text-[#B1BAD3] hover:bg-[#213743]'
            }`}
          >
            Tie <span className="text-xs font-normal opacity-75 ml-1">8:1</span>
          </button>
          
          <button
            onClick={() => setBetTarget('banker')}
            disabled={isDealing}
            className={`py-3 rounded-lg font-bold text-sm transition-all border ${
              betTarget === 'banker' ? 'bg-red-500/20 border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.2)]' : 'bg-[#0F212E] border-transparent text-[#B1BAD3] hover:bg-[#213743]'
            }`}
          >
            Banker <span className="text-xs font-normal opacity-75 ml-1">0.95:1</span>
          </button>
        </div>
      </div>

      <button
        className="w-full mt-2 bg-[#00E701] hover:bg-[#00c701] text-[#0F212E] font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase shadow-[0_0_15px_rgba(0,231,1,0.2)]"
        onClick={handleDeal}
        disabled={isDealing || !betTarget || betAmount <= 0}
      >
        {isDealing ? 'Dealing...' : 'Deal'}
      </button>
    </div>
  );

  return (
    <GameLayout title="Baccarat" onBack={onBack} controls={controls}>
      <div className="flex-1 flex flex-col items-center justify-between p-4 md:p-8 relative min-h-[500px] overflow-hidden">
        
        {/* Banker Area (Top) */}
        <div className="w-full flex flex-col items-center mt-4">
          <div className="mb-4 flex items-center gap-4">
             <span className="text-red-500 font-bold text-xl uppercase tracking-wider">Banker</span>
             {bankerHand.length > 0 && (
               <motion.span 
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(239,68,68,0.3)]"
               >
                 {getHandValue(bankerHand)}
               </motion.span>
             )}
          </div>
          <div className="flex justify-center min-h-[144px]">
            <AnimatePresence>
              {bankerHand.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: -50, x: -100, rotateY: 180 }}
                  animate={{ opacity: 1, y: 0, x: 0, rotateY: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  className={`relative ${i > 0 ? '-ml-8 md:-ml-12' : ''}`}
                  style={{ zIndex: i }}
                >
                  <Card card={card} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Message Overlay */}
        {message && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-8 py-4 rounded-xl border border-white/10 font-bold text-xl md:text-3xl z-50 backdrop-blur-md whitespace-nowrap shadow-2xl"
          >
            {message}
          </motion.div>
        )}

        {/* Player Area (Bottom) */}
        <div className="w-full flex flex-col items-center mb-8">
          <div className="flex justify-center min-h-[144px] mb-4">
            <AnimatePresence>
              {playerHand.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50, x: 100, rotateY: 180 }}
                  animate={{ opacity: 1, y: 0, x: 0, rotateY: 0 }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15 }}
                  className={`relative ${i > 0 ? '-ml-8 md:-ml-12' : ''}`}
                  style={{ zIndex: i }}
                >
                  <Card card={card} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-blue-500 font-bold text-xl uppercase tracking-wider">Player</span>
             {playerHand.length > 0 && (
               <motion.span 
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]"
               >
                 {getHandValue(playerHand)}
               </motion.span>
             )}
          </div>
        </div>

        <BeadPlate history={history} />
      </div>
    </GameLayout>
  );
}
