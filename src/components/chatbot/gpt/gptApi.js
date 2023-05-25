import express from "express";
import { verifyToken } from "../../../middlewares/verifyToken.js";
import { verifyRole } from "../../../middlewares/index.js";
import { changeModel, createFineTune } from "./gptController.js";

const gptRouter = express.Router({ mergeParams: true });

gptRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Customer']
  next();
});

gptRouter.use("/", [verifyToken()]);

gptRouter.get("/");
gptRouter.post("/create", verifyRole.isOwner, createFineTune);
gptRouter.patch("/change-model", verifyRole.isOwner, changeModel);

export default gptRouter;
