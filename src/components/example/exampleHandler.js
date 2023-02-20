import logger from "../../config/logger/index.js";

export default async (io, socket) => {
  socket.on("example", (data, callback) => {
    logger.info(data);
    callback({ message: "example" });
  });
};
