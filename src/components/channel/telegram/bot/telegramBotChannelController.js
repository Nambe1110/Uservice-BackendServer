import StatusEnum from "../../../../enums/Status.js";
import TelegramBotService from "./telegramBotChannelService.js";

export const createConnection = async (req, res) => {
  const { user } = req;

  try {
    const { token } = req.body;
    const response = await TelegramBotService.checkAuthenticationToken({
      token,
      companyId: user.company_id,
    });

    return res.status(200).json({ status: StatusEnum.Success, data: response });
  } catch (error) {
    return res
      .status(500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
