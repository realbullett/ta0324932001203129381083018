import { User } from '../types';

const CLIENT_ID = '966441971642-oa7306u7kaafsov0kq4qndvihro817e4.apps.googleusercontent.com';
const STORAGE_KEY = 'tabib_user';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: CredentialResponse) => void;
          }) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface CredentialResponse {
  credential: string;
}

function parseJwt(token: string): { name: string; email: string; picture: string } {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  const payload = JSON.parse(jsonPayload);
  return {
    name: payload.name,
    email: payload.email,
    picture: payload.picture,
  };
}

export function getStoredUser(): User | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function storeUser(user: User): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function initGoogleAuth(callback: (user: User) => void): void {
  if (!window.google?.accounts?.id) return;

  window.google.accounts.id.initialize({
    client_id: CLIENT_ID,
    callback: (response: CredentialResponse) => {
      const payload = parseJwt(response.credential);
      const user: User = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };
      storeUser(user);
      callback(user);
    },
  });
}

export function promptGoogleSignIn(): void {
  window.google?.accounts?.id.prompt();
}

export function googleSignOut(callback: () => void): void {
  clearUser();
  window.google?.accounts?.id.disableAutoSelect();
  callback();
}
