import React, { useRef, useEffect } from 'react';
import { Pill, Stethoscope, LogOut, Menu, X } from 'lucide-react';
import { ViewMode, User } from '../types';

interface HeaderProps {
  onContactClick: () => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onContactClick, currentView, onViewChange, user, onSignIn, onSignOut }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Diagnosis', view: 'diagnosis' as ViewMode, icon: Stethoscope },
    { label: 'Meds Info', view: 'medication' as ViewMode, icon: Pill },
    { label: 'About Us', view: 'about' as ViewMode, icon: null },
    { label: 'Privacy', view: 'privacy' as ViewMode, icon: null },
  ];

  const authButton = user ? (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
          border: '2px solid rgba(255,255,255,0.15)', cursor: 'pointer', padding: 0,
        }}
      >
        {user.picture ? (
          <img src={user.picture} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, fontWeight: 700 }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </button>
      {showMenu && (
        <div
          style={{
            position: 'absolute', top: '100%', right: 0, marginTop: 8,
            background: 'rgba(15,15,20,0.95)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, padding: '8px', minWidth: 180, zIndex: 100,
            backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
        >
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'white' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{user.email}</div>
          </div>
          <button
            onClick={() => { onSignOut(); setShowMenu(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px',
              borderRadius: 8, border: 'none', background: 'transparent', color: '#ef4444',
              fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      )}
    </div>
  ) : (
    <button
      onClick={onSignIn}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, borderRadius: 9999, padding: '8px 16px',
        fontSize: 12, fontWeight: 600, cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.12)',
        backgroundColor: 'rgba(255,255,255,0.06)',
        color: 'white',
      }}
    >
      Sign In
    </button>
  );

  return (
    <header className="header-bar" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 50 }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '16px 16px 0' }}>
        <div className="header-pill" style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', paddingLeft: '20px', paddingRight: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => onViewChange('landing')}>
            <img src="/logo.png" alt="Tabib" style={{ width: 48, height: 48, objectFit: 'contain' }} />
            <span style={{ fontSize: '20px', fontWeight: 700, color: 'white', letterSpacing: '-0.025em' }}>Tabib</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Desktop tabs */}
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
              onClick={() => onViewChange('privacy')}
              className="header-privacy-btn"
              style={{
                display: 'none', alignItems: 'center', gap: '8px', borderRadius: '9999px', padding: '8px 12px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer',
                border: currentView === 'privacy' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,255,255,0.1)',
                backgroundColor: currentView === 'privacy' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                color: currentView === 'privacy' ? 'white' : '#9ca3af',
              }}
            >
              Privacy
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

            {/* Desktop auth */}
            <div className="header-auth">
              {authButton}
            </div>

            {/* Mobile hamburger */}
            <div className="header-hamburger" ref={mobileMenuRef}>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, height: 40, borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.1)',
                  backgroundColor: showMobileMenu ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                  color: 'white', cursor: 'pointer',
                }}
              >
                {showMobileMenu ? <X size={18} /> : <Menu size={18} />}
              </button>
              {showMobileMenu && (
                <div
                  style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220,
                    background: 'rgba(15,15,20,0.97)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 16, padding: '6px', zIndex: 100,
                    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                  }}
                >
                  {navItems.map((item) => (
                    <button
                      key={item.view}
                      onClick={() => { onViewChange(item.view); setShowMobileMenu(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                        padding: '10px 14px', borderRadius: 10, border: 'none',
                        background: currentView === item.view ? 'rgba(255,255,255,0.08)' : 'transparent',
                        color: currentView === item.view ? 'white' : '#9ca3af',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      {item.icon && <item.icon size={15} />}
                      {!item.icon && <span style={{ width: 15 }} />}
                      {item.label}
                    </button>
                  ))}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />
                  <button
                    onClick={() => { onContactClick(); setShowMobileMenu(false); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', borderRadius: 10, border: 'none',
                      background: 'transparent', color: '#9ca3af',
                      fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 15 }} />
                    Contact Us
                  </button>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />
                  <div style={{ padding: '4px 6px' }}>
                    {user ? (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 8px' }}>
                          <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{user.name}</div>
                            <div style={{ fontSize: 10, color: '#9ca3af' }}>{user.email}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => { onSignOut(); setShowMobileMenu(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                            padding: '8px', borderRadius: 8, border: 'none', background: 'transparent',
                            color: '#ef4444', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                          }}
                        >
                          <LogOut size={13} />
                          Sign out
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { onSignIn(); setShowMobileMenu(false); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                          padding: '8px 12px', borderRadius: 8,
                          border: '1px solid rgba(255,255,255,0.1)',
                          background: 'rgba(255,255,255,0.05)', color: 'white',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', justifyContent: 'center',
                        }}
                      >
                        Sign In
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .header-desktop-tabs { display: flex !important; }
          .header-about-btn { display: flex !important; }
          .header-privacy-btn { display: flex !important; }
          .header-contact-btn { display: flex !important; }
          .header-hamburger { display: none !important; }
          .header-pill { height: 96px !important; padding-left: 32px !important; padding-right: 32px !important; }
        }
        @media (min-width: 640px) {
          .header-about-btn { display: flex !important; }
          .header-privacy-btn { display: flex !important; }
          .header-contact-btn { display: flex !important; }
        }
        .header-bar { pointer-events: none; }
        .header-pill, .header-mobile-nav { pointer-events: auto; }
        .header-auth img { display: block; }
        .header-hamburger { position: relative; pointer-events: auto; }
      `}</style>
    </header>
  );
};
