import express from "express";
import { getThreads, getThread, updateThread } from "./threadController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { verifyThreadId } from "./threadMiddleware.js";
import messageRouter from "../message/messageApi.js";

const threadRouter = express.Router({ mergeParams: true });

threadRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Thread']
  next();
});

threadRouter.use("/", verifyToken(true));
threadRouter.get("/", getThreads);

threadRouter.use("/:threadId", verifyThreadId);
threadRouter.get("/:threadId", getThread);
threadRouter.patch("/:threadId", updateThread);

threadRouter.use("/:threadId/message", messageRouter);

export default threadRouter;
