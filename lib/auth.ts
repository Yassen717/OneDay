import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export interface User {
  name: string;
  email: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return secret;
}

// SERVER-SIDE: Validate JWT token and verify user exists in database
// This centralizes auth logic and prevents redundant checks across API routes
export async function validateUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Extract token from httpOnly cookie
    const token = request.cookies.get('token')?.value;
    if (!token) return null;

    // Verify JWT signature and expiration
    const decoded = jwt.verify(token, getJwtSecret()) as { userId?: string; email?: string; name?: string };
    if (!decoded.userId) {
      // Old token format without userId - reject it
      return null;
    }

    // Verify user exists in database (prevents stale tokens after DB resets or user deletions)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) return null;

    return {
      userId: user.id,
      email: user.email,
      name: user.name
    };
  } catch (error) {
    // JWT verification failed (expired, invalid signature, etc.)
    return null;
  }
}

// CLIENT-SIDE: Token is now stored in httpOnly cookie (set by server), not accessible by JavaScript
// This is more secure as it prevents XSS attacks from stealing the token

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem('oneday-user');
  return user ? JSON.parse(user) : null;
};

export const setUser = (user: User) => {
  localStorage.setItem('oneday-user', JSON.stringify(user));
};

export const logout = async () => {
  localStorage.removeItem('oneday-user');
  // Server will clear the httpOnly cookie
  await fetch('/api/auth/logout', { method: 'POST' });
};

export const register = async (email: string, password: string, name: string) => {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  // Token is set as httpOnly cookie by server, we only store user info for display
  setUser(data.user);
  return data;
};

export const login = async (email: string, password: string) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  // Token is set as httpOnly cookie by server, we only store user info for display
  setUser(data.user);
  return data;
};

export const verifyToken = async () => {
  // Cookie is automatically sent by browser
  const res = await fetch('/api/auth/verify');
  if (!res.ok) {
    logout();
    return null;
  }
  const data = await res.json();
  return data.user;
};
