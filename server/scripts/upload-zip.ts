import { S3Storage } from "coze-coding-dev-sdk";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  const filePath = "/tmp/zhaobiao-app.tar.gz";
  const fileName = "zhaobiao-app.tar.gz";

  console.log("正在读取文件...");
  const fileContent = fs.readFileSync(filePath);
  
  console.log("正在上传到对象存储...");
  const key = await storage.uploadFile({
    fileContent,
    fileName,
    contentType: "application/gzip",
  });

  console.log("上传成功，key:", key);

  // 生成 7 天有效期的下载链接
  const downloadUrl = await storage.generatePresignedUrl({
    key,
    expireTime: 7 * 24 * 60 * 60, // 7 天
  });

  console.log("\n========================================");
  console.log("下载链接（7天有效）:");
  console.log(downloadUrl);
  console.log("========================================\n");
}

main().catch(console.error);
