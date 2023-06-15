import express from "express";
import {
  getCustomers,
  getCustomerById,
  updateCustomer,
} from "./customerController.js";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { verifyCustomerId } from "./customerMiddleware.js";
import tagSubscriptionRouter from "./tagSubscription/tagSubscriptionApi.js";

const customerRouter = express.Router({ mergeParams: true });

customerRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

customerRouter.use("/tag", tagSubscriptionRouter);

customerRouter.use("/", verifyToken(true));
customerRouter.get("/", getCustomers);

customerRouter.use("/:customerId", verifyCustomerId);
customerRouter.get("/:customerId", getCustomerById);
customerRouter.patch("/:customerId", updateCustomer);

export default customerRouter;
