import express from "express";
import verifyToken from "../../middlewares/verifyToken.js";

const companyRouter = express.Router({ mergeParams: true });

companyRouter.post("/create", verifyToken);
companyRouter.post("/join", verifyToken);

export default companyRouter;
