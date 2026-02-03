import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

function getUserFromToken(request: NextRequest) {
  // Read token from httpOnly cookie (secure) instead of Authorization header
  const token = request.cookies.get('token')?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId?: string; email?: string };
    if (!decoded.userId) {
      // Old token without userId - reject it
      return null;
    }
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // IMPORTANT: Verify user exists in database
    // This prevents foreign key constraint errors after migrations reset the database
    // Solution: User must log out and log in again if this check fails
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    if (!userExists) {
      return NextResponse.json({ error: 'User not found. Please log in again.' }, { status: 401 });
    }

    const notes = await prisma.note.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error('GET /api/notes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // IMPORTANT: Verify user exists in database
    // This prevents foreign key constraint errors after migrations reset the database
    // Solution: User must log out and log in again if this check fails
    const userExists = await prisma.user.findUnique({
      where: { id: user.userId }
    });
    if (!userExists) {
      return NextResponse.json({ error: 'User not found. Please log in again.' }, { status: 401 });
    }

    const { text, color } = await request.json();
    
    const note = await prisma.note.create({
      data: { text, color, userId: user.userId }
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error('POST /api/notes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, text } = await request.json();
    
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updated = await prisma.note.update({
      where: { id },
      data: { text }
    });

    return NextResponse.json({ note: updated });
  } catch (error) {
    console.error('PUT /api/notes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = getUserFromToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.userId !== user.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/notes error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
