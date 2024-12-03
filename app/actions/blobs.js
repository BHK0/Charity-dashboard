'use server'

import { del } from '@vercel/blob';

export async function deleteBlob(url) {
  if (!url) return;
  
  try {
    // Extract the blob path from the URL
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Remove the leading slash if present
    const blobPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;

    await del(blobPath, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting blob:', error);
    // Don't throw the error as this is a cleanup operation
    return { success: false, error: error.message };
  }
}
