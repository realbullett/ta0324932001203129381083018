import React from 'react';
import { UrgencyLevel } from '../types';
import { AlertTriangle, AlertCircle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface UrgencyBadgeProps {
  level: string;
}

export const UrgencyBadge: React.FC<UrgencyBadgeProps> = ({ level }) => {
  let styles = '';
  let Icon = Info;
  
  const normalizedLevel = level as UrgencyLevel;

  switch (normalizedLevel) {
    case UrgencyLevel.LOW:
      styles = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]';
      Icon = CheckCircle2;
      break;
    case UrgencyLevel.MEDIUM:
      styles = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]';
      Icon = AlertTriangle;
      break;
    case UrgencyLevel.HIGH:
      styles = 'bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)]';
      Icon = AlertCircle;
      break;
    case UrgencyLevel.CRITICAL:
      styles = 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      Icon = ShieldAlert;
      break;
    default:
      styles = 'bg-gray-800 text-gray-400 border-gray-700';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${styles}`}>
      <Icon size={14} strokeWidth={2.5} />
      {level}
    </span>
  );
};