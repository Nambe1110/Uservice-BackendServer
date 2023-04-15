import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";

import {
  createCompany,
  deleteCompany,
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
companyRouter.delete("/delete", deleteCompany);

export default companyRouter;
