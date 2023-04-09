import express from "express";
import { createConnection } from "./telegramBotChannelController.js";
import { verifyToken } from "../../../../middlewares/verifyToken.js";

const telegramBotRouter = express.Router({ mergeParams: true });

telegramBotRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram Bot']
  next();
});
telegramBotRouter.use("/", verifyToken());

telegramBotRouter.post("/connect", createConnection);

export default telegramBotRouter;
