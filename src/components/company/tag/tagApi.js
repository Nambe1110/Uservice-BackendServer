import express from "express";
import { verifyToken, verifyRole } from "../../../middlewares/index.js";

import {
  createTag,
  getAllTagsOfCompany,
  getTagDetails,
  updateTagDetails,
  deleteTag,
} from "./tagController.js";

const tagRouter = express.Router({ mergeParams: true });

tagRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Tag']
  next();
});

tagRouter.use("/", verifyToken.verifyToken());

tagRouter.post("/create", [verifyToken.verifyToken(true)], createTag);
tagRouter.get("/all", verifyToken.verifyToken(true), getAllTagsOfCompany);
tagRouter.get("/:id", verifyToken.verifyToken(true), getTagDetails);
tagRouter.delete(
  "/delete",
  [verifyToken.verifyToken(true), verifyRole.isManagerOrOwner],
  deleteTag
);
tagRouter.put("/profile", [verifyToken.verifyToken(true)], updateTagDetails);

export default tagRouter;
