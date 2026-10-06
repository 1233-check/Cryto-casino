import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GameLayout from '../components/GameLayout';
import BetControls from '../components/BetControls';
import { COLOR_MAP } from '../utils/constants';
import { getBalance, subtractFromBalance, addToBalance, addHistoryEntry } from '../utils/balance';

export default function ColorTradingGame({ onBack }) {
  const [balance, setBalanceState] = useState(getBalance());
  const [betAmount, setBetAmount] = useState(0.1);
  const [bets, setBets] = useState({}); // allows multiple bets, e.g. { 'color-green': 0.5, 'number-5': 0.1 }
  const [timeLeft, setTimeLeft] = useState(30);
  const [phase, setPhase] = useState('betting'); // betting, locked, result
  const [history, setHistory] = useState([1, 4, 7, 0, 9, 2]);
  const [result, setResult] = useState(null);
  const [profit, setProfit] = useState(null);

  const betsRef = useRef(bets);
  useEffect(() => { betsRef.current = bets; }, [bets]);

  useEffect(() => {
    const handleUpdate = () => setBalanceState(getBalance());
    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, []);

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
          
          const currentBets = betsRef.current;
          let totalWin = 0;
          let totalBet = 0;

          if (Object.keys(currentBets).length > 0) {
            for (const [key, amount] of Object.entries(currentBets)) {
              totalBet += amount;
              const [type, value] = key.split('-');
              
              if (type === 'number' && parseInt(value) === randNum) {
                totalWin += amount * 9;
              } else if (type === 'color') {
                const resColors = COLOR_MAP[randNum].colors;
                if (resColors.includes(value)) {
                   const multiplier = value === 'violet' ? 4.5 : 2;
                   totalWin += amount * multiplier;
                }
              }
            }

            if (totalWin > 0) {
               addToBalance(totalWin);
            }
            const profitVal = totalWin - totalBet;
            setProfit(profitVal);
            
            addHistoryEntry({
              game: 'colortrading',
              bet: totalBet,
              payout: totalWin,
              profit: profitVal,
              result: randNum,
              details: { bets: currentBets, result: randNum }
            });
          }
          setHistory(h => [...h.slice(-19), randNum]);
        } else if (next <= 0) {
          setPhase('betting');
          setResult(null);
          setProfit(null);
          setBets({}); // reset bets for next round
          return 30;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const placeBet = (type, value) => {
    if (phase !== 'betting') return;
    if (betAmount <= 0) return;
    
    const newBal = subtractFromBalance(betAmount);
    if (newBal === null) return alert('Insufficient balance');
    setBalanceState(newBal);
    
    const key = `${type}-${value}`;
    setBets(prev => ({
      ...prev,
      [key]: (prev[key] || 0) + betAmount
    }));
  };

  const getNumberStyle = (num) => {
    const colors = COLOR_MAP[num].colors;
    let bgClass = '';
    if (colors.includes('red') && colors.includes('violet')) {
      bgClass = 'bg-gradient-to-br from-[#ED4163] to-[#B388FF] text-white border-[#B388FF] shadow-[0_0_20px_rgba(179,136,255,0.4)]';
    } else if (colors.includes('green') && colors.includes('violet')) {
      bgClass = 'bg-gradient-to-br from-[#00E701] to-[#B388FF] text-white border-[#B388FF] shadow-[0_0_20px_rgba(0,231,1,0.4)]';
    } else if (colors.includes('red')) {
      bgClass = 'bg-[#ED4163]/20 text-[#ED4163] border-[#ED4163] shadow-[0_0_15px_rgba(237,65,99,0.3)]';
    } else if (colors.includes('green')) {
      bgClass = 'bg-[#00E701]/20 text-[#00E701] border-[#00E701] shadow-[0_0_15px_rgba(0,231,1,0.3)]';
    }
    
    return `relative p-4 rounded-xl font-display font-black text-2xl border-2 transition-all overflow-hidden
            hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 
            active:translate-y-0 backdrop-blur-md ${bgClass}`;
  };

  const getResultColorClass = (num) => {
    const colors = COLOR_MAP[num].colors;
    if (colors.includes('red') && colors.includes('violet')) return 'bg-gradient-to-br from-[#ED4163] to-[#B388FF] border-[#ED4163] shadow-[0_0_40px_rgba(237,65,99,0.5)] text-white';
    if (colors.includes('green') && colors.includes('violet')) return 'bg-gradient-to-br from-[#00E701] to-[#B388FF] border-[#00E701] shadow-[0_0_40px_rgba(0,231,1,0.5)] text-white';
    if (colors.includes('red')) return 'bg-[#ED4163] border-[#ED4163] shadow-[0_0_40px_rgba(237,65,99,0.5)] text-white';
    if (colors.includes('green')) return 'bg-[#00E701] border-[#00E701] shadow-[0_0_40px_rgba(0,231,1,0.5)] text-black';
    return 'bg-[#2F4553] text-white';
  };

  const getHistoryColorClass = (num) => {
    const colors = COLOR_MAP[num].colors;
    if (colors.includes('red') && colors.includes('violet')) return 'bg-gradient-to-br from-[#ED4163] to-[#B388FF] text-white border border-white/20';
    if (colors.includes('green') && colors.includes('violet')) return 'bg-gradient-to-br from-[#00E701] to-[#B388FF] text-white border border-white/20';
    if (colors.includes('red')) return 'bg-[#ED4163]/20 text-[#ED4163] border border-[#ED4163]/50';
    if (colors.includes('green')) return 'bg-[#00E701]/20 text-[#00E701] border border-[#00E701]/50';
    return 'bg-[#2F4553] text-white';
  };

  const renderChip = (key) => {
    const amount = bets[key];
    if (!amount) return null;
    return (
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
      >
        <div className="bg-[#1475E1] rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-[0_2px_10px_rgba(0,0,0,0.5)] text-[9px] font-black text-white leading-none">
          {amount >= 1000 ? (amount/1000).toFixed(1)+'k' : parseFloat(amount.toFixed(2))}
        </div>
      </motion.div>
    );
  };

  const totalBetAmount = Object.values(bets).reduce((a, b) => a + b, 0);

  const controls = (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar space-y-4 pb-4">
      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 shadow-inner">
        <BetControls 
          betAmount={betAmount} 
          setBetAmount={setBetAmount} 
          disabled={phase !== 'betting'} 
        />
      </div>

      <div className="bg-[#0F212E] rounded-xl p-4 border border-white/5 shadow-inner">
        <label className="text-xs text-[#B1BAD3] font-bold uppercase tracking-wider mb-3 block flex justify-between">
          <span>Colors</span>
          <span className="text-[#8790a1] font-mono">2x / 4.5x</span>
        </label>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            className="relative p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-[#00E701] bg-[#00E701]/10 text-[#00E701] hover:bg-[#00E701]/20 shadow-[0_0_15px_rgba(0,231,1,0.3)] hover:shadow-[0_0_25px_rgba(0,231,1,0.6)] hover:-translate-y-1 active:translate-y-0"
            onClick={() => placeBet('color', 'green')}
            disabled={phase !== 'betting'}
          >
            <span className="mb-1 text-2xl drop-shadow-[0_0_10px_rgba(0,231,1,0.8)]">🟢</span>
            <span className="tracking-wide uppercase font-black">Green</span>
            {renderChip('color-green')}
          </button>
          <button 
            className="relative p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-[#B388FF] bg-[#B388FF]/10 text-[#B388FF] hover:bg-[#B388FF]/20 shadow-[0_0_15px_rgba(179,136,255,0.3)] hover:shadow-[0_0_25px_rgba(179,136,255,0.6)] hover:-translate-y-1 active:translate-y-0"
            onClick={() => placeBet('color', 'violet')}
            disabled={phase !== 'betting'}
          >
            <span className="mb-1 text-2xl drop-shadow-[0_0_10px_rgba(179,136,255,0.8)]">🟣</span>
            <span className="tracking-wide uppercase font-black">Violet</span>
            {renderChip('color-violet')}
          </button>
          <button 
            className="relative p-4 rounded-xl font-bold border-2 transition-all flex flex-col items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed border-[#ED4163] bg-[#ED4163]/10 text-[#ED4163] hover:bg-[#ED4163]/20 shadow-[0_0_15px_rgba(237,65,99,0.3)] hover:shadow-[0_0_25px_rgba(237,65,99,0.6)] hover:-translate-y-1 active:translate-y-0"
            onClick={() => placeBet('color', 'red')}
            disabled={phase !== 'betting'}
          >
            <span className="mb-1 text-2xl drop-shadow-[0_0_10px_rgba(237,65,99,0.8)]">🔴</span>
            <span className="tracking-wide uppercase font-black">Red</span>
            {renderChip('color-red')}
          </button>
        </div>

        <label className="text-xs text-[#B1BAD3] font-bold uppercase tracking-wider mb-3 block flex justify-between">
          <span>Numbers</span>
          <span className="text-[#8790a1] font-mono">9x</span>
        </label>
        <div className="grid grid-cols-5 gap-2">
          {[0,1,2,3,4,5,6,7,8,9].map(num => (
            <button 
              key={num}
              onClick={() => placeBet('number', num)}
              className={getNumberStyle(num)}
              disabled={phase !== 'betting'}
            >
              {num}
              {renderChip(`number-${num}`)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 shadow-inner mt-auto flex items-center justify-between">
        <div className="text-xs text-[#B1BAD3] uppercase font-bold tracking-wider">Total Bet</div>
        <div className="text-xl font-display font-bold text-white">
          {totalBetAmount.toFixed(4)}
        </div>
      </div>
    </div>
  );

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((timeLeft / 30) * circumference);

  return (
    <GameLayout title="Color Trading" balance={balance} onBack={onBack} controls={controls}>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 md:p-8 bg-gradient-to-b from-[#0F212E] to-[#1A2C38]/50 overflow-hidden">
        
        {/* Animated Background Sine Wave (Simulating Live Trading Data) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center">
           <svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 1000 200">
             <motion.path 
                d="M 0 100 Q 125 50 250 100 T 500 100 T 750 100 T 1000 100"
                fill="transparent"
                stroke="#00E701"
                strokeWidth="2"
                animate={{
                   d: [
                      "M 0 100 Q 125 50 250 100 T 500 100 T 750 100 T 1000 100",
                      "M 0 100 Q 125 150 250 100 T 500 100 T 750 100 T 1000 100",
                      "M 0 100 Q 125 50 250 100 T 500 100 T 750 100 T 1000 100"
                   ]
                }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
             />
             <motion.path 
                d="M 0 100 Q 250 150 500 100 T 1000 100"
                fill="transparent"
                stroke="#ED4163"
                strokeWidth="2"
                animate={{
                   d: [
                      "M 0 100 Q 250 150 500 100 T 1000 100",
                      "M 0 100 Q 250 50 500 100 T 1000 100",
                      "M 0 100 Q 250 150 500 100 T 1000 100"
                   ]
                }}
                transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
             />
           </svg>
        </div>

        {/* Profit/Loss Notification */}
        <AnimatePresence>
          {profit !== null && phase === 'result' && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`absolute top-8 left-1/2 -translate-x-1/2 px-10 py-4 rounded-3xl font-black text-3xl border-4 shadow-2xl z-30 backdrop-blur-xl flex flex-col items-center
                ${profit > 0 ? 'bg-[#00E701]/20 text-[#00E701] border-[#00E701] shadow-[0_0_50px_rgba(0,231,1,0.5)]' : 
                  profit < 0 ? 'bg-[#ED4163]/20 text-[#ED4163] border-[#ED4163] shadow-[0_0_50px_rgba(237,65,99,0.5)]' : 
                  'bg-[#2F4553]/80 text-white border-white/20'}`}
            >
              <span className="text-sm uppercase tracking-[0.2em] mb-1 font-bold opacity-90">
                {profit > 0 ? 'Trade Won' : profit < 0 ? 'Trade Lost' : 'No Profit'}
              </span>
              {profit > 0 ? '+' : ''}{profit.toFixed(4)}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-12">
          {/* SVG Timer Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90 filter drop-shadow-[0_0_10px_rgba(0,0,0,0.5)]">
            <circle cx="50%" cy="50%" r={radius} stroke="#1A2C38" strokeWidth="16" fill="none" />
            <motion.circle 
              cx="50%" cy="50%" r={radius} 
              stroke={phase === 'betting' ? '#00E701' : phase === 'locked' ? '#ED4163' : '#B388FF'} 
              strokeWidth="16" fill="none" strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1, ease: "linear" }}
              className={phase === 'betting' ? "drop-shadow-[0_0_15px_rgba(0,231,1,0.5)]" : phase === 'locked' ? "drop-shadow-[0_0_15px_rgba(237,65,99,0.5)]" : "drop-shadow-[0_0_15px_rgba(179,136,255,0.5)]"}
            />
          </svg>
          
          <div className="text-center z-10 flex flex-col items-center justify-center bg-[#0F212E]/90 rounded-full w-[220px] h-[220px] md:w-[230px] md:h-[230px] border-4 border-[#1A2C38] backdrop-blur-xl shadow-inner">
            <AnimatePresence mode="wait">
              {phase === 'result' && result !== null ? (
                <motion.div 
                  key="result"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  className={`w-40 h-40 rounded-full flex items-center justify-center text-7xl font-black font-display border-4 shadow-[inset_0_0_20px_rgba(0,0,0,0.3)] ${getResultColorClass(result)}`}
                >
                  <span className="drop-shadow-lg">{result}</span>
                </motion.div>
              ) : phase === 'locked' ? (
                <motion.div
                  key="locked"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <span className="text-4xl font-display font-black mb-1 text-[#ED4163] animate-pulse uppercase tracking-widest drop-shadow-[0_0_10px_rgba(237,65,99,0.5)]">Locked</span>
                  <span className="text-sm text-[#8790a1] uppercase font-bold">Waiting...</span>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.span 
                    animate={
                      timeLeft <= 5 
                        ? { scale: [1, 1.2, 1], color: ['#ffffff', '#ED4163', '#ffffff'] } 
                        : {}
                    }
                    transition={{ repeat: timeLeft <= 5 ? Infinity : 0, duration: 1 }}
                    className={`text-7xl font-display font-black mb-1 tracking-tighter drop-shadow-md ${timeLeft <= 5 ? 'text-[#ED4163]' : 'text-white'}`}
                  >
                    {timeLeft}
                  </motion.span>
                  <span className="text-[#00E701] font-bold tracking-widest text-sm uppercase">
                    Place Bets
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="w-full max-w-3xl bg-[#0F212E] p-4 md:p-6 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 md:gap-6 items-center overflow-hidden shadow-2xl">
          <span className="text-[#B1BAD3] font-bold uppercase tracking-widest text-xs whitespace-nowrap bg-[#1A2C38] px-4 py-2 rounded-lg">History</span>
          <div className="flex gap-2.5 w-full overflow-x-auto pb-2 custom-scrollbar items-center">
            {history.map((h, i) => (
              <div key={i} className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-bold font-display text-lg shadow-md transition-transform hover:scale-110 ${getHistoryColorClass(h)}`}>
                {h}
              </div>
            ))}
          </div>
        </div>

      </div>
    </GameLayout>
  );
}
