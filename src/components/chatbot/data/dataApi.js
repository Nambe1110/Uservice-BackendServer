import express from "express";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { verifyRole } from "../../../middlewares/index.js";
import { upload } from "./dataController.js";

const dataRouter = express.Router({ mergeParams: true });

dataRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

dataRouter.use("/", [verifyToken(), verifyRole.isOwner]);

dataRouter.post("/upload", upload);

export default dataRouter;
