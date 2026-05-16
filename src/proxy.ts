import { NextRequest, NextResponse } from 'next/server';

type AuthPayload = {
  id?: string;
  sub?: string;
  email?: string;
  role?: string;
};

const TOKEN_KEY = 'auth_token';

function decodeJwtPayload(token: string): AuthPayload | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');

  try {
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as AuthPayload;
  } catch {
    return null;
  }
}

function redirectTo(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return NextResponse.redirect(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_KEY)?.value;

  if (pathname.startsWith('/login')) {
    if (token) {
      const payload = decodeJwtPayload(token);
      if (payload?.role === 'admin') {
        return redirectTo(request, '/dashboard');
      }
      if (payload?.role === 'customer') {
        return redirectTo(request, '/users');
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    return redirectTo(request, '/login');
  }

  const payload = decodeJwtPayload(token);
  const role = payload?.role;
  if (!role) {
    return redirectTo(request, '/login');
  }

  if (pathname.startsWith('/dashboard') && role !== 'admin') {
    return redirectTo(request, '/users');
  }

  if (pathname.startsWith('/users') && role !== 'customer') {
    return redirectTo(request, '/dashboard');
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login', '/users/:path*', '/dashboard/:path*'],
};

