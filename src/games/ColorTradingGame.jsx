import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { COLOR_MAP } from '../utils/constants';

export default function ColorTradingGame({ balance, setBalance, onBack }) {
  const [betAmount, setBetAmount] = useState(0.001);
  const [betSelection, setBetSelection] = useState({ type: 'color', value: 'green' });
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState('betting'); // betting, locked, result
  const [history, setHistory] = useState([1, 4, 7, 0, 9, 2]);
  const [myBet, setMyBet] = useState(null);
  const [result, setResult] = useState(null);

  const myBetRef = useRef(myBet);
  useEffect(() => { myBetRef.current = myBet; }, [myBet]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1;
        
        if (next === 5) {
          setPhase('locked');
        } else if (next === 2) {
          setPhase('result');
          const randNum = Math.floor(Math.random() * 10);
          setResult(randNum);
          
          const currentBet = myBetRef.current;
          if (currentBet) {
             let winAmount = 0;
             if (currentBet.type === 'number' && currentBet.value === randNum) {
                 winAmount = currentBet.amount * 9;
             } else if (currentBet.type === 'color') {
                 const resColors = COLOR_MAP[randNum].colors;
                 if (resColors.includes(currentBet.value)) {
                     winAmount = currentBet.amount * (currentBet.value === 'violet' ? 4.5 : 2);
                 }
             }
             if (winAmount > 0) {
                 setBalance(b => b + winAmount);
             }
          }
          setHistory(h => [...h.slice(-19), randNum]);
        } else if (next <= 0) {
          setPhase('betting');
          setResult(null);
          setMyBet(null);
          return 30;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [setBalance]);

  const placeBet = () => {
    if (phase !== 'betting') return;
    if (betAmount > balance) return;
    setBalance(b => b - betAmount);
    setMyBet({ ...betSelection, amount: betAmount });
  };

  const getNumberStyle = (num, isSelected) => {
    const colors = COLOR_MAP[num].colors;
    let bgClass = '';
    if (colors.includes('red') && colors.includes('violet')) {
      bgClass = 'bg-gradient-to-br from-danger/40 to-purple/40 text-white border-purple/50';
    } else if (colors.includes('green') && colors.includes('violet')) {
      bgClass = 'bg-gradient-to-br from-primary/40 to-purple/40 text-white border-purple/50';
    } else if (colors.includes('red')) {
      bgClass = 'bg-danger/20 text-danger border-danger/50';
    } else if (colors.includes('green')) {
      bgClass = 'bg-primary/20 text-primary border-primary/50';
    }
    
    return `p-3 rounded-lg font-display font-bold text-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isSelected ? 'ring-2 ring-white scale-105 opacity-100' : 'opacity-70 hover:opacity-100 hover:bg-white/5'} ${bgClass}`;
  };

  const getResultColorClass = (num) => {
    const colors = COLOR_MAP[num].colors;
    if (colors.includes('red') && colors.includes('violet')) return 'bg-gradient-to-br from-danger to-purple border-danger shadow-[0_0_30px_#FF1744] text-white';
    if (colors.includes('green') && colors.includes('violet')) return 'bg-gradient-to-br from-primary to-purple border-primary shadow-[0_0_30px_#00E701] text-white';
    if (colors.includes('red')) return 'bg-danger border-danger shadow-[0_0_30px_#FF1744] text-white';
    if (colors.includes('green')) return 'bg-primary border-primary shadow-[0_0_30px_#00E701] text-black';
    return 'bg-surface text-white';
  };

  const getHistoryColorClass = (num) => {
    const colors = COLOR_MAP[num].colors;
    if (colors.includes('red') && colors.includes('violet')) return 'bg-gradient-to-br from-danger to-purple text-white';
    if (colors.includes('green') && colors.includes('violet')) return 'bg-gradient-to-br from-primary to-purple text-white';
    if (colors.includes('red')) return 'bg-danger/20 text-danger border border-danger/50';
    if (colors.includes('green')) return 'bg-primary/20 text-primary border border-primary/50';
    return 'bg-surface text-white';
  };

  const controls = (
    <div className="flex flex-col h-full max-h-full overflow-y-auto scrollbar-hide space-y-4 pb-4">
      <BetControls 
        betAmount={betAmount} 
        setBetAmount={setBetAmount} 
        maxBet={balance} 
        disabled={phase !== 'betting' || myBet !== null} 
      />

      <div className="bg-background rounded-xl p-3 border border-white/5">
        <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Select Color (2x / 4.5x)</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button 
            className={`p-3 rounded-lg font-bold border transition-colors flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${betSelection.type === 'color' && betSelection.value === 'green' ? 'border-primary bg-primary/20 text-primary ring-2 ring-primary/50 scale-105' : 'border-primary/30 bg-surface text-gray-300 hover:bg-primary/10'}`} 
            onClick={() => setBetSelection({type: 'color', value: 'green'})}
            disabled={myBet !== null || phase !== 'betting'}
          >
            <span className="mb-1 text-xl">🟢</span>
            <span>Green</span>
            <span className="text-xs opacity-70">2x</span>
          </button>
          <button 
            className={`p-3 rounded-lg font-bold border transition-colors flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${betSelection.type === 'color' && betSelection.value === 'violet' ? 'border-purple bg-purple/20 text-purple ring-2 ring-purple/50 scale-105' : 'border-purple/30 bg-surface text-gray-300 hover:bg-purple/10'}`} 
            onClick={() => setBetSelection({type: 'color', value: 'violet'})}
            disabled={myBet !== null || phase !== 'betting'}
          >
            <span className="mb-1 text-xl">🟣</span>
            <span>Violet</span>
            <span className="text-xs opacity-70">4.5x</span>
          </button>
          <button 
            className={`p-3 rounded-lg font-bold border transition-colors flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${betSelection.type === 'color' && betSelection.value === 'red' ? 'border-danger bg-danger/20 text-danger ring-2 ring-danger/50 scale-105' : 'border-danger/30 bg-surface text-gray-300 hover:bg-danger/10'}`} 
            onClick={() => setBetSelection({type: 'color', value: 'red'})}
            disabled={myBet !== null || phase !== 'betting'}
          >
            <span className="mb-1 text-xl">🔴</span>
            <span>Red</span>
            <span className="text-xs opacity-70">2x</span>
          </button>
        </div>

        <label className="text-xs text-gray-400 font-bold uppercase mb-2 block">Select Number (9x)</label>
        <div className="grid grid-cols-5 gap-2">
          {[0,1,2,3,4,5,6,7,8,9].map(num => (
            <button 
              key={num}
              onClick={() => setBetSelection({type: 'number', value: num})}
              className={getNumberStyle(num, betSelection.type === 'number' && betSelection.value === num)}
              disabled={myBet !== null || phase !== 'betting'}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={placeBet}
        disabled={phase !== 'betting' || myBet !== null || betAmount > balance}
        className={`w-full py-4 mt-auto rounded-xl font-bold text-lg transition-all ${
          phase !== 'betting' ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 
          myBet !== null ? 'bg-primary/20 text-primary border border-primary/50 cursor-not-allowed' : 
          betAmount > balance ? 'bg-danger/20 text-danger border border-danger/50 cursor-not-allowed' :
          'bg-primary text-black hover:bg-primary/90 hover:-translate-y-1'
        }`}
      >
        {myBet ? 'Bet Placed' : phase !== 'betting' ? 'Bets Locked' : betAmount > balance ? 'Insufficient Balance' : 'Place Bet'}
      </button>
    </div>
  );

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((timeLeft / 30) * circumference);

  return (
    <GameLayout title="Color Trading" balance={balance} onBack={onBack} controls={controls}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-surface/50">
        
        <div className="relative w-80 h-80 flex items-center justify-center mb-12">
          {/* SVG Timer Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle cx="160" cy="160" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="12" fill="none" />
            <motion.circle 
              cx="160" cy="160" r={radius} 
              stroke={phase === 'betting' ? '#00E701' : phase === 'locked' ? '#FF1744' : '#B388FF'} 
              strokeWidth="12" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "linear" }}
              className={phase === 'betting' ? "drop-shadow-[0_0_15px_rgba(0,231,1,0.5)]" : "drop-shadow-[0_0_15px_rgba(255,23,68,0.5)]"}
            />
          </svg>
          
          <div className="text-center z-10 flex flex-col items-center justify-center bg-background/50 rounded-full w-[220px] h-[220px] border border-white/5 backdrop-blur-md overflow-hidden">
            <AnimatePresence mode="wait">
              {phase === 'result' && result !== null ? (
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className={`w-32 h-32 rounded-full flex items-center justify-center text-6xl font-bold font-display border-4 shadow-2xl ${getResultColorClass(result)}`}
                >
                  {result}
                </motion.div>
              ) : phase === 'locked' ? (
                <motion.div
                  key="locked"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-3xl font-display font-black mb-2 text-danger animate-pulse uppercase tracking-widest">Locked</span>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-7xl font-display font-black mb-2 tracking-tighter text-white">{timeLeft}</span>
                  <span className="text-gray-400 font-bold tracking-widest text-sm uppercase">
                    Place Bets
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full max-w-2xl bg-surface/80 backdrop-blur-md p-6 rounded-2xl border border-white/5 flex flex-col sm:flex-row gap-4 items-center overflow-hidden">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-sm whitespace-nowrap">History</span>
          <div className="flex gap-2 w-full overflow-x-auto pb-2 scrollbar-hide items-center">
            {history.map((h, i) => (
              <div key={i} className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold font-display text-lg shadow-lg ${getHistoryColorClass(h)}`}>
                {h}
              </div>
            ))}
          </div>
        </div>

      </div>
    </GameLayout>
  );
}
