import express from "express";
import telegramRouter from "./telegram/telegramChannelApi.js";
import messengerRouter from "./messenger/messengerChannelApi.js";
import viberRouter from "./viber/viberChannelApi.js";
import instagramRouter from "./instagram/instagramChannelApi.js";
import { getChannels, deleteChannel } from "./channelController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const channelRouter = express.Router({ mergeParams: true });

channelRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Channel']
  next();
});
channelRouter.use("/telegram", telegramRouter);
channelRouter.use("/messenger", messengerRouter);
channelRouter.use("/instagram", instagramRouter);
channelRouter.use("/viber", viberRouter);
channelRouter.use("/", verifyToken(true));

channelRouter.get("/", getChannels);
channelRouter.delete("/:channelId", deleteChannel);

export default channelRouter;
