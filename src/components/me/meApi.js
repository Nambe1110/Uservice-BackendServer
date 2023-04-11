import express from "express";
import { getProfile, changeAvatar, changePassword } from "./meController.js";
import { upload, validators, verifyToken } from "../../middlewares/index.js";

const meRouter = express.Router({ mergeParams: true });

meRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Me']
  next();
});
meRouter.use("/", verifyToken.verifyToken());

meRouter.get("/", getProfile);
meRouter.post("/change-password", validators.passwordValidator, changePassword);
meRouter.post("/leave-company");
meRouter.patch("/avatar", upload.single("avatar"), changeAvatar);

export default meRouter;
