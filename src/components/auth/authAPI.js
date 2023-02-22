import express from "express";
import { login } from "./authController.js";

const authRouter = express.Router({ mergeParams: true });

authRouter.post("/login", login);
authRouter.get("/signup");

export default authRouter;
