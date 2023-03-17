import express from "express";
import { redirectToS3Url } from "./imageController.js";

const imageRouter = express.Router({ mergeParams: true });

imageRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['image']
  next();
});

imageRouter.get("/:name", redirectToS3Url);

export default imageRouter;
