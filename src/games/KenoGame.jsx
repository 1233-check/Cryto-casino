import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trash2, Dices, Trophy } from 'lucide-react';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { KENO_PAYOUTS } from '../utils/constants';
import { shuffleArray } from '../utils/provablyFair';
import { playSound } from '../utils/audio';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

const TOTAL_NUMBERS = 40;
const DRAW_COUNT = 10;
const MAX_PICKS = 10;

export default function KenoGame({ onBack }) {
  const [balance, setBalanceState] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(10);
  const [selectedNumbers, setSelectedNumbers] = useState([]);
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [drawingIndex, setDrawingIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [lastMultiplier, setLastMultiplier] = useState(0);
  const [status, setStatus] = useState('idle'); // 'idle', 'drawing', 'finished'

  const drawTimerRef = useRef(null);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

  useEffect(() => {
    return () => {
      if (drawTimerRef.current) {
        clearInterval(drawTimerRef.current);
      }
    };
  }, []);

  const toggleNumber = (num) => {
    if (isPlaying) return;
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length >= MAX_PICKS) return;
      setSelectedNumbers([...selectedNumbers, num].sort((a, b) => a - b));
    }
  };

  const autoPick = (count = 10) => {
    if (isPlaying) return;
    const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const shuffled = shuffleArray(pool);
    setSelectedNumbers(shuffled.slice(0, Math.min(count, MAX_PICKS)).sort((a, b) => a - b));
    setDrawnNumbers([]);
    setStatus('idle');
  };

  const clearSelection = () => {
    if (isPlaying) return;
    setSelectedNumbers([]);
    setDrawnNumbers([]);
    setStatus('idle');
  };

  const handlePlay = () => {
    if (isPlaying || selectedNumbers.length === 0 || betAmount <= 0) return;
    const newBal = subtractFromBalance(betAmount);
    if (newBal === null) return alert('Insufficient balance');
    setBalanceState(newBal);

    playSound('bet');
    setIsPlaying(true);
    setStatus('drawing');
    setDrawnNumbers([]);
    setLastWin(0);
    setLastMultiplier(0);

    const pool = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    const shuffled = shuffleArray(pool);
    const finalDrawn = shuffled.slice(0, DRAW_COUNT);

    let step = 0;
    const currentDrawn = [];

    drawTimerRef.current = setInterval(() => {
      if (step < finalDrawn.length) {
        const nextNum = finalDrawn[step];
        currentDrawn.push(nextNum);
        setDrawnNumbers([...currentDrawn]);
        setDrawingIndex(nextNum);
        step++;
      } else {
        clearInterval(drawTimerRef.current);
        drawTimerRef.current = null;
        finishRound(finalDrawn);
      }
    }, 120);
  };

  const finishRound = (allDrawn) => {
    const hits = selectedNumbers.filter(n => allDrawn.includes(n));
    const matchCount = hits.length;
    const pickTable = KENO_PAYOUTS[selectedNumbers.length] || {};
    const multiplier = pickTable[matchCount] !== undefined ? pickTable[matchCount] : 0;
    const payout = parseFloat((betAmount * multiplier).toFixed(8));
    const profit = parseFloat((payout - betAmount).toFixed(8));

    if (payout > 0) {
      playSound('win');
      addToBalance(payout);
    }

    addHistoryEntry({
      game: 'keno',
      bet: betAmount,
      payout,
      profit,
      multiplier,
      details: {
        picksCount: selectedNumbers.length,
        matchCount,
        matches: hits
      }
    });

    setLastMultiplier(multiplier);
    setLastWin(payout);
    setStatus('finished');
    setIsPlaying(false);
  };

  const pickCount = selectedNumbers.length;
  const payTableForCurrentPicks = KENO_PAYOUTS[pickCount] || {};
  const currentHits = status !== 'idle' ? selectedNumbers.filter(n => drawnNumbers.includes(n)) : [];

  const controls = (
    <div className="flex flex-col gap-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        disabled={isPlaying} 
      />

      {/* Quick Picks / Actions */}
      <div className="bg-[#0F212E] p-3 rounded-lg border border-white/[0.04] flex flex-col gap-2">
        <div className="flex justify-between items-center text-xs text-[#B1BAD3] font-semibold uppercase">
          <span>Picks ({selectedNumbers.length}/{MAX_PICKS})</span>
          {selectedNumbers.length > 0 && (
            <button 
              onClick={clearSelection} 
              disabled={isPlaying}
              className="text-[#E9113C] hover:text-[#ff3b30] flex items-center gap-1 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            onClick={() => autoPick(5)}
            disabled={isPlaying}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#213743] hover:bg-[#2A4454] text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            <Dices className="w-3.5 h-3.5 text-[#00E701]" />
            <span>Pick 5</span>
          </button>
          <button
            onClick={() => autoPick(10)}
            disabled={isPlaying}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-[#213743] hover:bg-[#2A4454] text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Pick 10</span>
          </button>
        </div>
      </div>

      {/* Paytable Table */}
      {pickCount > 0 && (
        <div className="bg-[#0F212E] p-3 rounded-lg border border-white/[0.04]">
          <span className="text-xs text-[#B1BAD3] font-semibold uppercase block mb-2">Paytable ({pickCount} Picks)</span>
          <div className="grid grid-cols-3 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
            {Object.entries(payTableForCurrentPicks)
              .filter(([_, mult]) => mult > 0)
              .map(([hits, mult]) => {
                const isCurrentHitCount = status === 'finished' && currentHits.length === Number(hits);
                return (
                  <div
                    key={hits}
                    className={`p-1.5 rounded flex flex-col items-center border text-xs transition-colors ${
                      isCurrentHitCount
                        ? 'bg-[#00E701]/20 border-[#00E701] text-[#00E701] font-bold'
                        : 'bg-[#1A2C38] border-white/5 text-[#B1BAD3]'
                    }`}
                  >
                    <span>{hits} Hits</span>
                    <span className="font-bold text-white font-display">{mult}×</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Bet Button */}
      <button
        onClick={handlePlay}
        disabled={isPlaying || selectedNumbers.length === 0 || betAmount <= 0}
        className={`w-full py-4 mt-auto rounded-xl font-bold text-lg font-display transition-all ${
          isPlaying
            ? 'bg-[#2A3F4C] text-[#B1BAD3] cursor-not-allowed'
            : selectedNumbers.length === 0
            ? 'bg-[#1A2C38] text-[#557086] border border-white/5 cursor-not-allowed'
            : 'bg-[#00E701] text-[#0F212E] hover:bg-[#00E701]/90 shadow-[0_0_20px_rgba(0,231,1,0.2)]'
        }`}
      >
        {isPlaying ? 'Drawing...' : selectedNumbers.length === 0 ? 'Select Numbers' : 'Bet'}
      </button>
    </div>
  );

  return (
    <GameLayout title="Keno" balance={balance} onBack={onBack} controls={controls}>
      <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 w-full max-w-4xl mx-auto min-h-[500px]">
        
        {/* Top Status Bar */}
        <div className="w-full flex items-center justify-between bg-[#0F212E] p-3 rounded-xl border border-white/5 mb-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase text-[#B1BAD3] font-bold">Drawn Numbers:</span>
            <div className="flex gap-1.5 flex-wrap">
              {drawnNumbers.length === 0 ? (
                <span className="text-xs text-[#557086]">10 numbers will be drawn</span>
              ) : (
                drawnNumbers.map(n => {
                  const isMatch = selectedNumbers.includes(n);
                  return (
                    <span
                      key={n}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-display ${
                        isMatch
                          ? 'bg-[#00E701] text-[#0F212E] shadow-[0_0_10px_#00E701]'
                          : 'bg-[#213743] text-white'
                      }`}
                    >
                      {n}
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {status === 'finished' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-sm font-bold font-display px-3 py-1 rounded-lg ${
                lastMultiplier > 0
                  ? 'bg-[#00E701]/20 text-[#00E701] border border-[#00E701]/30'
                  : 'bg-surface text-[#B1BAD3]'
              }`}
            >
              {lastMultiplier > 0 ? `+${lastWin.toFixed(2)} (${lastMultiplier}×)` : 'No Win'}
            </motion.div>
          )}
        </div>

        {/* 40-Number Keno Grid */}
        <div className="grid grid-cols-8 gap-2 sm:gap-3 w-full max-w-2xl my-auto">
          {Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1).map(num => {
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isHit = isSelected && isDrawn;

            let tileStyle = 'bg-[#1A2C38] text-white border-white/5 hover:border-white/20';

            if (isHit) {
              tileStyle = 'bg-gradient-to-br from-[#00E701] to-[#00b001] text-[#0F212E] font-extrabold shadow-[0_0_20px_rgba(0,231,1,0.5)] border-[#00E701] scale-105';
            } else if (isDrawn) {
              tileStyle = 'bg-[#213743] text-[#F59E0B] border-[#F59E0B]/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
            } else if (isSelected) {
              tileStyle = 'bg-[#1475E1] text-white font-bold border-[#1475E1] shadow-[0_0_15px_rgba(20,117,225,0.4)] scale-105';
            }

            return (
              <motion.button
                key={num}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleNumber(num)}
                disabled={isPlaying}
                className={`aspect-square rounded-xl flex items-center justify-center font-display text-base sm:text-lg font-bold border transition-all ${tileStyle} disabled:cursor-not-allowed`}
              >
                {num}
              </motion.button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-xs text-[#557086] flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#1475E1]" />
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#00E701]" />
            <span>Hit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#F59E0B]" />
            <span>Drawn</span>
          </div>
        </div>

      </div>
    </GameLayout>
  );
}
