import express from "express";
import telegramRouter from "./telegram/telegramChannelApi.js";
import { getChannels, deleteChannel } from "./channelController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const channelRouter = express.Router({ mergeParams: true });

channelRouter.use("/telegram", telegramRouter);
channelRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Channel']
  next();
});
channelRouter.use("/", verifyToken(true));

channelRouter.get("/", getChannels);
channelRouter.delete("/:channelId", deleteChannel);

export default channelRouter;
