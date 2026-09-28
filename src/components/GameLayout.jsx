import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function GameLayout({ title, onBack, children, controls }) {
  return (
    <div className="h-full flex flex-col md:flex-row gap-4 p-4 max-w-[1400px] mx-auto w-full">
      {/* Sidebar Controls */}
      <div className="w-full md:w-80 bg-[#1A2C38] rounded-xl flex flex-col h-[calc(100vh-140px)] shrink-0 overflow-hidden shadow-2xl">
        <div className="p-4 bg-[#213743] flex items-center gap-3">
          <button onClick={onBack} className="text-[#B1BAD3] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-display font-bold">{title}</h2>
        </div>
        
        <div className="flex-1 flex flex-col p-4 overflow-y-auto">
          {controls}
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 bg-[#0F212E] md:bg-[#1A2C38] rounded-xl relative overflow-hidden shadow-2xl flex flex-col min-h-[400px]">
        {children}
      </div>
    </div>
  );
}
