import express from "express";
import {
  getThreads,
  getThread,
  updateThread,
  tagUserToThread,
} from "./threadController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { verifyThreadId, handleTagUserToThread } from "./threadMiddleware.js";
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
threadRouter.post("/:threadId/tag", handleTagUserToThread, tagUserToThread);

threadRouter.use("/:threadId/message", messageRouter);

export default threadRouter;
