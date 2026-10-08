import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCcw } from 'lucide-react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { getGameResult } from '../utils/provablyFair';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

export default function DiceGame({ onBack }) {
  const [balance, setBalanceState] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(10);
  const [target, setTarget] = useState(50.00);
  const [condition, setCondition] = useState('over'); // 'over' | 'under'
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState(50.00);
  const [hasRolled, setHasRolled] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  const winChance = condition === 'over' ? 100 - target : target;
  const multiplier = 99 / winChance;
  const profitOnWin = betAmount * multiplier - betAmount;

  const handleRoll = async () => {
    if (isRolling || betAmount <= 0) return;
    
    // Get current auth token (you'd normally pull this from AuthContext, 
    // but for simplicity we can get it from the firebase auth instance)
    const { auth } = await import('../firebase');
    if (!auth.currentUser) return alert('Must be logged in to bet');
    const token = await auth.currentUser.getIdToken();

    setIsRolling(true);
    
    try {
      const response = await fetch('http://localhost:3001/api/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          game: 'dice',
          betAmount,
          target,
          condition
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Bet failed');
      }

      const { roll, won, payout, profit } = data;

      // The balance will auto-update via Firestore listener, but we can update history locally
      addHistoryEntry({
        game: 'dice',
        bet: betAmount,
        payout,
        profit,
        multiplier: won ? multiplier : 0,
        details: { roll, target, condition, winChance }
      });

      setResult(roll);
      setHasRolled(true);
      
      setHistory(prev => [{ 
        roll, 
        target, 
        condition, 
        won, 
        id: Date.now() 
      }, ...prev].slice(0, 8));

    } catch (err) {
      alert(err.message);
    } finally {
      setIsRolling(false);
    }
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
          <div className="flex flex-col items-center justify-center mb-16 relative">
            {/* Background glowing halo behind the number */}
            <motion.div 
               animate={{ opacity: hasRolled ? 0.3 : 0, scale: hasRolled ? 1.5 : 1 }}
               className={`absolute w-32 h-32 rounded-full blur-3xl pointer-events-none ${
                 !hasRolled ? 'bg-transparent' : (condition === 'over' ? result > target : result < target) ? 'bg-[#00E701]' : 'bg-[#E9113C]'
               }`}
            />
            <motion.div 
              key={hasRolled ? result : 'init'}
              initial={{ scale: 0.5, y: -20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`text-7xl sm:text-9xl font-black font-display drop-shadow-2xl relative z-10 ${
                !hasRolled 
                  ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]' 
                  : (condition === 'over' ? result > target : result < target) 
                    ? 'text-[#00E701] drop-shadow-[0_0_30px_rgba(0,231,1,0.6)]' 
                    : 'text-[#E9113C] drop-shadow-[0_0_30px_rgba(233,17,60,0.6)]'
              }`}
            >
              {result.toFixed(2)}
            </motion.div>
          </div>

          {/* The Slider */}
          <div className="relative h-20 w-full flex items-center select-none group mt-10">
            
            {/* Background 3D Metallic Track */}
            <div className="absolute w-full h-8 rounded-full overflow-hidden flex bg-gradient-to-b from-[#0a151d] to-[#162734] border border-white/5 shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)]">
              {condition === 'over' ? (
                <>
                  <div className="h-full bg-gradient-to-r from-[#8a0a24] to-[#E9113C] transition-all duration-200 border-r-2 border-white/20" style={{ width: `${target}%` }} />
                  <div className="h-full bg-gradient-to-r from-[#00E701] to-[#008a01] transition-all duration-200 border-l-2 border-black/40" style={{ width: `${100 - target}%` }} />
                </>
              ) : (
                <>
                  <div className="h-full bg-gradient-to-r from-[#008a01] to-[#00E701] transition-all duration-200 border-r-2 border-white/20" style={{ width: `${target}%` }} />
                  <div className="h-full bg-gradient-to-r from-[#E9113C] to-[#8a0a24] transition-all duration-200 border-l-2 border-black/40" style={{ width: `${100 - target}%` }} />
                </>
              )}
            </div>

            {/* Target markers */}
            <div className="absolute w-full h-full pointer-events-none flex justify-between items-center px-2">
              {[0, 25, 50, 75, 100].map(val => (
                <div key={val} className="flex flex-col items-center mt-16">
                   <div className="w-1.5 h-3 bg-white/20 mb-1 rounded shadow-inner" />
                   <span className="text-sm text-[#B1BAD3] font-display font-bold">{val}</span>
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
              className="absolute w-full h-20 opacity-0 cursor-pointer z-30 m-0"
              disabled={isRolling}
            />

            {/* Target Thumb (3D Glowing Orb) */}
            <div 
              className="absolute top-1/2 w-14 h-14 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.8)] pointer-events-none z-20 flex items-center justify-center transition-all duration-200"
              style={{ 
                left: `${target}%`, 
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #B1BAD3 20%, #2A3F4C 80%, #0F212E 100%)',
                border: '2px solid rgba(255,255,255,0.2)'
              }}
            >
              {/* Value Tooltip */}
              <div className="absolute -top-16 bg-[#0F212E] text-white font-black font-display px-4 py-2 rounded-xl text-lg shadow-[0_10px_20px_rgba(0,0,0,0.5)] whitespace-nowrap border-2 border-white/10">
                {target.toFixed(2)}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0F212E] rotate-45 border-r-2 border-b-2 border-white/10" />
              </div>
            </div>

            {/* Result Marker (Rolling Die) */}
            <motion.div
              animate={{ 
                 left: `${result}%`, 
                 opacity: hasRolled ? 1 : 0,
                 rotate: hasRolled ? result * 10 : 0 // Physical rotation based on distance travelled
              }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="absolute top-1/2 w-10 h-10 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] pointer-events-none z-20 flex items-center justify-center border-4 border-[#0F212E]"
              style={{ 
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle at 30% 30%, #ffffff 0%, #dddddd 100%)',
              }}
            >
              <div className="w-3 h-3 bg-[#0F212E] rounded-full shadow-inner" />
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
