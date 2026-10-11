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
        w-[250px] bg-[#1A2C38] border-r border-white/[0.05] 
        flex flex-col h-screen shrink-0 transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-[64px] flex items-center justify-between px-6 border-b border-white/[0.05] shrink-0">
          <button 
            onClick={() => handleNav('home')}
            className="font-display font-black text-xl text-white tracking-wider flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1475E1] to-[#00E701] flex items-center justify-center shadow-[0_0_15px_rgba(0,231,1,0.4)]">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <span>CRYPTO<span className="text-[#00E701]">BET</span></span>
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-6">
          
          {/* Admin Management Section (Visible to authorized admins) */}
          {isAdmin && (
            <div>
              <h3 className="text-[#ED4163] text-[11px] font-black uppercase tracking-wider mb-2 px-3 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Staff Administration
              </h3>
              <button
                onClick={() => handleNav('admin')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  activeView === 'admin'
                    ? 'bg-[#ED4163]/20 text-[#ED4163] border border-[#ED4163]/40 shadow-[0_0_15px_rgba(237,65,99,0.25)]'
                    : 'text-[#ED4163]/80 hover:bg-[#ED4163]/10 hover:text-[#ED4163]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </div>
                <span className="text-[10px] bg-[#ED4163]/20 text-[#ED4163] px-1.5 py-0.5 rounded font-extrabold uppercase">
                  Active
                </span>
              </button>
            </div>
          )}

          {/* Main Core Links */}
          <div>
            <h3 className="text-[#557086] text-[11px] font-bold uppercase tracking-wider mb-2 px-3">
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isActive 
                        ? 'bg-[#2F4553] text-white shadow-sm' 
                        : 'text-[#B1BAD3] hover:bg-[#213743] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#00E701]' : 'text-[#557086]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stake Originals */}
          <div>
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[#557086] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-[#00E701]" />
                Stake Originals
              </h3>
              <span className="text-[10px] text-[#00E701] font-bold bg-[#00E701]/10 px-1.5 py-0.2 rounded">10</span>
            </div>
            <div className="flex flex-col gap-1">
              {originalGames.map(game => {
                const Icon = game.icon;
                const isActive = activeView === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleNav(game.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                      isActive 
                        ? 'bg-[#2F4553] text-white shadow-sm font-bold' 
                        : 'text-[#B1BAD3] hover:bg-[#213743] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#00E701]' : 'text-[#557086]'}`} />
                      <span>{game.label}</span>
                    </div>
                    {game.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                        game.badge === 'HOT' ? 'bg-[#ED4163]/20 text-[#ED4163]' :
                        game.badge === '99%' ? 'bg-[#00E701]/20 text-[#00E701]' :
                        'bg-[#1475E1]/20 text-[#1475E1]'
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
            <div className="flex items-center justify-between px-3 mb-2">
              <h3 className="text-[#557086] text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#1475E1]" />
                Tables & Slots
              </h3>
              <span className="text-[10px] text-[#1475E1] font-bold bg-[#1475E1]/10 px-1.5 py-0.2 rounded">5</span>
            </div>
            <div className="flex flex-col gap-1">
              {tableGames.map(game => {
                const Icon = game.icon;
                const isActive = activeView === game.id;
                return (
                  <button
                    key={game.id}
                    onClick={() => handleNav(game.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-sm transition-all ${
                      isActive 
                        ? 'bg-[#2F4553] text-white shadow-sm font-bold' 
                        : 'text-[#B1BAD3] hover:bg-[#213743] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#1475E1]' : 'text-[#557086]'}`} />
                      <span>{game.label}</span>
                    </div>
                    {game.badge && (
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                        game.badge === 'JACKPOT' ? 'bg-[#FFD700]/20 text-[#FFD700]' :
                        'bg-[#1475E1]/20 text-[#1475E1]'
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
        <div className="p-3 border-t border-white/[0.05] bg-[#162734]/50">
          {user ? (
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleNav('account')}
                className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] transition-all text-left group border border-white/5"
              >
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-xl bg-[#2F4553] border border-[#00E701]/40 object-cover" 
                />
                <div className="flex flex-col overflow-hidden flex-1 min-w-0">
                  <span className="text-xs font-bold text-white truncate group-hover:text-[#00E701] transition-colors">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-[#00E701] font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E701]" />
                    {isAdmin ? 'Staff Admin' : 'VIP Player'}
                  </span>
                </div>
              </button>
              
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all text-xs font-bold text-[#B1BAD3] hover:bg-[#ED4163]/15 hover:text-[#ED4163]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => handleNav('login')}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#00E701] to-[#00C853] rounded-xl font-extrabold text-xs text-black shadow-[0_0_20px_rgba(0,231,1,0.35)] hover:brightness-110 hover:-translate-y-0.5 transition-all"
            >
              <Sparkles className="w-4 h-4 fill-black" />
              <span>Sign In / Play Now</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
