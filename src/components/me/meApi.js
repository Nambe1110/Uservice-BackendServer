import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { getMyProfile } from "./meController.js";

const meRouter = express.Router({ mergeParams: true });

meRouter.get("/", verifyToken, getMyProfile);

export default meRouter;
