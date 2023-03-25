import ThreadService from "./threadService.js";
import UserService from "../user/userService.js";
import CustomerService from "../customer/customerService.js";
import MessageService from "../message/messageService.js";
import AttachmentService from "../attachment/attachmentService.js";
import { SenderType, UserRole, StatusType } from "../../constants.js";
import logger from "../../config/logger/index.js";

export const threadNotifier = {};

export default async (io) => {
  threadNotifier.onNewMessage = async ({
    channelType,
    companyId,
    channelId,
    threadType,
    threadApiId,
    threadTitle,
    senderType,
    senderApiId,
    senderFirstName,
    senderLastName,
    senderPhoneNumber,
    senderProfile,
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

      const [customer] = await CustomerService.getOrCreateCustomer({
        customer_api_id: senderApiId,
        company_id: companyId,
        thread_id: thread.id,
      });

      customer.first_name = senderFirstName;
      customer.last_name = senderLastName;
      customer.phone_number = senderPhoneNumber;
      customer.profile = senderProfile;
      customer.alias = `${senderFirstName} ${senderLastName}`;

      await customer.save();

      let sender;

      if (senderType === SenderType.STAFF) {
        sender = await UserService.getUser({
          companyId,
          role: UserRole.OWNER,
        });
      } else {
        sender = customer;
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
          thread: {
            ...thread.dataValues,
            customer: {
              id: customer.id,
              image_url: customer.image_url,
              alias: customer.alias,
              first_name: customer.first_name,
              last_name: customer.last_name,
            },
            channel_type: channelType,
            last_message: {
              id: message.id,
              sender_type: message.sender_type,
              timestamp: message.timestamp,
              content: message.content,
              sender: {
                id: sender.id,
                first_name: sender.first_name,
                last_name: sender.last_name,
                image_url: sender.image_url,
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error(error.message);
    }
  };

  threadNotifier.onMessageSendSucceeded = async ({
    channelType,
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
    messageAttachment,
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

      await Promise.all(
        messageAttachment.map((attachment) =>
          AttachmentService.createAttachment(attachment)
        )
      );

      const user = await UserService.getUserById(senderId);
      const customer = await CustomerService.getCustomer({
        threadId: thread.id,
      });

      socket.broadcast.to(companyId).emit("new-message", {
        data: {
          thread: {
            ...thread.dataValues,
            customer: {
              id: customer.id,
              image_url: customer.image_url,
              alias: customer.alias,
              first_name: customer.first_name,
              last_name: customer.last_name,
            },
            channel_type: channelType,
            last_message: {
              id: message.id,
              sender_type: message.sender_type,
              timestamp: message.timestamp,
              content: message.content,
              sender: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                image_url: user.image_url,
              },
            },
          },
        },
      });

      callback({
        status: StatusType.SUCCESS,
        data: {
          message_id: message.id,
          content: messageContent,
          timestamp: messageTimestamp,
          attachment: messageAttachment,
        },
      });
    } catch (error) {
      logger.error(error.message);
      callback({
        status: StatusType.ERROR,
        message: error.message,
      });
    }
  };
};
