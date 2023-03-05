import express from "express";
import { verifyToken } from "../../middlewares/verifyToken.js";
import { isOwner } from "../../middlewares/isOwner.js";
import { getCompanyMembers, changeUserRole } from "./userController.js";

const userRouter = express.Router({ mergeParams: true });

userRouter.use("/", (req, res, next) => {
  // #swagger.tags = ['User']
  next();
});

userRouter.get("/company-members", verifyToken, getCompanyMembers);
userRouter.patch("/role", [verifyToken, isOwner], changeUserRole);

export default userRouter;
