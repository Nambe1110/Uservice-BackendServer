import express from "express";
import multer from "multer";
import multerS3 from "multer-s3";
import s3 from "../../config/s3.js";
import { uploadFile } from "./uploaderController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

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

const uploaderRouter = express.Router({ mergeParams: true });

uploaderRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Uploader']
  next();
});

uploaderRouter.use("/", verifyToken(true));

uploaderRouter.post("/", upload.array("file", 10), uploadFile);

export default uploaderRouter;
