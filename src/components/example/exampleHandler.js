import logger from "../../config/logger.js";

export default async (io, socket) => {
  socket.on("example", (data, callback) => {
    logger.info(data);
    callback({ message: "example" });
  });
};
