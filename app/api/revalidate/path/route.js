

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// List of valid paths that can be revalidated
const VALID_PATHS = [
  '/',
  '/admin',
  '/admin/organizations',
  '/admin/donations',
  '/admin/date-donations',
  '/admin/users'
];

export async function POST(request) {
  try {
    // Verify secret
    const { secret, path } = await request.json();
    
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    if (!path) {
      return NextResponse.json(
        { error: 'Path is required' },
        { status: 400 }
      );
    }

    // Validate path
    if (!VALID_PATHS.includes(path)) {
      return NextResponse.json(
        { error: 'Invalid path' },
        { status: 400 }
      );
    }

    // Revalidate path
    revalidatePath(path);

    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate path' },
      { status: 500 }
    );
  }
} 