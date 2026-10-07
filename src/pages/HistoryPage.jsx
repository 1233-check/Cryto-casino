import React, { useState, useEffect } from 'react';
import { getHistory } from '../utils/balance';
import { format } from 'date-fns';

export default function HistoryPage({ onNavigate }) {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setHistory(getHistory().reverse());
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#0F212E] text-white p-4 sm:p-8 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black font-display tracking-tight text-white">Game History</h1>
        <div className="text-[#B1BAD3] text-sm">
           Showing last <span className="font-bold text-white">{history.length}</span> bets
        </div>
      </div>

      <div className="bg-[#1A2C38] rounded-2xl border border-white/5 shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0F212E]/50 border-b border-white/5 text-xs uppercase tracking-wider text-[#B1BAD3]">
                <th className="p-4 font-bold">Game</th>
                <th className="p-4 font-bold">Time</th>
                <th className="p-4 font-bold">Bet Amount</th>
                <th className="p-4 font-bold">Multiplier</th>
                <th className="p-4 font-bold">Payout</th>
                <th className="p-4 font-bold text-right">Profit / Loss</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-12 text-center text-[#B1BAD3]">
                     No betting history found. Start playing to see your stats here!
                  </td>
                </tr>
              ) : (
                history.map((entry, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="capitalize font-bold text-white">{entry.game}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-[#B1BAD3]">
                      {format(new Date(entry.timestamp), 'MMM d, HH:mm:ss')}
                    </td>
                    <td className="p-4 font-mono font-medium">
                      {entry.bet.toFixed(2)}
                    </td>
                    <td className="p-4 font-mono font-bold text-white">
                      {entry.multiplier > 0 ? `${entry.multiplier}x` : '-'}
                    </td>
                    <td className="p-4 font-mono font-medium text-white">
                      {entry.payout.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-display font-black">
                      <span className={entry.profit > 0 ? 'text-[#00E701]' : entry.profit < 0 ? 'text-[#ED4163]' : 'text-[#B1BAD3]'}>
                        {entry.profit > 0 ? '+' : ''}{entry.profit.toFixed(2)}
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
