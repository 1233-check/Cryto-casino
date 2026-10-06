import React, { useState } from 'react';

export default function BetControls({ betAmount, setBetAmount, maxBet, disabled }) {
  const [mode, setMode] = useState('Manual'); // 'Manual' or 'Auto'

  const handleAdd = (val) => {
    setBetAmount(a => {
      const next = a + val;
      return maxBet ? Math.min(maxBet, next) : next;
    });
  };

  return (
    <div className="flex flex-col space-y-4">
      {/* Manual / Auto Toggle */}
      <div className="flex bg-[#0F212E] rounded-full p-1 border border-white/5 shadow-inner">
        {['Manual', 'Auto'].map(m => (
          <button
            key={m}
            className={`flex-1 py-2 text-sm font-bold rounded-full transition-all ${
              mode === m 
                ? 'bg-[#2F4553] text-white shadow-md' 
                : 'text-[#B1BAD3] hover:text-white hover:bg-white/5'
            }`}
            onClick={() => setMode(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="bg-[#0F212E] rounded-xl border border-white/5 p-3 shadow-inner group transition-colors focus-within:border-[#00E701]/50">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-[#B1BAD3] font-bold uppercase tracking-wider">Bet Amount</label>
          <span className="text-xs text-[#557086] font-bold uppercase">USD</span>
        </div>
        
        <div className="flex items-center bg-[#1A2C38] rounded-lg border border-white/5 focus-within:border-white/10 transition-colors overflow-hidden">
          <span className="pl-3 text-[#00E701] font-bold">$</span>
          <input
            type="number"
            value={betAmount === 0 ? '' : Number(betAmount).toString()}
            onChange={e => {
              const val = e.target.value === '' ? 0 : Number(e.target.value);
              setBetAmount(Math.max(0, val));
            }}
            className="bg-transparent text-white p-3 w-full font-bold font-display outline-none"
            step="0.01"
            min="0"
            disabled={disabled}
          />
          <div className="flex border-l border-white/5">
            <button
              className="px-3 text-[#B1BAD3] hover:text-white hover:bg-white/5 font-bold text-xs transition-colors disabled:opacity-30 border-r border-white/5"
              onClick={() => setBetAmount(a => Math.max(0.1, a / 2))}
              disabled={disabled}
            >½</button>
            <button
              className="px-3 text-[#B1BAD3] hover:text-white hover:bg-white/5 font-bold text-xs transition-colors disabled:opacity-30 border-r border-white/5"
              onClick={() => setBetAmount(a => maxBet ? Math.min(maxBet, a * 2) : a * 2)}
              disabled={disabled}
            >2×</button>
            <button
              className="px-3 text-[#B1BAD3] hover:text-white hover:bg-white/5 font-bold text-xs transition-colors disabled:opacity-30"
              onClick={() => {
                if (maxBet) setBetAmount(maxBet);
              }}
              disabled={disabled}
            >MAX</button>
          </div>
        </div>
      </div>

      {/* Quick Add Chips */}
      <div className="grid grid-cols-4 gap-2">
        <button 
          onClick={() => handleAdd(1)} 
          disabled={disabled}
          className="bg-[#0F212E] hover:bg-[#1A2C38] border border-white/5 rounded-lg py-2 text-xs font-bold text-[#B1BAD3] hover:text-white transition-colors disabled:opacity-50"
        >+1</button>
        <button 
          onClick={() => handleAdd(10)} 
          disabled={disabled}
          className="bg-[#0F212E] hover:bg-[#1A2C38] border border-white/5 rounded-lg py-2 text-xs font-bold text-[#B1BAD3] hover:text-white transition-colors disabled:opacity-50"
        >+10</button>
        <button 
          onClick={() => handleAdd(100)} 
          disabled={disabled}
          className="bg-[#0F212E] hover:bg-[#1A2C38] border border-white/5 rounded-lg py-2 text-xs font-bold text-[#B1BAD3] hover:text-white transition-colors disabled:opacity-50"
        >+100</button>
        <button 
          onClick={() => setBetAmount(0)} 
          disabled={disabled}
          className="bg-[#ED4163]/10 hover:bg-[#ED4163]/20 border border-[#ED4163]/20 rounded-lg py-2 text-xs font-bold text-[#ED4163] transition-colors disabled:opacity-50"
        >CLR</button>
      </div>

      {mode === 'Auto' && (
        <div className="bg-[#0F212E] rounded-xl border border-white/5 p-4 mt-2 space-y-4">
          <div className="text-xs text-[#00E701] font-bold uppercase tracking-wider text-center">Auto-Bet Active</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
               <label className="text-[10px] text-[#557086] font-bold uppercase block mb-1">On Win</label>
               <select className="w-full bg-[#1A2C38] border border-white/5 rounded-lg text-xs font-bold text-white p-2 outline-none">
                 <option>Reset Bet</option>
                 <option>Increase 100%</option>
               </select>
            </div>
            <div>
               <label className="text-[10px] text-[#557086] font-bold uppercase block mb-1">On Loss</label>
               <select className="w-full bg-[#1A2C38] border border-white/5 rounded-lg text-xs font-bold text-white p-2 outline-none">
                 <option>Increase 100%</option>
                 <option>Reset Bet</option>
               </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] text-[#557086] font-bold uppercase block mb-1">Number of Bets</label>
            <input type="number" defaultValue="0" className="w-full bg-[#1A2C38] border border-white/5 rounded-lg text-xs font-bold text-white p-2 outline-none" placeholder="0 (Infinite)" />
          </div>
        </div>
      )}
    </div>
  );
}
