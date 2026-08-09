import { NextRequest, NextResponse } from 'next/server';

// Note: the actual JWT is validated server-side by the backend API on every
// request via requireAdminAuth. This middleware only performs a lightweight
// client-side gate (checks a mirrored cookie) to avoid flashing protected
// UI before redirecting — it is a UX guard, not the security boundary.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/admin')) {
    const hasToken = request.cookies.get('admin_token_present');
    if (!hasToken) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
