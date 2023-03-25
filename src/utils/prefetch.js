import { listCompany } from "./singleton.js";
import CompanyModel from "../components/company/companyModel.js";
import TelegramUserService from "../components/channel/telegram/user/telegramUserChannelService.js";
import logger from "../config/logger/index.js";

export default async function prefetch() {
  try {
    const companies = await CompanyModel.findAll();

    const setConnection = async (companyId) => {
      const listChannel = {
        telegramUserChannel: new Map(),
        telegramBotChannel: new Map(),
        EmailChannel: new Map(),
      };

      const setTelegramOnnection = async (phoneNumber) => {
        const connection = await TelegramUserService.createConnectionFromDb({
          phoneNumber,
          companyId,
        });

        listChannel.telegramUserChannel.set(phoneNumber, {
          connection,
        });
      };

      const telegramUserChannels = await TelegramUserService.getChannels({
        companyId,
      });

      await Promise.all(
        telegramUserChannels.map((channel) =>
          setTelegramOnnection(channel.phone_number)
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
