import express from "express";
import telegramUserRouter from "./user/telegramUserChannelApi.js";

const telegramRouter = express.Router({ mergeParams: true });

telegramRouter.use("/user", telegramUserRouter);
telegramRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram']
  next();
});

export default telegramRouter;
