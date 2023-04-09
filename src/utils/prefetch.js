import { listCompany } from "./singleton.js";
import CompanyModel from "../components/company/companyModel.js";
import TelegramUserChannelService from "../components/channel/telegram/user/telegramUserChannelService.js";
import TelegramBotChannelService from "../components/channel/telegram/bot/telegramBotChannelService.js";
import logger from "../config/logger/index.js";

export default async function prefetch() {
  try {
    const companies = await CompanyModel.findAll();

    const setConnection = async (companyId) => {
      const listChannel = {
        telegramUserChannel: new Map(),
        telegramBotChannel: new Map(),
        emailChannel: new Map(),
      };

      // Prefetch Telegram User
      const setTelegramUserConnection = async (phoneNumber) => {
        const connection =
          await TelegramUserChannelService.createConnectionFromDb({
            phoneNumber,
            companyId,
          });

        listChannel.telegramUserChannel.set(phoneNumber, {
          connection,
        });
      };

      const telegramUserChannels = await TelegramUserChannelService.getChannels(
        {
          companyId,
        }
      );

      await Promise.all(
        telegramUserChannels.map((channel) =>
          setTelegramUserConnection(channel.phone_number)
        )
      );

      // Prefetch Telegram Bot
      const setTelegramBotConnection = async (token) => {
        const connection =
          await TelegramBotChannelService.createConnectionFromDb({
            token,
            companyId,
          });

        listChannel.telegramBotChannel.set(token, {
          connection,
        });
      };

      const telegramBotChannels = await TelegramBotChannelService.getChannels({
        companyId,
      });

      await Promise.all(
        telegramBotChannels.map((channel) =>
          setTelegramBotConnection(channel.token)
        )
      );

      listCompany.set(companyId, {
        listChannel,
      });
    };

    await Promise.all(companies.map((company) => setConnection(company.id)));
  } catch (error) {
    logger.error(error.message);
  }
}
