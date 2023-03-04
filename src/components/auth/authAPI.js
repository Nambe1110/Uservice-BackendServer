import express from "express";
import {
  loginValidator,
  passwordValidator,
  signupValidator,
} from "../../middlewares/validators.js";
import {
  login,
  refreshToken,
  forgetPassword,
  signup,
  resetPassword,
} from "./authController.js";

const authRouter = express.Router({ mergeParams: true });

authRouter.post("/login", loginValidator, login);
authRouter.post("/signup", signupValidator, signup);
authRouter.post("/refresh", refreshToken);
authRouter.post("/forget-password", forgetPassword);
authRouter.post("/reset-password", passwordValidator, resetPassword);

export default authRouter;
