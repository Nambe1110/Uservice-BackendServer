import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import * as dotenv from "dotenv";
import crypto from "crypto";
import path from "path";
import logger from "../config/logger/index.js";

dotenv.config();

const randomUniqueImgName = (originalName, bytes = 32) => {
  const ext = path.extname(originalName);
  const randomCharacters = crypto.randomBytes(bytes).toString("hex");
  return `${randomCharacters}${Date.now()}${ext}`;
};

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

export default class S3 {
  static async pushToS3(image) {
    const imageName = randomUniqueImgName(image.originalname);
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: imageName,
      Body: image.buffer,
      ContentType: image.mimetype,
    };

    const command = new PutObjectCommand(params);
    await s3.send(command);
    logger.info("Upload image to S3");

    return imageName;
  }

  static async getImageUrl(imageName, timeToLive = 3600) {
    const getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: imageName,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: timeToLive });

    return url;
  }

  static async removeFromS3(fileName) {
    const deleteObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: fileName,
    };
    const command = new DeleteObjectCommand(deleteObjectParams);
    await s3.send(command);
    logger.info("Remove file/image from S3");
  }
}
