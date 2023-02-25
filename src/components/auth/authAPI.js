import express from "express";
import {
  loginValidator,
  signupValidator,
} from "../../middlewares/validators.js";
import { login, refreshToken, signup } from "./authController.js";

const authRouter = express.Router({ mergeParams: true });

authRouter.post("/login", login);
authRouter.post("/signup", signupValidator, signup);
authRouter.post("/refresh", loginValidator, refreshToken);

export default authRouter;
