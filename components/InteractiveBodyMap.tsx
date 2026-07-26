import React, { useState } from 'react';

interface InteractiveBodyMapProps {
  activeZone: string;
  onSelectZone: (zone: string) => void;
}

export const InteractiveBodyMap: React.FC<InteractiveBodyMapProps> = ({ activeZone, onSelectZone }) => {
  const [viewSide, setViewSide] = useState<'front' | 'back'>('front');

  const zones = [
    { id: 'head', label: 'Head', side: 'both', path: 'M 90,25 C 90,15 110,15 110,25 C 112,35 108,42 100,45 C 92,42 88,35 90,25 Z' },
    { id: 'face', label: 'Face & Eyes', side: 'front', path: 'M 92,46 C 92,42 108,42 108,46 C 109,50 107,54 100,56 C 93,54 91,50 92,46 Z' },
    { id: 'ears', label: 'Ears', side: 'both', path: 'M 86,40 C 84,38 83,44 85,48 C 86,50 87,48 87,45 Z M 114,40 C 116,38 117,44 115,48 C 114,50 113,48 113,45 Z' },
    { id: 'throat', label: 'Throat & Neck', side: 'both', path: 'M 95,58 L 105,58 L 106,72 L 94,72 Z' },
    { id: 'chest', label: 'Chest & Heart', side: 'front', path: 'M 82,74 L 118,74 L 116,105 L 84,105 Z' },
    { id: 'stomach', label: 'Stomach & Gut', side: 'front', path: 'M 84,107 L 116,107 L 114,140 L 86,140 Z' },
    { id: 'pelvis', label: 'Pelvis & Hips', side: 'front', path: 'M 86,142 L 114,142 L 112,158 L 88,158 Z' },
    { id: 'upper_back', label: 'Upper Back', side: 'back', path: 'M 82,74 L 118,74 L 116,110 L 84,110 Z' },
    { id: 'lower_back', label: 'Lower Back', side: 'back', path: 'M 84,112 L 116,112 L 114,145 L 86,145 Z' },
    { id: 'buttocks', label: 'Buttocks', side: 'back', path: 'M 86,147 L 114,147 L 112,168 L 88,168 Z' },
    { id: 'shoulder', label: 'Shoulders', side: 'both', path: 'M 72,74 L 82,74 L 80,88 L 70,88 Z M 118,74 L 128,74 L 130,88 L 120,88 Z' },
    { id: 'arm', label: 'Arms', side: 'both', path: 'M 68,90 L 60,115 L 55,140 L 62,140 L 68,118 L 74,95 Z M 132,90 L 140,115 L 145,140 L 138,140 L 132,118 L 126,95 Z' },
    { id: 'elbow', label: 'Elbows', side: 'both', path: 'M 58,118 C 56,116 54,122 56,126 C 57,128 59,126 59,123 Z M 142,118 C 144,116 146,122 144,126 C 143,128 141,126 141,123 Z' },
    { id: 'hand', label: 'Hands & Wrists', side: 'both', path: 'M 52,142 C 50,140 48,150 52,155 C 54,157 58,152 56,148 Z M 148,142 C 150,140 152,150 148,155 C 146,157 142,152 144,148 Z' },
    { id: 'hip', label: 'Hips & Pelvis', side: 'both', path: 'M 82,145 L 118,145 L 116,165 L 84,165 Z' },
    { id: 'thigh', label: 'Thighs', side: 'both', path: 'M 86,167 L 98,167 L 95,210 L 88,210 Z M 114,167 L 102,167 L 105,210 L 112,210 Z' },
    { id: 'knee', label: 'Knees', side: 'both', path: 'M 86,212 C 84,210 83,220 86,224 C 88,226 90,222 89,218 Z M 114,212 C 116,210 117,220 114,224 C 112,226 110,222 111,218 Z' },
    { id: 'lower_leg', label: 'Lower Legs', side: 'both', path: 'M 84,226 L 94,226 L 92,260 L 82,260 Z M 116,226 L 106,226 L 108,260 L 118,260 Z' },
    { id: 'ankle_foot', label: 'Ankles & Feet', side: 'both', path: 'M 78,262 C 76,260 74,272 80,275 C 84,276 86,268 84,264 Z M 122,262 C 124,260 126,272 120,275 C 116,276 114,268 116,264 Z' },
  ];

  return (
    <div className="flex flex-col h-full items-center justify-between p-4 bg-zinc-950/40 rounded-3xl border border-white/5 backdrop-blur-xl">
      <div className="flex justify-between w-full items-center mb-4">
        <div className="text-left">
          <div className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-500">Symptom Targeter</div>
          <div className="text-lg font-bold text-white mt-1">Select Affected Area</div>
        </div>
        <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setViewSide('front')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewSide === 'front' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Front
          </button>
          <button
            type="button"
            onClick={() => setViewSide('back')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewSide === 'back' ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center min-h-[300px]">
        <svg viewBox="40 10 120 270" className="h-full max-h-[360px] w-auto drop-shadow-[0_0_20px_rgba(168,85,247,0.15)]">
          <path
            d="M 100,15 C 80,15 75,50 75,80 C 75,90 70,95 65,100 L 50,140 C 47,148 50,155 58,155 C 65,155 70,145 74,130 L 80,105 L 82,150 L 70,210 L 68,265 C 67,272 73,275 79,275 C 85,275 88,265 90,240 L 98,160 L 100,160 L 102,160 L 110,240 C 112,265 115,275 121,275 C 127,275 133,272 132,265 L 130,210 L 118,150 L 120,105 L 126,130 C 130,145 135,155 142,155 C 150,155 153,148 150,140 L 135,100 C 130,95 125,90 125,80 C 125,50 120,15 100,15 Z"
            fill="#16161a"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="2"
          />

          {zones
            .filter((z) => z.side === 'both' || z.side === viewSide)
            .map((z) => {
              const isActive = activeZone === z.id;
              return (
                <path
                  key={z.id}
                  d={z.path}
                  onClick={() => onSelectZone(z.id)}
                  className={`cursor-pointer transition-all duration-300 outline-none ${
                    isActive
                      ? 'fill-purple-500/35 stroke-purple-400 stroke-[2px] filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]'
                      : 'fill-transparent stroke-transparent hover:fill-purple-500/15 hover:stroke-purple-400/40 hover:stroke-[1.5px]'
                  }`}
                />
              );
            })}
        </svg>
      </div>

      <div className="w-full mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 justify-center">
        {zones
          .filter((z) => z.side === 'both' || z.side === viewSide)
          .map((z) => {
            const isActive = activeZone === z.id;
            return (
              <button
                key={z.id}
                type="button"
                onClick={() => onSelectZone(z.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
                  isActive
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {z.label}
              </button>
            );
          })}
      </div>
    </div>
  );
};
