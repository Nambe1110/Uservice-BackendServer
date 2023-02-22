import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import registerExampleHandler from "./components/example/exampleHandler.js";

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

app.get('/', (req, res) => {
  res.status(200).send({
      status: "success",
      data: {
          message: "API is working. Server is running perfectly"
      }
  });
});


export default httpServer;
