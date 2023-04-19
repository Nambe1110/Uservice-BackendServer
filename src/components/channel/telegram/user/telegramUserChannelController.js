import { StatusType } from "../../../../constants.js";
import TelegramUserChannelService from "./telegramUserChannelService.js";

export const sendPhoneNumberVerificationCode = async (req, res) => {
  const { phoneNumber } = req.body;
  const { user } = req;

  try {
    const response = await TelegramUserChannelService.sendAuthenticationCode({
      phoneNumber,
      companyId: user.company_id,
    });

    return res
      .status(200)
      .json({ status: StatusType.SUCCESS, message: response.message });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const checkAuthenticationCode = async (req, res) => {
  const { phoneNumber, code } = req.body;
  const { user } = req;

  try {
    const response = await TelegramUserChannelService.checkAuthenticationCode({
      phoneNumber,
      code,
      companyId: user.company_id,
    });

    return res.status(200).json({ status: StatusType.SUCCESS, data: response });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const checkAuthenticationPassword = async (req, res) => {
  const { phoneNumber, password } = req.body;
  const { user } = req;

  try {
    const response =
      await TelegramUserChannelService.checkAuthenticationPassword({
        phoneNumber,
        password,
        companyId: user.company_id,
      });

    return res.status(200).json({ status: StatusType.SUCCESS, data: response });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
