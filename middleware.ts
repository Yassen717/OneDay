import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Edge-compatible JWT verification (no Prisma, no Node.js crypto)
// Full user validation with database check happens in API routes
async function verifyTokenEdge(token: string): Promise<boolean> {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('JWT_SECRET is not configured');
      return false;
    }
    
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey);
    
    // Basic validation: check that userId exists in the token
    return !!payload.userId;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;

  if (!token) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  const isValid = await verifyTokenEdge(token);

  if (!isValid) {
    // Invalid or expired token
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/profile'],
};
