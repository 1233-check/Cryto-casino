import React, { useState, useEffect } from 'react';
import { getActiveCurrency, getCurrencyConfig, CURRENCIES, getBalance } from '../utils/balance';

export default function BetControls({ betAmount, setBetAmount, maxBet, disabled }) {
  const [mode, setMode] = useState('Manual'); // 'Manual' or 'Auto'
  const [currency, setCurrencyState] = useState(getActiveCurrency());
  const config = getCurrencyConfig(currency);

  useEffect(() => {
    const handleUpdate = (e) => {
      const active = getActiveCurrency();
      if (active !== currency) {
        setCurrencyState(active);
        const newConf = getCurrencyConfig(active);
        // Reset or scale bet amount to sensible default if it exceeds balance
        const currentBal = getBalance(active);
        if (betAmount > currentBal || betAmount <= 0) {
          setBetAmount(newConf.defaultBet);
        }
      }
    };

    window.addEventListener('balance-update', handleUpdate);
    return () => window.removeEventListener('balance-update', handleUpdate);
  }, [currency, betAmount, setBetAmount]);

  const handleAdd = (val) => {
    setBetAmount(a => {
      const next = parseFloat((Number(a) + Number(val)).toFixed(config.decimals));
      const limit = maxBet || getBalance(currency);
      return limit ? Math.min(limit, next) : next;
    });
  };

  const handleHalf = () => {
    setBetAmount(a => {
      const half = a / 2;
      return Math.max(config.minBet, parseFloat(half.toFixed(config.decimals)));
    });
  };

  const handleDouble = () => {
    setBetAmount(a => {
      const doubled = a * 2;
      const limit = maxBet || getBalance(currency);
      const next = limit ? Math.min(limit, doubled) : doubled;
      return parseFloat(next.toFixed(config.decimals));
    });
  };

  const handleMax = () => {
    const limit = maxBet || getBalance(currency);
    setBetAmount(parseFloat(Number(limit).toFixed(config.decimals)));
  };

  return (
    <div className="flex flex-col space-y-3.5">
      {/* Manual / Auto Toggle - Tactile Matte */}
      <div className="flex bg-[#10131A] rounded-xl p-1 border border-white/[0.06]">
        {['Manual', 'Auto'].map(m => (
          <button
            key={m}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              mode === m 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
            }`}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Bet Amount Input Card */}
      <div className="bg-[#10131A] rounded-xl border border-white/[0.07] p-3 transition-colors focus-within:border-emerald-500/40">
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">Bet Amount</label>
          <div className="flex items-center gap-1.5">
            <span 
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: `${config.color}20`, color: config.color }}
            >
              {config.symbol}
            </span>
            <span className="text-[11px] text-slate-400 font-medium uppercase">{config.name}</span>
          </div>
        </div>
        
        <div className="flex items-center bg-[#151922] rounded-lg border border-white/[0.06] focus-within:border-white/20 transition-colors overflow-hidden">
          <span className="pl-3 font-semibold text-sm" style={{ color: config.color }}>
            {config.prefix}
          </span>
          <input
            type="number"
            value={betAmount === 0 ? '' : Number(betAmount).toString()}
            onChange={e => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              setBetAmount(Math.max(0, val));
            }}
            className="bg-transparent text-white p-2.5 w-full font-semibold outline-none text-xs sm:text-sm tabular-nums"
            step={config.step}
            min="0"
            disabled={disabled}
            placeholder={config.defaultBet.toString()}
          />
          <div className="flex border-l border-white/[0.06] shrink-0">
            <button
              className="px-2.5 text-slate-400 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors disabled:opacity-30 border-r border-white/[0.06]"
              onClick={handleHalf}
              disabled={disabled}
              title="Half Bet"
            >½</button>
            <button
              className="px-2.5 text-slate-400 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors disabled:opacity-30 border-r border-white/[0.06]"
              onClick={handleDouble}
              disabled={disabled}
              title="2x Bet"
            >2×</button>
            <button
              className="px-2.5 text-slate-400 hover:text-white hover:bg-white/5 font-semibold text-xs transition-colors disabled:opacity-30"
              onClick={handleMax}
              disabled={disabled}
              title="Max Bet"
            >MAX</button>
          </div>
        </div>
      </div>

      {/* Quick Add Chips (Dynamically tailored to active currency) */}
      <div className="grid grid-cols-5 gap-1.5">
        {config.chips.map((chipVal) => (
          <button 
            key={chipVal}
            onClick={() => handleAdd(chipVal)} 
            disabled={disabled}
            className="bg-[#14171F] hover:bg-[#1C202B] border border-white/[0.06] rounded-lg py-1.5 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors disabled:opacity-50"
          >
            +{chipVal}
          </button>
        ))}
        <button 
          onClick={() => setBetAmount(0)} 
          disabled={disabled}
          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg py-1.5 text-[11px] font-semibold text-rose-400 transition-colors disabled:opacity-50"
        >
          CLR
        </button>
      </div>

      {mode === 'Auto' && (
        <div className="bg-[#10131A] rounded-xl border border-white/[0.06] p-3.5 mt-2 space-y-3">
          <div className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider text-center">Auto-Bet Active</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
               <label className="text-[10px] text-slate-400 font-medium uppercase block mb-1">On Win</label>
               <select className="w-full bg-[#151922] border border-white/[0.06] rounded-lg text-xs font-medium text-white p-2 outline-none">
                 <option>Reset Bet</option>
                 <option>Increase 100%</option>
               </select>
            </div>
            <div>
               <label className="text-[10px] text-slate-400 font-medium uppercase block mb-1">On Loss</label>
               <select className="w-full bg-[#151922] border border-white/[0.06] rounded-lg text-xs font-medium text-white p-2 outline-none">
                 <option>Increase 100%</option>
                 <option>Reset Bet</option>
               </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 font-medium uppercase block mb-1">Number of Bets</label>
            <input type="number" defaultValue="0" className="w-full bg-[#151922] border border-white/[0.06] rounded-lg text-xs font-medium text-white p-2 outline-none" placeholder="0 (Infinite)" />
          </div>
        </div>
      )}
    </div>
  );
}
