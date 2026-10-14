import fs from 'fs';
import path from 'path';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET = process.env.AWS_BUCKET_NAME || 'docmind-default-bucket';

/**
 * Upload a file buffer to S3 with local disk fallback.
 */
export const uploadToS3 = async (buffer, key, mimeType) => {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      });
      await s3Client.send(command);
      return key;
    } catch (s3Err) {
      console.warn(`S3 upload warning: ${s3Err.message}. Storing file locally in uploads/ fallback.`);
    }
  }

  // Local fallback: save to uploads folder
  const localDir = path.join(process.cwd(), 'uploads', path.dirname(key));
  await fs.promises.mkdir(localDir, { recursive: true });
  const localFilePath = path.join(process.cwd(), 'uploads', key);
  await fs.promises.writeFile(localFilePath, buffer);
  return `local:${key}`;
};

/**
 * Delete a file from S3 or local disk.
 */
export const deleteFromS3 = async (key) => {
  if (key?.startsWith('local:')) {
    const rawKey = key.replace('local:', '');
    const localFilePath = path.join(process.cwd(), 'uploads', rawKey);
    await fs.promises.unlink(localFilePath).catch(() => {});
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  } catch (err) {
    console.warn('S3 delete warning:', err.message);
  }
};

/**
 * Generate a pre-signed URL for a file in S3 or local download link.
 */
export const getS3SignedUrl = async (key, expiresIn = 3600) => {
  if (key?.startsWith('local:')) {
    const rawKey = key.replace('local:', '');
    return `/api/documents/file/${encodeURIComponent(rawKey)}`;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (err) {
    return `/api/documents/file/${encodeURIComponent(key)}`;
  }
};

/**
 * Stream an S3 object response body (or local file stream).
 */
export const streamFromS3 = async (key) => {
  if (key?.startsWith('local:')) {
    const rawKey = key.replace('local:', '');
    const localFilePath = path.join(process.cwd(), 'uploads', rawKey);
    const stat = await fs.promises.stat(localFilePath);
    return {
      body: fs.createReadStream(localFilePath),
      contentType: 'application/octet-stream',
      contentLength: stat.size,
    };
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const response = await s3Client.send(command);
    return {
      body: response.Body,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
    };
  } catch (err) {
    // Attempt local fallback
    const localFilePath = path.join(process.cwd(), 'uploads', key);
    if (fs.existsSync(localFilePath)) {
      const stat = await fs.promises.stat(localFilePath);
      return {
        body: fs.createReadStream(localFilePath),
        contentType: 'application/octet-stream',
        contentLength: stat.size,
      };
    }
    throw err;
  }
};

export default s3Client;
