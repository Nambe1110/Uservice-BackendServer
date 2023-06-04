import express from "express";
import deviceTokenRouter from "./device_token/deviceTokenApi.js";

const tokenRouter = express.Router({ mergeParams: true });

tokenRouter.use("/device", deviceTokenRouter);

export default tokenRouter;
