import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import registerExampleHandler from "./components/example/exampleHandler.js";
import authRouter from "./components/auth/authAPI.js";
import { sendEmail } from "./utils/Email.js";

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

app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    data: {
      message: "API is working. Server is running perfectly",
    },
  });
});

app.post("/email/send", async (req, res) => {
  try {
    sendEmail({
      text: "<h3>Welcome to Uservice Application</h3>",
      to: "namqn11102001@gmail.com",
      subject: "Uservice Application - Activate account",
      from: "uservice.system@gmail.com",
    });
    res.status(200).json({ message: "Email sent successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ errors: error.message });
  }
});

export default httpServer;
