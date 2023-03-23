import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";

import {
  createCompany,
  getCompanyDetails,
  joinCompany,
} from "./companyController.js";

const companyRouter = express.Router({ mergeParams: true });

companyRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Company']
  next();
});

companyRouter.use("/", verifyToken());

companyRouter.post("/create", createCompany);
companyRouter.post("/join", joinCompany);
companyRouter.get("/:id", getCompanyDetails);

export default companyRouter;
