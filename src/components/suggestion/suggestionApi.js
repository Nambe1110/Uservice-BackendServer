import express from "express";
import { verifyToken } from "../../middlewares/index.js";
import { generateSuggestion } from "./suggestionController.js";

const suggestionRouter = express.Router({ mergeParams: true });

suggestionRouter.get(
  "/generate",
  verifyToken.verifyToken(),
  generateSuggestion
);

export default suggestionRouter;
