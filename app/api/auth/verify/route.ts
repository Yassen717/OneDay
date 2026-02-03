import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

export async function GET(request: NextRequest) {
  try {
    // Read token from httpOnly cookie (secure) instead of Authorization header
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; email: string; name: string };
    
    if (!decoded.userId) {
      return NextResponse.json({ error: 'Invalid token - please login again' }, { status: 401 });
    }
    
    return NextResponse.json({ user: { email: decoded.email, name: decoded.name } });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}
