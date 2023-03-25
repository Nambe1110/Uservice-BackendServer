import ThreadService from "./threadService.js";
import ChannelService from "../channel/channelService.js";
import TelegramUSerChannelService from "../channel/telegram/user/telegramUserChannelService.js";
import { StatusType, ChannelType } from "../../constants.js";

export default async (io, socket) => {
  const { user } = socket;
  socket.join(user.company_id);

  socket.on("send-message", async (data, callback) => {
    const { content, threadId, attachment } = data;

    try {
      const thread = await ThreadService.getThreadById(threadId);
      const channel = await ChannelService.getChannelById(thread.channel_id);

      if (channel.company_id !== user.company_id)
        throw new Error("You don't have permission to send message");

      if (channel.type === ChannelType.TELEGRAM_USER) {
        await TelegramUSerChannelService.sendMessage({
          companyId: user.company_id,
          channelDetailId: channel.channel_detail_id,
          threadId: thread.id,
          threadApiId: thread.thread_api_id,
          senderId: user.id,
          content,
          attachment,
          socket,
          callback,
        });
      }
    } catch (error) {
      callback({
        status: StatusType.ERROR,
        message: error.message,
      });
    }
  });
};
