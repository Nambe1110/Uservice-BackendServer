import { Server } from "socket.io";
import registerThreadHandler from "./components/thread/threadHandler.js";
import registerThreadNotifier from "./components/thread/threadNotifier.js";
import registerCompanyHandler from "./components/company/companyHandler.js";
import { verifyTokenSocket } from "./middlewares/verifyToken.js";

const io = new Server({
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.emit("connection", "connected");
});

const threadIo = io.of("/thread").use(verifyTokenSocket);
const companyIo = io.of("/company").use(verifyTokenSocket);

threadIo.on("connection", async (socket) => {
  await registerThreadHandler(threadIo, socket);
});
await registerThreadNotifier(threadIo);

companyIo.on("connection", async (socket) => {
  await registerCompanyHandler(companyIo, socket);
});

export default io;
