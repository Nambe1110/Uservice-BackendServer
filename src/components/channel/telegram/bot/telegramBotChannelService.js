import { listCompany } from "../../../../utils/singleton.js";
import { ChannelType, SenderType } from "../../../../constants.js";
import AppError from "../../../../utils/AppError.js";
import ChannelService from "../../channelService.js";
import MessageService from "../../../message/messageService.js";
import TelegramBotChannelModel from "./telegramBotChannelModel.js";
import TelegramBotConnection from "./telegramBotChannelConnection.js";
import ThreadService from "../../../thread/threadService.js";
import CustomerService from "../../../customer/customerService.js";
import { addJobsToMessageQueue } from "../../../../modules/queue.js";

export default class TelegramUserService {
  static async getChannels({ companyId }) {
    const channels = await TelegramBotChannelModel.findAll({
      where: {
        company_id: companyId,
      },
    });

    return channels;
  }

  static async checkAuthenticationToken({ token, companyId }) {
    if (
      await TelegramBotChannelModel.findOne({
        where: { token, company_id: companyId },
      })
    )
      throw new AppError("Kênh đã được kết nối", 400);

    const { telegramBotChannel } = listCompany.get(companyId).listChannel;
    const connection = new TelegramBotConnection({
      token,
      companyId,
    });

    await connection.checkAuthenticationToken();

    telegramBotChannel.set(token, {
      connection,
    });

    const [newTelegramBotChannel] = await TelegramBotChannelModel.findOrCreate({
      where: {
        company_id: companyId,
        token,
      },
    });
    const { name, username, imageUrl } = await connection.getMe();
    const [channel] = await ChannelService.findOrCreate({
      companyId,
      type: ChannelType.TELEGRAM_BOT,
      channelDetailId: newTelegramBotChannel.id,
      name,
      imageUrl,
      profile: `https://t.me/${username}`,
    });

    connection.setUpdateListener({
      channelId: channel.id,
    });

    return {
      channel,
      detail: newTelegramBotChannel,
    };
  }

  static async createConnectionFromDb({ token, companyId }) {
    const telegramBotChannel = await TelegramBotChannelModel.findOne({
      where: {
        company_id: companyId,
        token,
      },
    });

    const channel = await ChannelService.getChannel({
      companyId,
      type: ChannelType.TELEGRAM_BOT,
      channelDetailId: telegramBotChannel.id,
    });

    const connection = new TelegramBotConnection({
      companyId,
      token,
    });

    await connection.createConnectionFromDb();
    await connection.setUpdateListener({
      channelId: channel.id,
    });

    return connection;
  }

  static async sendMessage({
    companyId,
    channelDetailId,
    threadId,
    threadApiId,
    senderType = SenderType.STAFF,
    senderId,
    content,
    repliedMessageId,
    attachment,
    callback,
    socket,
  }) {
    let repliedMessage = null;

    if (repliedMessageId) {
      repliedMessage = await MessageService.getMessageById({
        id: repliedMessageId,
        threadId,
      });

      if (!repliedMessage) throw new Error("Replied message not found");
    }

    const channel = await TelegramBotChannelModel.findOne({
      where: {
        id: channelDetailId,
      },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    const { connection } = listCompany
      .get(companyId)
      .listChannel.telegramBotChannel.get(channel.token);

    await connection.sendMessage({
      senderId,
      senderType,
      chatId: threadApiId,
      repliedMessage,
      content,
      attachment,
      callback,
      socket,
    });
  }

  static async sendMessageInQueue({
    companyId,
    channelDetailId,
    threadId,
    threadApiId,
    senderType,
    content,
    attachment,
    customerId,
  }) {
    const replacedContent = await CustomerService.replaceParams({
      text: content,
      customerId,
    });

    await this.sendMessage({
      companyId,
      channelDetailId,
      threadId,
      threadApiId,
      senderType,
      content: replacedContent,
      attachment,
    });
  }

  static async sendCampaign({
    companyId,
    channelId,
    channelDetailId,
    content,
    attachment,
    dayDiff,
    tags,
    andFilter,
    skipUnresolvedThread,
  }) {
    const threads = await ThreadService.getThreadsForCampaign({
      channelId,
      skipUnresolvedThread,
      dayDiff,
      tags,
      andFilter,
    });

    await addJobsToMessageQueue(
      threads.map((thread) => ({
        type: ChannelType.TELEGRAM_BOT,
        data: {
          companyId,
          channelDetailId,
          threadId: thread.id,
          threadApiId: thread.thread_api_id,
          senderType: SenderType.CAMPAIGN,
          content,
          attachment,
          customerId: thread.customer.id,
        },
      }))
    );
  }
}
