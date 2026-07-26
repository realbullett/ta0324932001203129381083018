import React from 'react';
import { Pill, Stethoscope } from 'lucide-react';
import { ViewMode } from '../types';

interface HeaderProps {
  onContactClick: () => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export const Header: React.FC<HeaderProps> = ({ onContactClick, currentView, onViewChange }) => {
  return (
    <header className="fixed w-full z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
        <div className="h-20 md:h-24 flex items-center justify-between rounded-full border border-white/10 bg-black/65 px-5 md:px-8 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center gap-3 md:gap-5 group cursor-pointer" onClick={() => onViewChange('landing')}>
          <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center transition-transform duration-500 group-hover:rotate-[360deg] group-hover:scale-110">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-xl"></div>
            <img src="/logo.png" alt="Tabib" className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_16px_rgba(255,255,255,0.35)]" />
          </div>
          
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
              Tabib
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden md:flex items-center rounded-full border border-white/10 bg-white/5 p-1">
            <button
              onClick={() => onViewChange('diagnosis')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                currentView === 'diagnosis' 
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Stethoscope size={14} />
              Diagnosis
            </button>
            <button
              onClick={() => onViewChange('medication')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                currentView === 'medication' 
                  ? 'bg-zinc-200 text-black shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Pill size={14} />
              Meds Info
            </button>
          </div>

          <button
            onClick={() => onViewChange('about')}
            className={`hidden sm:flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all md:px-5 md:py-2.5 md:text-xs ${
              currentView === 'about'
                ? 'border-white/20 bg-white/10 text-white'
                : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
            }`}
          >
            About Us
          </button>
          <button
            onClick={onContactClick}
            className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white md:px-5 md:py-2.5 md:text-xs"
          >
            Contact Us
          </button>
        </div>
      </div>
      </div>

      <div className="md:hidden absolute top-24 w-full px-4">
        <div className="mx-auto flex w-max items-center rounded-full border border-white/10 bg-black/80 p-1 backdrop-blur-md">
            <button
              onClick={() => onViewChange('diagnosis')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                currentView === 'diagnosis' 
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Stethoscope size={14} />
              Diagnosis
            </button>
            <button
              onClick={() => onViewChange('medication')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                currentView === 'medication' 
                  ? 'bg-zinc-200 text-black shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Pill size={14} />
              Meds Info
            </button>
            <button
              onClick={() => onViewChange('about')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                currentView === 'about' 
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              About
            </button>
          </div>
      </div>
    </header>
  );
};
