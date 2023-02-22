import express from "express";

const authRouter = express.Router({ mergeParams: true });

authRouter.get("/login");
authRouter.get("/signup");

export default authRouter;
