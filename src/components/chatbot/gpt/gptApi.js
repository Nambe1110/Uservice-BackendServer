import express from "express";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { verifyRole } from "../../../middlewares/index.js";
import { createFineTune } from "./gptController.js";

const gptRouter = express.Router({ mergeParams: true });

gptRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

gptRouter.use("/", [verifyToken(), verifyRole.isOwner]);

gptRouter.get("/");
gptRouter.post("/create", createFineTune);

export default gptRouter;
