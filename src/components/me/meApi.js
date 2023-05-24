import express from "express";
import {
  getProfile,
  changeAvatar,
  changePassword,
  leaveCompany,
  updateProfile,
} from "./meController.js";
import { upload, validators, verifyToken } from "../../middlewares/index.js";

const meRouter = express.Router({ mergeParams: true });

meRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Me']
  next();
});

meRouter.get("/", getProfile);
meRouter.post(
  "/change-password",
  [verifyToken.verifyToken(), validators.passwordValidator],
  changePassword
);
meRouter.put("/leave-company", verifyToken.verifyToken(true), leaveCompany);
meRouter.patch(
  "/avatar",
  [verifyToken.verifyToken(), upload.single("avatar")],
  changeAvatar
);
meRouter.put("/profile", verifyToken.verifyToken(), updateProfile);

export default meRouter;
