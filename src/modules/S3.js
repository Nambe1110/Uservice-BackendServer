import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import randomBytes from "randombytes";
import path from "path";
import fs from "fs";
import axios from "axios";
import logger from "../config/logger/index.js";

const s3BucketUrl = process.env.BUCKET_URL;

const randomUniqueFileName = (originalName, bytes = 32) => {
  const ext = path.extname(originalName);
  const randomCharacters = randomBytes(bytes).toString("hex");
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
  static async pushDiskStorageFileToS3({ filePath, companyId }) {
    // Disk storage file path on server BE
    const file = await fs.promises.readFile(filePath);
    const randomName = randomUniqueFileName(filePath);
    const key = `company/${companyId}/${randomName}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: file.buffer,
      });
      await s3.send(command);
      fs.unlinkSync(filePath);
      const url = `${s3BucketUrl}${key}`;

      return url;
    } catch (error) {
      logger.error(error.message);
    }
  }

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

  static async uploadFromUrlToS3({ url, companyId }) {
    if (!url) return null;

    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        responseEncoding: "binary",
      });

      const randomName = randomUniqueFileName(url);
      const key = `company/${companyId}/${randomName}`;

      const command = new PutObjectCommand({
        ContentType: response.headers["content-type"],
        ContentLength: response.data.length.toString(),
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: response.data,
      });
      await s3.send(command);
      const S3url = `${s3BucketUrl}${key}`;

      return S3url;
    } catch {
      logger.error("Error when upload file from url to S3");
    }
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
