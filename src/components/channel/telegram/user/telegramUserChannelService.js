import { listCompany } from "../../../../utils/singleton.js";
import { ChannelType, SenderType } from "../../../../constants.js";
import AppError from "../../../../utils/AppError.js";
import ChannelService from "../../channelService.js";
import MessageService from "../../../message/messageService.js";
import TelegramUserChannelModel from "./telegramUserChannelModel.js";
import TelegramUserConnection from "./telegramUserChannelConnection.js";
import ThreadService from "../../../thread/threadService.js";
import CustomerService from "../../../customer/customerService.js";
import { addJobsToMessageQueue } from "../../../../modules/queue.js";

export default class TelegramUserChannelService {
  static async getChannels({ companyId }) {
    const channels = await TelegramUserChannelModel.findAll({
      where: {
        company_id: companyId,
      },
    });

    return channels;
  }

  static async sendAuthenticationCode({ phoneNumber, companyId }) {
    if (
      await TelegramUserChannelModel.findOne({
        where: { phone_number: phoneNumber, company_id: companyId },
      })
    )
      throw new AppError("Kênh đã được kết nối", 400);

    const { telegramUserChannel } = listCompany.get(companyId).listChannel;
    let connection = null;

    if (telegramUserChannel.has(phoneNumber)) {
      connection = telegramUserChannel.get(phoneNumber).connection;
    } else {
      connection = new TelegramUserConnection({
        phoneNumber,
        companyId,
      });

      telegramUserChannel.set(phoneNumber, {
        connection,
      });
    }

    const response = await connection.sendAuthenticationCode();
    return response;
  }

  static async checkAuthenticationCode({ phoneNumber, code, companyId }) {
    const { telegramUserChannel } = listCompany.get(companyId).listChannel;

    if (!telegramUserChannel.has(phoneNumber))
      throw new AppError("Vui lòng nhập số điện thoại", 404);

    const { connection } = telegramUserChannel.get(phoneNumber);
    const reponse = await connection.checkAuthenticationCode({ code });

    if (reponse.requiredPassword) return reponse;

    const [newTelegramUserChannel] =
      await TelegramUserChannelModel.findOrCreate({
        where: {
          company_id: companyId,
          phone_number: phoneNumber,
        },
      });
    const { name, username, imageUrl } = await connection.getMe();
    const [channel] = await ChannelService.findOrCreate({
      companyId,
      type: ChannelType.TELEGRAM_USER,
      channelDetailId: newTelegramUserChannel.id,
      name,
      imageUrl,
      profile: `https://t.me/${username ?? phoneNumber}`,
    });

    connection.setUpdateListener({
      channelId: channel.id,
    });

    return {
      channel,
      detail: newTelegramUserChannel,
    };
  }

  static async checkAuthenticationPassword({
    phoneNumber,
    password,
    companyId,
  }) {
    const { telegramUserChannel } = listCompany.get(companyId).listChannel;

    if (!telegramUserChannel.has(phoneNumber))
      throw new AppError("Vui lòng nhập số điện thoại", 404);

    const { connection } = telegramUserChannel.get(phoneNumber);
    await connection.checkAuthenticationPassword({ password });

    const [newTelegramUserChannel] =
      await TelegramUserChannelModel.findOrCreate({
        where: {
          company_id: companyId,
          phone_number: phoneNumber,
        },
      });

    const { name, username, imageUrl } = await connection.getMe();
    const [channel] = await ChannelService.findOrCreate({
      companyId,
      type: ChannelType.TELEGRAM_USER,
      channelDetailId: newTelegramUserChannel.id,
      name,
      imageUrl,
      profile: `https://t.me/${username ?? phoneNumber}`,
    });

    connection.setUpdateListener({
      channelId: channel.id,
    });

    return {
      channel,
      detail: newTelegramUserChannel,
    };
  }

  static async createConnectionFromDb({ phoneNumber, companyId }) {
    const telegramUserChannel = await TelegramUserChannelModel.findOne({
      where: {
        company_id: companyId,
        phone_number: phoneNumber,
      },
    });

    const channel = await ChannelService.getChannel({
      companyId,
      type: ChannelType.TELEGRAM_USER,
      channelDetailId: telegramUserChannel.id,
    });

    const connection = new TelegramUserConnection({
      phoneNumber,
      companyId,
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

    const channel = await TelegramUserChannelModel.findOne({
      where: {
        id: channelDetailId,
      },
    });

    if (!channel) {
      throw new Error("Channel not found");
    }

    const { connection } = listCompany
      .get(companyId)
      .listChannel.telegramUserChannel.get(channel.phone_number);

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
        type: ChannelType.TELEGRAM_USER,
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
