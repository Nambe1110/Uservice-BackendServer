import express from "express";
import { verifyToken, verifyRole } from "../../../middlewares/index.js";

import { subscribeTag, unsubscribeTag } from "./tagSubscriptionController.js";

const tagRouter = express.Router({ mergeParams: true });

tagRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Tag_subscription']
  next();
});

tagRouter.use("/", verifyToken.verifyToken(true));

tagRouter.post("/subscribe", subscribeTag);
tagRouter.delete("/unsubscribe", verifyRole.isManagerOrOwner, unsubscribeTag);

export default tagRouter;
