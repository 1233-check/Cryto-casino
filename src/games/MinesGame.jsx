import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Diamond, Bomb, Trophy } from 'lucide-react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { shuffleArray } from '../utils/provablyFair';

function comb(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

function getMultiplier(mines, revealedSafe) {
  if (revealedSafe === 0) return 1.00;
  const totalSafe = 25 - mines;
  const numerator = comb(25, revealedSafe);
  const denominator = comb(totalSafe, revealedSafe);
  const multiplier = (0.99 * numerator) / denominator;
  return Math.floor(multiplier * 100) / 100;
}

export default function MinesGame({ onBack }) {
  const [betAmount, setBetAmount] = useState(1);
  const [minesCount, setMinesCount] = useState(3);
  
  const [gameActive, setGameActive] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  
  const [minesPositions, setMinesPositions] = useState([]);
  const [clickedTiles, setClickedTiles] = useState(Array(25).fill(null));
  const [revealedCount, setRevealedCount] = useState(0);
  
  const [lastWinAmount, setLastWinAmount] = useState(0);

  const startGame = () => {
    // Generate mines using provablyFair shuffleArray
    const arr = Array.from({ length: 25 }, (_, i) => i);
    const shuffled = shuffleArray(arr);
    const selectedMines = shuffled.slice(0, minesCount);
    
    setMinesPositions(selectedMines);
    setClickedTiles(Array(25).fill(null));
    setRevealedCount(0);
    setGameOver(false);
    setWin(false);
    setGameActive(true);
    setLastWinAmount(0);
  };

  const handleTileClick = (index) => {
    if (!gameActive || gameOver || clickedTiles[index] !== null) return;

    const isMine = minesPositions.includes(index);
    const newTiles = [...clickedTiles];
    
    if (isMine) {
      // Explode
      newTiles[index] = 'mine';
      setClickedTiles(newTiles);
      setGameOver(true);
      setGameActive(false);
      setWin(false);
    } else {
      // Safe
      newTiles[index] = 'safe';
      setClickedTiles(newTiles);
      setRevealedCount(prev => prev + 1);
      
      const newRevealedCount = revealedCount + 1;
      const totalSafe = 25 - minesCount;
      
      // Auto cashout if all safe tiles are found
      if (newRevealedCount === totalSafe) {
        handleCashout(newRevealedCount);
      }
    }
  };

  const handleCashout = (overrideCount) => {
    const count = typeof overrideCount === 'number' ? overrideCount : revealedCount;
    if (count === 0) return;
    
    const mult = getMultiplier(minesCount, count);
    const winAmt = betAmount * mult;
    
    setLastWinAmount(winAmt);
    setGameOver(true);
    setGameActive(false);
    setWin(true);
  };

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={gameActive} 
      />
      
      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04]">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase px-3 pt-2 block">Mines</label>
        <div className="px-3 pb-3 pt-1">
          <select
            value={minesCount}
            onChange={(e) => setMinesCount(Number(e.target.value))}
            disabled={gameActive}
            className="w-full bg-[#1A2C38] text-white p-2 rounded outline-none font-bold font-display cursor-pointer"
          >
            {Array.from({ length: 24 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>
      
      {!gameActive ? (
        <button 
          onClick={startGame}
          className="w-full bg-[#00E701] hover:bg-[#00c701] text-black font-bold py-4 rounded-lg uppercase tracking-wide transition-colors mt-2"
        >
          Bet
        </button>
      ) : (
        <button 
          onClick={() => handleCashout()}
          disabled={revealedCount === 0}
          className="w-full bg-[#00E701] hover:bg-[#00c701] disabled:bg-[#0F212E] disabled:text-[#B1BAD3] disabled:cursor-not-allowed text-black font-bold py-4 rounded-lg uppercase tracking-wide transition-colors mt-2"
        >
          {revealedCount === 0 
            ? 'Cashout' 
            : `Cashout ${(betAmount * getMultiplier(minesCount, revealedCount)).toFixed(2)}`}
        </button>
      )}
    </div>
  );

  return (
    <GameLayout title="Mines" onBack={onBack} controls={controls}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative">
        
        {gameActive && revealedCount > 0 && revealedCount < (25 - minesCount) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 bg-[#213743] px-4 py-2 rounded-full border border-white/5 shadow-lg z-10 flex items-center gap-2"
          >
            <span className="text-[#B1BAD3] text-sm font-semibold">Next:</span>
            <span className="text-white font-bold font-display">
               {getMultiplier(minesCount, revealedCount + 1).toFixed(2)}×
            </span>
          </motion.div>
        )}

        <AnimatePresence>
          {gameOver && win && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute z-20 flex flex-col items-center justify-center pointer-events-none"
            >
              <div className="bg-[#00E701]/20 border-2 border-[#00E701] rounded-2xl p-6 backdrop-blur-md flex flex-col items-center shadow-[0_0_50px_rgba(0,231,1,0.3)]">
                <div className="text-[#00E701] text-xl font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Trophy className="w-6 h-6" />
                  You Won!
                </div>
                <div className="text-white text-4xl font-display font-bold">
                  {lastWinAmount.toFixed(2)}
                </div>
                <div className="text-[#00E701] font-semibold mt-1">
                  {getMultiplier(minesCount, revealedCount).toFixed(2)}×
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-5 grid-rows-5 gap-2 sm:gap-3 w-full max-w-[500px] aspect-square relative z-0">
          {Array.from({ length: 25 }).map((_, i) => {
            let state = 'hidden';
            if (clickedTiles[i] === 'safe') state = 'safe';
            else if (clickedTiles[i] === 'mine') state = 'mine';
            else if (gameOver) {
              if (minesPositions.includes(i)) state = 'faded-mine';
              else state = 'faded-safe';
            }

            return (
              <Tile 
                key={i} 
                state={state} 
                disabled={!gameActive || gameOver}
                onClick={() => handleTileClick(i)}
              />
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}

function Tile({ state, onClick, disabled }) {
  const getStyle = () => {
    switch (state) {
      case 'hidden':
        return 'bg-[#2F4553] hover:bg-[#3d5566] hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(0,0,0,0.3)] shadow-[0_4px_0_rgba(0,0,0,0.3)] active:translate-y-1 active:shadow-none cursor-pointer';
      case 'safe':
        return 'bg-[#0F212E] border-2 border-[#00E701] shadow-[inset_0_0_20px_rgba(0,231,1,0.2)] cursor-default';
      case 'mine':
        return 'bg-[#0F212E] border-2 border-[#ff3b30] shadow-[inset_0_0_20px_rgba(255,59,48,0.2)] cursor-default';
      case 'faded-mine':
        return 'bg-[#0F212E] opacity-50 cursor-default border border-white/5';
      case 'faded-safe':
        return 'bg-[#2F4553] opacity-30 cursor-default';
      default:
        return 'bg-[#2F4553] cursor-pointer';
    }
  };

  return (
    <button
      disabled={disabled || state !== 'hidden'}
      onClick={onClick}
      className={`rounded-lg flex items-center justify-center transition-all duration-200 w-full h-full relative ${getStyle()}`}
    >
      <div className="absolute inset-0 bg-white/[0.02] rounded-lg pointer-events-none" />
      <AnimatePresence>
        {state === 'safe' && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center justify-center absolute inset-0"
          >
            <Diamond className="w-8 h-8 text-[#00E701] drop-shadow-[0_0_10px_rgba(0,231,1,0.8)] fill-[#00E701]/20" />
          </motion.div>
        )}
        {state === 'mine' && (
          <motion.div
            initial={{ scale: 0, rotate: 45 }}
            animate={{ scale: 1, rotate: 0 }}
            className="flex items-center justify-center absolute inset-0"
          >
            <Bomb className="w-8 h-8 text-[#ff3b30] drop-shadow-[0_0_10px_rgba(255,59,48,0.8)]" />
          </motion.div>
        )}
        {state === 'faded-mine' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center absolute inset-0"
          >
            <Bomb className="w-6 h-6 text-white/30" />
          </motion.div>
        )}
        {state === 'faded-safe' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center absolute inset-0"
          >
            <Diamond className="w-6 h-6 text-white/30 fill-white/10" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}
