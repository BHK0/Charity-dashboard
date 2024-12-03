import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const file = await request.blob();

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (500KB limit)
    if (file.size > 500 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 500KB limit' },
        { status: 400 }
      );
    }

    try {
      const blob = await put(filename, file, {
        access: 'public',
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: true,
      });

      if (!blob || !blob.url) {
        throw new Error('Failed to get image URL');
      }

      return NextResponse.json(blob);
    } catch (uploadError) {
      console.error('Blob upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload image to server' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error details:', error);
    return NextResponse.json(
      { error: 'File upload error: ' + (error.message || 'Unknown error') },
      { status: error.status || 500 }
    );
  }
}

export const runtime = 'edge';