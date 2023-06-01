import express from "express";
import {
  registerWebhook,
  receiveMessage,
  connectPages,
} from "./instagramChannelController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";

const instagramRouter = express.Router({ mergeParams: true });

instagramRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram Bot']
  next();
});
instagramRouter.get("/webhook", registerWebhook);
instagramRouter.post("/webhook", receiveMessage);

instagramRouter.use("/", verifyToken(true));
instagramRouter.post("/connect", connectPages);

export default instagramRouter;
