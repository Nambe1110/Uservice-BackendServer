import express from "express";
import { verifyToken } from "../../middlewares/index.js";

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

companyRouter.post("/create", verifyToken.verifyToken, createCompany);
companyRouter.post("/join", verifyToken.verifyToken, joinCompany);
companyRouter.get("/:id", verifyToken.verifyToken, getCompanyDetails);

export default companyRouter;
