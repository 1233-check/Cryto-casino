import React, { useState, useEffect } from 'react';
import { useAuth, isUserAdmin } from '../context/AuthContext';
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
  Lock,
  ShieldAlert
} from 'lucide-react';

export default function AccountPage({ onNavigate }) {
  const { user, logout } = useAuth();
  const isAdmin = isUserAdmin(user);
  const [balance, setBalance] = useState(getBalance());
  const [copied, setCopied] = useState(false);
  const [clientSeed, setClientSeed] = useState(() => localStorage.getItem('cryptobet_client_seed') || 'provably_fair_client');
  const [seedSaved, setSeedSaved] = useState(false);
  const [selfExclusion, setSelfExclusion] = useState(() => localStorage.getItem('cryptobet_self_exclusion') || 'none');
  const [depositLimit, setDepositLimit] = useState(() => localStorage.getItem('cryptobet_deposit_limit') || 'unlimited');

  const saveClientSeed = () => {
    localStorage.setItem('cryptobet_client_seed', clientSeed);
    setSeedSaved(true);
    setTimeout(() => setSeedSaved(false), 2000);
  };

  const randomizeSeed = () => {
    const random = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setClientSeed(random);
    localStorage.setItem('cryptobet_client_seed', random);
    setSeedSaved(true);
    setTimeout(() => setSeedSaved(false), 2000);
  };

  const updateSelfExclusion = (val) => {
    setSelfExclusion(val);
    localStorage.setItem('cryptobet_self_exclusion', val);
    if (val !== 'none') {
      alert(`Self-exclusion applied for ${val}. Responsible gaming protections are active.`);
    }
  };

  const updateDepositLimit = (val) => {
    setDepositLimit(val);
    localStorage.setItem('cryptobet_deposit_limit', val);
  };

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
        <div className="bg-[#14171F] border border-white/[0.07] p-8 rounded-2xl max-w-md w-full shadow-md flex flex-col items-center">
          <div className="p-3 bg-white/[0.05] rounded-xl mb-4 text-slate-400">
            <Lock className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Account Sign In Required</h2>
          <p className="text-slate-400 text-xs mb-6">
            Sign in to view your player profile, user ID, and manage your crypto balances.
          </p>
          <button
            onClick={() => onNavigate('login')}
            className="w-full py-3 px-5 bg-[#10B981] hover:bg-[#059669] text-gray-950 font-bold rounded-xl transition-all shadow-sm text-xs uppercase tracking-wider"
          >
            Sign In or Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const formattedDate = user.createdAt 
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Recent Member';

  const btcPriceUsd = 65000;
  const balanceUsd = (balance * btcPriceUsd).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
      
      {/* Header Banner - Matte Charcoal Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-[#14171F] border border-white/[0.07] p-5 sm:p-7 shadow-sm"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={user.avatar} 
                alt={user.name} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#10131A] border border-white/10 object-cover" 
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 border-2 border-[#14171F] rounded-full" title="Active" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {user.name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-slate-400 text-xs mt-1">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span className="truncate max-w-xs">{user.email || user.walletAddress || 'Web3 Account'}</span>
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-[11px] mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>Joined {formattedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold rounded-xl transition-all text-xs"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('home')}
              className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#10B981] hover:bg-[#059669] text-gray-950 font-bold rounded-xl transition-all shadow-sm text-xs"
            >
              <Gamepad2 className="w-3.5 h-3.5 fill-gray-950" />
              Play Games
            </button>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white/[0.04] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/[0.07] rounded-xl transition-all text-xs font-medium"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Grid: User ID & Balance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* User ID & Identity Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#14171F] border border-white/[0.07] rounded-2xl p-5 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-400" />
                Player ID
              </span>
              <span className="text-[10px] bg-white/[0.05] text-slate-400 px-2 py-0.5 rounded font-mono">
                UID
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Your unique cryptographic player identifier across the casino ecosystem:
            </p>

            <div className="bg-[#10131A] border border-white/[0.07] rounded-xl p-3 flex items-center justify-between gap-3 font-mono text-xs">
              <span className="text-white truncate select-all">{user.id}</span>
              <button
                onClick={copyUserId}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/[0.08] transition-all text-[11px] font-medium font-sans"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 text-[11px] block">Status</span>
              <span className="text-emerald-400 font-semibold">Authenticated</span>
            </div>
            <div>
              <span className="text-slate-500 text-[11px] block">Security Method</span>
              <span className="text-white font-medium capitalize">
                {user.isWalletUser ? `${user.walletType || 'Web3'} Connected` : 'Google OAuth 2.0'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Casino Balance Card */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#14171F] border border-white/[0.07] rounded-2xl p-5 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                Casino Vault Balance
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/20">
                Live Synced
              </span>
            </div>

            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-2xl sm:text-3xl font-bold text-white tabular-nums tracking-tight">
                {balance.toFixed(8)}
              </span>
              <span className="text-base font-semibold text-emerald-400">BTC</span>
            </div>
            <p className="text-xs text-slate-400">
              ≈ ${balanceUsd} USD
            </p>
          </div>

          <div className="mt-5 pt-4 border-t border-white/[0.05] flex gap-2.5">
            <button
              onClick={() => onNavigate('wallet')}
              className="flex-1 py-2.5 px-3.5 bg-[#10B981] hover:bg-[#059669] text-gray-950 font-bold rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 fill-gray-950" />
              Deposit / Withdraw
            </button>
            <button
              onClick={() => onNavigate('history')}
              className="py-2.5 px-3.5 bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 font-semibold rounded-xl transition-all border border-white/[0.07] text-xs flex items-center justify-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              History
            </button>
          </div>
        </motion.div>

      </div>

      {/* Security & Provably Fair Section */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-[#14171F] border border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Provably Fair &amp; Security Protocol</h2>
            <p className="text-xs text-slate-400">All game rounds are verified using SHA-256 HMAC cryptographic hashing</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#10131A] p-3.5 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">RNG Protocol</span>
            <span className="text-xs font-semibold text-white">HMAC SHA-256</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Pre-committed hashed seeds</p>
          </div>

          <div className="bg-[#10131A] p-3.5 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Account Tier</span>
            <span className="text-xs font-semibold text-emerald-400">VIP Tier 1</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Zero-fee settlement</p>
          </div>

          <div className="bg-[#10131A] p-3.5 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">Session Protocol</span>
            <span className="text-xs font-semibold text-blue-400">Secure JWT</span>
            <p className="text-[10px] text-slate-400 mt-0.5">Encrypted authentication</p>
          </div>
        </div>

        {/* Client Seed Customizer */}
        <div className="mt-5 pt-5 border-t border-white/[0.05]">
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2">
            Active Client Seed
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={clientSeed}
              onChange={(e) => setClientSeed(e.target.value)}
              className="flex-1 bg-[#10131A] border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none focus:border-white/20"
              placeholder="Enter custom client seed"
            />
            <button
              onClick={randomizeSeed}
              className="px-3.5 py-2.5 bg-white/[0.05] hover:bg-white/[0.09] text-slate-300 rounded-xl text-xs font-semibold transition-all border border-white/[0.07]"
            >
              Randomize
            </button>
            <button
              onClick={saveClientSeed}
              className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-gray-950 rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              {seedSaved ? 'Saved ✓' : 'Update Seed'}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Your client seed directly alters the cryptographic hash outcome. Modifying this guarantees zero house bias.
          </p>
        </div>
      </motion.div>

      {/* Responsible Gaming & Limits */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#14171F] border border-white/[0.07] rounded-2xl p-5 sm:p-6 shadow-sm"
      >
        <div className="flex items-center gap-2.5 mb-5">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Responsible Gaming &amp; Protection</h2>
            <p className="text-xs text-slate-400">Configure daily deposit limits or activate temporary cooling-off periods</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-[#10131A] p-3.5 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Daily Deposit Limit</span>
            <select
              value={depositLimit}
              onChange={(e) => updateDepositLimit(e.target.value)}
              className="w-full bg-[#14171F] border border-white/[0.07] rounded-xl p-2.5 text-xs font-semibold text-white outline-none"
            >
              <option value="unlimited">No Limit (Default)</option>
              <option value="0.1">0.10 BTC / Day</option>
              <option value="0.5">0.50 BTC / Day</option>
              <option value="1.0">1.00 BTC / Day</option>
            </select>
          </div>

          <div className="bg-[#10131A] p-3.5 rounded-xl border border-white/[0.05]">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">Self-Exclusion Cooling-Off</span>
            <select
              value={selfExclusion}
              onChange={(e) => updateSelfExclusion(e.target.value)}
              className="w-full bg-[#14171F] border border-white/[0.07] rounded-xl p-2.5 text-xs font-semibold text-white outline-none"
            >
              <option value="none">Active (No Freeze)</option>
              <option value="24h">24 Hour Cool-Off</option>
              <option value="7d">7 Day Self-Exclusion</option>
              <option value="30d">30 Day Self-Exclusion</option>
            </select>
          </div>
        </div>
      </motion.div>

    </div>
  );
}
