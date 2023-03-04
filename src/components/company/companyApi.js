import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";
import {
  createCompany,
  joinCompany,
  getCompanyMembers,
} from "./companyController.js";

const companyRouter = express.Router({ mergeParams: true });

companyRouter.post("/create", verifyToken, createCompany);
companyRouter.post("/join", verifyToken, joinCompany);
companyRouter.post("/members", verifyToken, getCompanyMembers);

export default companyRouter;
