import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const R2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId:     process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { base64, contentType, filename } = JSON.parse(event.body);
    if (!base64 || !filename) {
      return { statusCode: 400, body: 'Missing base64 or filename' };
    }

    const key    = `surveys/${filename}`;
    const buffer = Buffer.from(base64, 'base64');

    await R2.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: contentType || 'image/jpeg',
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${key}`;
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, path: key }),
    };
  } catch (err) {
    console.error('R2 upload error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};
