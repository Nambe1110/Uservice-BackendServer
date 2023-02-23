import express from "express";
import { login, refreshToken, signup } from "./authController.js";

const authRouter = express.Router({ mergeParams: true });

authRouter.post("/login", login);
authRouter.post("/signup", signup);
authRouter.post("/refresh", refreshToken);

export default authRouter;
