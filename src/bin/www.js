import logger from "../config/logger/index.js";
import httpServer from "../app.js";
import io from "../socket.js";
import sequelize from "../config/database/index.js";
import prefetch from "../utils/prefetch.js";
import "../../swagger.js";

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(async () => {
    logger.info(`Database connection has been established successfully`);

    sequelize.sync({ logging: false });
    // await prefetch();

    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    io.attach(httpServer);
  })
  .catch((error) => {
    logger.error(error);
  });
