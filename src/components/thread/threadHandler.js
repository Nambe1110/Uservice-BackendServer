import ThreadService from "./threadService.js";
import ChannelService from "../channel/channelService.js";
import TelegramUserChannelService from "../channel/telegram/user/telegramUserChannelService.js";
import TelegramBotChannelService from "../channel/telegram/bot/telegramBotChannelService.js";
import MessengerChannelService from "../channel/messenger/messengerChannelService.js";
import ViberChannelService from "../channel/viber/viberChannelService.js";
import InstagramChannelService from "../channel/instagram/instagramChannelService.js";
import { StatusType, ChannelType } from "../../constants.js";
import { listThread } from "../../utils/singleton.js";
import logger from "../../config/logger.js";

const getJoiners = (joiners) =>
  Array.from(joiners.values()).map((joiner) => ({
    id: joiner.id,
    first_name: joiner.firstName,
    last_name: joiner.lastName,
    image_url: joiner.imageUrl,
  }));

export const registerThreadHandler = async (io, socket) => {
  const { user } = socket;
  let joinedThreadId = null;
  socket.join(user.company_id);

  socket.on("send-message", async (data, callback) => {
    const { content, threadId, attachment = [], repliedMessageId } = data;

    try {
      const thread = await ThreadService.getThreadById(threadId);
      const channel = await ChannelService.getChannelById(thread.channel_id);

      if (channel.company_id !== user.company_id)
        throw new Error("Bạn không có quyền gửi tin nhắn.");

      const sendObject = {
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
      };

      switch (channel.type) {
        case ChannelType.TELEGRAM_USER:
          await TelegramUserChannelService.sendMessage(sendObject);
          break;
        case ChannelType.TELEGRAM_BOT:
          await TelegramBotChannelService.sendMessage(sendObject);
          break;
        case ChannelType.MESSENGER:
          await MessengerChannelService.sendMessage(sendObject);
          break;
        case ChannelType.INSTAGRAM:
          await InstagramChannelService.sendMessage(sendObject);
          break;
        case ChannelType.VIBER:
          await ViberChannelService.sendMessage(sendObject);
          break;
        default:
          throw new Error("Loại kênh không được hỗ trợ");
      }
    } catch (error) {
      if (callback)
        callback({
          status: StatusType.ERROR,
          message: error.message,
        });
    }
  });

  socket.on("join-thread", async (data, callback) => {
    try {
      const { threadId } = data;
      const thread = await ThreadService.getThreadById(threadId);

      if (!thread)
        return callback({
          status: StatusType.ERROR,
          message: "Thread not found",
        });

      if (threadId === joinedThreadId)
        return callback({
          status: StatusType.SUCCESS,
          message: "Join thread successfully",
        });

      if (joinedThreadId) {
        const joiners = listThread.get(joinedThreadId);

        const joiner = joiners.get(user.id);
        --joiner.socketCount;

        if (joiner.socketCount === 0) {
          joiners.delete(user.id);
          io.to(user.company_id).emit("update-joiner", {
            data: {
              thread_id: joinedThreadId,
              joiners: getJoiners(joiners),
            },
          });
        }
      }

      joinedThreadId = threadId;
      if (!listThread.has(threadId)) listThread.set(threadId, new Map());
      const joiners = listThread.get(threadId);

      if (!joiners.has(user.id))
        joiners.set(user.id, {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          imageUrl: user.image_url,
          socketCount: 0,
        });
      const joiner = joiners.get(user.id);
      ++joiner.socketCount;

      if (joiner.socketCount === 1) {
        io.to(user.company_id).emit("update-joiner", {
          data: {
            thread_id: threadId,
            joiners: getJoiners(joiners),
          },
        });
      }

      callback({
        status: StatusType.SUCCESS,
        message: "Join thread successfully",
      });
    } catch (error) {
      logger.error(error.message);
    }
  });

  socket.on("get-joiner", async (data, callback) => {
    try {
      const { threadId } = data;
      const thread = await ThreadService.getThreadById(threadId);

      if (!thread)
        return callback({
          status: StatusType.ERROR,
          message: "Thread not found",
        });

      if (!listThread.has(threadId)) listThread.set(threadId, new Map());
      const joiners = listThread.get(threadId);

      callback({
        status: StatusType.SUCCESS,
        data: {
          thread_id: threadId,
          joiners: getJoiners(joiners),
        },
      });
    } catch (error) {
      logger.error(error.message);
    }
  });

  socket.on("leave-thread", (data, callback) => {
    try {
      if (!joinedThreadId)
        return callback({
          status: StatusType.ERROR,
          message: "You haven't joined any thread",
        });

      const joiners = listThread.get(joinedThreadId);
      const joiner = joiners.get(user.id);
      --joiner.socketCount;

      if (joiner.socketCount === 0) {
        joiners.delete(user.id);
        io.to(user.company_id).emit("update-joiner", {
          data: {
            thread_id: joinedThreadId,
            joiners: getJoiners(joiners),
          },
        });
      }

      joinedThreadId = null;

      callback({
        status: StatusType.SUCCESS,
        message: "Leave thread successfully",
      });
    } catch (error) {
      logger.error(error.message);
    }
  });

  socket.on("disconnect", () => {
    try {
      if (joinedThreadId) {
        const joiners = listThread.get(joinedThreadId);
        const joiner = joiners.get(user.id);
        --joiner.socketCount;

        if (joiner.socketCount === 0) {
          joiners.delete(user.id);
          io.to(user.company_id).emit("update-joiner", {
            data: {
              thread_id: joinedThreadId,
              joiners: getJoiners(joiners),
            },
          });
        }
      }
    } catch (error) {
      logger.error(error.message);
    }
  });
};
