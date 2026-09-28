import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { createDeck, SUIT_COLORS } from '../utils/constants';

const STATES = {
  BETTING: 'BETTING',
  DEAL: 'DEAL',
  PLAYER_TURN: 'PLAYER_TURN',
  DEALER_TURN: 'DEALER_TURN',
  PAYOUT: 'PAYOUT'
};

const Card = ({ card, hidden, index }) => {
  return (
    <div className="relative w-16 h-24 sm:w-20 sm:h-28 md:w-24 md:h-36 -ml-8 first:ml-0" style={{ perspective: '1000px' }}>
      <motion.div
        initial={{ opacity: 0, y: -200, x: 200, rotateY: 180 }}
        animate={{ opacity: 1, y: 0, x: 0, rotateY: hidden ? 180 : 0 }}
        transition={{ 
          default: { duration: 0.5, delay: index * 0.15 },
          y: { duration: 0.5, delay: index * 0.15, type: 'spring', bounce: 0.2 },
          x: { duration: 0.5, delay: index * 0.15, ease: 'easeOut' },
          opacity: { duration: 0.2, delay: index * 0.15 }
        }}
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 bg-white rounded-xl border-2 border-white shadow-lg p-1 sm:p-2 flex flex-col justify-between" 
          style={{ backfaceVisibility: 'hidden' }}
        >
          {card && (
            <div className="flex flex-col h-full justify-between" style={{ color: SUIT_COLORS[card.suit] || '#18181B' }}>
              <div className="text-left font-bold text-sm sm:text-lg md:text-xl leading-none">{card.rank}</div>
              <div className="text-center text-xl sm:text-3xl md:text-4xl">{card.suit}</div>
              <div className="text-right font-bold text-sm sm:text-lg md:text-xl leading-none rotate-180">{card.rank}</div>
            </div>
          )}
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0 bg-[#0F212E] rounded-xl border-2 border-white/10 shadow-lg overflow-hidden" 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-full opacity-50 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjMGYyMTJlIj48L3JlY3Q+CjxwYXRoIGQ9Ik0wIDBMOCA4Wk04IDBMMCA4WiIgc3Ryb2tlPSIjMjEzNzQzIiBzdHJva2Utd2lkdGg9IjEiPjwvcGF0aD4KPC9zdmc+')] bg-cover"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default function BlackjackGame({ onBack }) {
  const [gameState, setGameState] = useState(STATES.BETTING);
  const [betAmount, setBetAmount] = useState(10);
  const [activeBet, setActiveBet] = useState(0);
  const [deck, setDeck] = useState([]);
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [message, setMessage] = useState('');
  const [isDealerRevealed, setIsDealerRevealed] = useState(false);

  const getHandValue = (hand) => {
    let val = 0;
    let aces = 0;
    for (const c of hand) {
      val += c.value;
      if (c.rank === 'A') aces++;
    }
    while (val > 21 && aces > 0) {
      val -= 10;
      aces--;
    }
    return val;
  };

  const startGame = () => {
    let newDeck = createDeck(4).map((c, i) => ({ ...c, id: `card-${i}-${Math.random()}` })).sort(() => Math.random() - 0.5);
    const p1 = newDeck.pop();
    const d1 = newDeck.pop();
    const p2 = newDeck.pop();
    const d2 = newDeck.pop();

    setDeck(newDeck);
    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setGameState(STATES.DEAL);
    setActiveBet(betAmount);
    setMessage('');
    setIsDealerRevealed(false);

    setTimeout(() => {
       const pVal = getHandValue([p1, p2]);
       const dVal = getHandValue([d1, d2]);
       if (pVal === 21) {
         setIsDealerRevealed(true);
         if (dVal === 21) {
           endGame('Push! Both have Blackjack', 'push');
         } else {
           endGame('Blackjack!', 'win', 1.5);
         }
       } else {
         setGameState(STATES.PLAYER_TURN);
       }
    }, 1500);
  };

  const endGame = (msg, type, multiplier = 1) => {
     setMessage(msg);
     setGameState(STATES.PAYOUT);
     setIsDealerRevealed(true);
  };

  const playDealerTurn = async (currentDealerHand, currentDeck, finalPlayerVal) => {
    setIsDealerRevealed(true);
    let val = getHandValue(currentDealerHand);
    
    await new Promise(r => setTimeout(r, 800));
    
    while (val < 17) {
      const card = currentDeck.pop();
      currentDealerHand.push(card);
      setDealerHand([...currentDealerHand]);
      setDeck([...currentDeck]);
      val = getHandValue(currentDealerHand);
      await new Promise(r => setTimeout(r, 800));
    }
    
    if (val > 21) {
      endGame('Dealer Busts! You Win', 'win');
    } else if (val > finalPlayerVal) {
      endGame('Dealer Wins', 'lose');
    } else if (val < finalPlayerVal) {
      endGame('You Win!', 'win');
    } else {
      endGame('Push', 'push');
    }
  };

  const hit = () => {
    let newDeck = [...deck];
    const card = newDeck.pop();
    setDeck(newDeck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    
    const val = getHandValue(newHand);
    if (val > 21) {
      setTimeout(() => endGame('Bust! You Lose', 'lose'), 500);
    } else if (val === 21) {
      setGameState(STATES.DEALER_TURN);
      playDealerTurn([...dealerHand], newDeck, val);
    }
  };

  const stand = () => {
    setGameState(STATES.DEALER_TURN);
    playDealerTurn([...dealerHand], [...deck], getHandValue(playerHand));
  };

  const doubleDown = () => {
    let newDeck = [...deck];
    const card = newDeck.pop();
    setDeck(newDeck);
    const newHand = [...playerHand, card];
    setPlayerHand(newHand);
    setActiveBet(b => b * 2);

    const val = getHandValue(newHand);
    if (val > 21) {
      setTimeout(() => endGame('Bust! You Lose', 'lose'), 500);
    } else {
      setGameState(STATES.DEALER_TURN);
      playDealerTurn([...dealerHand], newDeck, val);
    }
  };

  const pVal = getHandValue(playerHand);
  const dVal = getHandValue(dealerHand);
  const displayDVal = isDealerRevealed ? dVal : dealerHand.length > 1 ? getHandValue([dealerHand[1]]) : 0;

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={gameState !== STATES.BETTING}
      />
      
      {gameState === STATES.BETTING || gameState === STATES.PAYOUT ? (
        <button 
          onClick={startGame} 
          className="w-full bg-[#00E701] text-[#0F212E] py-4 rounded-lg font-bold text-lg hover:bg-[#00E701]/90 transition-colors shadow-[0_0_15px_rgba(0,231,1,0.2)]"
        >
          {gameState === STATES.PAYOUT ? 'Play Again' : 'Bet'}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={hit} 
              disabled={gameState !== STATES.PLAYER_TURN} 
              className="bg-[#213743] hover:bg-[#2A4454] border border-white/5 py-3 rounded-lg text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hit
            </button>
            <button 
              onClick={stand} 
              disabled={gameState !== STATES.PLAYER_TURN} 
              className="bg-[#213743] hover:bg-[#2A4454] border border-white/5 py-3 rounded-lg text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Stand
            </button>
          </div>
          <button 
            onClick={doubleDown} 
            disabled={gameState !== STATES.PLAYER_TURN || playerHand.length > 2} 
            className="w-full bg-[#1A2C38] border border-[#00E701]/30 hover:border-[#00E701] py-3 rounded-lg text-[#00E701] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Double Down
          </button>
        </div>
      )}

      {gameState !== STATES.BETTING && (
        <div className="mt-4 p-4 bg-[#0F212E] rounded-lg border border-white/[0.04]">
          <div className="flex justify-between text-sm">
            <span className="text-[#B1BAD3]">Active Bet</span>
            <span className="text-white font-bold">${activeBet.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <GameLayout title="Blackjack" onBack={onBack} controls={controls}>
      <div className="flex-1 flex flex-col items-center justify-between py-12 px-4 relative min-h-[500px]">
        
        {/* Dealer Area */}
        <div className="flex flex-col items-center gap-4 w-full h-[200px]">
          {dealerHand.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mb-2 text-[#B1BAD3] font-bold bg-[#0F212E]/50 px-4 py-1 rounded-full border border-white/5"
            >
              Dealer <span className="text-white ml-2">{displayDVal}</span>
            </motion.div>
          )}
          <div className="flex justify-center h-[144px]">
            <AnimatePresence>
              {dealerHand.map((card, i) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  hidden={!isDealerRevealed && i === 0} 
                  index={i} 
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Center message / Result */}
        <div className="h-20 flex items-center justify-center my-4 z-10">
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`text-2xl md:text-3xl font-display font-bold px-8 py-3 rounded-xl shadow-2xl backdrop-blur-sm
                  ${message.includes('Win') || message.includes('Blackjack') ? 'bg-[#00E701]/20 text-[#00E701] border border-[#00E701]/30' : 
                    message.includes('Lose') || message.includes('Bust') ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 
                    'bg-white/10 text-white border border-white/20'}
                `}
              >
                {message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Player Area */}
        <div className="flex flex-col items-center gap-4 w-full h-[200px]">
          <div className="flex justify-center h-[144px]">
            <AnimatePresence>
              {playerHand.map((card, i) => (
                <Card 
                  key={card.id} 
                  card={card} 
                  hidden={false} 
                  index={i} 
                />
              ))}
            </AnimatePresence>
          </div>
          {playerHand.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-2 text-[#B1BAD3] font-bold bg-[#0F212E]/50 px-4 py-1 rounded-full border border-white/5"
            >
              You <span className="text-white ml-2">{pVal}</span>
            </motion.div>
          )}
        </div>

      </div>
    </GameLayout>
  );
}
