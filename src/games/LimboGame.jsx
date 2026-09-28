import React, { useState } from 'react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { getGameResult } from '../utils/provablyFair';

export default function LimboGame({ balance, onBack }) {
  const [betAmount, setBetAmount] = useState(1);
  const [targetMultiplier, setTargetMultiplier] = useState(2.00);
  const [result, setResult] = useState(1.00);
  const [displayResult, setDisplayResult] = useState(1.00);
  const [isPlaying, setIsPlaying] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'spinning', 'finished'

  const winChance = targetMultiplier >= 1.01 ? (99 / targetMultiplier).toFixed(4) : 0;

  const handleBet = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setStatus('spinning');
    
    // Provably fair float
    const float = getGameResult(0, 1);
    const finalResult = Math.max(1, Math.floor((0.99 / float) * 100) / 100);
    
    setResult(finalResult);

    // Spin duration: Fast (150ms-600ms)
    const duration = Math.random() * 450 + 150;
    const start = performance.now();
    
    const animate = (time) => {
      const elapsed = time - start;
      if (elapsed < duration) {
        // Odometer spin effect logic
        const spinValue = (1.00 + Math.random() * 99).toFixed(2);
        setDisplayResult(Number(spinValue));
        requestAnimationFrame(animate);
      } else {
        setDisplayResult(finalResult);
        setIsPlaying(false);
        setStatus('finished');
      }
    };
    
    requestAnimationFrame(animate);
  };

  const isWin = status === 'finished' && result >= targetMultiplier;
  const resultColor = status === 'finished' 
    ? (isWin ? 'text-[#00E701]' : 'text-[#ff1f44]')
    : 'text-white';

  const controls = (
    <>
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={isPlaying} 
      />

      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-2">Target Multiplier</label>
        <div className="flex items-center bg-black/20 rounded p-2 border border-white/5">
          <input
            type="number"
            value={targetMultiplier}
            onChange={e => setTargetMultiplier(Math.max(1.01, Number(e.target.value)))}
            step="0.01"
            min="1.01"
            disabled={isPlaying}
            className="bg-transparent text-white w-full font-bold font-display outline-none"
          />
          <span className="text-[#B1BAD3] font-bold">×</span>
        </div>
      </div>

      <div className="bg-[#0F212E] rounded-lg border border-white/[0.04] p-3">
        <label className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-2">Win Chance</label>
        <div className="flex items-center bg-black/20 rounded p-2 border border-white/5">
          <input
            type="text"
            value={winChance}
            readOnly
            className="bg-transparent text-white w-full font-bold font-display outline-none cursor-default"
          />
          <span className="text-[#B1BAD3] font-bold">%</span>
        </div>
      </div>

      <button
        onClick={handleBet}
        disabled={isPlaying || betAmount <= 0}
        className="w-full bg-[#00E701] hover:bg-[#00c701] text-black font-bold uppercase py-4 rounded-lg transition-colors mt-2 disabled:opacity-50"
      >
        {isPlaying ? 'Betting...' : 'Bet'}
      </button>
    </>
  );

  return (
    <GameLayout
      title="Limbo"
      balance={balance}
      onBack={onBack}
      controls={controls}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="flex items-baseline gap-2">
          <span className={`text-[80px] font-display font-bold leading-none tracking-tighter ${resultColor} transition-colors duration-200 drop-shadow-2xl`}>
            {displayResult.toFixed(2)}
          </span>
          <span className={`text-4xl font-display font-bold ${resultColor} opacity-80`}>
            ×
          </span>
        </div>
        
        {status === 'finished' && (
          <div className={`mt-4 text-xl font-bold font-display ${isWin ? 'text-[#00E701]' : 'text-[#ff1f44]'}`}>
            {isWin ? `+${(betAmount * targetMultiplier).toFixed(2)}` : `-${betAmount.toFixed(2)}`}
          </div>
        )}
      </div>
    </GameLayout>
  );
}
