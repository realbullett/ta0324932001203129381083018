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
    <header className="header-bar" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50 }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '16px 16px 0' }}>
        <div className="header-pill" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', paddingLeft: '20px', paddingRight: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onViewChange('landing')}>
            <img src="/logo.png" alt="Tabib" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '-0.025em' }}>Tabib</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="header-desktop-tabs" style={{ display: 'none', alignItems: 'center', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.06)', padding: '4px', gap: '4px' }}>
              <button
                onClick={() => onViewChange('diagnosis')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '9999px', padding: '6px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  backgroundColor: currentView === 'diagnosis' ? 'white' : 'transparent',
                  color: currentView === 'diagnosis' ? 'black' : '#9ca3af',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <Stethoscope size={14} />
                Diagnosis
              </button>
              <button
                onClick={() => onViewChange('medication')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '9999px', padding: '6px 16px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                  backgroundColor: currentView === 'medication' ? '#e4e4e7' : 'transparent',
                  color: currentView === 'medication' ? 'black' : '#9ca3af',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <Pill size={14} />
                Meds Info
              </button>
            </div>

            <button
              onClick={() => onViewChange('about')}
              className="header-about-btn"
              style={{
                display: 'none', alignItems: 'center', gap: '8px', borderRadius: '9999px', padding: '8px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                border: currentView === 'about' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: currentView === 'about' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                color: currentView === 'about' ? 'white' : '#9ca3af',
              }}
            >
              About Us
            </button>
            <button
              onClick={onContactClick}
              className="header-contact-btn"
              style={{
                display: 'none', alignItems: 'center', gap: '8px', borderRadius: '9999px', padding: '8px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                border: '1px solid rgba(255,255,255,0.1)',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#9ca3af',
              }}
            >
              Contact Us
            </button>
          </div>
        </div>
      </div>

      <div className="header-mobile-nav" style={{ display: 'flex', maxWidth: '320px', margin: '8px auto 0', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '4px', gap: '2px', boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)' }}>
          <button
            onClick={() => onViewChange('diagnosis')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '9999px', padding: '6px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer',
              backgroundColor: currentView === 'diagnosis' ? 'white' : 'transparent',
              color: currentView === 'diagnosis' ? 'black' : '#9ca3af',
            }}
          >
            <Stethoscope size={12} />
            Diagnosis
          </button>
          <button
            onClick={() => onViewChange('medication')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '9999px', padding: '6px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer',
              backgroundColor: currentView === 'medication' ? '#e4e4e7' : 'transparent',
              color: currentView === 'medication' ? 'black' : '#9ca3af',
            }}
          >
            <Pill size={12} />
            Meds
          </button>
          <button
            onClick={() => onViewChange('about')}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '9999px', padding: '6px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', border: 'none', cursor: 'pointer',
              backgroundColor: currentView === 'about' ? 'white' : 'transparent',
              color: currentView === 'about' ? 'black' : '#9ca3af',
            }}
          >
            About
          </button>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .header-desktop-tabs { display: flex !important; }
          .header-about-btn { display: flex !important; }
          .header-contact-btn { display: flex !important; }
          .header-mobile-nav { display: none !important; }
          .header-pill { height: 96px !important; padding-left: 32px !important; padding-right: 32px !important; }
        }
        @media (min-width: 640px) {
          .header-about-btn { display: flex !important; }
          .header-contact-btn { display: flex !important; }
        }
        .header-bar { pointer-events: none; }
        .header-pill, .header-mobile-nav { pointer-events: auto; }
      `}</style>
    </header>
  );
};
