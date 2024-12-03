

import { validateToken } from '@/app/actions/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ valid: false }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const result = await validateToken(token);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Token validation error:', error);
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}

