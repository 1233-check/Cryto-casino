import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, BarChart3, Volume2, VolumeX, Maximize2 } from 'lucide-react';

export default function GameLayout({ title, onBack, children, controls }) {
  const [muted, setMuted] = useState(false);
  const [showFairness, setShowFairness] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col gap-2 p-2 md:p-3.5 max-w-[1400px] mx-auto w-full overflow-hidden">
      
      {/* Universal Header (Top for both Mobile and Desktop) */}
      <div className="bg-[#14171F] rounded-xl flex items-center justify-between p-3 border border-white/[0.07] shadow-sm shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-lg hover:bg-white/10 active:scale-95">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold tracking-tight text-white">{title}</h2>
          </div>
          <button 
            onClick={() => setMuted(!muted)}
            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10 active:scale-95"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
      </div>
      
      {/* Main Content Area (Controls below game on Mobile, beside game on Desktop) */}
      <div className="flex-1 flex flex-col-reverse md:flex-row gap-2 md:gap-3.5 overflow-y-auto md:overflow-hidden custom-scrollbar pb-10 md:pb-0">
        
        {/* Sidebar Controls */}
        <div className="w-full md:w-80 bg-[#14171F] rounded-xl md:rounded-2xl flex flex-col shrink-0 shadow-md border border-white/[0.07] h-auto md:h-full z-10">
          <div className="flex-1 flex flex-col p-3.5 custom-scrollbar md:overflow-y-auto">
            {controls}
          </div>
        </div>

        {/* Main Game Area */}
        <div className="flex-1 flex flex-col gap-2 md:gap-3.5 h-full md:overflow-hidden">
          
          {/* Game Canvas / Board */}
          <div className="flex-1 bg-[#10131A] rounded-xl md:rounded-2xl relative overflow-hidden shadow-md flex flex-col min-h-[350px] md:min-h-[500px] border border-white/[0.07] z-10">
            {/* Top Bar for Game Area */}
            <div className="absolute top-0 left-0 right-0 p-3 md:p-3.5 flex justify-between items-start pointer-events-none z-20">
               <div className="bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/[0.08] pointer-events-auto shadow-sm">
                 <span className="text-[10px] md:text-xs font-semibold text-white tracking-wider uppercase flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live
                 </span>
               </div>
               <div className="flex gap-1.5 pointer-events-auto">
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/10 transition-all shadow-sm active:scale-95">
                    <BarChart3 className="w-4 h-4" />
                 </button>
                 <button className="bg-black/40 backdrop-blur-md p-2 rounded-lg border border-white/[0.08] text-white/60 hover:text-white hover:bg-white/10 transition-all shadow-sm active:scale-95 hidden md:block">
                    <Maximize2 className="w-4 h-4" />
                 </button>
               </div>
            </div>
            
            {/* INJECT GAME COMPONENT HERE */}
            {children}
            
          </div>

          {/* Footer Utilities */}
          <div className="h-12 md:h-13 bg-[#14171F] rounded-xl border border-white/[0.07] flex items-center justify-between px-3 md:px-4 shadow-sm shrink-0 overflow-x-auto custom-scrollbar gap-4 z-10">
             <button 
               onClick={() => setShowFairness(!showFairness)}
               className="flex items-center gap-2 text-[11px] font-semibold text-slate-300 hover:text-white transition-colors bg-[#10131A] px-3 py-1.5 rounded-lg border border-white/[0.07] hover:border-white/20 whitespace-nowrap active:scale-95"
             >
               <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
               Provably Fair
             </button>
             
             <div className="flex items-center gap-4 md:gap-5 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                   <span>Edge:</span>
                   <span className="text-slate-300 font-semibold">1.00%</span>
                </div>
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                   <span>Max Win:</span>
                   <span className="text-slate-300 font-semibold">$1,000,000</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Fairness Modal */}
      {showFairness && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-[#14171F] border border-white/[0.09] rounded-2xl p-6 w-full max-w-lg shadow-2xl relative">
              <button 
                onClick={() => setShowFairness(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-2"
              >✕</button>
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2.5 text-white">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                Provably Fair Verification
              </h3>
              
              <div className="space-y-3.5">
                 <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Client Seed</label>
                    <input type="text" readOnly value="a7b8c9d0e1f2..." className="w-full bg-[#10131A] border border-white/[0.07] p-2.5 rounded-xl font-mono text-xs text-slate-300 outline-none" />
                 </div>
                 <div>
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Server Seed (Hashed)</label>
                    <input type="text" readOnly value="d41d8cd98f00b204e9800998ecf8427e..." className="w-full bg-[#10131A] border border-white/[0.07] p-2.5 rounded-xl font-mono text-xs text-slate-300 outline-none" />
                 </div>
                 <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">Nonce</label>
                      <input type="text" readOnly value="13,337" className="w-full bg-[#10131A] border border-white/[0.07] p-2.5 rounded-xl font-mono text-xs text-slate-300 outline-none" />
                    </div>
                 </div>
                 
                 <button onClick={() => setShowFairness(false)} className="w-full mt-3 bg-[#10B981] hover:bg-[#059669] text-gray-950 font-bold py-2.5 rounded-xl text-xs transition-colors active:scale-95 shadow-sm">
                   Close
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
