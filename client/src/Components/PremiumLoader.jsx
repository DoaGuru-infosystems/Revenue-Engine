import React from 'react';

const PremiumLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing spinning ring */}
        <div className="absolute w-32 h-32 rounded-full border-t-2 border-r-2 border-orange-500 animate-[spin_1.5s_linear_infinite] shadow-[0_0_30px_rgba(249,115,22,0.5)]"></div>
        
        {/* Inner reverse spinning ring */}
        <div className="absolute w-24 h-24 rounded-full border-b-2 border-l-2 border-red-500 animate-[spin_2s_linear_infinite_reverse] shadow-[0_0_20px_rgba(239,68,68,0.4)]"></div>
        
        {/* Center Image Logo */}
        <img 
          src="/revenue-engine-logo.png" 
          alt="Revenue Engine Logo" 
          className="relative z-10 w-16 h-16 object-contain animate-pulse rounded-full shadow-[0_0_15px_rgba(255,86,37,0.5)] bg-slate-900/50" 
        />
        
        {/* Subtle background pulse */}
        <div className="absolute w-32 h-32 bg-orange-600/20 rounded-full blur-[30px] animate-pulse"></div>
      </div>
      
      {/* Loading Text at bottom */}
      <div className="absolute bottom-20 flex flex-col items-center gap-3">
        <div className="font-mono text-xs tracking-[0.3em] text-slate-400 uppercase animate-pulse">
          Revenue Engine
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default PremiumLoader;
