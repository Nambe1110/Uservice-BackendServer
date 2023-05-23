import express from "express";
import { handleCallback, connectChannel } from "./viberChannelController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";

const viberRouter = express.Router({ mergeParams: true });

viberRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Telegram Bot']
  next();
});
viberRouter.use("/webhook/:companyId/:token", handleCallback);

viberRouter.use("/", verifyToken(true));
viberRouter.post("/connect", connectChannel);

export default viberRouter;
