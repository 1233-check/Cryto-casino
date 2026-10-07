import React from 'react';
import { Home, Gamepad2, TrendingUp, CircleDot, Bomb, Dice5, Dices, ArrowUpToLine, History, LayoutGrid, Target, Activity, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ activeView, setActiveView }) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'home', label: 'Casino Home', icon: Home, category: 'Main' },
    { id: 'history', label: 'Game History', icon: FileText, category: 'Main' },
    // Category A - Originals
    { id: 'crash', label: 'Crash', icon: TrendingUp, category: 'Originals' },
    { id: 'dice', label: 'Dice', icon: Dice5, category: 'Originals' },
    { id: 'mines', label: 'Mines', icon: Bomb, category: 'Originals' },
    { id: 'limbo', label: 'Limbo', icon: ArrowUpToLine, category: 'Originals' },
    { id: 'plinko', label: 'Plinko', icon: Activity, category: 'Originals' },
    { id: 'tower', label: 'Tower', icon: LayoutGrid, category: 'Originals' },
    { id: 'hilo', label: 'HiLo', icon: History, category: 'Originals' },
    { id: 'keno', label: 'Keno', icon: LayoutGrid, category: 'Originals' },
    { id: 'wheel', label: 'Wheel', icon: CircleDot, category: 'Originals' },
    { id: 'colortrading', label: 'Color Trading', icon: Activity, category: 'Originals' },
    // Category B - Table
    { id: 'roulette', label: 'Roulette', icon: CircleDot, category: 'Table Games' },
    // Category C - Cards
    { id: 'blackjack', label: 'Blackjack', icon: Gamepad2, category: 'Cards' },
    { id: 'baccarat', label: 'Baccarat', icon: Gamepad2, category: 'Cards' },
    { id: 'videopoker', label: 'Video Poker', icon: Gamepad2, category: 'Cards' },
    // Category D - Slots
    { id: 'slots', label: 'Slots', icon: Target, category: 'Slots' },
  ];

  const categories = [...new Set(navItems.map(item => item.category))];

  return (
    <aside className="w-[240px] bg-[#1A2C38] border-r border-white/[0.04] flex flex-col h-screen hidden md:flex shrink-0">
      <div className="h-[64px] flex items-center px-6 border-b border-white/[0.04] shrink-0">
        <span className="font-display font-black text-2xl text-white tracking-wider flex items-center gap-2">
          <Gamepad2 className="text-[#00E701] w-8 h-8" />
          CRYPTO<span className="text-[#00E701]">BET</span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
        {categories.map(category => (
          <div key={category} className="mb-6">
            <h3 className="text-[#557086] text-xs font-bold uppercase tracking-wider mb-2 px-3">
              {category}
            </h3>
            <div className="flex flex-col gap-1">
              {navItems.filter(item => item.category === category).map(item => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
                      isActive 
                        ? 'bg-[#2F4553] text-white' 
                        : 'text-[#B1BAD3] hover:bg-[#213743] hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-[#00E701]' : ''}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 mt-auto border-t border-white/[0.04]">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-3 py-2">
               <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full bg-[#2F4553]" />
               <div className="flex flex-col overflow-hidden">
                 <span className="text-sm font-bold text-white truncate">{user.name}</span>
                 <span className="text-xs text-[#00E701] font-bold">Online</span>
               </div>
            </div>
            <button 
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-[#B1BAD3] hover:bg-[#ED4163]/10 hover:text-[#ED4163]"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setActiveView('login')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1475E1] rounded-xl transition-all font-bold text-white shadow-[0_0_15px_rgba(20,117,225,0.4)] hover:bg-[#1475E1]/80 hover:-translate-y-1"
          >
            Sign In with Google
          </button>
        )}
      </div>
    </aside>
  );
}
