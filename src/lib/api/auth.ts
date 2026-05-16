export type AuthTokenPayload = {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
};

const TOKEN_KEY = 'auth_token';

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  try {
    return atob(padded);
  } catch {
    return '';
  }
}

export function decodeJwtPayload(token: string): AuthTokenPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }
  const decoded = base64UrlDecode(parts[1]);
  if (!decoded) {
    return null;
  }
  try {
    return JSON.parse(decoded) as AuthTokenPayload;
  } catch {
    return null;
  }
}

export function readAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string, days = 7) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
  const maxAge = Math.max(1, Math.floor(days * 24 * 60 * 60));
  document.cookie = `${TOKEN_KEY}=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_KEY}=; Path=/; Max-Age=0; SameSite=Lax`;
}
