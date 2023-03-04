import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { getProfile } from "./meController.js";

const meRouter = express.Router({ mergeParams: true });

meRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Me']
  next();
});

meRouter.get("/", verifyToken, getProfile);

export default meRouter;
