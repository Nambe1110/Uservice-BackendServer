import express from "express";
import {
  loginValidator,
  signupValidator,
} from "../../middlewares/validators.js";
import { login, refreshToken, signup } from "./authController.js";

const authRouter = express.Router({ mergeParams: true });

authRouter.post("/login", loginValidator, login);
authRouter.post("/signup", signupValidator, signup);
authRouter.post("/refresh", refreshToken);
authRouter.post("/verify", refreshToken);
authRouter.get("/verify/", refreshToken);

export default authRouter;
