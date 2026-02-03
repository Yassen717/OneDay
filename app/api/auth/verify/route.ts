import { NextRequest, NextResponse } from 'next/server';
import { validateUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await validateUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    
    return NextResponse.json({ user: { email: user.email, name: user.name } });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
