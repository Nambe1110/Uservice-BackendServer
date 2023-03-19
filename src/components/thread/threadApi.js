import express from "express";
import { getThreads } from "./threadController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import messageRouter from "../message/messageApi.js";

const threadRouter = express.Router({ mergeParams: true });

threadRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Thread']
  next();
});

threadRouter.use("/", verifyToken);
threadRouter.get("/", getThreads);

threadRouter.use("/:threadId/message", messageRouter);

export default threadRouter;
