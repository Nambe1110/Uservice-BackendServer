import express from "express";
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
} from "./customerController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";

const customerRouter = express.Router({ mergeParams: true });

customerRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

customerRouter.use("/", verifyToken(true));

customerRouter.get("/", getCustomers);
customerRouter.get("/:customerId", verifyToken(true), getCustomerById);
customerRouter.post("/:customerId", verifyToken(true), updateCustomer);

export default customerRouter;
