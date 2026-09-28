import React from 'react';

export default function BetControls({ betAmount, setBetAmount, maxBet, disabled }) {
  return (
    <div className="bg-[#0F212E] rounded-lg border border-white/[0.04]">
      <label className="text-xs text-[#B1BAD3] font-semibold uppercase px-3 pt-2 block">Bet Amount</label>
      <div className="flex items-center">
        <input
          type="number"
          value={betAmount}
          onChange={e => setBetAmount(Math.max(0.00000001, Number(e.target.value)))}
          className="bg-transparent text-white p-3 w-full font-bold font-display outline-none"
          step="0.001"
          min="0.00000001"
          disabled={disabled}
        />
        <div className="flex border-l border-white/[0.04]">
          <button
            className="px-3 py-3 text-[#B1BAD3] hover:text-white font-bold text-sm transition-colors disabled:opacity-30"
            onClick={() => setBetAmount(a => Math.max(0.00000001, a / 2))}
            disabled={disabled}
          >½</button>
          <button
            className="px-3 py-3 text-[#B1BAD3] hover:text-white font-bold text-sm border-l border-white/[0.04] transition-colors disabled:opacity-30"
            onClick={() => setBetAmount(a => maxBet ? Math.min(maxBet, a * 2) : a * 2)}
            disabled={disabled}
          >2×</button>
        </div>
      </div>
    </div>
  );
}
