import ThreadService from "./threadService.js";
import ChannelService from "../channel/channelService.js";
import TelegramUserChannelService from "../channel/telegram/user/telegramUserChannelService.js";
import TelegramBotChannelService from "../channel/telegram/bot/telegramBotChannelService.js";
import MessengerChannelService from "../channel/messenger/messengerChannelService.js";
import { StatusType, ChannelType } from "../../constants.js";

export default async (io, socket) => {
  const { user } = socket;
  socket.join(user.company_id);

  socket.on("send-message", async (data, callback) => {
    const { content, threadId, attachment = [], repliedMessageId } = data;

    try {
      const thread = await ThreadService.getThreadById(threadId);
      const channel = await ChannelService.getChannelById(thread.channel_id);

      if (channel.company_id !== user.company_id)
        throw new Error("You don't have permission to send message");

      switch (channel.type) {
        case ChannelType.TELEGRAM_USER:
          await TelegramUserChannelService.sendMessage({
            companyId: user.company_id,
            channelDetailId: channel.channel_detail_id,
            threadId: thread.id,
            threadApiId: thread.thread_api_id,
            senderId: user.id,
            content,
            repliedMessageId,
            attachment,
            socket,
            callback,
          });
          break;
        case ChannelType.TELEGRAM_BOT:
          await TelegramBotChannelService.sendMessage({
            companyId: user.company_id,
            channelDetailId: channel.channel_detail_id,
            threadId: thread.id,
            threadApiId: thread.thread_api_id,
            senderId: user.id,
            content,
            repliedMessageId,
            attachment,
            socket,
            callback,
          });
          break;
        case ChannelType.MESSENGER:
          await MessengerChannelService.sendMessage({
            companyId: user.company_id,
            channelDetailId: channel.channel_detail_id,
            threadId: thread.id,
            threadApiId: thread.thread_api_id,
            senderId: user.id,
            content,
            repliedMessageId,
            attachment,
            socket,
            callback,
          });
          break;
        default:
          throw new Error("Channel type not supported");
      }
    } catch (error) {
      if (callback)
        callback({
          status: StatusType.ERROR,
          message: error.message,
        });
    }
  });
};
