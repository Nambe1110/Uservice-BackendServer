import { Server } from "socket.io";
import registerThreadHandler from "./components/thread/threadHandler.js";
import registerThreadNotifier from "./components/thread/threadNotifier.js";
import { verifyTokenSocket } from "./middlewares/verifyToken.js";

const io = new Server({
  /* options */
});

const threadIo = io.of("/thread").use(verifyTokenSocket);

threadIo.on("connection", async (socket) => {
  await registerThreadHandler(threadIo, socket);
});
await registerThreadNotifier(threadIo);

export default io;
