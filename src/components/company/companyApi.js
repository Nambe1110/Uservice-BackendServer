import express from "express";
import { upload, verifyToken } from "../../middlewares/index.js";

import {
  createCompany,
  deleteCompany,
  getCompanyDetails,
  joinCompany,
  changeAvatar,
  updateProfile,
} from "./companyController.js";

const companyRouter = express.Router({ mergeParams: true });

companyRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Company']
  next();
});

companyRouter.use("/", verifyToken.verifyToken());

companyRouter.post("/create", createCompany);
companyRouter.post("/join", joinCompany);
companyRouter.get("/:id", getCompanyDetails);
companyRouter.delete("/delete", deleteCompany);
companyRouter.patch(
  "/avatar",
  [verifyToken.verifyToken(), upload.single("avatar")],
  changeAvatar
);
companyRouter.put("/profile", verifyToken.verifyToken(), updateProfile);

export default companyRouter;
