import express from "express";
import telegramUserRouter from "./user/telegramUserChannelApi.js";
import telegramBotRouter from "./bot/telegramBotChannelApi.js";

const telegramRouter = express.Router({ mergeParams: true });

telegramRouter.use("/user", telegramUserRouter);
telegramRouter.use("/bot", telegramBotRouter);
telegramRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram']
  next();
});

export default telegramRouter;
