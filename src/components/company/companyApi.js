import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";

import {
  changeChatbotMode,
  createCompany,
  deleteCompany,
  getCompanyDetails,
  joinCompany,
} from "./companyController.js";
import { verifyRole } from "../../middlewares/index.js";

const companyRouter = express.Router({ mergeParams: true });

companyRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Company']
  next();
});

companyRouter.use("/", verifyToken());

companyRouter.post("/create", createCompany);
companyRouter.post("/join", joinCompany);
companyRouter.get("/:id", getCompanyDetails);
companyRouter.put(
  "/change-chatbot-mode",
  verifyRole.isOwner,
  changeChatbotMode
);
companyRouter.delete("/delete", deleteCompany);

export default companyRouter;
