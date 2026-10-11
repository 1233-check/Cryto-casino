import React from 'react';
import { Home, Gamepad2, Wallet, FileText, Menu, Sparkles } from 'lucide-react';

export default function MobileBottomNav({ activeView, setActiveView, onToggleSidebar }) {
  const navItems = [
    { id: 'home', label: 'Lobby', icon: Home },
    { id: 'games', label: 'Games', icon: Gamepad2, isAction: true },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'history', label: 'History', icon: FileText },
    { id: 'menu', label: 'Menu', icon: Menu, isAction: true },
  ];

  const handleClick = (item) => {
    if (item.id === 'menu' || item.id === 'games') {
      if (onToggleSidebar) onToggleSidebar();
    } else {
      setActiveView(item.id);
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0D11]/95 backdrop-blur-xl border-t border-white/[0.08] px-2 py-1.5 flex items-center justify-around safe-area-bottom shadow-2xl">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeView === item.id;

        return (
          <button
            key={item.id}
            onClick={() => handleClick(item)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
              isActive
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isActive && (
              <span className="absolute -top-1.5 w-6 h-0.5 rounded-full bg-emerald-400" />
            )}
            <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110' : ''}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
