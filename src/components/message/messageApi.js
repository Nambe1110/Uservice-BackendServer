import express from "express";
import { getMessages } from "./messageController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const messageRouter = express.Router({ mergeParams: true });

messageRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Message']
  next();
});

messageRouter.use("/", verifyToken(true));
messageRouter.get("/", getMessages);

export default messageRouter;
