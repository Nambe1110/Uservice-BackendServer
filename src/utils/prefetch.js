import { listCompany } from "./singleton.js";
import CompanyModel from "../components/company/companyModel.js";
import UserModel from "../components/user/userModel.js";
import TelegramUserChannelService from "../components/channel/telegram/user/telegramUserChannelService.js";
import TelegramBotChannelService from "../components/channel/telegram/bot/telegramBotChannelService.js";
import logger from "../config/logger/index.js";

export default async function prefetch() {
  try {
    const companies = await CompanyModel.findAll();

    companies.forEach((company) => {
      listCompany.set(company.id, {});
    });

    const setConnection = async (companyId) => {
      const listChannel = {
        telegramUserChannel: new Map(),
        telegramBotChannel: new Map(),
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

      listCompany.get(companyId).listChannel = listChannel;
    };

    const getEmployees = async (companyId) => {
      const employees = await UserModel.findAll({
        where: {
          company_id: companyId,
          is_verified: true,
          is_locked: false,
        },
      });

      listCompany.get(companyId).employees = new Map();

      employees.forEach((employee) => {
        listCompany.get(companyId).employees.set(employee.id, {
          id: employee.id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          email: employee.email,
          phoneNumber: employee.phone_number,
          role: employee.role,
          imageUrl: employee.image_url,
          disconnectTimestamp: employee.disconnect_timestamp,
          socketCount: 0,
        });
      });
    };

    await Promise.all(companies.map((company) => setConnection(company.id)));
    await Promise.all(companies.map((company) => getEmployees(company.id)));
  } catch (error) {
    logger.error(error.message);
  }
}
