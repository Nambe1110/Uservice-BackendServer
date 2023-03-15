import express from "express";
import { getProfile, changeAvatar } from "./meController.js";
import { upload, verifyToken } from "../../middlewares/index.js";

const meRouter = express.Router({ mergeParams: true });

meRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Me']
  next();
});

meRouter.get("/", verifyToken.verifyToken, getProfile);
meRouter.patch(
  "/avatar",
  [verifyToken.verifyToken, upload.single("avatar")],
  changeAvatar
);

export default meRouter;
