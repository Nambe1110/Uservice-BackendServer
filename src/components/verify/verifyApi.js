import express from "express";
import { verifyAccount } from "./verifyController.js";

const verifyRouter = express.Router({ mergeParams: true });

verifyRouter.post("/account", verifyAccount);

export default verifyRouter;
