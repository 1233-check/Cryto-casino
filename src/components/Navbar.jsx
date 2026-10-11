import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  Search, 
  Bell, 
  Settings, 
  LogIn, 
  User, 
  ShieldAlert, 
  Crown, 
  ChevronDown, 
  Sparkles,
  Menu,
  X
} from 'lucide-react';
import { getBalance } from '../utils/balance';
import { useAuth, isUserAdmin } from '../context/AuthContext';

export default function Navbar({ onNavigate, onToggleMobileSidebar }) {
  const [balance, setBalance] = useState(getBalance());
  const [currency, setCurrency] = useState('BTC'); // 'BTC' | 'USD'
  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);

  const navigateTo = (view) => {
    if (onNavigate) {
      onNavigate(view);
    } else if (typeof window !== 'undefined') {
      window.location.hash = `#${view}`;
    }
  };

  // Listen for balance updates from anywhere in the app
  useEffect(() => {
    const handleBalanceUpdate = () => setBalance(getBalance());
    window.addEventListener('balance-update', handleBalanceUpdate);
    const interval = setInterval(() => {
      setBalance(getBalance());
    }, 1000);
    return () => {
      window.removeEventListener('balance-update', handleBalanceUpdate);
      clearInterval(interval);
    };
  }, []);

  const btcPriceUsd = 65000;
  const numBalance = typeof balance === 'number' ? balance : parseFloat(balance || 0);
  const formattedBtc = numBalance.toFixed(8);
  const formattedUsd = (numBalance * btcPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <nav className="h-[64px] bg-[#1A2C38]/95 backdrop-blur-xl border-b border-white/[0.06] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Left - Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 md:hidden text-[#B1BAD3] hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        <div className="md:hidden flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('home')}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#1475E1] to-[#00E701] flex items-center justify-center shadow-[0_0_12px_rgba(0,231,1,0.35)]">
            <Sparkles className="w-4 h-4 text-black" />
          </div>
          <span className="font-display font-black text-lg text-white">
            CRYPTO<span className="text-[#00E701]">BET</span>
          </span>
        </div>

        {/* Live Community Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#0F212E] rounded-full border border-white/5 text-xs text-[#B1BAD3]">
          <span className="w-2 h-2 rounded-full bg-[#00E701] animate-pulse shadow-[0_0_8px_#00E701]" />
          <span className="font-semibold text-white">4,219</span>
          <span className="text-[#557086]">Online</span>
        </div>
      </div>
      
      {/* Center - Search Bar */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#557086]" />
          <input 
            type="text" 
            placeholder="Search games, providers, tags..." 
            className="w-full bg-[#0F212E] text-white pl-10 pr-4 py-2 rounded-xl border border-white/5 focus:outline-none focus:border-[#1475E1] focus:ring-1 focus:ring-[#1475E1] transition-all text-xs placeholder:text-[#557086]"
          />
        </div>
      </div>

      {/* Right - Admin, Balance, Wallet, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Admin Dashboard Pill (Special for authorized admins like tejugiri549@gmail.com and giribiju456@gmail.com) */}
        {isAdmin && (
          <button 
            onClick={() => navigateTo('admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ED4163]/20 border border-[#ED4163]/50 text-[#ED4163] hover:bg-[#ED4163]/30 rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(237,65,99,0.3)] animate-pulse"
            title="Admin Dashboard (Authorized)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Panel</span>
          </button>
        )}

        {user ? (
          <>
            {/* Vault Balance Display with currency switch */}
            <div 
              onClick={() => setCurrency(currency === 'BTC' ? 'USD' : 'BTC')}
              className="bg-[#0F212E] hover:bg-[#213743] transition-colors cursor-pointer px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 sm:gap-3 border border-white/5 select-none"
              title="Click to toggle between BTC and USD"
            >
              <div className="flex flex-col text-right">
                <span className="font-bold font-display tracking-wider text-xs sm:text-sm tabular-nums text-white">
                  {currency === 'BTC' ? formattedBtc : `$${formattedUsd}`}
                </span>
              </div>
              <span className={`text-[10px] sm:text-xs font-extrabold px-1.5 py-0.5 rounded ${
                currency === 'BTC' ? 'bg-[#00E701]/20 text-[#00E701]' : 'bg-[#1475E1]/20 text-[#1475E1]'
              }`}>
                {currency}
              </span>
            </div>
            
            {/* Wallet / Deposit Button */}
            <button 
              onClick={() => navigateTo('wallet')}
              className="bg-gradient-to-r from-[#1475E1] to-[#0088FF] hover:brightness-110 transition-all text-white px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_15px_rgba(20,117,225,0.35)] hover:-translate-y-0.5"
            >
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">Wallet</span>
            </button>

            {/* User Profile Pill */}
            <button
              onClick={() => navigateTo('account')}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 bg-[#0F212E] hover:bg-[#213743] rounded-xl border border-white/5 transition-all text-left group"
              title="View Account Profile"
            >
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#2F4553] object-cover border border-[#00E701]/50" 
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00E701] ring-2 ring-[#0F212E]" />
              </div>
              <div className="hidden md:flex flex-col max-w-[90px]">
                <span className="text-xs font-bold text-white truncate group-hover:text-[#00E701] transition-colors">
                  {user.name}
                </span>
                <span className="text-[10px] text-[#557086] truncate">
                  {isAdmin ? 'Admin' : 'VIP Bronze'}
                </span>
              </div>
            </button>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigateTo('login')}
              className="bg-gradient-to-r from-[#00E701] to-[#00C853] hover:brightness-110 transition-all text-black px-4 sm:px-6 py-2 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,231,1,0.4)] hover:-translate-y-0.5"
            >
              <LogIn className="w-4 h-4 fill-black" />
              <span>Sign In / Play</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
