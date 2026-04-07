import { S3Storage } from "coze-coding-dev-sdk";
import * as fs from "fs";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function uploadApk() {
  const filePath = "/workspace/projects/client/zhaocaiyi.apk";
  const fileContent = fs.readFileSync(filePath);
  
  const key = await storage.uploadFile({
    fileContent: fileContent,
    fileName: "zhaocaiyi-app.apk",
    contentType: "application/vnd.android.package-archive",
  });
  
  console.log("File uploaded with key:", key);
  
  const downloadUrl = await storage.generatePresignedUrl({
    key: key,
    expireTime: 86400 * 7, // 7天有效期
  });
  
  console.log("Download URL:", downloadUrl);
}

uploadApk().catch(console.error);
