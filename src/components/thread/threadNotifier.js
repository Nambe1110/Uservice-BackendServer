import { StatusType } from "../../constants.js";
import logger from "../../config/logger/index.js";

export const threadNotifier = {};

export default async (io) => {
  threadNotifier.onNewMessage = async ({
    created,
    companyId,
    channelType,
    thread,
    customer,
    message,
    sender,
    attachment,
  }) => {
    try {
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
              attachment,
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
    sender,
    attachment,
    socket,
    callback,
  }) => {
    try {
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
                id: sender.id,
                first_name: sender.first_name,
                last_name: sender.last_name,
                image_url: sender.image_url,
              },
              attachment,
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
      callback({
        status: StatusType.ERROR,
        message: error.message,
      });
    }
  };
};
