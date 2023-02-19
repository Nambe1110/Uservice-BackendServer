import express from "express";
import logger from "./config/logger/index.js";

const app = express();

app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    data: {
      message: "API is working. Server is running on port 7502",
    },
  });
});

const PORT = process.env.PORT || 7502;

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
