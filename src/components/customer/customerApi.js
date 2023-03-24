import express from "express";
import { verifyToken } from "../../middlewares/index.js";
import { getCompanyCustomers } from "./customerController.js";

const customerRouter = express.Router({ mergeParams: true });

customerRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

customerRouter.get(
  "/company-customers",
  verifyToken.verifyToken,
  getCompanyCustomers
);

export default customerRouter;
