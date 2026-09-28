import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';
import { playSound } from '../utils/audio';

const SUITS = ['♠', '♥', '♣', '♦'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];

const RANK_VALUES = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

const PAYTABLE = {
  ROYAL_FLUSH: { name: "Royal Flush", multi: 800 },
  STRAIGHT_FLUSH: { name: "Straight Flush", multi: 50 },
  FOUR_OF_A_KIND: { name: "Four of a Kind", multi: 25 },
  FULL_HOUSE: { name: "Full House", multi: 9 },
  FLUSH: { name: "Flush", multi: 6 },
  STRAIGHT: { name: "Straight", multi: 4 },
  THREE_OF_A_KIND: { name: "Three of a Kind", multi: 3 },
  TWO_PAIR: { name: "Two Pair", multi: 2 },
  JACKS_OR_BETTER: { name: "Jacks or Better", multi: 1 },
  NONE: { name: "Nothing", multi: 0 }
};

function generateDeck() {
  let deck = [];
  for (let s of SUITS) {
    for (let r of RANKS) {
      deck.push({ rank: r, suit: s });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function evaluateHand(hand) {
  const ranks = hand.map(c => RANK_VALUES[c.rank]).sort((a, b) => a - b);
  const suits = hand.map(c => c.suit);
  
  const isFlush = suits.every(s => s === suits[0]);
  
  let isStraight = false;
  if (ranks[4] - ranks[0] === 4 && new Set(ranks).size === 5) {
    isStraight = true;
  } else if (ranks.join(',') === '2,3,4,5,14') {
    isStraight = true;
  }
  
  const rankCounts = {};
  for (let r of ranks) {
    rankCounts[r] = (rankCounts[r] || 0) + 1;
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a);
  
  if (isFlush && isStraight) {
    if (ranks[0] === 10 && ranks[4] === 14) return PAYTABLE.ROYAL_FLUSH;
    return PAYTABLE.STRAIGHT_FLUSH;
  }
  
  if (counts[0] === 4) return PAYTABLE.FOUR_OF_A_KIND;
  if (counts[0] === 3 && counts[1] === 2) return PAYTABLE.FULL_HOUSE;
  if (isFlush) return PAYTABLE.FLUSH;
  if (isStraight) return PAYTABLE.STRAIGHT;
  if (counts[0] === 3) return PAYTABLE.THREE_OF_A_KIND;
  if (counts[0] === 2 && counts[1] === 2) return PAYTABLE.TWO_PAIR;
  
  if (counts[0] === 2) {
    const pairRanks = Object.keys(rankCounts).filter(r => rankCounts[r] === 2).map(Number);
    if (pairRanks.some(r => r >= 11)) {
      return PAYTABLE.JACKS_OR_BETTER;
    }
  }
  
  return PAYTABLE.NONE;
}

const PlayingCard = ({ card, held, onToggleHold, hidden }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  return (
    <div className="relative group w-14 sm:w-16 md:w-24 lg:w-32 aspect-[2/3] cursor-pointer" style={{ perspective: 1000 }} onClick={onToggleHold}>
      <AnimatePresence>
        {held && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-6 md:-top-8 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[10px] md:text-xs font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded shadow-lg z-10 uppercase tracking-widest"
          >
            Hold
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        className="w-full h-full relative"
        initial={false}
        animate={{ rotateY: hidden ? 180 : 0, y: held ? -10 : 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div 
          className="absolute inset-0 bg-white rounded-lg md:rounded-xl shadow-xl border border-gray-200 flex flex-col justify-between p-1 md:p-3 overflow-hidden select-none"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className={`text-sm sm:text-base md:text-2xl font-bold leading-none ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
            <div>{card.rank}</div>
            <div className="text-base sm:text-lg md:text-3xl leading-none">{card.suit}</div>
          </div>
          
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl sm:text-4xl md:text-7xl opacity-20 ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
            {card.suit}
          </div>
          
          <div className={`text-sm sm:text-base md:text-2xl font-bold leading-none rotate-180 ${isRed ? 'text-red-500' : 'text-gray-900'}`}>
            <div>{card.rank}</div>
            <div className="text-base sm:text-lg md:text-3xl leading-none">{card.suit}</div>
          </div>
        </div>
        
        {/* Back */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg md:rounded-xl shadow-xl border border-white/20 flex items-center justify-center select-none"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <div className="w-full h-full m-1 md:m-1.5 border border-blue-400/30 rounded-lg opacity-50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.1)_10px,rgba(255,255,255,0.1)_20px)]"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default function VideoPokerGame({ onBack }) {
  const [betAmount, setBetAmount] = useState(1);
  const [deck, setDeck] = useState([]);
  const [hand, setHand] = useState(Array(5).fill({ rank: 'A', suit: '♠' }));
  const [hiddenCards, setHiddenCards] = useState(Array(5).fill(true));
  const [held, setHeld] = useState(Array(5).fill(false));
  const [gameState, setGameState] = useState('IDLE');
  const [result, setResult] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const maxBet = getBalance();

  const handleDeal = () => {
    if (isAnimating) return;

    if (gameState === 'IDLE') {
      const newBalance = subtractFromBalance(betAmount);
      if (newBalance === null) return;
      playSound('bet');
      
      setIsAnimating(true);
      
      const newDeck = generateDeck();
      const newHand = newDeck.splice(0, 5);
      
      setDeck(newDeck);
      setHand(newHand);
      setHeld(Array(5).fill(false));
      setHiddenCards(Array(5).fill(true));
      setGameState('DEALT');
      setResult(null);

      setTimeout(() => setHiddenCards(h => [false, h[1], h[2], h[3], h[4]]), 100);
      setTimeout(() => setHiddenCards(h => [h[0], false, h[2], h[3], h[4]]), 200);
      setTimeout(() => setHiddenCards(h => [h[0], h[1], false, h[3], h[4]]), 300);
      setTimeout(() => setHiddenCards(h => [h[0], h[1], h[2], false, h[4]]), 400);
      setTimeout(() => {
        setHiddenCards(h => [h[0], h[1], h[2], h[3], false]);
        const currentWin = evaluateHand(newHand);
        if (currentWin.name !== 'Nothing') {
          playSound('win');
        }
        setIsAnimating(false);
      }, 500);

    } else if (gameState === 'DEALT') {
      playSound('click');
      setIsAnimating(true);
      
      let currentDeck = [...deck];
      let newHand = [...hand];
      let flipSequence = [...hiddenCards];
      
      const newlyDrawnIndexes = [];
      for (let i = 0; i < 5; i++) {
        if (!held[i]) {
          flipSequence[i] = true;
          newlyDrawnIndexes.push(i);
        }
      }
      
      if (newlyDrawnIndexes.length > 0) {
        setHiddenCards(flipSequence);
        
        setTimeout(() => {
          for (let i = 0; i < 5; i++) {
            if (!held[i]) {
              newHand[i] = currentDeck.pop();
            }
          }
          setHand(newHand);
          
          let delay = 100;
          newlyDrawnIndexes.forEach(idx => {
            setTimeout(() => {
              setHiddenCards(h => {
                const next = [...h];
                next[idx] = false;
                return next;
              });
            }, delay);
            delay += 100;
          });

          setTimeout(() => finishGame(newHand), delay + 200);
        }, 300);
      } else {
        finishGame(newHand);
      }
    }
  };

  const finishGame = (finalHand) => {
    const evalResult = evaluateHand(finalHand);
    setResult(evalResult);
    setGameState('IDLE');
    setIsAnimating(false);
    
    if (evalResult.multi > 0) {
      const winAmount = betAmount * evalResult.multi;
      addToBalance(winAmount);
      addHistoryEntry({
        game: 'Video Poker',
        bet: betAmount,
        payout: winAmount,
        multiplier: evalResult.multi,
        result: evalResult.name
      });
      playSound('win');
    } else {
      addHistoryEntry({
        game: 'Video Poker',
        bet: betAmount,
        payout: 0,
        multiplier: 0,
        result: 'Loss'
      });
    }
  };

  const toggleHold = (index) => {
    if (gameState === 'DEALT' && !isAnimating) {
      playSound('click');
      const newHeld = [...held];
      newHeld[index] = !newHeld[index];
      setHeld(newHeld);
    }
  };

  const controls = (
    <div className="flex flex-col gap-4">
      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3 text-sm shadow-inner overflow-hidden">
        <div className="text-yellow-400 font-bold mb-2 uppercase text-xs tracking-wider">Paytable</div>
        <div className="flex flex-col">
          {Object.values(PAYTABLE).filter(p => p.multi > 0).map(p => (
            <div key={p.name} className={`flex justify-between py-1 border-b border-white/[0.02] last:border-0 transition-colors ${result?.name === p.name ? 'text-[#00E701] font-bold bg-white/[0.05] -mx-3 px-3' : 'text-[#B1BAD3]'}`}>
              <span>{p.name}</span>
              <span>{p.multi}x</span>
            </div>
          ))}
        </div>
      </div>

      <BetControls
        betAmount={betAmount}
        setBetAmount={setBetAmount}
        maxBet={maxBet}
        disabled={gameState !== 'IDLE' || isAnimating}
      />
      
      <button
        onClick={handleDeal}
        disabled={(gameState === 'IDLE' && (betAmount > getBalance() || betAmount <= 0)) || isAnimating}
        className="w-full bg-[#00E701] hover:bg-[#00E701]/90 disabled:bg-[#304554] disabled:text-[#B1BAD3] text-[#0F212E] font-bold py-4 rounded-lg transition-colors font-display text-lg tracking-wide shadow-lg"
      >
        {gameState === 'IDLE' ? 'DEAL' : 'DRAW'}
      </button>
    </div>
  );

  return (
    <GameLayout title="Video Poker" onBack={onBack} controls={controls}>
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        
        <div className="h-20 mb-4 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ scale: 0.8, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: -20 }}
                className={`text-2xl md:text-4xl font-display font-bold text-center ${result.multi > 0 ? 'text-[#00E701]' : 'text-[#B1BAD3]'}`}
              >
                {result.multi > 0 ? (
                  <>
                    <div className="text-yellow-400 mb-1 drop-shadow-md">{result.name}!</div>
                    <div>+{(betAmount * result.multi).toFixed(4)}</div>
                  </>
                ) : (
                  'Game Over'
                )}
              </motion.div>
            ) : gameState === 'DEALT' && !isAnimating ? (
              <motion.div
                key="prompt"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-white text-lg md:text-xl font-display bg-[#0F212E]/50 px-6 py-2 rounded-full border border-white/10 shadow-lg"
              >
                Select cards to hold
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="flex gap-2 sm:gap-3 md:gap-4 lg:gap-6 justify-center">
          {hand.map((card, i) => (
            <PlayingCard
              key={i}
              card={card}
              held={held[i]}
              hidden={hiddenCards[i]}
              onToggleHold={() => toggleHold(i)}
            />
          ))}
        </div>
        
      </div>
    </GameLayout>
  );
}
