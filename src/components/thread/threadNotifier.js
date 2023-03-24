import ThreadService from "./threadService.js";
import UserService from "../user/userService.js";
import CustomerService from "../customer/customerService.js";
import MessageService from "../message/messageService.js";
import { SenderType, UserRole, StatusType } from "../../constants.js";
import logger from "../../config/logger/index.js";

export const threadNotifier = {};

export default async (io) => {
  threadNotifier.onNewMessage = async ({
    companyId,
    channelId,
    threadType,
    threadApiId,
    threadTitle,
    senderType,
    senderApiId,
    senderFirstName,
    senderLastName,
    messageApiId,
    messageContent,
    messageTimestamp,
  }) => {
    try {
      const [thread] = await ThreadService.getOrCreateThread({
        channel_id: channelId,
        thread_api_id: threadApiId,
        title: threadTitle,
        type: threadType,
      });

      let sender;
      let senderId;

      if (senderType === SenderType.STAFF) {
        sender = await UserService.getUser({
          companyId,
          role: UserRole.OWNER,
        });
      } else {
        [sender] = await CustomerService.getOrCreateCustomer({
          customer_api_id: senderApiId,
          company_id: companyId,
          thread_id: thread.id,
          first_name: senderFirstName,
          last_name: senderLastName,
        });
      }

      const [message, created] = await MessageService.getOrCreateMessage(
        {
          thread_id: thread.id,
          message_api_id: messageApiId,
        },
        {
          sender_type: senderType,
          sender_id: sender.id,
          content: messageContent,
          timestamp: messageTimestamp,
        }
      );

      if (!created) {
        message.content = messageContent;
        await message.save();
      }

      io.to(companyId).emit(created ? "new-message" : "update-message", {
        data: {
          thread_id: thread.id,
          message_id: message.id,
          content: messageContent,
          timestamp: messageTimestamp,
          sender_type: senderType,
          sender: {
            id: senderId,
            first_name: sender.first_name,
            last_name: sender.last_name,
            image_url: sender.image_url,
          },
        },
      });
    } catch (error) {
      logger.error(error.message);
    }
  };

  threadNotifier.onMessageSendSucceeded = async ({
    companyId,
    channelId,
    threadType,
    threadApiId,
    threadTitle,
    senderType,
    senderId,
    messageApiId,
    messageContent,
    messageTimestamp,
    socket,
    callback,
  }) => {
    try {
      const [thread] = await ThreadService.getOrCreateThread({
        channel_id: channelId,
        thread_api_id: threadApiId,
        title: threadTitle,
        type: threadType,
      });

      const [message] = await MessageService.getOrCreateMessage(
        {
          thread_id: thread.id,
          message_api_id: messageApiId,
        },
        {
          sender_type: senderType,
          sender_id: senderId,
          content: messageContent,
          timestamp: messageTimestamp,
        }
      );

      const user = await UserService.getUserById(senderId);

      socket.broadcast.to(companyId).emit("new-message", {
        data: {
          thread_id: thread.id,
          message_id: message.id,
          content: messageContent,
          timestamp: messageTimestamp,
          sender_type: senderType,
          sender: {
            id: senderId,
            first_name: user.first_name,
            last_name: user.last_name,
            image_url: user.image_url,
          },
        },
      });

      callback({
        status: StatusType.SUCCESS,
        data: {
          message_id: message.id,
          content: messageContent,
          timestamp: messageTimestamp,
        },
      });
    } catch (error) {
      logger.error(error.message);
    }
  };
};
