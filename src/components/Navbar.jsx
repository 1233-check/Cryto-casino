import React, { useState, useEffect, useRef } from 'react';
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
  Check
} from 'lucide-react';
import { 
  getBalance, 
  getAllBalances, 
  getActiveCurrency, 
  setActiveCurrency, 
  getCurrencyConfig, 
  CURRENCIES 
} from '../utils/balance';
import { useAuth, isUserAdmin } from '../context/AuthContext';

export default function Navbar({ onNavigate, onToggleMobileSidebar }) {
  const [activeCurrency, setActiveCurrencyState] = useState(getActiveCurrency());
  const [balance, setBalance] = useState(getBalance());
  const [allBalances, setAllBalances] = useState(getAllBalances());
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { user } = useAuth();
  const isAdmin = isUserAdmin(user);
  const config = getCurrencyConfig(activeCurrency);

  const navigateTo = (view) => {
    if (onNavigate) {
      onNavigate(view);
    } else if (typeof window !== 'undefined') {
      window.location.hash = `#${view}`;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen for balance updates from anywhere in the app
  useEffect(() => {
    const handleBalanceUpdate = () => {
      const cur = getActiveCurrency();
      setActiveCurrencyState(cur);
      setBalance(getBalance(cur));
      setAllBalances(getAllBalances());
    };
    window.addEventListener('balance-update', handleBalanceUpdate);
    return () => window.removeEventListener('balance-update', handleBalanceUpdate);
  }, []);

  const numBalance = typeof balance === 'number' ? balance : parseFloat(balance || 0);

  return (
    <nav className="h-[64px] bg-[#0B0D11]/90 backdrop-blur-md border-b border-white/[0.07] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      
      {/* Left - Mobile Menu Toggle & Brand */}
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="p-2 md:hidden text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        <div className="md:hidden flex items-center gap-2.5 cursor-pointer" onClick={() => navigateTo('home')}>
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-gray-950 font-black text-sm">
            CB
          </div>
          <span className="font-bold text-base text-white tracking-tight">
            Crypto<span className="text-emerald-400">Bet</span>
          </span>
        </div>

        {/* Live Community Indicator */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-[#14171F] rounded-full border border-white/[0.06] text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">4,219</span>
          <span className="text-slate-400">Online</span>
        </div>
      </div>
      
      {/* Center - Search Bar */}
      <div className="hidden md:flex flex-1 max-w-sm mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search games, categories..." 
            className="w-full bg-[#14171F] text-white pl-9 pr-3.5 py-2 rounded-xl border border-white/[0.07] focus:outline-none focus:border-white/20 transition-all text-xs placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right - Admin, Balance, Wallet, Profile */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        
        {/* Admin Dashboard Pill */}
        {isAdmin && (
          <button 
            onClick={() => navigateTo('admin')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl text-xs font-semibold transition-all"
            title="Admin Dashboard (Authorized)"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin Panel</span>
          </button>
        )}

        {user ? (
          <>
            {/* Multi-Currency Dropdown Selector */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-[#14171F] hover:bg-[#1A1E27] transition-colors cursor-pointer px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl flex items-center gap-2 sm:gap-2.5 border border-white/[0.07] select-none"
                title="Click to switch active betting currency"
              >
                <span className="font-semibold text-sm" style={{ color: config.color }}>
                  {config.prefix}
                </span>
                <div className="flex flex-col text-right">
                  <span className="font-semibold text-xs sm:text-sm tabular-nums text-white">
                    {numBalance.toLocaleString(undefined, { 
                      minimumFractionDigits: config.decimals > 2 ? config.decimals : 2, 
                      maximumFractionDigits: config.decimals 
                    })}
                  </span>
                </div>
                <span 
                  className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${config.color}20`, color: config.color }}
                >
                  {config.symbol}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Currency Dropdown Popover */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#14171F] border border-white/[0.09] rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.05] mb-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Betting Currency
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">
                      Instant Settlement
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {Object.entries(CURRENCIES).map(([key, curr]) => {
                      const bal = allBalances[key] || 0;
                      const usdVal = (bal * curr.rateUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      const isSelected = key === activeCurrency;
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            setActiveCurrency(key);
                            setActiveCurrencyState(key);
                            setShowDropdown(false);
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                            isSelected 
                              ? 'bg-white/[0.08] border border-white/[0.1] shadow-sm' 
                              : 'hover:bg-white/[0.04] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span 
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs" 
                              style={{ backgroundColor: `${curr.color}20`, color: curr.color }}
                            >
                              {curr.icon}
                            </span>
                            <div className="text-left">
                              <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                                {curr.name}
                                <span className="text-[10px] text-slate-400 font-mono">({curr.symbol})</span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                ≈ ${usdVal} USD
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-semibold tabular-nums text-white block">
                              {bal.toLocaleString(undefined, { 
                                minimumFractionDigits: curr.decimals > 2 ? curr.decimals : 2, 
                                maximumFractionDigits: curr.decimals 
                              })}
                            </span>
                            {isSelected ? (
                              <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1 justify-end">
                                <Check className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500">1 {curr.symbol} = ${curr.rateUsd}</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            
            {/* Wallet / Deposit Button - Tactile Emerald */}
            <button 
              onClick={() => navigateTo('wallet')}
              className="bg-[#10B981] hover:bg-[#059669] text-gray-950 px-3.5 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-sm hover:-translate-y-0.5"
            >
              <Wallet className="w-3.5 h-3.5 fill-gray-950" />
              <span className="hidden sm:inline">Wallet</span>
            </button>

            {/* User Profile Pill */}
            <button
              onClick={() => navigateTo('account')}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 bg-[#14171F] hover:bg-[#1A1E27] rounded-xl border border-white/[0.07] transition-all text-left group"
              title="View Account Profile"
            >
              <div className="relative">
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#1A1E27] object-cover border border-white/10"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-400 border-2 border-[#14171F] rounded-full" />
              </div>
              <div className="hidden xl:flex flex-col">
                <span className="text-xs font-semibold text-white leading-tight group-hover:text-emerald-400 transition-colors truncate max-w-[90px]">
                  {user.name.split(' ')[0]}
                </span>
                <span className="text-[10px] text-slate-400 leading-none uppercase font-medium">
                  VIP 1
                </span>
              </div>
            </button>
          </>
        ) : (
          <button 
            onClick={() => navigateTo('login')}
            className="bg-white/10 hover:bg-white/[0.15] text-white px-4 sm:px-5 py-2 rounded-xl font-semibold text-xs sm:text-sm border border-white/[0.08] hover:-translate-y-0.5 transition-all flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}

      </div>

    </nav>
  );
}
