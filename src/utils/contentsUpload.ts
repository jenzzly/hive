import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import imageCompression from 'browser-image-compression';

export type ContentFolder = 'properties' | 'units' | 'contracts' | 'maintenance' | 'payments' | 'receipts' | 'profiles';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: import.meta.env.VITE_R2_ENDPOINT || 'https://77248eb4c6cf01d39e2260f048b49c85.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: import.meta.env.VITE_R2_ACCESS_KEY || 'MISSING_ACCESS_KEY',
    secretAccessKey: import.meta.env.VITE_R2_SECRET_KEY || 'MISSING_SECRET_KEY',
  },
});

const BUCKET_NAME = 'terraviser';
const PUBLIC_R2_URL = import.meta.env.VITE_R2_PUBLIC_URL || 'https://pub-YOUR-R2-DEV-URL.r2.dev';

export const uploadContent = async (
  file: File,
  folder: ContentFolder = 'properties'
): Promise<string> => {
  let processedFile = file;

  // Compress images (skip PDFs or other non-image formats)
  if (file.type.startsWith('image/')) {
    try {
      processedFile = await imageCompression(file, {
        maxSizeMB: 1, // Compress to max 1MB
        maxWidthOrHeight: 1600, // Resize if dimensions exceed 1600px
        useWebWorker: true,
      });
    } catch (err) {
      console.warn('Image compression failed, using original file:', err);
    }
  }

  // Generate a unique filename
  const extension = processedFile.name.split('.').pop();
  const filename = `${folder}/${uuidv4()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: filename,
    Body: new Uint8Array(await processedFile.arrayBuffer()),
    ContentType: processedFile.type,
  });

  try {
    await s3Client.send(command);
    return `${PUBLIC_R2_URL}/${filename}`;
  } catch (error) {
    console.error('R2 upload failed:', error);
    throw new Error('Failed to upload file to Cloudflare R2');
  }
};

export const uploadMultiple = async (
  files: File[],
  folder: ContentFolder = 'properties'
): Promise<string[]> => {
  return Promise.all(files.map((f) => uploadContent(f, folder)));
};

export const resolveFileUrl = (url: string | undefined): string => {
  if (!url) return '';
  
  if (url.includes('cloudinary.com')) {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (match && match[1]) {
      const key = match[1];
      const pubUrl = import.meta.env.VITE_R2_PUBLIC_URL?.replace(/\/$/, '') || 'https://77248eb4c6cf01d39e2260f048b49c85.r2.cloudflarestorage.com/terraviser';
      return `${pubUrl}/${key}`;
    }
  } 
  
  return url;
};
