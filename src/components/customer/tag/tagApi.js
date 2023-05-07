import express from "express";
import { verifyToken, verifyRole } from "../../../middlewares/index.js";

import { createTag, deleteTag } from "./tagController.js";

const tagRouter = express.Router({ mergeParams: true });

tagRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer_tag']
  next();
});

tagRouter.use("/", verifyToken.verifyToken());

tagRouter.post("/create", [verifyToken.verifyToken(true)], createTag);
tagRouter.delete(
  "/delete",
  [verifyToken.verifyToken(true), verifyRole.isManagerOrOwner],
  deleteTag
);

export default tagRouter;
