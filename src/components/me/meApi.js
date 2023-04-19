import express from "express";
import {
  getProfile,
  changeAvatar,
  changePassword,
  leaveCompany,
} from "./meController.js";
import { upload, validators, verifyToken } from "../../middlewares/index.js";

const meRouter = express.Router({ mergeParams: true });

meRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Me']
  next();
});
meRouter.use("/", verifyToken.verifyToken());

meRouter.get("/", getProfile);
meRouter.post("/change-password", validators.passwordValidator, changePassword);
meRouter.put("/leave-company", leaveCompany);
meRouter.patch("/avatar", upload.single("avatar"), changeAvatar);

export default meRouter;
