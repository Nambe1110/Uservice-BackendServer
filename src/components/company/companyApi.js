import express from "express";
import { upload, verifyToken, verifyRole } from "../../middlewares/index.js";

import {
  changeChatbotMode,
  createCompany,
  deleteCompany,
  getCompanyDetails,
  joinCompany,
  changeAvatar,
  updateProfile,
  getModels,
} from "./companyController.js";

const companyRouter = express.Router({ mergeParams: true });

companyRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Company']
  next();
});

companyRouter.use("/", verifyToken.verifyToken());

companyRouter.post("/create", createCompany);
companyRouter.post("/join", joinCompany);
companyRouter.get("/model", getModels);
companyRouter.get(
  "/:companyId",
  verifyToken.verifyToken(true),
  getCompanyDetails
);
companyRouter.put(
  "/change-chatbot-mode",
  verifyRole.isOwner,
  changeChatbotMode
);
companyRouter.delete("/delete", deleteCompany);
companyRouter.patch(
  "/avatar",
  [verifyToken.verifyToken(), upload.single("avatar")],
  changeAvatar
);
companyRouter.put(
  "/profile",
  [verifyToken.verifyToken(), verifyRole.isOwner],
  updateProfile
);

export default companyRouter;
