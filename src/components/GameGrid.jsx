import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Bomb, 
  Dice5, 
  ArrowUpToLine, 
  CircleDot, 
  History, 
  Target, 
  Gamepad2, 
  Activity, 
  LayoutGrid, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Search, 
  Play, 
  Crown,
  Lock,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GameGrid({ onSelectGame }) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveBets, setLiveBets] = useState([
    { id: 1, game: 'Crash', user: 'CryptoWhale_88', bet: 0.05, mult: '3.42x', payout: 0.171, win: true, time: 'Just now' },
    { id: 2, game: 'Dice', user: 'Satoshi_VIP', bet: 0.02, mult: '2.00x', payout: 0.040, win: true, time: '2s ago' },
    { id: 3, game: 'Mines', user: 'LuckyGamer', bet: 0.01, mult: '1.45x', payout: 0.0145, win: true, time: '5s ago' },
    { id: 4, game: 'Plinko', user: 'Player_7x92', bet: 0.03, mult: '0.20x', payout: 0.006, win: false, time: '8s ago' },
    { id: 5, game: 'Roulette', user: 'RedOrBlack', bet: 0.10, mult: '2.00x', payout: 0.200, win: true, time: '11s ago' },
    { id: 6, game: 'Blackjack', user: 'HighRoller_X', bet: 0.25, mult: '2.50x', payout: 0.625, win: true, time: '14s ago' },
  ]);

  // Simulate dynamic live casino ticker
  useEffect(() => {
    const gameNames = ['Crash', 'Dice', 'Mines', 'Limbo', 'Plinko', 'Tower', 'HiLo', 'Wheel', 'Roulette', 'Blackjack', 'Slots'];
    const fakeUsers = ['VipPlayer', 'Satoshi_Dice', 'WhaleTrader', 'SolanaKing', 'ApeRockets', 'LuckyCharm', 'ZeroHouse', 'EtherGod'];

    const interval = setInterval(() => {
      const g = gameNames[Math.floor(Math.random() * gameNames.length)];
      const u = fakeUsers[Math.floor(Math.random() * fakeUsers.length)] + '_' + Math.floor(Math.random() * 90 + 10);
      const bet = +(Math.random() * 0.1 + 0.005).toFixed(4);
      const isWin = Math.random() > 0.42;
      const mult = isWin ? +(Math.random() * 5 + 1.2).toFixed(2) : +(Math.random() * 0.5).toFixed(2);
      const payout = isWin ? +(bet * mult).toFixed(4) : 0;

      const newBet = {
        id: Date.now(),
        game: g,
        user: u,
        bet,
        mult: mult + 'x',
        payout,
        win: isWin,
        time: 'Just now'
      };

      setLiveBets(prev => [newBet, ...prev.slice(0, 7)]);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const games = [
    // Stake Originals
    { id: 'crash', title: 'Crash', category: 'Originals', icon: TrendingUp, color: '#00E701', rtp: '99.00%', players: 942, badge: 'HOT', desc: 'Watch multiplier soar and cash out before it busts!' },
    { id: 'dice', title: 'Dice', category: 'Originals', icon: Dice5, color: '#00E701', rtp: '99.00%', players: 618, badge: 'CLASSIC', desc: 'Roll over or under with adjustable win chances.' },
    { id: 'mines', title: 'Mines', category: 'Originals', icon: Bomb, color: '#00E701', rtp: '99.00%', players: 785, badge: 'POPULAR', desc: 'Uncover gems and avoid the hidden explosive mines.' },
    { id: 'limbo', title: 'Limbo', category: 'Originals', icon: ArrowUpToLine, color: '#00E701', rtp: '99.00%', players: 432, desc: 'Target massive multipliers up to 1,000,000x.' },
    { id: 'plinko', title: 'Plinko', category: 'Originals', icon: Activity, color: '#00E701', rtp: '99.00%', players: 810, badge: 'HOT', desc: 'Drop balls through pins into high multiplier slots.' },
    { id: 'tower', title: 'Tower', category: 'Originals', icon: LayoutGrid, color: '#00E701', rtp: '99.00%', players: 312, desc: 'Climb the castle tower floor by floor for huge rewards.' },
    { id: 'hilo', title: 'HiLo', category: 'Originals', icon: History, color: '#00E701', rtp: '99.00%', players: 289, desc: 'Guess if the next card is higher or lower.' },
    { id: 'keno', title: 'Keno', category: 'Originals', icon: LayoutGrid, color: '#00E701', rtp: '99.00%', players: 350, desc: 'Pick your lucky numbers in this crypto lottery classic.' },
    { id: 'wheel', title: 'Wheel', category: 'Originals', icon: CircleDot, color: '#00E701', rtp: '98.50%', players: 405, desc: 'Spin the segmented wheel for instant calibrated payouts.' },
    { id: 'colortrading', title: 'Color Trading', category: 'Originals', icon: Activity, color: '#00E701', rtp: '98.00%', players: 520, desc: 'Predict colors and numbers on fast rounds.' },
    
    // Table & Live
    { id: 'roulette', title: 'Roulette', category: 'Table', icon: CircleDot, color: '#ED4163', rtp: '97.30%', players: 430, badge: 'EUROPEAN', desc: 'Single-zero European roulette with full felt board.' },
    { id: 'blackjack', title: 'Blackjack', category: 'Cards', icon: Gamepad2, color: '#1475E1', rtp: '99.50%', players: 670, badge: 'LIVE', desc: 'Classic 21 with Double, Split, and dealer stands on 17.' },
    { id: 'baccarat', title: 'Baccarat', category: 'Cards', icon: Gamepad2, color: '#1475E1', rtp: '98.94%', players: 310, desc: 'Player, Banker or Tie with standard Punto Banco rules.' },
    { id: 'videopoker', title: 'Video Poker', category: 'Cards', icon: Gamepad2, color: '#1475E1', rtp: '99.54%', players: 260, desc: 'Jacks or Better draw poker with royal flush jackpots.' },
    
    // Slots
    { id: 'slots', title: 'Slots', category: 'Slots', icon: Target, color: '#F6C743', rtp: '96.50%', players: 580, badge: 'JACKPOT', desc: '5-reel crypto slot with expanding wilds and scatter bonuses.' },
  ];

  const categories = [
    { id: 'all', label: 'All Titles', count: games.length },
    { id: 'Originals', label: 'Stake Originals', count: 10 },
    { id: 'Table', label: 'Table & Live', count: 3 },
    { id: 'Cards', label: 'Card Games', count: 3 },
    { id: 'Slots', label: 'Slots', count: 1 },
  ];

  const filteredGames = games.filter(g => {
    const matchesCategory = activeCategory === 'all' || g.category === activeCategory || (activeCategory === 'Table' && (g.category === 'Table' || g.category === 'Cards'));
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-8 pb-12">
      
      {/* Premium Hero Promo Showcase */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#0F212E] via-[#142A3B] to-[#1A384D] border border-white/10 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#00E701]/15 via-[#1475E1]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-72 h-72 bg-[#FFD700]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E701]/10 border border-[#00E701]/30 text-[#00E701] text-xs font-black uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next-Gen Crypto Casino • 99% Theoretical RTP</span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight mb-4">
              Play With Crypto. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E701] via-[#00E5FF] to-[#1475E1]">
                Win Provably Fair.
              </span>
            </h1>
            
            <p className="text-sm sm:text-base text-[#B1BAD3] leading-relaxed mb-6">
              15 high-speed crypto titles with mathematical provable fairness, non-custodial wallet connectivity, and instant zero-fee withdrawals.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => onSelectGame('crash')}
                className="px-6 py-3.5 bg-gradient-to-r from-[#00E701] to-[#00C853] hover:brightness-110 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_25px_rgba(0,231,1,0.35)] hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Flame className="w-4 h-4 fill-black" />
                <span>Play Crash Now</span>
              </button>
              
              <button 
                onClick={() => onSelectGame('plinko')}
                className="px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white font-bold text-sm rounded-xl border border-white/10 transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Explore Plinko</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 gap-3 w-full lg:w-auto">
            <div className="bg-[#0F212E]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-black font-display text-[#00E701]">99.00%</div>
              <div className="text-[11px] font-bold text-[#557086] uppercase tracking-wider mt-0.5">Highest RTP</div>
            </div>
            <div className="bg-[#0F212E]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-black font-display text-[#00E5FF]">15</div>
              <div className="text-[11px] font-bold text-[#557086] uppercase tracking-wider mt-0.5">Casino Titles</div>
            </div>
            <div className="bg-[#0F212E]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-black font-display text-[#FFD700]">0 Sec</div>
              <div className="text-[11px] font-bold text-[#557086] uppercase tracking-wider mt-0.5">Instant Payouts</div>
            </div>
            <div className="bg-[#0F212E]/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 text-center">
              <div className="text-2xl font-black font-display text-[#ED4163]">100%</div>
              <div className="text-[11px] font-bold text-[#557086] uppercase tracking-wider mt-0.5">Provably Fair</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-[#2F4553] text-white shadow-sm border border-white/10'
                  : 'bg-[#1A2C38] text-[#B1BAD3] hover:text-white hover:bg-[#213743] border border-transparent'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                activeCategory === cat.id ? 'bg-[#00E701] text-black' : 'bg-black/20 text-[#557086]'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#557086] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search casino games..."
            className="w-full bg-[#1A2C38] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#557086] focus:outline-none focus:border-[#1475E1] transition-colors"
          />
        </div>
      </div>

      {/* Game Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredGames.map(game => {
          const Icon = game.icon;
          return (
            <motion.div
              key={game.id}
              whileHover={{ y: -5 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectGame(game.id)}
              className="group relative bg-[#1A2C38] rounded-2xl overflow-hidden border border-white/5 hover:border-white/20 shadow-lg hover:shadow-[0_15px_30px_rgba(0,0,0,0.5)] cursor-pointer flex flex-col aspect-[4/5]"
            >
              {/* Badge */}
              {game.badge && (
                <div className={`absolute top-2.5 right-2.5 z-20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-md ${
                  game.badge === 'HOT' ? 'bg-[#ED4163] text-white shadow-[#ED4163]/30' :
                  game.badge === 'JACKPOT' ? 'bg-[#FFD700] text-black shadow-[#FFD700]/30' :
                  'bg-[#00E701] text-black shadow-[#00E701]/30'
                }`}>
                  {game.badge}
                </div>
              )}

              {/* Game Visual Top Area */}
              <div className="flex-1 bg-gradient-to-b from-[#0F212E] to-[#152532] flex items-center justify-center relative overflow-hidden p-6">
                {/* Ambient glow matching game color */}
                <div 
                  className="absolute inset-0 opacity-10 group-hover:opacity-30 transition-opacity duration-500 blur-2xl"
                  style={{ backgroundColor: game.color }}
                />

                <Icon 
                  className="w-16 h-16 transition-all duration-300 group-hover:scale-110 drop-shadow-md relative z-10"
                  style={{ color: game.color }}
                />

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center z-20">
                  <div className="w-11 h-11 rounded-full bg-[#00E701] flex items-center justify-center shadow-[0_0_20px_rgba(0,231,1,0.5)] mb-2 group-hover:scale-105 transition-transform">
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-wider">Play Now</span>
                  <span className="text-[10px] text-[#00E701] font-bold mt-1">RTP {game.rtp}</span>
                </div>
              </div>

              {/* Game Info Bottom Area */}
              <div className="p-3.5 bg-[#1A2C38] border-t border-white/[0.04] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white group-hover:text-[#00E701] transition-colors truncate">
                    {game.title}
                  </h3>
                  <span className="text-[10px] font-bold text-[#557086] bg-black/20 px-1.5 py-0.5 rounded">
                    {game.rtp}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#557086] mt-1.5">
                  <span className="truncate">{game.category}</span>
                  <span className="flex items-center gap-1 text-[10px] text-[#B1BAD3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00E701]" />
                    {game.players}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Live Bets Community Activity Ticker (Hallmark of Stake/Roobet) */}
      <div className="bg-[#1A2C38] rounded-2xl border border-white/5 overflow-hidden shadow-xl mt-8">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#213743]/50">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E701] animate-pulse" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-display">
              Live Bets & Community Activity
            </h2>
          </div>
          <span className="text-xs text-[#557086] font-semibold">Real-Time Casino Ledger</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#162734] text-[#557086] uppercase font-bold text-[10px] tracking-wider border-b border-white/5">
              <tr>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Bet Amount</th>
                <th className="px-4 py-3">Multiplier</th>
                <th className="px-4 py-3 text-right">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              <AnimatePresence initial={false}>
                {liveBets.map(b => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-2.5 font-bold text-white flex items-center gap-1.5 font-sans">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#1475E1]" />
                      {b.game}
                    </td>
                    <td className="px-4 py-2.5 text-[#B1BAD3]">
                      {b.user}
                    </td>
                    <td className="px-4 py-2.5 text-[#557086]">
                      {b.time}
                    </td>
                    <td className="px-4 py-2.5 text-white">
                      {b.bet.toFixed(4)} <span className="text-[#00E701] text-[10px]">BTC</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        b.win ? 'bg-[#00E701]/15 text-[#00E701]' : 'bg-[#ED4163]/15 text-[#ED4163]'
                      }`}>
                        {b.mult}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold ${
                      b.win ? 'text-[#00E701]' : 'text-[#557086]'
                    }`}>
                      {b.payout > 0 ? `+${b.payout.toFixed(4)} BTC` : '0.0000 BTC'}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Security, Trust & Provably Fair Footer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="bg-[#1A2C38] p-5 rounded-2xl border border-white/5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#00E701]/10 text-[#00E701] shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-1">100% Provably Fair</h4>
            <p className="text-xs text-[#B1BAD3] leading-relaxed">
              Every single round is verified using SHA-256 HMAC cryptographic seeds. Results cannot be manipulated.
            </p>
          </div>
        </div>

        <div className="bg-[#1A2C38] p-5 rounded-2xl border border-white/5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#1475E1]/10 text-[#1475E1] shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-1">Instant Automated Cashouts</h4>
            <p className="text-xs text-[#B1BAD3] leading-relaxed">
              Fast non-custodial payouts directly to your Bitcoin, Ethereum, Solana, or USDT wallet address.
            </p>
          </div>
        </div>

        <div className="bg-[#1A2C38] p-5 rounded-2xl border border-white/5 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-[#FFD700]/10 text-[#FFD700] shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white mb-1">High Roller VIP Club</h4>
            <p className="text-xs text-[#B1BAD3] leading-relaxed">
              Level up your wager volume to unlock daily reload bonuses, rakeback, and dedicated VIP account management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
