// eslint-disable-next-line import/no-extraneous-dependencies
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import * as dotenv from "dotenv";

dotenv.config();
const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

export default class S3 {
  static async pushToS3(avatar) {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: avatar.originalname,
      Body: avatar.buffer,
      ContentType: avatar.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
  }
}
