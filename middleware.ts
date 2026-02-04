import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { validateUserFromRequest } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const user = await validateUserFromRequest(request);

  if (!user) {
    // Invalid or expired token, or user doesn't exist
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/profile'],
};
