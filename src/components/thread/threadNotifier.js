import { StatusType } from "../../constants.js";
import logger from "../../config/logger.js";
import ThreadService from "./threadService.js";

export const threadNotifier = {};

export default async (io) => {
  threadNotifier.onNewMessage = async ({
    created,
    companyId,
    channelType,
    thread,
    customer,
    message,
    repliedMessage,
    sender,
    attachment,
  }) => {
    try {
      io.to(companyId).emit(created ? "new-message" : "update-message", {
        data: {
          thread: {
            id: thread.id,
            channel_id: thread.channel_id,
            type: thread.type,
            title: thread.title,
            image_url: thread.image_url,
            is_resolved: thread.is_resolved,
            is_autoreply_disabled: thread.is_autoreply_disabled,
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
              sender: sender
                ? {
                    id: sender.id,
                    first_name: sender.first_name,
                    last_name: sender.last_name,
                    image_url: sender.image_url,
                  }
                : null,
              attachment,
              replied_message: repliedMessage
                ? {
                    id: repliedMessage.id,
                    sender_type: repliedMessage.sender_type,
                    timestamp: repliedMessage.timestamp,
                    content: repliedMessage.content,
                    sender: {
                      id: repliedMessage.sender.id,
                      first_name: repliedMessage.sender.first_name,
                      last_name: repliedMessage.sender.last_name,
                      image_url: repliedMessage.sender.image_url,
                    },
                    attachment: repliedMessage.attachment,
                  }
                : null,
            },
          },
        },
      });
    } catch (error) {
      logger.error(error.message);
    }
  };

  threadNotifier.onMessageSendSucceeded = async ({
    companyId,
    channelType,
    thread,
    customer,
    message,
    repliedMessage,
    sender,
    attachment,
    socket,
    callback,
  }) => {
    try {
      ThreadService.updateResolvedStatus({
        threadId: thread.id,
        isResolved: false,
      });
      socket.broadcast.to(companyId).emit("new-message", {
        data: {
          thread: {
            id: thread.id,
            channel_id: thread.channel_id,
            type: thread.type,
            title: thread.title,
            image_url: thread.image_url,
            is_resolved: thread.is_resolved,
            is_autoreply_disabled: thread.is_autoreply_disabled,
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
              attachment,
              replied_message: repliedMessage
                ? {
                    id: repliedMessage.id,
                    sender_type: repliedMessage.sender_type,
                    timestamp: repliedMessage.timestamp,
                    content: repliedMessage.content,
                    sender: {
                      id: repliedMessage.sender.id,
                      first_name: repliedMessage.sender.first_name,
                      last_name: repliedMessage.sender.last_name,
                      image_url: repliedMessage.sender.image_url,
                    },
                    attachment: repliedMessage.attachment,
                  }
                : null,
            },
          },
        },
      });

      callback({
        status: StatusType.SUCCESS,
        data: {
          message_id: message.id,
          content: message.content,
          timestamp: message.timestamp,
          attachment,
        },
      });
    } catch (error) {
      logger.error(error.message);
      if (callback)
        callback({
          status: StatusType.ERROR,
          message: error.message,
        });
    }
  };
};
