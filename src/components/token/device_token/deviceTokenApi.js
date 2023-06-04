import express from "express";
import { addDeviceToken } from "./deviceTokenController.js";
import { verifyToken } from "../../../middlewares/verifyToken.js";

const deviceTokenRouter = express.Router({ mergeParams: true });

deviceTokenRouter.use("/", verifyToken());
deviceTokenRouter.post("/", addDeviceToken);

export default deviceTokenRouter;
