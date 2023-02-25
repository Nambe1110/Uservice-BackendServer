import nodemailer from "nodemailer";
import { google } from "googleapis";
import * as dotenv from "dotenv";
const OAuth2 = google.auth.OAuth2;

const origin = "https://developers.google.com/oauthplayground";

class EmailModule {
  async send({
      html, // Html content
      receiver, // Email of receiver
      subject, // Title
  }){
    try {
      const myOAuth2Client = new OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        origin
      );

      myOAuth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });

      const myAccessToken = myOAuth2Client.getAccessToken();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "uservice.system@gmail.com",
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: myAccessToken,
        },
      });

      await new Promise((resolve, reject) => {
        transporter.verify(function (error, success) {
          if (error) {
              reject(error);
          } else {
              resolve(success);
          }
        });
      });

      const mailOptions = {
        to: receiver, // receiver
        subject, // Subject
        html, // html body
      };

      await new Promise((resolve, reject) => {
        // send mail
        transporter.sendMail(mailOptions, (err, info) => {
          if (err) {
              reject(err);
          } else {
              resolve(info);
          }
        });
      });
      console.log("Email was sent sucessfully");
    } catch (error) {
      console.log("Email was not sent");
      console.log(error);
    }
  }
}

export const Email = new EmailModule();