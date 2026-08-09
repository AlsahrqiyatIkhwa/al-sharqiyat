import { env } from '../config/env';

/**
 * Uploads a buffer to S3 (or any S3-compatible provider configured via
 * S3_ENDPOINT) and returns its public URL. Only called when
 * STORAGE_DRIVER=s3 — the default "local" driver never touches this file's
 * dependency, so a store that hasn't configured S3 yet is completely
 * unaffected.
 */
export async function uploadBufferToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
  // Imported lazily so `@aws-sdk/client-s3` is only required at runtime when
  // the S3 driver is actually selected.
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

  if (!env.storage.s3Bucket || !env.storage.s3AccessKeyId || !env.storage.s3SecretAccessKey) {
    throw new Error(
      'STORAGE_DRIVER=s3 but S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY are not fully set'
    );
  }

  const client = new S3Client({
    region: env.storage.s3Region,
    ...(env.storage.s3Endpoint ? { endpoint: env.storage.s3Endpoint, forcePathStyle: true } : {}),
    credentials: {
      accessKeyId: env.storage.s3AccessKeyId,
      secretAccessKey: env.storage.s3SecretAccessKey,
    },
  });

  await client.send(
    new PutObjectCommand({
      Bucket: env.storage.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=604800, immutable',
    })
  );

  if (env.storage.s3PublicUrlBase) {
    return `${env.storage.s3PublicUrlBase.replace(/\/$/, '')}/${key}`;
  }
  if (env.storage.s3Endpoint) {
    return `${env.storage.s3Endpoint.replace(/\/$/, '')}/${env.storage.s3Bucket}/${key}`;
  }
  return `https://${env.storage.s3Bucket}.s3.${env.storage.s3Region}.amazonaws.com/${key}`;
}
