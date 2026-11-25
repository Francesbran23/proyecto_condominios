const {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

const bucket = 'receipts';
const requiredVariables = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_ENDPOINT_URL_S3',
  'AWS_REGION',
];

function getClient() {
  const missing = requiredVariables.filter(name => !process.env[name]);
  if (missing.length) {
    throw new Error(`Neon Object Storage is missing configuration: ${missing.join(', ')}`);
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    forcePathStyle: true,
  });
}

async function saveReceiptPdf(receiptId, contents) {
  const key = `receipts/${receiptId}/recibo.pdf`;
  const client = getClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: Buffer.from(contents),
    ContentType: 'application/pdf',
    CacheControl: 'private, no-store',
  }));
  return key;
}

async function getReceiptPdf(key) {
  const client = getClient();
  const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!result.Body) throw new Error('Neon Object Storage returned an empty PDF object.');
  return Buffer.from(await result.Body.transformToByteArray());
}

module.exports = { getReceiptPdf, saveReceiptPdf };
