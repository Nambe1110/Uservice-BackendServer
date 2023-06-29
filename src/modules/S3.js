import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import fs from "fs";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import mime from "mime-types";
import logger from "../config/logger.js";

const s3BucketUrl = process.env.BUCKET_URL;

const randomUniqueFileName = () => uuidv4();

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

export default class S3 {
  static async pushDiskStorageFileToS3({ filePath }) {
    // Disk storage file path on server BE
    const file = await fs.promises.readFile(filePath);
    const key = `company/${uuidv4()}/${path.basename(filePath)}`;

    try {
      const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType:
          mime.lookup(file.originalname) || "application/octet-stream",
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
    const randomName = randomUniqueFileName();
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
    } catch (error) {
      logger.error(error.message);
    }
    const url = `${s3BucketUrl}${key}`;
    return url;
  }

  static async uploadFromUrlToS3({ url }) {
    if (!url) return null;

    try {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        responseEncoding: "binary",
      });

      const key = `company/${uuidv4()}/${path.basename(url)}`;

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
    } catch (error) {
      logger.error(error.message);
    }
  }
}
