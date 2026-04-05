import { S3Storage } from 'coze-coding-dev-sdk';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadApk() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });

  // 上传新 APK
  const apkPath = path.join(__dirname, '../public/zcy-new.apk');
  console.log('正在上传 APK 到对象存储...');
  
  const stream = createReadStream(apkPath);
  const key = await storage.streamUploadFile({
    stream,
    fileName: 'zcy/zcy-new.apk',
    contentType: 'application/vnd.android.package-archive',
  });

  console.log('上传成功! Key:', key);

  // 生成长期有效的下载链接（7天）
  const downloadUrl = await storage.generatePresignedUrl({
    key,
    expireTime: 7 * 24 * 60 * 60, // 7天
  });

  console.log('\n下载链接（7天有效）:');
  console.log(downloadUrl);
}

uploadApk().catch(console.error);
