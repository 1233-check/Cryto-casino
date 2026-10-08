import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import GameGrid from './components/GameGrid';
import AIChatWidget from './components/AIChatWidget';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';

// New Pages
import LoginPage from './pages/LoginPage';
import WalletPage from './pages/WalletPage';
import HistoryPage from './pages/HistoryPage';
import AdminPage from './pages/AdminPage';

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
import KenoGame from './games/KenoGame';

// Phase 3
import RouletteGame from './games/RouletteGame';
import SlotsGame from './games/SlotsGame';

// Phase 4
import BlackjackGame from './games/BlackjackGame';
import BaccaratGame from './games/BaccaratGame';
import VideoPokerGame from './games/VideoPokerGame';

const VALID_VIEWS = [
  'home', 'login', 'wallet', 'history', 'admin',
  'crash', 'dice', 'mines', 'limbo',
  'colortrading', 'plinko', 'tower', 'hilo', 'keno', 'wheel',
  'roulette', 'slots', 'blackjack', 'baccarat', 'videopoker'
];

function getInitialView() {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
    if (VALID_VIEWS.includes(hash)) return hash;
    const params = new URLSearchParams(window.location.search);
    const game = params.get('game')?.toLowerCase();
    if (VALID_VIEWS.includes(game)) return game;
  }
  return 'home';
}

function App() {
  const [activeView, setActiveViewState] = useState(getInitialView);

  const setActiveView = (view) => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'home' ? '' : `#${view}`;
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
      if (VALID_VIEWS.includes(hash)) {
        setActiveViewState(hash);
      } else if (!hash) {
        setActiveViewState('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Expose programmatic navigation on window for automated testing & browser automation
    window.__cryptoCasinoNavigate = (view) => setActiveView(view);
    window.__cryptoCasinoActiveView = () => activeView;

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
      delete window.__cryptoCasinoNavigate;
      delete window.__cryptoCasinoActiveView;
    };
  }, [activeView]);

  const renderContent = () => {
    const onBack = () => setActiveView('home');

    switch (activeView) {
      case 'home': return <GameGrid onSelectGame={setActiveView} />;
      
      // Core Infrastructure
      case 'login': return <LoginPage onNavigate={setActiveView} />;
      case 'wallet': return <WalletPage onNavigate={setActiveView} />;
      case 'history': return <HistoryPage onNavigate={setActiveView} />;
      case 'admin': return <AdminPage onNavigate={setActiveView} />;

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
      case 'keno': return <KenoGame onBack={onBack} />;
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

  // If login page, don't render sidebar and navbar
  if (activeView === 'login') {
     return (
       <AuthProvider>
         <WalletProvider>
           <div className="flex h-screen bg-[#0F212E] text-white overflow-hidden font-sans">
             {renderContent()}
           </div>
         </WalletProvider>
       </AuthProvider>
     );
  }

  return (
    <AuthProvider>
      <WalletProvider>
        <div className="flex h-screen bg-[#0F212E] text-white overflow-hidden font-sans">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <div className="flex-1 flex flex-col min-w-0">
            <Navbar />
            <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative">
              {renderContent()}
            </main>
          </div>
          <AIChatWidget />
        </div>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
