import React, { useState, useEffect } from 'react';
import { getHistory } from '../utils/balance';
import { format } from 'date-fns';

export default function HistoryPage({ onNavigate }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory().reverse());
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0B0D11] text-white p-4 sm:p-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Bet History</h1>
          <p className="text-slate-400 text-xs mt-0.5">Chronological record of verified game rounds</p>
        </div>
        <div className="text-slate-400 text-xs bg-[#14171F] px-3.5 py-1.5 rounded-xl border border-white/[0.06]">
          Last <span className="font-semibold text-white">{history.length}</span> bets
        </div>
      </div>

      <div className="bg-[#14171F] rounded-2xl border border-white/[0.07] shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#10131A] border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                <th className="p-3.5">Game</th>
                <th className="p-3.5">Time</th>
                <th className="p-3.5">Bet</th>
                <th className="p-3.5">Multiplier</th>
                <th className="p-3.5">Payout</th>
                <th className="p-3.5 text-right">Profit / Loss</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-xs font-mono">
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-500 font-sans">
                     No betting history found yet. Play a round to view your audit log.
                  </td>
                </tr>
              ) : (
                history.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-3.5 font-sans font-medium text-white capitalize">
                      {entry.game}
                    </td>
                    <td className="p-3.5 text-slate-500 text-[11px]">
                      {format(new Date(entry.timestamp), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {entry.bet.toFixed(4)}
                    </td>
                    <td className="p-3.5 font-semibold text-white">
                      {entry.multiplier > 0 ? `${entry.multiplier}x` : '0.00x'}
                    </td>
                    <td className="p-3.5 text-slate-300">
                      {entry.payout.toFixed(4)}
                    </td>
                    <td className="p-3.5 text-right font-semibold">
                      <span className={entry.profit > 0 ? 'text-emerald-400' : entry.profit < 0 ? 'text-rose-400' : 'text-slate-400'}>
                        {entry.profit > 0 ? '+' : ''}{entry.profit.toFixed(4)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
