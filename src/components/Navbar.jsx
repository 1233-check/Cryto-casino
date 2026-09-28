import React, { useState, useEffect } from 'react';
import { Wallet, Search, Bell, Settings } from 'lucide-react';
import { getBalance } from '../utils/balance';

export default function Navbar() {
  const [balance, setBalance] = useState(getBalance());

  // Listen for balance updates from anywhere in the app
  useEffect(() => {
    const interval = setInterval(() => {
      setBalance(getBalance());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="h-[64px] bg-[#1A2C38] border-b border-white/[0.04] px-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Mobile menu spacer */}
        <div className="w-10 md:hidden"></div>
      </div>
      
      {/* Center - Search */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#557086]" />
          <input 
            type="text" 
            placeholder="Search your game..." 
            className="w-full bg-[#0F212E] text-white pl-10 pr-4 py-2 rounded-lg border border-white/[0.04] focus:outline-none focus:border-[#1475E1] transition-colors text-sm"
          />
        </div>
      </div>

      {/* Right - Balance & Profile */}
      <div className="flex items-center gap-3">
        <div className="bg-[#0F212E] px-4 py-2 rounded-lg flex items-center gap-3 border border-white/[0.04]">
          <span className="font-bold font-display tracking-wider text-sm tabular-nums">
            {balance.toFixed(8)}
          </span>
          <span className="text-[#00E701] font-bold text-xs">BTC</span>
        </div>
        
        <button className="bg-[#1475E1] hover:bg-[#1475E1]/80 transition-colors text-white px-4 py-2 rounded-lg font-bold text-sm hidden sm:flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Wallet
        </button>

        <div className="flex items-center gap-1 border-l border-white/[0.04] pl-2 ml-1">
          <button className="p-2 text-[#B1BAD3] hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="p-2 text-[#B1BAD3] hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
