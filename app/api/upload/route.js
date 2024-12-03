import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const s3 = new S3Client({
  region: 'me-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files');

    const uploadPromises = files.map(async (file) => {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;

      const command = new PutObjectCommand({
        Bucket: 'farmersdonations2',
        Key: `donations/${fileName}`,
        Body: buffer,
        ContentType: file.type,
      });

      await s3.send(command);

      return `https://farmersdonations2.s3.me-south-1.amazonaws.com/donations/${fileName}`;
    });

    const imageUrls = await Promise.all(uploadPromises);

    return NextResponse.json({ imageUrls });
    
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return NextResponse.json(
      { error: 'Failed to upload images' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
