import express from "express";
import {
  sendPhoneNumberVerificationCode,
  checkCodeAuthentication,
  checkPasswordAuthentication,
} from "./telegramUserChannelController.js";
import { verifyToken } from "../../../../middlewares/verifyToken.js";

const telegramUserRouter = express.Router({ mergeParams: true });

telegramUserRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram User']
  next();
});
telegramUserRouter.use("/", verifyToken());

telegramUserRouter.post("/send-code", sendPhoneNumberVerificationCode);
telegramUserRouter.post("/check-code", checkCodeAuthentication);
telegramUserRouter.post("/check-password", checkPasswordAuthentication);

export default telegramUserRouter;
