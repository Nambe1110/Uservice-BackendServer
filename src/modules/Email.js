import nodemailer from "nodemailer";
import { google } from "googleapis";
import * as dotenv from "dotenv";
import logger from "../config/logger.js";

const { OAuth2 } = google.auth;

dotenv.config();

const createTransporter = async () => {
  const oauth2Client = new OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );

  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });

  const accessToken = await new Promise((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        reject(new Error("Failed to create access token"));
        logger.error(err);
      }
      resolve(token);
    });
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: "uservice.system@gmail.com",
      accessToken,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    },
  });

  return transporter;
};

export const sendEmail = async (emailOptions) => {
  const emailTransporter = await createTransporter();
  await emailTransporter.sendMail(emailOptions);
};
