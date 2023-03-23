import StatusEnum from "../../../../enums/Status.js";
import TelegramBotService from "./telegramBotService.js";
import logger from "../../../../config/logger/index.js";

export const createConnection = async (req, res) => {
  try {
    const { token } = req.body;
    const connection = await TelegramBotService.createConnection(token);
    logger.info(connection);
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: connection });
  } catch (error) {
    return res
      .status(500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
