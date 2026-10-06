import React, { useState, useRef, useEffect } from 'react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { createDeck, RANKS } from '../utils/constants';

const Card = ({ card, size = 'large', className = "" }) => {
  if (!card) return (
    <div className={`bg-[#2F4553] rounded-xl flex items-center justify-center font-display border border-white/5 ${className}`}>
      <div className="border-2 border-white/10 rounded-lg w-3/4 h-3/4"></div>
    </div>
  );

  const isRed = card.suit === '♥' || card.suit === '♦';
  const textColor = isRed ? 'text-[#ff1f44]' : 'text-black';
  
  const rankSize = size === 'large' ? 'text-3xl' : 'text-sm';
  const suitSize = size === 'large' ? 'text-2xl' : 'text-xs';
  const centerSuitSize = size === 'large' ? 'text-8xl' : 'text-3xl';
  
  return (
    <div className={`bg-white rounded-xl shadow-2xl flex flex-col justify-between font-display relative overflow-hidden ${size === 'large' ? 'p-4' : 'p-2'} ${className} ${textColor}`}>
      <div>
        <div className={`text-left font-bold leading-none ${rankSize}`}>{card.rank}</div>
        <div className={`text-left leading-none mt-1 ${suitSize}`}>{card.suit}</div>
      </div>
      
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${centerSuitSize}`}>
        {card.suit}
      </div>
      
      <div className="rotate-180">
        <div className={`text-left font-bold leading-none ${rankSize}`}>{card.rank}</div>
        <div className={`text-left leading-none mt-1 ${suitSize}`}>{card.suit}</div>
      </div>
    </div>
  );
};

import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

export default function HiLoGame({ onBack }) {
  const [balance, setBalanceState] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentCard, setCurrentCard] = useState(null);
  const [drawnCards, setDrawnCards] = useState([]);
  const [cumulativeMultiplier, setCumulativeMultiplier] = useState(1);
  const [status, setStatus] = useState('idle'); // 'idle', 'playing', 'lost', 'cashed_out'

  const scrollRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [drawnCards]);

  const getV = (card) => RANKS.indexOf(card.rank) + 1;
  
  const getHighMultiplier = (card) => {
    const v = getV(card);
    return 0.99 * (13 / (14 - v));
  };

  const getLowMultiplier = (card) => {
    const v = getV(card);
    return 0.99 * (13 / v);
  };

  const handleStart = () => {
    if (betAmount <= 0) return;
    const newBal = subtractFromBalance(betAmount);
    if (newBal === null) return alert('Insufficient balance');
    setBalanceState(newBal);

    setIsPlaying(true);
    setStatus('playing');
    setCumulativeMultiplier(1);
    const deck = createDeck();
    const firstCard = deck[Math.floor(Math.random() * deck.length)];
    setCurrentCard(firstCard);
    setDrawnCards([firstCard]);
  };

  const handleGuess = (guess) => {
    if (!isPlaying) return;
    
    const deck = createDeck();
    const newCard = deck[Math.floor(Math.random() * deck.length)];
    
    const oldV = getV(currentCard);
    const newV = getV(newCard);
    
    const stepMultiplier = guess === 'higher' 
      ? getHighMultiplier(currentCard) 
      : getLowMultiplier(currentCard);
    
    const isWin = guess === 'higher' ? newV >= oldV : newV <= oldV;
    
    setDrawnCards(prev => [...prev, newCard]);
    setCurrentCard(newCard);
    
    if (isWin) {
      setCumulativeMultiplier(prev => prev * stepMultiplier);
    } else {
      setIsPlaying(false);
      setStatus('lost');
      addHistoryEntry({
        game: 'hilo',
        bet: betAmount,
        payout: 0,
        profit: -betAmount,
        multiplier: 0,
        details: { stepsCompleted: drawnCards.length, lost: true }
      });
    }
  };

  const handleCashout = () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    setStatus('cashed_out');
    const finalMult = parseFloat(cumulativeMultiplier.toFixed(4));
    const payout = parseFloat((betAmount * finalMult).toFixed(8));
    const profitVal = parseFloat((payout - betAmount).toFixed(8));
    if (payout > 0) {
      addToBalance(payout);
    }
    addHistoryEntry({
      game: 'hilo',
      bet: betAmount,
      payout,
      profit: profitVal,
      multiplier: finalMult,
      details: { stepsCompleted: drawnCards.length - 1, lost: false }
    });
  };

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={isPlaying} 
      />

      {isPlaying ? (
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => handleGuess('higher')} 
              className="flex-1 bg-[#2F4553] hover:bg-[#3d5565] text-white py-3 px-2 rounded-lg font-bold text-sm transition-colors flex flex-col items-center justify-center gap-1 shadow-lg"
            >
               <span className="text-xs uppercase tracking-wider text-[#B1BAD3]">Higher or Same</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-[#00E701] text-lg leading-none">
                   {currentCard ? getHighMultiplier(currentCard).toFixed(2) : '0.00'}x
                 </span>
               </div>
               <span className="text-white/40 text-[10px]">
                 {currentCard ? ((14 - getV(currentCard)) / 13 * 100).toFixed(1) : 0}%
               </span>
            </button>
            <button 
              onClick={() => handleGuess('lower')} 
              className="flex-1 bg-[#2F4553] hover:bg-[#3d5565] text-white py-3 px-2 rounded-lg font-bold text-sm transition-colors flex flex-col items-center justify-center gap-1 shadow-lg"
            >
               <span className="text-xs uppercase tracking-wider text-[#B1BAD3]">Lower or Same</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-[#00E701] text-lg leading-none">
                   {currentCard ? getLowMultiplier(currentCard).toFixed(2) : '0.00'}x
                 </span>
               </div>
               <span className="text-white/40 text-[10px]">
                 {currentCard ? (getV(currentCard) / 13 * 100).toFixed(1) : 0}%
               </span>
            </button>
          </div>

          <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3 flex justify-between items-center">
            <label className="text-xs text-[#B1BAD3] font-semibold uppercase">Total Multiplier</label>
            <div className="text-white font-bold font-display text-lg">
              {cumulativeMultiplier.toFixed(2)}x
            </div>
          </div>

          <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3 flex justify-between items-center">
            <label className="text-xs text-[#B1BAD3] font-semibold uppercase">Profit</label>
            <div className="text-[#00E701] font-bold font-display text-lg">
              +{(betAmount * cumulativeMultiplier - betAmount).toFixed(4)}
            </div>
          </div>

          <button
            onClick={handleCashout}
            className="w-full bg-[#00E701] hover:bg-[#00c701] text-black font-bold uppercase py-4 rounded-lg transition-colors mt-2"
          >
            Cashout ({(betAmount * cumulativeMultiplier).toFixed(2)})
          </button>
        </div>
      ) : (
        <button
          onClick={handleStart}
          disabled={betAmount <= 0}
          className="w-full bg-[#00E701] hover:bg-[#00c701] text-black font-bold uppercase py-4 rounded-lg transition-colors mt-2 disabled:opacity-50"
        >
          Bet
        </button>
      )}
    </div>
  );

  return (
    <GameLayout
      title="HiLo"
      balance={balance}
      onBack={onBack}
      controls={controls}
    >
      <div className="flex-1 flex flex-col relative h-full">
        {/* History */}
        <div className="bg-[#0F212E]/50 border-b border-white/[0.04] px-4 py-3 min-h-[90px]">
          <div ref={scrollRef} className="flex gap-2 overflow-x-auto whitespace-nowrap items-center hide-scrollbar scroll-smooth">
            {drawnCards.map((c, i) => {
              const isLast = i === drawnCards.length - 1;
              return (
                <div key={i} className={`transition-all duration-300 ${isLast && status === 'playing' ? 'scale-100' : 'opacity-60 scale-90'}`}>
                  <Card card={c} size="small" className="w-12 h-16 shrink-0" />
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Active Game Area */}
        <div className="flex-1 flex items-center justify-center p-8 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <div className="text-[20rem] font-display font-bold">HiLo</div>
          </div>

          {currentCard ? (
            <div className="flex flex-col items-center gap-8 z-10 relative">
              <div className="relative">
                <Card card={currentCard} size="large" className="w-56 h-80 shadow-[0_0_50px_rgba(0,0,0,0.5)] transform hover:scale-105 transition-transform duration-300" />
                
                {/* Result Overlays */}
                {status === 'lost' && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <div className="text-[#ff1f44] font-display font-bold text-4xl transform -rotate-12 uppercase tracking-widest border-4 border-[#ff1f44] px-4 py-2 rounded-lg">
                      Busted
                    </div>
                  </div>
                )}
                
                {status === 'cashed_out' && (
                  <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <div className="text-[#00E701] font-display font-bold text-4xl transform -rotate-12 uppercase tracking-widest border-4 border-[#00E701] px-4 py-2 rounded-lg">
                      Won!
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="z-10 flex flex-col items-center gap-4">
              <div className="w-56 h-80 border-2 border-dashed border-white/20 rounded-xl flex items-center justify-center">
                <span className="text-[#B1BAD3] font-display font-medium text-lg uppercase tracking-widest">
                  Place a bet
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </GameLayout>
  );
}
