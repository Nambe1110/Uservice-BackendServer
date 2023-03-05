import express from "express";
import { verifyAccount } from "./verifyController.js";

const verifyRouter = express.Router({ mergeParams: true });

verifyRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Verify']
  next();
});

verifyRouter.post("/account", verifyAccount);

export default verifyRouter;
