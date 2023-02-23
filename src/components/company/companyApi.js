import express from "express";
import verifyToken from "../../middlewares/verifyToken.js";
import { createCompany, joinCompany } from "./companyController.js";

const companyRouter = express.Router({ mergeParams: true });

companyRouter.post("/create", verifyToken, createCompany);
companyRouter.post("/join", verifyToken, joinCompany);

export default companyRouter;
