import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { getGameResult } from '../utils/provablyFair';

export default function DiceGame({ balance, onBack }) {
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState(50.00);
  const [condition, setCondition] = useState('over'); // 'over' | 'under'
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState(50.00);
  const [hasRolled, setHasRolled] = useState(false);
  const [history, setHistory] = useState([]);

  const winChance = condition === 'over' ? 100 - target : target;
  const multiplier = 99 / winChance;
  const profitOnWin = betAmount * multiplier - betAmount;

  const handleRoll = () => {
    if (isRolling) return;
    setIsRolling(true);
    
    // Quick timeout to allow UI to show rolling state
    setTimeout(() => {
      const roll = getGameResult(0, 100);
      const won = condition === 'over' ? roll > target : roll < target;
      
      setResult(roll);
      setHasRolled(true);
      setIsRolling(false);
      
      setHistory(prev => [{ 
        roll, 
        target, 
        condition, 
        won, 
        id: Date.now() 
      }, ...prev].slice(0, 8));
    }, 150);
  };

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={isRolling} 
      />
      
      <div className="bg-[#0F212E] p-3 rounded-lg border border-white/[0.04]">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-[#B1BAD3] font-semibold uppercase">Profit on Win</span>
          <span className="text-sm text-[#00E701] font-bold font-display">${profitOnWin.toFixed(2)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#0F212E] p-3 rounded-lg border border-white/[0.04]">
          <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-1">Multiplier</label>
          <div className="text-white font-bold font-display">{multiplier.toFixed(4)}×</div>
        </div>
        <div className="bg-[#0F212E] p-3 rounded-lg border border-white/[0.04]">
          <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-1">Win Chance</label>
          <div className="text-white font-bold font-display">{winChance.toFixed(2)}%</div>
        </div>
      </div>

      <button
        onClick={handleRoll}
        disabled={isRolling}
        className="w-full bg-[#00E701] hover:bg-[#00c701] text-gray-900 font-bold font-display py-4 rounded-lg transition-colors mt-2 uppercase text-lg disabled:opacity-50"
      >
        {isRolling ? 'Rolling...' : 'Bet'}
      </button>
    </div>
  );

  return (
    <GameLayout title="Dice" balance={balance} onBack={onBack} controls={controls}>
      <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 w-full max-w-3xl mx-auto min-h-[400px]">
        
        {/* Game Container */}
        <div className="w-full bg-[#0F212E] p-6 sm:p-10 rounded-2xl relative shadow-2xl border border-white/5">
          
          {/* Large Roll Result Display */}
          <div className="flex flex-col items-center justify-center mb-16">
            <motion.div 
              key={hasRolled ? result : 'init'}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-6xl sm:text-8xl font-bold font-display drop-shadow-lg ${
                !hasRolled 
                  ? 'text-white' 
                  : (condition === 'over' ? result > target : result < target) 
                    ? 'text-[#00E701]' 
                    : 'text-[#E9113C]'
              }`}
            >
              {result.toFixed(2)}
            </motion.div>
          </div>

          {/* The Slider */}
          <div className="relative h-16 w-full flex items-center select-none group">
            
            {/* Background Track */}
            <div className="absolute w-full h-4 rounded-full overflow-hidden flex shadow-inner bg-surface">
              {condition === 'over' ? (
                <>
                  <div className="h-full bg-[#E9113C] transition-all duration-200" style={{ width: `${target}%` }} />
                  <div className="h-full bg-[#00E701] transition-all duration-200" style={{ width: `${100 - target}%` }} />
                </>
              ) : (
                <>
                  <div className="h-full bg-[#00E701] transition-all duration-200" style={{ width: `${target}%` }} />
                  <div className="h-full bg-[#E9113C] transition-all duration-200" style={{ width: `${100 - target}%` }} />
                </>
              )}
            </div>

            {/* Target markers */}
            <div className="absolute w-full h-full pointer-events-none flex justify-between items-center px-1">
              {[0, 25, 50, 75, 100].map(val => (
                <div key={val} className="flex flex-col items-center mt-12">
                   <div className="w-1 h-2 bg-white/20 mb-1 rounded" />
                   <span className="text-xs text-[#B1BAD3] font-display">{val}</span>
                </div>
              ))}
            </div>

            {/* Range Input (Invisible, over the track) */}
            <input 
              type="range"
              min="2"
              max="98"
              step="0.01"
              value={target}
              onChange={(e) => setTarget(parseFloat(e.target.value))}
              className="absolute w-full h-12 opacity-0 cursor-pointer z-30 m-0"
              disabled={isRolling}
            />

            {/* Target Thumb */}
            <div 
              className="absolute top-1/2 w-12 h-12 bg-white rounded-xl shadow-xl pointer-events-none z-20 flex items-center justify-center transition-all duration-200 border-4 border-[#0F212E]"
              style={{ left: `${target}%`, transform: 'translate(-50%, -50%)' }}
            >
              {/* Grip lines */}
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-gray-300 rounded-full" />
                <div className="w-1 h-4 bg-gray-300 rounded-full" />
              </div>
              
              {/* Value Tooltip */}
              <div className="absolute -top-12 bg-[#213743] text-white font-bold font-display px-3 py-1.5 rounded-lg text-sm shadow-xl whitespace-nowrap border border-white/5">
                {target.toFixed(2)}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#213743] rotate-45 border-r border-b border-white/5" />
              </div>
            </div>

            {/* Result Marker (Animated) */}
            <motion.div
              animate={{ left: `${result}%`, opacity: hasRolled ? 1 : 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 150 }}
              className="absolute top-1/2 w-8 h-8 bg-white border-4 border-[#0F212E] rounded-full shadow-2xl pointer-events-none z-20 flex items-center justify-center"
              style={{ transform: 'translate(-50%, -50%)' }}
            >
              <div className="w-2 h-2 bg-[#0F212E] rounded-full" />
            </motion.div>
          </div>

          {/* Toggle condition */}
          <div className="flex justify-center mt-16">
            <button 
              onClick={() => setCondition(prev => prev === 'over' ? 'under' : 'over')}
              disabled={isRolling}
              className="flex items-center gap-2 bg-surface hover:bg-white/5 border border-white/10 px-6 py-3 rounded-full transition-colors text-sm font-semibold text-[#B1BAD3] disabled:opacity-50"
            >
              <RefreshCcw className="w-4 h-4" />
              <span>Roll {condition === 'over' ? 'Under' : 'Over'}</span>
            </button>
          </div>
        </div>
        
        {/* Recent History */}
        <div className="mt-8 flex flex-wrap gap-2 w-full justify-center min-h-[40px]">
          {history.map(h => (
            <motion.div 
              key={h.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`px-4 py-2 rounded-full text-sm font-bold font-display shadow-lg border border-white/5 ${
                h.won 
                  ? 'bg-[#00E701]/10 text-[#00E701]' 
                  : 'bg-surface text-[#B1BAD3]'
              }`}
            >
              {h.roll.toFixed(2)}
            </motion.div>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
