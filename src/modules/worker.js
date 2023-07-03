import { Worker } from "bullmq";
import logger from "../config/logger.js";
import { ChannelType } from "../constants.js";
import CampaignService from "../components/campaign/campaignService.js";
import TelegramUserChannelService from "../components/channel/telegram/user/telegramUserChannelService.js";
import TelegramBotChannelService from "../components/channel/telegram/bot/telegramBotChannelService.js";
import MessengerChannelService from "../components/channel/messenger/messengerChannelService.js";
import ViberChannelService from "../components/channel/viber/viberChannelService.js";
import InstagramChannelService from "../components/channel/instagram/instagramChannelService.js";

export const initilizeWorker = () => {
  /* eslint no-unused-vars: "off" */
  const campaignWorker = new Worker(
    "campaign",
    async (job) => {
      try {
        const { campaignId } = job.data;
        await CampaignService.sendCampaign(campaignId);
      } catch (error) {
        logger.error(error.message);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
    }
  );

  const messageWorker = new Worker(
    "message",
    async (job) => {
      try {
        const { type, data } = job.data;

        switch (type) {
          case ChannelType.TELEGRAM_USER:
            await TelegramUserChannelService.sendMessageInQueue(data);
            break;
          case ChannelType.TELEGRAM_BOT:
            await TelegramBotChannelService.sendMessageInQueue(data);
            break;
          case ChannelType.MESSENGER:
            await MessengerChannelService.sendMessageInQueue(data);
            break;
          case ChannelType.VIBER:
            await ViberChannelService.sendMessageInQueue(data);
            break;
          case ChannelType.INSTAGRAM:
            await InstagramChannelService.sendMessageInQueue(data);
            break;
          default:
            break;
        }
      } catch (error) {
        logger.error(error.message);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
      },
      concurrency: 50,
    }
  );
};
