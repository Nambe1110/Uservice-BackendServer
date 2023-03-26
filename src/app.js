import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { readFileSync } from "fs";

import express from "express";
import { createServer } from "http";
import cors from "cors";
import swaggerUi from "swagger-ui-express";

import exampleRouter from "./components/example/exampleAPI.js";
import authRouter from "./components/auth/authAPI.js";
import companyRouter from "./components/company/companyApi.js";
import meRouter from "./components/me/meApi.js";
import verifyRouter from "./components/verify/verifyApi.js";
import userRouter from "./components/user/userApi.js";
import channelRouter from "./components/channel/channelApi.js";
import threadRouter from "./components/thread/threadApi.js";
import customerRouter from "./components/customer/customerApi.js";
import suggestionRouter from "./components/suggestion/suggestionApi.js";
import uploaderRouter from "./components/uploader/uploaderApi.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const fileUrl = new URL("../swagger_output.json", import.meta.url);
const swaggerFile = JSON.parse(readFileSync(fileUrl));

app.use("/doc", swaggerUi.serve, swaggerUi.setup(swaggerFile));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api/example", exampleRouter);
app.use("/api/auth", authRouter);
app.use("/api/company", companyRouter);
app.use("/api/me", meRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/user", userRouter);
app.use("/api/channel", channelRouter);
app.use("/api/thread", threadRouter);
app.use("/api/customer", customerRouter);
app.use("/api/suggestion", suggestionRouter);
app.use("/api/upload", uploaderRouter);

app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    data: {
      message: "API is working. Server is running perfectly",
    },
  });
});

export default httpServer;
