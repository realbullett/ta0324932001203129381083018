import React, { useState, useEffect, useRef, useCallback } from 'react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, verifyCustomOtp, resendOtp } from '../services/authService';
import { initEmailJs } from '../services/emailService';
import { supabase } from '../services/supabase';

type Mode = 'signin' | 'signup' | 'verify';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const blockRedirectRef = useRef(false);

  useEffect(() => {
    initEmailJs();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && !blockRedirectRef.current) {
        window.location.href = '/';
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otpDigits];
    next[index] = value.slice(-1);
    setOtpDigits(next);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }, [otpDigits]);

  const handleOtpKeyDown = useCallback((index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }, [otpDigits]);

  const handleOtpPaste = useCallback((e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...otpDigits];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || '';
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }, [otpDigits]);

  useEffect(() => {
    if (mode === 'verify') {
      otpRefs.current[0]?.focus();
    }
  }, [mode]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    const { error } = await resendOtp(email);
    if (error) {
      setError(error);
    } else {
      setResendCooldown(60);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) { setError('Please enter your name.'); setLoading(false); return; }
        blockRedirectRef.current = true;
        sessionStorage.setItem('tabib_signup_password', password);
        const { error } = await signUpWithEmail(email, password, name.trim());
        if (error) {
          sessionStorage.removeItem('tabib_signup_password');
          blockRedirectRef.current = false;
          setError(error);
          setLoading(false);
          return;
        }
        setMode('verify');
        setResendCooldown(60);
        setLoading(false);
        return;
      } else {
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(result.error);
        } else if (result.user) {
          window.location.href = '/';
          return;
        }
      }
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }
    setError('');
    setVerifyLoading(true);
    try {
      const result = await verifyCustomOtp(email, code);
      if (result.error) {
        setError(result.error);
      } else {
        blockRedirectRef.current = false;
        window.location.href = '/';
        return;
      }
    } catch {
      setError('Verification failed. Please try again.');
    }
    setVerifyLoading(false);
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch {
      setError('Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-white/25 transition-colors";

  if (mode === 'verify') {
    const code = otpDigits.join('');
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Tabib" className="w-10 h-10" />
              <span className="text-xl font-bold text-white">Tabib</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Check your email</h1>
            <p className="text-sm text-zinc-500">
              We sent a code to <span className="text-white">{email}</span>
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <form onSubmit={handleVerify} className="space-y-5">
              <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-11 h-13 text-center text-lg font-bold text-white bg-white/[0.04] border border-white/10 rounded-xl outline-none focus:border-purple-500/50 transition-colors"
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={verifyLoading || code.length !== 6}
                className="w-full px-4 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
              >
                {verifyLoading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            <div className="mt-4 text-center">
              {resendCooldown > 0 ? (
                <p className="text-xs text-zinc-600">
                  Resend in {resendCooldown}s
                </p>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-xs text-white/50 hover:text-white/80 font-medium transition-colors"
                >
                  Resend code
                </button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-zinc-600 mt-4">
            <button
              onClick={() => { setMode('signin'); setError(''); setOtpDigits(['', '', '', '', '', '']); }}
              className="text-white/70 hover:text-white font-semibold transition-colors"
            >
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Tabib" className="w-10 h-10" />
            <span className="text-xl font-bold text-white">Tabib</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-zinc-500">
            {mode === 'signin'
              ? 'Sign in to access your health history and reports.'
              : 'Join Tabib for AI-powered health insights.'}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-medium text-white transition-colors mb-4 disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-600">or</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                autoComplete="name"
              />
            )}
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              autoComplete="email"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              required
              minLength={6}
            />

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
            )}
            {success && (
              <p className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">{success}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl bg-white text-black text-sm font-bold hover:bg-zinc-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-4">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }}
            className="text-white/70 hover:text-white font-semibold transition-colors"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
