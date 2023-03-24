import express from "express";
import { createConnection } from "./telegramBotController.js";

const telegramBotRouter = express.Router({ mergeParams: true });

telegramBotRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram Bot']
  next();
});

telegramBotRouter.post("/connect", createConnection);

export default telegramBotRouter;
