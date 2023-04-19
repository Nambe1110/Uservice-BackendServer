import express from "express";
import {
  sendPhoneNumberVerificationCode,
  checkAuthenticationCode,
  checkAuthenticationPassword,
} from "./telegramUserChannelController.js";
import { verifyToken } from "../../../../middlewares/verifyToken.js";

const telegramUserRouter = express.Router({ mergeParams: true });

telegramUserRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram User']
  next();
});
telegramUserRouter.use("/", verifyToken());

telegramUserRouter.post("/send-code", sendPhoneNumberVerificationCode);
telegramUserRouter.post("/check-code", checkAuthenticationCode);
telegramUserRouter.post("/check-password", checkAuthenticationPassword);

export default telegramUserRouter;
