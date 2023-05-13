import express from "express";
import { verifyToken, verifyRole } from "../../../middlewares/index.js";

import { subscribeTag, unsubscribeTag } from "./tagSubscriptionController.js";

const tagRouter = express.Router({ mergeParams: true });

tagRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Tag_subscription']
  next();
});

tagRouter.use("/", verifyToken.verifyToken());

tagRouter.post("/create", [verifyToken.verifyToken(true)], subscribeTag);
tagRouter.delete(
  "/delete",
  [verifyToken.verifyToken(true), verifyRole.isManagerOrOwner],
  unsubscribeTag
);

export default tagRouter;
