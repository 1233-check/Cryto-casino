import React, { useState } from 'react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { Gem, Bomb } from 'lucide-react';

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
  const [difficulty, setDifficulty] = useState('easy');
  const [betAmount, setBetAmount] = useState(10);
  const [gameState, setGameState] = useState('idle'); // 'idle', 'playing', 'cashed_out', 'game_over'
  const [currentFloor, setCurrentFloor] = useState(0); 
  const [tower, setTower] = useState([]);
  const [profit, setProfit] = useState(0);

  const startGame = () => {
    const d = difficulties[difficulty];
    const newTower = Array(10).fill(null).map(() => {
      const bombIndex = Math.floor(Math.random() * d.cols);
      return {
        bombIndex,
        pickedIndex: null
      };
    });
    setTower(newTower);
    setCurrentFloor(0);
    setGameState('playing');
    setProfit(0);
  };

  const handleCashout = () => {
    if (gameState !== 'playing' || currentFloor === 0) return;
    const mult = getMultiplier(difficulty, currentFloor);
    setProfit(betAmount * mult);
    setGameState('cashed_out');
  };

  const handleTileClick = (floorIndex, colIndex) => {
    if (gameState !== 'playing' || floorIndex !== currentFloor) return;

    const floorData = tower[floorIndex];
    const isBomb = floorData.bombIndex === colIndex;

    const newTower = [...tower];
    newTower[floorIndex] = {
      ...floorData,
      pickedIndex: colIndex
    };
    setTower(newTower);

    if (isBomb) {
      setGameState('game_over');
      setProfit(0);
    } else {
      if (currentFloor === 9) {
        // Auto cashout on top floor
        const mult = getMultiplier(difficulty, 10);
        setProfit(betAmount * mult);
        setGameState('cashed_out');
        setCurrentFloor(10);
      } else {
        setCurrentFloor(prev => prev + 1);
      }
    }
  };

  const floors = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

  const renderTile = (floorIndex, colIndex) => {
    const floorData = tower[floorIndex];
    const isCurrentFloor = gameState === 'playing' && floorIndex === currentFloor;
    const isPastFloor = floorIndex < currentFloor;
    const isFutureFloor = floorIndex > currentFloor;
    const isGameOver = gameState === 'game_over';
    const isCashedOut = gameState === 'cashed_out';

    let isPicked = false;
    let isBomb = false;
    
    if (floorData) {
      isPicked = floorData.pickedIndex === colIndex;
      isBomb = floorData.bombIndex === colIndex;
    }

    let content = null;
    let bgClass = "bg-[#2F4553]";
    let shadowClass = "";
    let opacityClass = "opacity-100";
    let cursorClass = "cursor-default";

    if (gameState === 'idle') {
      bgClass = "bg-[#2F4553] opacity-50";
    } else if (isCurrentFloor) {
      bgClass = "bg-[#2F4553] hover:bg-[#3d5564] hover:-translate-y-1";
      cursorClass = "cursor-pointer";
      shadowClass = "shadow-lg";
    } else if (isFutureFloor) {
      opacityClass = "opacity-50";
    }

    if (isPicked) {
      if (isBomb) {
        bgClass = "bg-[#E53E3E]";
        content = <Bomb className="text-white w-5 h-5 md:w-6 md:h-6 animate-pulse" />;
      } else {
        bgClass = "bg-[#00E701]";
        shadowClass = "shadow-[0_0_15px_rgba(0,231,1,0.2)]";
        content = <Gem className="text-[#0F212E] w-5 h-5 md:w-6 md:h-6" fill="currentColor" />;
      }
      opacityClass = "opacity-100";
    } else if (gameState !== 'idle' && (isGameOver || isCashedOut)) {
      if (isBomb) {
        content = <Bomb className="text-[#E53E3E] w-5 h-5 md:w-6 md:h-6 opacity-40" />;
      } else {
        content = <Gem className="text-[#00E701] w-5 h-5 md:w-6 md:h-6 opacity-40" fill="currentColor" />;
      }
      opacityClass = "opacity-40";
    } else if (isPastFloor && !isPicked) {
      bgClass = "bg-[#2F4553]";
      opacityClass = "opacity-30";
    }

    return (
      <button
        key={colIndex}
        disabled={!isCurrentFloor}
        onClick={() => handleTileClick(floorIndex, colIndex)}
        className={`flex-1 h-12 md:h-14 rounded-lg flex items-center justify-center transition-all duration-300 transform
          ${bgClass} ${shadowClass} ${opacityClass} ${cursorClass}
        `}
      >
        {content}
      </button>
    );
  };

  const controls = (
    <div className="flex flex-col gap-4">
      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3 flex flex-col gap-2">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase">Difficulty</label>
        <div className="flex gap-1 bg-[#1A2C38] rounded-md p-1">
          {Object.entries(difficulties).map(([key, diff]) => (
            <button
              key={key}
              disabled={gameState === 'playing'}
              onClick={() => setDifficulty(key)}
              className={`flex-1 text-sm py-2 rounded font-semibold transition-all ${
                difficulty === key 
                  ? 'bg-[#2F4553] text-white shadow-sm' 
                  : 'text-[#B1BAD3] hover:text-white hover:bg-white/5 disabled:opacity-50'
              }`}
            >
              {diff.name}
            </button>
          ))}
        </div>
      </div>

      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount}
        disabled={gameState === 'playing'}
      />

      {gameState === 'playing' ? (
        <button 
          onClick={handleCashout}
          disabled={currentFloor === 0}
          className="w-full py-4 rounded-lg font-bold text-black uppercase transition-all
                     bg-[#00E701] hover:bg-[#00E701]/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cashout {currentFloor > 0 ? (betAmount * getMultiplier(difficulty, currentFloor)).toFixed(2) : ''}
        </button>
      ) : (
        <button 
          onClick={startGame}
          className="w-full bg-[#00E701] hover:bg-[#00E701]/90 text-black py-4 rounded-lg font-bold uppercase transition-all"
        >
          Bet
        </button>
      )}
    </div>
  );

  return (
    <GameLayout title="Tower" onBack={onBack} controls={controls}>
      <div className="flex-1 flex flex-col items-center justify-center py-8 relative">
        
        {/* Game Status Banner */}
        {gameState === 'cashed_out' && (
          <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 bg-[#00E701]/20 text-[#00E701] px-6 py-3 rounded-full font-bold text-lg border border-[#00E701]/30 shadow-[0_0_20px_rgba(0,231,1,0.2)] animate-bounce z-10 whitespace-nowrap">
            {profit.toFixed(2)} payout!
          </div>
        )}
        {gameState === 'game_over' && (
          <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 bg-[#E53E3E]/20 text-[#E53E3E] px-6 py-3 rounded-full font-bold text-lg border border-[#E53E3E]/30 z-10 whitespace-nowrap">
            Tower Crumbled
          </div>
        )}

        <div className="w-full max-w-lg mx-auto flex flex-col gap-2 px-4 z-0 mt-8 md:mt-0">
          {floors.map(floorIndex => {
            const mult = getMultiplier(difficulty, floorIndex + 1).toFixed(2);
            const isActive = gameState === 'playing' && currentFloor === floorIndex;
            const isPassed = gameState !== 'idle' && currentFloor > floorIndex;
            
            return (
              <div key={floorIndex} className="flex gap-4 items-center">
                <div className="flex-1 flex gap-2">
                  {Array(difficulties[difficulty].cols).fill(null).map((_, colIndex) => (
                    renderTile(floorIndex, colIndex)
                  ))}
                </div>
                <div className={`w-14 text-sm font-bold font-display text-right transition-colors
                  ${isActive ? 'text-white scale-110 drop-shadow-md' : 
                    isPassed ? 'text-[#00E701]' : 'text-[#8790a1]'}`}
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
