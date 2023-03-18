import express from "express";
import { verifyToken } from "../../middlewares/index.js";

const suggestionRouter = express.Router({ mergeParams: true });

suggestionRouter.get("/generate", verifyToken.verifyToken);

export default suggestionRouter;
