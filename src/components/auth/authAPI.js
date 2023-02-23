import express from "express";
import { login, signup } from "./authController.js";

const authRouter = express.Router({ mergeParams: true });

authRouter.post("/login", login);
authRouter.post("/signup", signup);

export default authRouter;
