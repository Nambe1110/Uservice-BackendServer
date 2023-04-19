import express from "express";
import { getCustomers, getCustomerById } from "./customerController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const customerRouter = express.Router({ mergeParams: true });

customerRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

customerRouter.use("/", verifyToken(true));

customerRouter.get("/", getCustomers);
customerRouter.get("/:customerId", verifyToken(), getCustomerById);

export default customerRouter;
