import express from "express";

const verifyRouter = express.Router({ mergeParams: true });

verifyRouter.post("/account");

export default verifyRouter;
