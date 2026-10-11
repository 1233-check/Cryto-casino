import React from 'react';
import { 
  Home, 
  User, 
  Gamepad2, 
  TrendingUp, 
  CircleDot, 
  Bomb, 
  Dice5, 
  ArrowUpToLine, 
  History, 
  LayoutGrid, 
  Target, 
  Activity, 
  LogOut, 
  FileText, 
  ShieldAlert, 
  Wallet,
  Sparkles,
  Flame,
  Award
} from 'lucide-react';
import { useAuth, isUserAdmin } from '../context/AuthContext';

export default function Sidebar({ activeView, setActiveView, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const isAdmin = isUserAdmin(user);

  const mainItems = [
    { id: 'home', label: 'Casino Home', icon: Home },
    { id: 'account', label: 'My Account', icon: User },
    { id: 'wallet', label: 'Wallet & Vault', icon: Wallet },
    { id: 'history', label: 'Game History', icon: FileText },
  ];

  const originalGames = [
    { id: 'crash', label: 'Crash', icon: TrendingUp, badge: 'HOT' },
    { id: 'dice', label: 'Dice', icon: Dice5, badge: '99%' },
    { id: 'mines', label: 'Mines', icon: Bomb, badge: 'POPULAR' },
    { id: 'limbo', label: 'Limbo', icon: ArrowUpToLine },
    { id: 'plinko', label: 'Plinko', icon: Activity, badge: 'NEW' },
    { id: 'tower', label: 'Tower', icon: LayoutGrid },
    { id: 'hilo', label: 'HiLo', icon: History },
    { id: 'keno', label: 'Keno', icon: LayoutGrid },
    { id: 'wheel', label: 'Wheel', icon: CircleDot },
    { id: 'colortrading', label: 'Color Trading', icon: Activity },
  ];

  const tableGames = [
    { id: 'roulette', label: 'Roulette', icon: CircleDot },
    { id: 'blackjack', label: 'Blackjack', icon: Gamepad2, badge: 'LIVE' },
    { id: 'baccarat', label: 'Baccarat', icon: Gamepad2 },
    { id: 'videopoker', label: 'Video Poker', icon: Gamepad2 },
    { id: 'slots', label: 'Slots', icon: Target, badge: 'JACKPOT' },
  ];

  const handleNav = (id) => {
    setActiveView(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-[240px] bg-[#0E1118] border-r border-white/[0.07] 
        flex flex-col h-screen shrink-0 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-[64px] flex items-center justify-between px-5 border-b border-white/[0.07] shrink-0">
          <button 
            onClick={() => handleNav('home')}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center text-gray-950 font-black text-sm">
              CB
            </div>
            <span className="font-bold text-base text-white tracking-tight">
              Crypto<span className="text-emerald-400">Bet</span>
            </span>
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-5">
          
          {/* Admin Management Section (Visible to authorized admins) */}
          {isAdmin && (
            <div>
              <h3 className="text-rose-400 text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-2.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Staff Administration
              </h3>
              <button
                onClick={() => handleNav('admin')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeView === 'admin'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Admin Panel</span>
                </div>
                <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold uppercase">
                  Staff
                </span>
              </button>
            </div>
          )}

          {/* Main Core Links */}
          <div>
            <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider mb-1.5 px-2.5">
              Platform
            </h3>
            <div className="flex flex-col gap-1">
              {mainItems.map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNav(item.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-white/[0.08] text-white border border-white/[0.08] shadow-sm' 
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake Originals */}
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3 h-3 text-emerald-400" />
                Originals
              </h3>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded">10</span>
            </div>
            <div className="flex flex-col gap-1">
              {originalGames.map(game => {
                const Icon = game.icon;
                const isActive = activeView === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleNav(game.id)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-white/[0.08] text-white border border-white/[0.08] shadow-sm font-semibold' 
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>{game.label}</span>
                    </div>
                    {game.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        game.badge === 'HOT' ? 'bg-rose-500/20 text-rose-400' :
                        game.badge === '99%' ? 'bg-emerald-500/20 text-emerald-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {game.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Table & Cards & Slots */}
          <div>
            <div className="flex items-center justify-between px-2.5 mb-1.5">
              <h3 className="text-slate-500 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3 h-3 text-blue-400" />
                Tables &amp; Slots
              </h3>
              <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/10 px-1.5 py-0.2 rounded">5</span>
            </div>
            <div className="flex flex-col gap-1">
              {tableGames.map(game => {
                const Icon = game.icon;
                const isActive = activeView === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleNav(game.id)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive 
                        ? 'bg-white/[0.08] text-white border border-white/[0.08] shadow-sm font-semibold' 
                        : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                      <span>{game.label}</span>
                    </div>
                    {game.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                        game.badge === 'JACKPOT' ? 'bg-amber-400/20 text-amber-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {game.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Auth Profile / Sign In Area */}
        <div className="p-3 border-t border-white/[0.07] bg-[#0A0D14]">
          {user ? (
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleNav('account')}
                className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all text-left group border border-white/[0.05]"
              >
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-lg bg-[#14171F] border border-white/10 object-cover" 
                />
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <span className="text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {isAdmin ? 'Staff Admin' : 'VIP Member'}
                  </span>
                </div>
              </button>
              
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all text-xs font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => handleNav('login')}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#10B981] hover:bg-[#059669] text-gray-950 rounded-xl font-bold text-xs transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 fill-gray-950" />
              <span>Sign In / Play</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
