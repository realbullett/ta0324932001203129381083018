import React from 'react';
import { MedicalCondition } from '../types';
import { UrgencyBadge } from './UrgencyBadge';
import { Check, ArrowRight, Activity } from 'lucide-react';

interface ConditionCardProps {
  condition: MedicalCondition;
  rank: number;
}

export const ConditionCard: React.FC<ConditionCardProps> = ({ condition, rank }) => {
  const isTopMatch = rank === 1;

  return (
    <div 
      className={`
        relative rounded-2xl transition-all duration-500 ease-out overflow-hidden backdrop-blur-sm animate-slide-up-fade opacity-0
        ${isTopMatch 
          ? 'bg-brand-panel/80 border border-brand-primary/50 shadow-[0_0_30px_rgba(124,58,237,0.15)] z-10 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(124,58,237,0.25)]' 
          : 'bg-brand-panel/40 border border-brand-border hover:border-brand-primary/30 hover:bg-brand-panel/60 hover:scale-[1.01] hover:shadow-lg'
        }
      `}
      style={{ animationDelay: `${rank * 150}ms` }}
    >
      {isTopMatch && (
        <div className="absolute top-0 right-0">
          <div className="bg-gradient-to-l from-brand-primary to-purple-700 text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 md:px-4 rounded-bl-xl shadow-sm animate-fade-in-up">
            Primary Match
          </div>
        </div>
      )}

      <div className="p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-lg shrink-0 font-bold text-sm border transition-colors duration-300
              ${isTopMatch 
                ? 'bg-brand-primary/20 text-brand-glow border-brand-primary/30' 
                : 'bg-white/5 text-gray-400 border-white/10 group-hover:border-white/20'}
            `}>
              #{rank}
            </div>
            <div>
              <h3 className="text-lg md:text-xl font-bold text-white leading-tight pr-20 md:pr-0">{condition.name}</h3>
              {isTopMatch && <p className="text-xs md:text-sm text-brand-accent font-medium mt-1">Highest Confidence Analysis</p>}
            </div>
          </div>
          <div className="self-start md:self-center">
             <UrgencyBadge level={condition.urgency} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
          <div className="md:col-span-8">
             <p className="text-gray-300 leading-relaxed text-sm md:text-base font-light">
              {condition.description}
            </p>
          </div>
          
          {/* Probability Gauge - Redesigned for vertical layering */}
          <div className="md:col-span-4 bg-black/20 rounded-xl p-4 border border-brand-border flex flex-col justify-center items-center relative overflow-hidden min-h-[100px] md:min-h-[120px] group/gauge">
             {/* Ambient background for depth */}
             <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-primary/5 pointer-events-none transition-opacity group-hover/gauge:opacity-100 opacity-50" />
             
             <div className="relative z-10 flex flex-col items-center w-full">
               <span className={`text-3xl md:text-4xl font-bold mb-1 transition-all duration-300 ${isTopMatch ? 'text-brand-glow drop-shadow-[0_0_8px_rgba(167,139,250,0.4)]' : 'text-gray-300 group-hover/gauge:text-white'}`}>
                  {condition.probability}%
               </span>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-3">
                  Confidence
               </span>
               
               <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full shadow-[0_0_10px_rgba(217,70,239,0.4)] transition-all duration-1000 ease-out ${
                    condition.probability > 70 ? 'bg-gradient-to-r from-brand-primary to-brand-accent' : 
                    condition.probability > 40 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500' : 'bg-gray-600'
                  }`}
                  style={{ width: `${condition.probability}%` }}
                />
              </div>
             </div>
          </div>
        </div>

        <div className="space-y-5">
          {/* Symptoms */}
          <div>
             <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Matched Symptoms</h4>
             <div className="flex flex-wrap gap-2">
               {condition.symptoms_matched.map((sym, idx) => (
                 <span key={idx} className="inline-flex items-center text-xs font-medium bg-white/5 text-gray-300 px-3 py-1.5 rounded-md border border-white/10 hover:bg-white/10 transition-colors cursor-default">
                   <Check size={12} className="mr-1.5 text-brand-accent" />
                   {sym}
                 </span>
               ))}
             </div>
          </div>

          {/* Recommendations */}
          <div className="bg-brand-primary/5 rounded-xl p-4 border border-brand-primary/10 hover:bg-brand-primary/10 transition-colors duration-300">
            <h4 className="text-[10px] font-bold text-brand-glow uppercase tracking-widest mb-3 flex items-center gap-2">
              <Activity size={14} /> Clinical Recommendations
            </h4>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {condition.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300">
                  <ArrowRight size={16} className="mt-0.5 text-brand-primary shrink-0" />
                  <span className="leading-snug">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};