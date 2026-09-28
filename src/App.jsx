import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import GameGrid from './components/GameGrid';

// Phase 1
import CrashGame from './games/CrashGame';
import DiceGame from './games/DiceGame';
import MinesGame from './games/MinesGame';
import LimboGame from './games/LimboGame';

// Phase 2
import ColorTradingGame from './games/ColorTradingGame';
import PlinkoGame from './games/PlinkoGame';
import TowerGame from './games/TowerGame';
import HiLoGame from './games/HiLoGame';
import WheelGame from './games/WheelGame';
// Keno was omitted in my agent calls above, I'll stub it
const ComingSoon = ({ title, onBack }) => (
  <div className="flex flex-col items-center justify-center h-full bg-[#1A2C38] rounded-xl border border-white/[0.04] p-8 text-center">
    <h2 className="text-3xl font-display font-bold text-white mb-4">{title}</h2>
    <p className="text-[#B1BAD3] mb-8 max-w-md">This game is currently in development by our engineering team and will be released shortly.</p>
    <button onClick={onBack} className="bg-[#00E701] text-[#0F212E] font-bold px-6 py-3 rounded-lg hover:bg-[#00E701]/90">
      Back to Home
    </button>
  </div>
);

// Phase 3
import RouletteGame from './games/RouletteGame';
import SlotsGame from './games/SlotsGame';

// Phase 4
import BlackjackGame from './games/BlackjackGame';
import BaccaratGame from './games/BaccaratGame';
import VideoPokerGame from './games/VideoPokerGame';

function App() {
  const [activeView, setActiveView] = useState('home');

  const renderContent = () => {
    const onBack = () => setActiveView('home');

    switch (activeView) {
      case 'home': return <GameGrid onSelectGame={setActiveView} />;
      
      // Phase 1
      case 'crash': return <CrashGame onBack={onBack} />;
      case 'dice': return <DiceGame onBack={onBack} />;
      case 'mines': return <MinesGame onBack={onBack} />;
      case 'limbo': return <LimboGame onBack={onBack} />;
      
      // Phase 2
      case 'colortrading': return <ColorTradingGame onBack={onBack} />;
      case 'plinko': return <PlinkoGame onBack={onBack} />;
      case 'tower': return <TowerGame onBack={onBack} />;
      case 'hilo': return <HiLoGame onBack={onBack} />;
      case 'keno': return <ComingSoon title="Keno" onBack={onBack} />;
      case 'wheel': return <WheelGame onBack={onBack} />;
      
      // Phase 3
      case 'roulette': return <RouletteGame onBack={onBack} />;
      case 'slots': return <SlotsGame onBack={onBack} />;
      
      // Phase 4
      case 'blackjack': return <BlackjackGame onBack={onBack} />;
      case 'baccarat': return <BaccaratGame onBack={onBack} />;
      case 'videopoker': return <VideoPokerGame onBack={onBack} />;

      default: return <GameGrid onSelectGame={setActiveView} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0F212E] text-white overflow-hidden font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
