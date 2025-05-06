import * as process from 'node:process';

export default () => ({
  upload: {
    imageLimitMB: parseInt(process.env.UPLOAD_IMAGE_LIMIT_MB) || 10,
    videoLimitMB: parseInt(process.env.UPLOAD_VIDEO_LIMIT_MB) || 100,
  },
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION,
    bucket: process.env.S3_BUCKET,
  },
});
