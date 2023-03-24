import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import mime from "mime-types";
import logger from "../config/logger/index.js";

const s3BucketUrl =
  "https://uservice-internal-s3-bucket.s3.ap-southeast-1.amazonaws.com/";

const randomUniqueFileName = (originalName, bytes = 32) => {
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
  static async pushDiskStorageFileToS3(fileName, destinationFolder) {
    // Disk storage file path on server BE
    const filePath = `./images/${fileName}`;
    const file = fs.readFileSync(filePath);
    const fileBuffer = Buffer.from(file, "binary");
    const mimeType = mime.lookup(filePath);

    const randomName = randomUniqueFileName(fileName);
    const key = !destinationFolder
      ? `${destinationFolder}/${randomName}`
      : `${randomName}`;
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    };

    try {
      const command = new PutObjectCommand(params);
      await s3.send(command);
      logger.info("Upload image to S3");
    } catch (error) {
      logger.error(error.message);
    }

    const url = `${s3BucketUrl}${key}`;
    return url;
  }

  // file: value read from file
  // destinationFolder: folder on S3 bucket to upload file to
  // ex: avatar
  static async pushMemoryStorageFileToS3(file, destinationFolder) {
    const randomName = randomUniqueFileName(file.originalname);
    const key =
      destinationFolder != null
        ? `${destinationFolder}/${randomName}`
        : `${randomName}`;
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    };

    try {
      const command = new PutObjectCommand(params);
      await s3.send(command);
      logger.info("Upload file/image to S3");
    } catch (error) {
      logger.error(error.message);
    }
    const url = `${s3BucketUrl}${key}`;
    return url;
  }

  static async getFileUrl(filePath, timeToLive = 7200) {
    const getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: filePath,
    };
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: timeToLive });

    return url;
  }

  static async removeFromS3(filePath) {
    try {
      const deleteObjectParams = {
        Bucket: process.env.BUCKET_NAME,
        Key: filePath,
      };
      const command = new DeleteObjectCommand(deleteObjectParams);
      await s3.send(command);
      logger.info("Remove file/image from S3");
    } catch (error) {
      logger.error(error.message);
    }
  }
}
