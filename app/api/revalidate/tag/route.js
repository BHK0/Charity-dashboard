

import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// List of valid tags that can be revalidated
const VALID_TAGS = [
  'organizations',
  'donations',
  'datedonations',
  'users'
];

export async function POST(request) {
  try {
    // Verify secret
    const { secret, tag } = await request.json();
    
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    if (!tag) {
      return NextResponse.json(
        { error: 'Tag is required' },
        { status: 400 }
      );
    }

    // Validate tag
    if (!VALID_TAGS.includes(tag)) {
      return NextResponse.json(
        { error: 'Invalid tag' },
        { status: 400 }
      );
    }

    // Revalidate tag
    revalidateTag(tag);

    return NextResponse.json({
      revalidated: true,
      tag,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate tag' },
      { status: 500 }
    );
  }
} 