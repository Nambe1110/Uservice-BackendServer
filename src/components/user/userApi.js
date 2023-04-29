import express from "express";
import { verifyRole, verifyToken } from "../../middlewares/index.js";
import {
  getCompanyMembers,
  changeUserRole,
  getUserCompanyById,
  transferCompany,
} from "./userController.js";

const userRouter = express.Router({ mergeParams: true });

userRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['User']
  next();
});

userRouter.get(
  "/company-members",
  verifyToken.verifyToken(),
  getCompanyMembers
);
userRouter.get(
  "/company-members/:userId",
  verifyToken.verifyToken(),
  getUserCompanyById
);
userRouter.patch(
  "/role",
  [verifyToken.verifyToken(), verifyRole.isOwner],
  changeUserRole
);
userRouter.patch(
  "/transfer-company",
  [verifyToken.verifyToken(true), verifyRole.isOwner],
  transferCompany
);
export default userRouter;
