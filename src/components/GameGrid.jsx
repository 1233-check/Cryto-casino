import React from 'react';
import { TrendingUp, Bomb, Dice5, ArrowUpToLine, CircleDot, History, Target, Gamepad2, Activity, LayoutGrid } from 'lucide-react';

export default function GameGrid({ onSelectGame }) {
  const games = [
    { id: 'crash', title: 'Crash', category: 'Stake Originals', icon: TrendingUp, color: '#00E701' },
    { id: 'dice', title: 'Dice', category: 'Stake Originals', icon: Dice5, color: '#00E701' },
    { id: 'mines', title: 'Mines', category: 'Stake Originals', icon: Bomb, color: '#00E701' },
    { id: 'limbo', title: 'Limbo', category: 'Stake Originals', icon: ArrowUpToLine, color: '#00E701' },
    { id: 'plinko', title: 'Plinko', category: 'Stake Originals', icon: Activity, color: '#00E701' },
    { id: 'colortrading', title: 'Color Trading', category: 'Stake Originals', icon: Activity, color: '#00E701' },
    { id: 'tower', title: 'Tower', category: 'Stake Originals', icon: LayoutGrid, color: '#00E701' },
    { id: 'hilo', title: 'HiLo', category: 'Stake Originals', icon: History, color: '#00E701' },
    { id: 'keno', title: 'Keno', category: 'Stake Originals', icon: LayoutGrid, color: '#00E701' },
    { id: 'wheel', title: 'Wheel', category: 'Stake Originals', icon: CircleDot, color: '#00E701' },
    
    { id: 'roulette', title: 'Roulette', category: 'Table Games', icon: CircleDot, color: '#ED4163' },
    { id: 'blackjack', title: 'Blackjack', category: 'Live Casino', icon: Gamepad2, color: '#1475E1' },
    { id: 'baccarat', title: 'Baccarat', category: 'Live Casino', icon: Gamepad2, color: '#1475E1' },
    { id: 'videopoker', title: 'Video Poker', category: 'Table Games', icon: Gamepad2, color: '#1475E1' },
    { id: 'slots', title: 'Slots', category: 'Slot Games', icon: Target, color: '#F6C743' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto w-full">
      {/* Hero Banner */}
      <div className="bg-[#1475E1] rounded-2xl p-8 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-display font-black mb-4">
            Welcome to CryptoBet
          </h1>
          <p className="text-white/80 max-w-lg mb-6">
            Experience the industry's most provably fair casino. 16 games. Instant crypto withdrawals. 99% RTP.
          </p>
          <button className="bg-[#00E701] text-[#0F212E] px-8 py-3 rounded-lg font-bold hover:bg-[#00E701]/90 transition-colors">
            Claim 500% Bonus
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display font-bold flex items-center gap-2">
          <span className="w-1.5 h-6 bg-[#00E701] rounded-full"></span>
          Casino Games
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {games.map(game => {
          const Icon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="group relative bg-[#1A2C38] rounded-xl overflow-hidden aspect-[3/4] flex flex-col hover:-translate-y-1 transition-all duration-300 border border-white/[0.04] hover:border-white/10 shadow-lg hover:shadow-2xl"
            >
              {/* Top half - Icon */}
              <div className="flex-1 flex items-center justify-center bg-[#0F212E] relative overflow-hidden group-hover:opacity-90 transition-opacity">
                <Icon className="w-16 h-16 transition-transform group-hover:scale-110 duration-500" style={{ color: game.color }} />
                
                {/* Glow effect */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl"
                  style={{ backgroundColor: game.color }}
                />
              </div>
              
              {/* Bottom half - Details */}
              <div className="p-3 text-left bg-[#1A2C38]">
                <h3 className="font-bold text-sm truncate">{game.title}</h3>
                <p className="text-[#557086] text-xs truncate mt-0.5">{game.category}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
