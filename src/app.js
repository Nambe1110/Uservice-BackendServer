import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { swaggerDocs } from "./config/Swagger/Swagger.js";
import registerExampleHandler from "./components/example/exampleHandler.js";
import authRouter from "./components/auth/authAPI.js";
import companyRouter from "./components/company/companyApi.js";
import meRouter from "./components/me/meApi.js";
import verifyRouter from "./components/verify/verifyApi.js";
import userRouter from "./components/user/userApi.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  /* options */
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const onConnection = async (socket) => {
  registerExampleHandler(io, socket);
};

io.on("connection", onConnection);

swaggerDocs(app, process.env.PORT);

app.use("/api/auth", authRouter);
app.use("/api/company", companyRouter);
app.use("/api/me", meRouter);
app.use("/api/verify", verifyRouter);
app.use("/api/user", userRouter);

app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    data: {
      message: "API is working. Server is running perfectly",
    },
  });
});

export default httpServer;
