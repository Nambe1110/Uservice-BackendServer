import express from "express";
import { getProfile, changeAvatar, changePassword } from "./meController.js";
import { upload, validators, verifyToken } from "../../middlewares/index.js";

const meRouter = express.Router({ mergeParams: true });

meRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Me']
  next();
});

meRouter.get("/", verifyToken.verifyToken(), getProfile);
meRouter.post(
  "/change-password",
  [verifyToken.verifyToken(), validators.passwordValidator],
  changePassword
);
meRouter.patch(
  "/avatar",
  [verifyToken.verifyToken(), upload.single("avatar")],
  changeAvatar
);

export default meRouter;
