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
    { id: 'crash', title: 'Crash', category: 'Originals', image: '/assets/games/crash.svg', rtp: '99.00%', players: 942, badge: 'HOT', desc: 'Watch multiplier soar and cash out before bust.' },
    { id: 'dice', title: 'Dice', category: 'Originals', image: '/assets/games/dice.svg', rtp: '99.00%', players: 618, badge: 'CLASSIC', desc: 'Roll over or under with adjustable win chances.' },
    { id: 'mines', title: 'Mines', category: 'Originals', image: '/assets/games/mines.svg', rtp: '99.00%', players: 785, badge: 'POPULAR', desc: 'Uncover gems and avoid hidden explosive mines.' },
    { id: 'limbo', title: 'Limbo', category: 'Originals', image: '/assets/games/limbo.svg', rtp: '99.00%', players: 432, desc: 'Target massive multipliers up to 1,000,000x.' },
    { id: 'plinko', title: 'Plinko', category: 'Originals', image: '/assets/games/plinko.svg', rtp: '99.00%', players: 810, badge: 'HOT', desc: 'Drop balls through pins into multiplier slots.' },
    { id: 'tower', title: 'Tower', category: 'Originals', image: '/assets/games/tower.svg', rtp: '99.00%', players: 312, desc: 'Climb the fortress tower floor by floor.' },
    { id: 'hilo', title: 'HiLo', category: 'Originals', image: '/assets/games/hilo.svg', rtp: '99.00%', players: 289, desc: 'Guess if the next card is higher or lower.' },
    { id: 'keno', title: 'Keno', category: 'Originals', image: '/assets/games/keno.svg', rtp: '99.00%', players: 350, desc: 'Pick your lucky numbers in this crypto classic.' },
    { id: 'wheel', title: 'Wheel', category: 'Originals', image: '/assets/games/wheel.svg', rtp: '98.50%', players: 405, desc: 'Spin the segmented wheel for instant payouts.' },
    { id: 'colortrading', title: 'Color Trading', category: 'Originals', image: '/assets/games/colortrading.svg', rtp: '98.00%', players: 520, desc: 'Predict colors and numbers on fast rounds.' },
    
    // Table & Live
    { id: 'roulette', title: 'Roulette', category: 'Table', image: '/assets/games/roulette.svg', rtp: '97.30%', players: 430, badge: 'EUROPEAN', desc: 'Single-zero European roulette with full felt board.' },
    { id: 'blackjack', title: 'Blackjack', category: 'Cards', image: '/assets/games/blackjack.svg', rtp: '99.50%', players: 670, badge: 'LIVE', desc: 'Classic 21 with Double, Split, and dealer stands on 17.' },
    { id: 'baccarat', title: 'Baccarat', category: 'Cards', image: '/assets/games/baccarat.svg', rtp: '98.94%', players: 310, desc: 'Player, Banker or Tie with standard Punto Banco rules.' },
    { id: 'videopoker', title: 'Video Poker', category: 'Cards', image: '/assets/games/videopoker.svg', rtp: '99.54%', players: 260, desc: 'Jacks or Better draw poker with royal flush jackpots.' },
    
    // Slots
    { id: 'slots', title: 'Slots', category: 'Slots', image: '/assets/games/slots.svg', rtp: '96.50%', players: 580, badge: 'JACKPOT', desc: '5-reel crypto slot with expanding wilds and scatter bonuses.' },
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
    <div className="max-w-[1440px] mx-auto w-full space-y-6 pb-12">
      
      {/* Matte Editorial Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden bg-[#12151D] border border-white/[0.07] p-6 sm:p-8 shadow-md">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300 text-xs font-medium mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Provably Fair Crypto Gaming • 99% Theoretical RTP</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight mb-2.5">
              Verified Odds. Instant Payouts. <br />
              <span className="text-slate-400 font-normal">Non-custodial gaming on your terms.</span>
            </h1>
            
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-5">
              15 high-speed crypto titles with SHA-256 cryptographic provable fairness, multi-currency balances, and immediate zero-fee settlement.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => onSelectGame('crash')}
                className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-gray-950 font-bold text-xs rounded-xl transition-all shadow-sm hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Flame className="w-4 h-4 fill-gray-950" />
                <span>Play Crash</span>
              </button>
              
              <button 
                onClick={() => onSelectGame('plinko')}
                className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-xs rounded-xl border border-white/[0.08] transition-all hover:-translate-y-0.5 flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Explore Plinko</span>
              </button>
            </div>
          </div>

          {/* Clean Quick Stats (Matte Charcoal Cards) */}
          <div className="grid grid-cols-2 gap-2.5 w-full lg:w-auto">
            <div className="bg-[#171A23] p-3.5 rounded-xl border border-white/[0.06] text-center min-w-[125px]">
              <div className="text-xl font-bold font-mono text-emerald-400">99.00%</div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Highest RTP</div>
            </div>
            <div className="bg-[#171A23] p-3.5 rounded-xl border border-white/[0.06] text-center min-w-[125px]">
              <div className="text-xl font-bold font-mono text-blue-400">15</div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Casino Titles</div>
            </div>
            <div className="bg-[#171A23] p-3.5 rounded-xl border border-white/[0.06] text-center min-w-[125px]">
              <div className="text-xl font-bold font-mono text-amber-400">0 Sec</div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Instant Payouts</div>
            </div>
            <div className="bg-[#171A23] p-3.5 rounded-xl border border-white/[0.06] text-center min-w-[125px]">
              <div className="text-xl font-bold font-mono text-slate-200">100%</div>
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Provably Fair</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3.5 py-2 rounded-xl font-medium text-xs whitespace-nowrap transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-white/10 text-white border border-white/[0.12] shadow-sm'
                  : 'bg-[#14171F] text-slate-400 hover:text-white hover:bg-[#1A1E27] border border-white/[0.04]'
              }`}
            >
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold ${
                activeCategory === cat.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-black/30 text-slate-500'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        {/* Clean Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search games..."
            className="w-full bg-[#14171F] border border-white/[0.07] rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 transition-colors"
          />
        </div>
      </div>

      {/* Game Cards Grid (High-Quality Artwork Covers) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        {filteredGames.map(game => (
          <motion.div
            key={game.id}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.15 }}
            onClick={() => onSelectGame(game.id)}
            className="group relative bg-[#14171F] rounded-2xl overflow-hidden border border-white/[0.07] hover:border-white/20 shadow-sm hover:shadow-xl cursor-pointer flex flex-col"
          >
            {/* Badge */}
            {game.badge && (
              <div className={`absolute top-2.5 right-2.5 z-20 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md shadow-sm ${
                game.badge === 'HOT' ? 'bg-rose-500 text-white' :
                game.badge === 'JACKPOT' ? 'bg-amber-400 text-gray-950' :
                'bg-emerald-500 text-gray-950'
              }`}>
                {game.badge}
              </div>
            )}

            {/* Game Artwork Cover Image */}
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#0F1219]">
              <img 
                src={game.image} 
                alt={game.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* Matte Hover Action Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center z-10 backdrop-blur-[1px]">
                <div className="px-3.5 py-1.5 rounded-lg bg-[#10B981] text-gray-950 font-bold text-xs flex items-center gap-1.5 shadow-md group-hover:scale-105 transition-transform">
                  <Play className="w-3.5 h-3.5 fill-gray-950 ml-0.5" />
                  <span>Play</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold mt-2">RTP {game.rtp}</span>
              </div>
            </div>

            {/* Game Info Bottom Card Area */}
            <div className="p-3 bg-[#14171F] border-t border-white/[0.04] flex flex-col justify-between flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-xs sm:text-sm text-white group-hover:text-emerald-400 transition-colors truncate">
                  {game.title}
                </h3>
                <span className="text-[10px] font-medium text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded">
                  {game.rtp}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                <span className="truncate">{game.category}</span>
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {game.players}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Live Bets Community Activity Ticker (Matte Institutional Ledger) */}
      <div className="bg-[#14171F] rounded-2xl border border-white/[0.07] overflow-hidden shadow-sm mt-6">
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between bg-[#171A23]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Live Bets &amp; Activity Ledger
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Real-Time Provably Fair Ticker</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#10131A] text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/[0.05]">
              <tr>
                <th className="px-4 py-2.5">Game</th>
                <th className="px-4 py-2.5">Player</th>
                <th className="px-4 py-2.5">Time</th>
                <th className="px-4 py-2.5">Bet Amount</th>
                <th className="px-4 py-2.5">Multiplier</th>
                <th className="px-4 py-2.5 text-right">Payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {liveBets.map(b => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-2.5 font-medium text-white flex items-center gap-2 font-sans text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                      {b.game}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400">
                      {b.user}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {b.time}
                    </td>
                    <td className="px-4 py-2.5 text-white">
                      {b.bet.toFixed(4)} <span className="text-slate-400 text-[10px]">BTC</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        b.win ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {b.mult}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-medium ${
                      b.win ? 'text-emerald-400' : 'text-slate-500'
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
        <div className="bg-[#14171F] p-4 rounded-xl border border-white/[0.07] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white mb-0.5">100% Provably Fair</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Every round is deterministically generated with SHA-256 HMAC cryptographic seeds. Results cannot be manipulated.
            </p>
          </div>
        </div>

        <div className="bg-[#14171F] p-4 rounded-xl border border-white/[0.07] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white mb-0.5">Instant Non-Custodial Settlements</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Fast automated withdrawals across USDT, Bitcoin, Ethereum, Solana, and BNB network rails.
            </p>
          </div>
        </div>

        <div className="bg-[#14171F] p-4 rounded-xl border border-white/[0.07] flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
            <Crown className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white mb-0.5">Transparent House Margin</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Low fixed 1.00% house edge with full mathematically provable return-to-player verification.
            </p>
          </div>
        </div>
      </div>

      {/* Responsible Gaming & Compliance Footer */}
      <div className="pt-5 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full border border-rose-500/40 text-rose-400 font-bold text-[10px] flex items-center justify-center">
            18+
          </span>
          <span className="text-[11px]">
            Play responsibly. Crypto gambling involves risk. Only wager amounts you can afford to lose.
          </span>
        </div>
        <div className="flex items-center gap-5 text-slate-400 text-[11px]">
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => onSelectGame('account')}>
            Provably Fair Verifier
          </span>
          <span className="hover:text-white cursor-pointer transition-colors" onClick={() => onSelectGame('account')}>
            Responsible Gaming
          </span>
          <span className="text-slate-600">© 2026 CryptoBet.</span>
        </div>
      </div>
    </div>
  );
}
