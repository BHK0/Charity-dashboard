

import { revalidateTag, revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

// All valid tags and paths
const VALID_TAGS = [
  'organizations',
  'donations',
  'datedonations',
  'users'
];

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
    const { secret } = await request.json();
    
    if (!secret || secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalidate all tags
    VALID_TAGS.forEach(tag => {
      try {
        revalidateTag(tag);
      } catch (error) {
        console.error(`Error revalidating tag ${tag}:`, error);
      }
    });

    // Revalidate all paths
    VALID_PATHS.forEach(path => {
      try {
        revalidatePath(path);
      } catch (error) {
        console.error(`Error revalidating path ${path}:`, error);
      }
    });

    return NextResponse.json({
      revalidated: true,
      tags: VALID_TAGS,
      paths: VALID_PATHS,
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
} 