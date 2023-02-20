import logger from "../config/logger/index.js";
import app from "../app.js";
import sequelize from "../config/database/index.js";

const PORT = process.env.PORT || 3000;

sequelize
  .authenticate()
  .then(async () => {
    logger.info(`Database connection has been established successfully`);

    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });

    sequelize.sync({ logging: false });
  })
  .catch((error) => {
    logger.error(error);
  });
