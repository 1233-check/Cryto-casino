import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, BarChart3, Volume2, VolumeX, Maximize2 } from 'lucide-react';

export default function GameLayout({ title, onBack, children, controls }) {
  const [muted, setMuted] = useState(false);
  const [showFairness, setShowFairness] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col gap-2 p-2 md:p-4 max-w-[1400px] mx-auto w-full overflow-hidden">
      
      {/* Universal Header (Top for both Mobile and Desktop) */}
      <div className="bg-[#1A2C38] rounded-xl flex items-center justify-between p-3 border border-white/5 shadow-md shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-[#B1BAD3] hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10 active:scale-95">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-display font-black tracking-wide text-white">{title}</h2>
          </div>
          <button 
            onClick={() => setMuted(!muted)}
            className="text-[#B1BAD3] hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 active:scale-95"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
      </div>
      
      {/* Main Content Area (Controls below game on Mobile, beside game on Desktop) */}
      <div className="flex-1 flex flex-col-reverse md:flex-row gap-2 md:gap-4 overflow-y-auto md:overflow-hidden custom-scrollbar pb-10 md:pb-0">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-[#1A2C38] rounded-xl md:rounded-2xl flex flex-col shrink-0 shadow-2xl border border-white/5 h-auto md:h-full z-10">
          <div className="flex-1 flex flex-col p-4 custom-scrollbar md:overflow-y-auto">
            {controls}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col gap-2 md:gap-4 h-full md:overflow-hidden">
          
          {/* Game Canvas / Board */}
          <div className="flex-1 bg-gradient-to-br from-[#0F212E] to-[#1A2C38] rounded-xl md:rounded-2xl relative overflow-hidden shadow-2xl flex flex-col min-h-[350px] md:min-h-[500px] border border-white/5 z-10">
            {/* Top Bar for Game Area */}
            <div className="absolute top-0 left-0 right-0 p-3 md:p-4 flex justify-between items-start pointer-events-none z-20">
               <div className="bg-black/30 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-1.5 rounded-full border border-white/10 pointer-events-auto shadow-lg">
                 <span className="text-[10px] md:text-xs font-bold text-white tracking-widest uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[#00E701] animate-pulse shadow-[0_0_8px_#00E701]"></span>
                    Live
                 </span>
               </div>
               <div className="flex gap-2 pointer-events-auto">
                 <button className="bg-black/30 backdrop-blur-md p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95">
                    <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
                 <button className="bg-black/30 backdrop-blur-md p-2 rounded-lg border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all shadow-lg active:scale-95 hidden md:block">
                    <Maximize2 className="w-4 h-4 md:w-5 md:h-5" />
                 </button>
               </div>
            </div>
            
            {/* INJECT GAME COMPONENT HERE */}
            {children}
            
          </div>

          {/* Footer Utilities */}
          <div className="h-12 md:h-14 bg-[#1A2C38] rounded-xl border border-white/5 flex items-center justify-between px-3 md:px-4 shadow-lg shrink-0 overflow-x-auto custom-scrollbar gap-4 z-10">
             <button 
               onClick={() => setShowFairness(!showFairness)}
               className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-[#B1BAD3] hover:text-white transition-colors bg-[#0F212E] px-3 py-1.5 md:px-4 md:py-2 rounded-lg border border-white/5 hover:border-white/20 whitespace-nowrap active:scale-95"
             >
               <ShieldCheck className="w-4 h-4 text-[#00E701]" />
               Provably Fair
             </button>
             
             <div className="flex items-center gap-4 md:gap-6 text-[10px] md:text-xs font-bold uppercase tracking-wider text-[#557086]">
                <div className="flex items-center gap-2 whitespace-nowrap">
                   <span>Edge:</span>
                   <span className="text-[#B1BAD3]">1.00%</span>
                </div>
                <div className="flex items-center gap-2 whitespace-nowrap">
                   <span>Max Win:</span>
                   <span className="text-[#B1BAD3]">$1,000,000</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Fairness Modal */}
      {showFairness && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-[#1A2C38] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
              <button 
                onClick={() => setShowFairness(false)}
                className="absolute top-4 right-4 text-white/50 hover:text-white p-2"
              >✕</button>
              <h3 className="text-xl font-black font-display mb-6 flex items-center gap-3 text-white">
                <ShieldCheck className="w-6 h-6 text-[#00E701]" />
                Provably Fair
              </h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-[#557086] uppercase tracking-wider mb-2 block">Active Client Seed</label>
                    <input type="text" readOnly value="a7b8c9d0e1f2..." className="w-full bg-[#0F212E] border border-white/5 p-3 rounded-xl font-mono text-sm text-[#B1BAD3] outline-none" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-[#557086] uppercase tracking-wider mb-2 block">Active Server Seed (Hashed)</label>
                    <input type="text" readOnly value="d41d8cd98f00b204e9800998ecf8427e..." className="w-full bg-[#0F212E] border border-white/5 p-3 rounded-xl font-mono text-sm text-[#B1BAD3] outline-none" />
                 </div>
                 <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-[#557086] uppercase tracking-wider mb-2 block">Nonce</label>
                      <input type="text" readOnly value="13,337" className="w-full bg-[#0F212E] border border-white/5 p-3 rounded-xl font-mono text-sm text-[#B1BAD3] outline-none" />
                    </div>
                 </div>
                 
                 <button onClick={() => setShowFairness(false)} className="w-full mt-4 bg-[#00E701] text-black font-bold py-3 rounded-xl hover:bg-[#00E701]/90 transition-colors active:scale-95">
                   Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
