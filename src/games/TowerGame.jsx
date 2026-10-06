import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { Gem, Bomb, ShieldCheck, Skull } from 'lucide-react';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

const difficulties = {
  easy: { cols: 4, safe: 3, bombs: 1, name: 'Easy' },
  medium: { cols: 3, safe: 2, bombs: 1, name: 'Medium' },
  hard: { cols: 2, safe: 1, bombs: 1, name: 'Hard' }
};

const getMultiplier = (diffKey, level) => {
  if (level === 0) return 1.00;
  const d = difficulties[diffKey];
  const val = 0.98 * Math.pow(d.cols / d.safe, level);
  return Math.floor(val * 100) / 100;
};

export default function TowerGame({ onBack }) {
  const [balance, setBalanceState] = useState(getBalance());
  const [difficulty, setDifficulty] = useState('easy');
  const [betAmount, setBetAmount] = useState(0.1);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'cashed_out', 'game_over'
  const [currentFloor, setCurrentFloor] = useState(0); 
  const [tower, setTower] = useState([]);
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  const startGame = () => {
    if (betAmount <= 0) return;
    const newBal = subtractFromBalance(betAmount);
    if (newBal === null) return alert('Insufficient balance');
    setBalanceState(newBal);

    const d = difficulties[difficulty];
    const newTower = Array(10).fill(null).map(() => {
      const bombIndex = Math.floor(Math.random() * d.cols);
      return { bombIndex, pickedIndex: null };
    });
    setTower(newTower);
    setCurrentFloor(0);
    setGameState('playing');
    setProfit(0);
  };

  const handleCashout = () => {
    if (gameState !== 'playing' || currentFloor === 0) return;
    const mult = getMultiplier(difficulty, currentFloor);
    const payout = parseFloat((betAmount * mult).toFixed(8));
    const profitVal = parseFloat((payout - betAmount).toFixed(8));
    addToBalance(payout);
    addHistoryEntry({
      game: 'tower',
      bet: betAmount,
      payout,
      profit: profitVal,
      multiplier: mult,
      details: { difficulty, clearedFloors: currentFloor, hitBomb: false }
    });
    setProfit(profitVal);
    setGameState('cashed_out');
  };

  const handleTileClick = (floorIndex, colIndex) => {
    if (gameState !== 'playing' || floorIndex !== currentFloor) return;

    const floorData = tower[floorIndex];
    const isBomb = floorData.bombIndex === colIndex;

    const newTower = [...tower];
    newTower[floorIndex] = { ...floorData, pickedIndex: colIndex };
    setTower(newTower);

    if (isBomb) {
      setGameState('game_over');
      setProfit(-betAmount);
      addHistoryEntry({
        game: 'tower',
        bet: betAmount,
        payout: 0,
        profit: -betAmount,
        multiplier: 0,
        details: { difficulty, clearedFloors: currentFloor, hitBomb: true }
      });
    } else {
      if (currentFloor === 9) {
        const mult = getMultiplier(difficulty, 10);
        const payout = parseFloat((betAmount * mult).toFixed(8));
        const profitVal = parseFloat((payout - betAmount).toFixed(8));
        addToBalance(payout);
        addHistoryEntry({
          game: 'tower',
          bet: betAmount,
          payout,
          profit: profitVal,
          multiplier: mult,
          details: { difficulty, clearedFloors: 10, hitBomb: false }
        });
        setProfit(profitVal);
        setGameState('cashed_out');
        setCurrentFloor(10);
      } else {
        setCurrentFloor(prev => prev + 1);
      }
    }
  };

  const renderTile = (floorIndex, colIndex) => {
    const floorData = tower[floorIndex];
    const isCurrentFloor = gameState === 'playing' && floorIndex === currentFloor;
    const isPastFloor = gameState !== 'idle' && floorIndex < currentFloor;
    const isFutureFloor = floorIndex > currentFloor;
    const isGameOver = gameState === 'game_over';
    const isCashedOut = gameState === 'cashed_out';

    let isPicked = false;
    let isBomb = false;
    
    if (floorData) {
      isPicked = floorData.pickedIndex === colIndex;
      isBomb = floorData.bombIndex === colIndex;
    }

    // Advanced UI Styling
    let content = null;
    let bgStyle = "bg-[#2F4553] border-b-4 border-[#213743]"; 
    let opacityStyle = "opacity-100";
    let interactiveStyle = "cursor-default";

    if (gameState === 'idle') {
      bgStyle = "bg-[#2F4553] border-b-4 border-[#213743] opacity-60";
    } else if (isCurrentFloor) {
      bgStyle = "bg-[#3A5364] border-b-4 border-[#2C4151] hover:bg-[#456175] hover:border-[#334D61] active:border-b-0 active:translate-y-1";
      interactiveStyle = "cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.3)]";
    } else if (isFutureFloor) {
      opacityStyle = "opacity-40";
    }

    if (isPicked) {
      if (isBomb) {
        bgStyle = "bg-gradient-to-b from-[#ED4163] to-[#C12543] border-b-4 border-[#93152D]";
        content = <Skull className="text-white w-6 h-6 animate-pulse" />;
      } else {
        bgStyle = "bg-gradient-to-b from-[#00E701] to-[#00C001] border-b-4 border-[#009201]";
        content = <ShieldCheck className="text-[#0F212E] w-6 h-6" />;
      }
      interactiveStyle = "cursor-default shadow-[0_0_20px_rgba(0,231,1,0.3)] border-b-0 translate-y-1";
    } else if (gameState !== 'idle' && (isGameOver || isCashedOut)) {
      if (isBomb) {
        content = <Bomb className="text-[#ED4163] w-6 h-6 opacity-30" />;
        bgStyle = "bg-[#2F4553] border-b-4 border-[#213743]";
      } else {
        content = <Gem className="text-[#00E701] w-6 h-6 opacity-30" />;
      }
      opacityStyle = "opacity-40";
    } else if (isPastFloor && !isPicked) {
      opacityStyle = "opacity-20";
    }

    return (
      <motion.button
        key={colIndex}
        disabled={!isCurrentFloor}
        onClick={() => handleTileClick(floorIndex, colIndex)}
        initial={false}
        animate={{ scale: isPicked ? 1.05 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`flex-1 h-14 md:h-16 rounded-xl flex items-center justify-center transition-colors duration-200 
          ${bgStyle} ${interactiveStyle} ${opacityStyle} relative overflow-hidden`}
      >
        {isCurrentFloor && !isPicked && (
          <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity"></div>
        )}
        {content}
      </motion.button>
    );
  };

  const controls = (
    <div className="flex flex-col gap-4">
      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 flex flex-col gap-3 shadow-inner">
        <label className="text-xs text-[#B1BAD3] font-bold uppercase tracking-wider">Difficulty</label>
        <div className="flex gap-2">
          {Object.entries(difficulties).map(([key, diff]) => (
            <button
              key={key}
              disabled={gameState === 'playing'}
              onClick={() => setDifficulty(key)}
              className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all duration-200 ${
                difficulty === key 
                  ? 'bg-gradient-to-b from-[#2F4553] to-[#213743] text-white shadow-[0_2px_10px_rgba(0,0,0,0.3)] ring-1 ring-white/10' 
                  : 'bg-[#1A2C38] text-[#8790a1] hover:text-white hover:bg-[#213743] disabled:opacity-50'
              }`}
            >
              {diff.name}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 shadow-inner">
        <BetControls 
          betAmount={betAmount} 
          setBetAmount={setBetAmount}
          disabled={gameState === 'playing'}
        />
      </div>

      <AnimatePresence mode="wait">
        {gameState === 'playing' ? (
          <motion.button 
            key="cashout"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={handleCashout}
            disabled={currentFloor === 0}
            className="w-full py-4 rounded-xl font-bold text-black uppercase tracking-wider transition-all
                       bg-gradient-to-b from-[#00E701] to-[#00C001] shadow-[0_4px_15px_rgba(0,231,1,0.2)] 
                       hover:shadow-[0_6px_20px_rgba(0,231,1,0.3)] hover:-translate-y-0.5 active:translate-y-0
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Cashout {currentFloor > 0 ? (betAmount * getMultiplier(difficulty, currentFloor)).toFixed(2) : ''}
          </motion.button>
        ) : (
          <motion.button 
            key="bet"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onClick={startGame}
            disabled={betAmount > balance}
            className="w-full py-4 rounded-xl font-bold text-black uppercase tracking-wider transition-all
                       bg-gradient-to-b from-[#00E701] to-[#00C001] shadow-[0_4px_15px_rgba(0,231,1,0.2)] 
                       hover:shadow-[0_6px_20px_rgba(0,231,1,0.3)] hover:-translate-y-0.5 active:translate-y-0
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            Bet
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <GameLayout title="Tower" onBack={onBack} controls={controls} balance={balance}>
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 relative bg-gradient-to-b from-[#0F212E] to-[#1A2C38]/50">
        
        {/* Status Overlay */}
        <AnimatePresence>
          {gameState === 'cashed_out' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#0F212E]/90 text-[#00E701] px-8 py-4 rounded-2xl font-black text-2xl md:text-3xl border-2 border-[#00E701]/30 shadow-[0_0_30px_rgba(0,231,1,0.3)] backdrop-blur-md z-20 flex flex-col items-center"
            >
              <span className="text-sm font-bold text-[#B1BAD3] uppercase tracking-widest mb-1">You Won</span>
              +{profit.toFixed(4)}
            </motion.div>
          )}
          {gameState === 'game_over' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute top-8 left-1/2 -translate-x-1/2 bg-[#0F212E]/90 text-[#ED4163] px-8 py-4 rounded-2xl font-black text-2xl md:text-3xl border-2 border-[#ED4163]/30 shadow-[0_0_30px_rgba(237,65,99,0.3)] backdrop-blur-md z-20 flex flex-col items-center"
            >
              <span className="text-sm font-bold text-[#B1BAD3] uppercase tracking-widest mb-1">Busted</span>
              {profit.toFixed(4)}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full max-w-xl mx-auto flex flex-col gap-2 relative z-10">
          {[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(floorIndex => {
            const mult = getMultiplier(difficulty, floorIndex + 1).toFixed(2);
            const isActive = gameState === 'playing' && currentFloor === floorIndex;
            const isPassed = gameState !== 'idle' && currentFloor > floorIndex;
            
            return (
              <div key={floorIndex} className="flex gap-4 items-center group">
                <div className="flex-1 flex gap-2">
                  {Array(difficulties[difficulty].cols).fill(null).map((_, colIndex) => (
                    renderTile(floorIndex, colIndex)
                  ))}
                </div>
                <div className={`w-16 text-sm font-bold font-display text-right transition-all duration-300
                  ${isActive ? 'text-white scale-125 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 
                    isPassed ? 'text-[#00E701]' : 'text-[#557086] group-hover:text-[#B1BAD3]'}`}
                >
                  {mult}x
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </GameLayout>
  );
}
