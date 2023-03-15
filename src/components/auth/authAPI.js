import express from "express";
import { validators } from "../../middlewares/index.js";
import {
  login,
  refreshToken,
  forgetPassword,
  signup,
  resetPassword,
} from "./authController.js";

const authRouter = express.Router({ mergeParams: true });

authRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['Auth']
  next();
});

authRouter.post("/login", validators.loginValidator, login);
authRouter.post("/signup", validators.signupValidator, signup);
authRouter.post("/refresh", refreshToken);
authRouter.post("/forget-password", forgetPassword);
authRouter.post("/reset-password", validators.passwordValidator, resetPassword);

export default authRouter;
