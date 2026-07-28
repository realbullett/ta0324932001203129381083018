import { User } from '../types';
import { supabase } from './supabase';
import { sendOtpEmail } from './emailService';

export function mapSupabaseUser(supabaseUser: any): User {
  const meta = supabaseUser.user_metadata || {};
  const picture = meta.picture || meta.avatar_url || '';
  const name = meta.name || meta.full_name || supabaseUser.email?.split('@')[0] || 'User';
  return {
    id: supabaseUser.id,
    name,
    email: supabaseUser.email || '',
    picture,
  };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<{ error: string | null }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) return { error: error.message };

  if (data.user) {
    await supabase.auth.signOut();

    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase.from('otp_codes').insert({
      email,
      code,
      expires_at: expiresAt,
    });
    if (dbError) {
      console.error('[Tabib] OTP store error:', dbError);
      return { error: 'Failed to generate verification code.' };
    }

    const { error: emailError } = await sendOtpEmail(email, code);
    if (emailError) return { error: emailError };

    return { error: null };
  }

  return { error: 'Account creation failed.' };
}

export async function verifyCustomOtp(email: string, code: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase
    .from('otp_codes')
    .select('*')
    .eq('email', email)
    .eq('code', code)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { user: null, error: 'Invalid or expired verification code.' };
  }

  await supabase.from('otp_codes').delete().eq('id', data.id);

  const password = sessionStorage.getItem('tabib_signup_password');
  if (password) {
    sessionStorage.removeItem('tabib_signup_password');
    const { user, error: signInError } = await signInWithEmail(email, password);
    if (signInError) return { user: null, error: signInError };
    return { user, error: null };
  }

  return { user: null, error: null };
}

export async function resendOtp(email: string): Promise<{ error: string | null }> {
  await supabase.from('otp_codes').delete().eq('email', email);

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  const { error: dbError } = await supabase.from('otp_codes').insert({
    email,
    code,
    expires_at: expiresAt,
  });
  if (dbError) return { error: 'Failed to generate verification code.' };

  const { error: emailError } = await sendOtpEmail(email, code);
  if (emailError) return { error: emailError };

  return { error: null };
}

export async function signInWithEmail(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message };
  return { user: mapSupabaseUser(data.user), error: null };
}

export async function signInWithGoogle(): Promise<void> {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export function onAuthStateChange(callback: (user: User | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      callback(mapSupabaseUser(session.user));
    } else {
      callback(null);
    }
  });
  return () => data.subscription.unsubscribe();
}
