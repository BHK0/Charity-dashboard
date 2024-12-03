import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';


export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not configured');
      return NextResponse.json(
        { error: 'خطأ في إعدادات الخادم' },
        { status: 500 }
      );
    }

    const file = await request.blob();

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'نوع الملف غير صالح. يسمح فقط بالصور' },
        { status: 400 }
      );
    }

    // Validate file size (500KB limit)
    if (file.size > 500 * 1024) {
      return NextResponse.json(
        { error: 'حجم الملف يتجاوز 500 كيلوبايت' },
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
        throw new Error('فشل في الحصول على رابط الصورة');
      }

      return NextResponse.json(blob);
    } catch (uploadError) {
      console.error('Blob upload error:', uploadError);
      return NextResponse.json(
        { error: 'فشل في رفع الصورة إلى الخادم' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Upload error details:', error);
    return NextResponse.json(
      { error: 'خطأ في رفع الملف: ' + (error.message || 'خطأ غير معروف') },
      { status: error.status || 500 }
    );
  }
}

export const runtime = 'edge';