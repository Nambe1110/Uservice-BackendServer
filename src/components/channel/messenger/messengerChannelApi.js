import express from "express";
import {
  receiveMessage,
  registerWebhook,
  connectPages,
} from "./messengerChannelController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";

const messengerRouter = express.Router({ mergeParams: true });

messengerRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram Bot']
  next();
});
messengerRouter.get("/webhook", registerWebhook);
messengerRouter.post("/webhook", receiveMessage);

messengerRouter.use("/", verifyToken(true));
messengerRouter.post("/connect", connectPages);

export default messengerRouter;
