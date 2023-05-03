import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { verifyRole } from "../../../middlewares/index.js";
import s3 from "../../../config/s3.js";
import { uploadDataset } from "./dataController.js";

const dataRouter = express.Router({ mergeParams: true });

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      cb(null, `company/${file.originalname}`);
    },
  }),
  limit: {
    fileSize: 1024 * 1024 * 1024 * 2,
  },
});

dataRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

dataRouter.use("/", [verifyToken(), verifyRole.isOwner]);

dataRouter.post("/upload", upload.array("file", 10), uploadDataset);

export default dataRouter;
