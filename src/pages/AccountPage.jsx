import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getBalance } from '../utils/balance';
import { motion } from 'framer-motion';
import { 
  User, 
  Copy, 
  Check, 
  ShieldCheck, 
  Wallet, 
  History, 
  Gamepad2, 
  LogOut, 
  Calendar, 
  Mail, 
  Sparkles,
  ExternalLink,
  Lock
} from 'lucide-react';

export default function AccountPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const [balance, setBalance] = useState(getBalance());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleBalanceUpdate = () => setBalance(getBalance());
    window.addEventListener('balance-update', handleBalanceUpdate);
    const interval = setInterval(() => setBalance(getBalance()), 1000);
    return () => {
      window.removeEventListener('balance-update', handleBalanceUpdate);
      clearInterval(interval);
    };
  }, []);

  const copyUserId = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center">
        <div className="bg-[#1A2C38] border border-white/5 p-8 rounded-3xl max-w-md w-full shadow-2xl flex flex-col items-center">
          <div className="p-4 bg-white/5 rounded-2xl mb-4 text-[#B1BAD3]">
            <Lock className="w-12 h-12 text-[#1475E1]" />
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Account Sign In Required</h2>
          <p className="text-[#B1BAD3] text-sm mb-6">
            Sign in with Google to view your player profile, user ID, and manage your casino balance.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-3.5 px-6 bg-[#00E701] hover:bg-[#00E701]/90 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(0,231,1,0.3)] hover:-translate-y-0.5"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Recent Player';

  const btcPriceUsd = 65000;
  const balanceUsd = (balance * btcPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#1A2C38] via-[#162734] to-[#0F212E] border border-white/10 p-6 sm:p-8 shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1475E1]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-[#00E701]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#0F212E] border-2 border-[#1475E1] shadow-[0_0_25px_rgba(20,117,225,0.3)] object-cover" 
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00E701] border-2 border-[#1A2C38] rounded-full shadow-[0_0_8px_#00E701]" title="Active" />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">
                  {user.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#00E701]/10 text-[#00E701] border border-[#00E701]/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Player
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-[#B1BAD3] text-sm mt-1">
                <Mail className="w-4 h-4 text-[#557086]" />
                <span>{user.email || 'Google Account'}</span>
              </div>

              <div className="flex items-center gap-2 text-[#557086] text-xs mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-[#00E701] hover:bg-[#00E701]/90 text-black font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(0,231,1,0.3)] hover:-translate-y-0.5 text-sm"
            >
              <Gamepad2 className="w-4 h-4" />
              Play Games
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-[#ED4163]/20 text-[#B1BAD3] hover:text-[#ED4163] border border-white/10 rounded-xl transition-all text-sm font-semibold"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Grid: User ID & Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* User ID & Identity Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A2C38] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#557086] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#1475E1]" />
                Generated Player ID
              </span>
              <span className="text-[11px] bg-white/5 text-[#B1BAD3] px-2 py-0.5 rounded-full border border-white/5">
                UID
              </span>
            </div>

            <p className="text-sm text-[#B1BAD3] mb-3">
              Your unique cryptographic player identifier across the casino ecosystem:
            </p>

            <div className="bg-[#0F212E] border border-white/10 rounded-xl p-3.5 flex items-center justify-between gap-3 font-mono text-sm">
              <span className="text-white truncate select-all">{user.id}</span>
              <button
                onClick={copyUserId}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1475E1]/20 hover:bg-[#1475E1]/40 text-[#1475E1] hover:text-white border border-[#1475E1]/30 transition-all text-xs font-bold font-sans"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#00E701]" />
                    <span className="text-[#00E701]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5 grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#557086] block">Status</span>
              <span className="text-[#00E701] font-bold">Authenticated</span>
            </div>
            <div>
              <span className="text-[#557086] block">Security Method</span>
              <span className="text-white font-medium">Google OAuth 2.0</span>
            </div>
          </div>
        </motion.div>

        {/* Casino Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-br from-[#1A2C38] to-[#14232e] border border-white/10 rounded-3xl p-6 shadow-xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#557086] flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#00E701]" />
                Casino Vault Balance
              </span>
              <span className="text-[11px] bg-[#00E701]/10 text-[#00E701] font-bold px-2 py-0.5 rounded-full border border-[#00E701]/20">
                Live Synced
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl sm:text-4xl font-black font-display text-white tabular-nums tracking-tight">
                {balance.toFixed(8)}
              </span>
              <span className="text-lg font-bold text-[#00E701]">BTC</span>
            </div>
            <p className="text-sm text-[#B1BAD3]">
              ≈ ${balanceUsd} USD
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5 flex gap-3">
            <button
              onClick={() => onNavigate('wallet')}
              className="flex-1 py-3 px-4 bg-[#1475E1] hover:bg-[#1475E1]/80 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(20,117,225,0.3)] text-sm flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Deposit / Withdraw
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="py-3 px-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl transition-all border border-white/10 text-sm flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" />
              Bets
            </button>
          </div>
        </motion.div>

      </div>

      {/* Security & Provably Fair Section */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1A2C38] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#00E701]/10 text-[#00E701] rounded-xl border border-[#00E701]/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Provably Fair & Security Status</h2>
            <p className="text-xs text-[#B1BAD3]">All game rounds are cryptographically verified using SHA-256 HMAC</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0F212E] p-4 rounded-2xl border border-white/5">
            <span className="text-xs text-[#557086] block mb-1">RNG Protocol</span>
            <span className="text-sm font-bold text-white">HMAC SHA-256</span>
            <p className="text-[11px] text-[#B1BAD3] mt-1">Server seed hashed before each wager</p>
          </div>

          <div className="bg-[#0F212E] p-4 rounded-2xl border border-white/5">
            <span className="text-xs text-[#557086] block mb-1">Account Tier</span>
            <span className="text-sm font-bold text-[#00E701]">VIP Tier 1</span>
            <p className="text-[11px] text-[#B1BAD3] mt-1">Instant payouts & zero fee wagers</p>
          </div>

          <div className="bg-[#0F212E] p-4 rounded-2xl border border-white/5">
            <span className="text-xs text-[#557086] block mb-1">Session Protocol</span>
            <span className="text-sm font-bold text-[#1475E1]">Firebase Secure JWT</span>
            <p className="text-[11px] text-[#B1BAD3] mt-1">Encrypted authentication handshake</p>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
