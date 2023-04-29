import express from "express";
import multer from "multer";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { verifyRole } from "../../../middlewares/index.js";
import { upload } from "./dataController.js";

const uploadStorage = multer();

const dataRouter = express.Router({ mergeParams: true });

dataRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

dataRouter.use("/", [verifyToken(), verifyRole.isOwner]);

dataRouter.post("/upload", uploadStorage.single("file"), upload);

export default dataRouter;
