const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

const SAFE_EXT_MAP = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
  'image/webp': '.webp', 'image/svg+xml': '.svg',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'text/plain': '.txt', 'text/csv': '.csv',
};

class S3Storage {
  constructor() {
    this.s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
    this.bucket = process.env.AWS_S3_BUCKET || 'holyname-db-backups';
  }

  _handleFile(req, file, cb) {
    const safeExt = SAFE_EXT_MAP[file.mimetype] || '.bin';
    const key = `uploads/${uuidv4()}${safeExt}`;
    const bucket = this.bucket;
    const region = process.env.AWS_REGION || 'us-east-1';

    const chunks = [];
    file.stream.on('data', chunk => chunks.push(chunk));
    file.stream.on('error', cb);
    file.stream.on('end', () => {
      const body = Buffer.concat(chunks);
      this.s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: file.mimetype,
      })).then(() => {
        cb(null, {
          key,
          location: `https://${bucket}.s3.${region}.amazonaws.com/${key}`,
          size: body.length,
        });
      }).catch(cb);
    });
  }

  _removeFile(req, file, cb) {
    cb(null);
  }
}

module.exports = { S3Storage };
