import axios from "axios";
import AppError from "../../../utils/AppError.js";
import ViberChannelModel from "./viberChannelModel.js";
import {
  ThreadType,
  SenderType,
  ChannelType,
  AttachmentType,
  ChatbotMode,
  NotificationCode,
} from "../../../constants.js";
import logger from "../../../config/logger.js";
import { threadNotifier } from "../../thread/threadNotifier.js";
import ThreadService from "../../thread/threadService.js";
import UserService from "../../user/userService.js";
import CustomerService from "../../customer/customerService.js";
import MessageService from "../../message/messageService.js";
import AttachmentService from "../../attachment/attachmentService.js";
import ChannelService from "../channelService.js";
import CompanyService from "../../company/companyService.js";
import SuggestionService from "../../suggestion/suggestionService.js";
import S3 from "../../../modules/S3.js";
import { parseFullName } from "../../../utils/parser.js";
import { sendPushNotificationToCompany } from "../../../modules/pushNotification.js";

const pendingMessages = new Map();

export default class ViberService {
  static async getChannel({ token, companyId }) {
    const channel = await ViberChannelModel.findOne({
      where: {
        company_id: companyId,
        token,
      },
    });

    return channel;
  }

  static async connectChannel({ token, companyId }) {
    try {
      const webhookResponse = await axios.post(
        `${process.env.VIBER_API_URL}/pa/set_webhook`,
        {
          url: `${process.env.SERVER_URL}/api/channel/viber/webhook/${companyId}/${token}`,
          event_types: ["message", "delivered"],
          send_name: true,
          send_photo: true,
        },
        {
          headers: {
            "X-Viber-Auth-Token": token,
          },
        }
      );

      if (webhookResponse.data.status !== 0) {
        logger.error(webhookResponse.data);
        throw new AppError(webhookResponse.data.status_message, 500);
      }

      const accountInfoResponse = await axios.get(
        `${process.env.VIBER_API_URL}/pa/get_account_info`,
        {
          headers: {
            "X-Viber-Auth-Token": token,
          },
        }
      );

      const { name, icon } = accountInfoResponse.data;

      const [newViberChannel] = await ViberChannelModel.findOrCreate({
        where: {
          company_id: companyId,
          token,
        },
      });

      const [channel] = await ChannelService.findOrCreate({
        companyId,
        type: ChannelType.VIBER,
        channelDetailId: newViberChannel.id,
        name,
      });

      if (!channel.image_url && icon) {
        const iconUrl = await S3.uploadFromUrlToS3({
          url: icon,
          companyId,
        });

        channel.image_url = iconUrl;
        await channel.save();
      }

      return {
        channel,
        detail: newViberChannel,
      };
    } catch (error) {
      if (error.response)
        throw new AppError(
          error.response.data.error.message,
          error.response.status
        );
      else throw new Error(error.message);
    }
  }

  static async receiveMessage({ body, detailChannel }) {
    const {
      timestamp,
      sender: { id: senderId, name: senderName, avatar: senderAvatar },
      message_token,
      message,
    } = body;
    const { firstName, lastName } = parseFullName(senderName);
    const attachment = [];

    const channel = await ChannelService.getChannel({
      companyId: detailChannel.company_id,
      channelDetailId: detailChannel.id,
      type: ChannelType.VIBER,
    });

    const [thread] = await ThreadService.getOrCreateThread(
      {
        channel_id: channel.id,
        thread_api_id: senderId,
      },
      {
        title: senderName,
        type: ThreadType.PRIVATE,
      }
    );

    const [customer] = await CustomerService.getOrCreateCustomer(
      {
        thread_id: thread.id,
        company_id: detailChannel.company_id,
        customer_api_id: senderId,
      },
      {
        first_name: lastName,
        last_name: firstName,
        alias: senderName,
      }
    );

    if ((!thread.image_url || !customer.image_url) && senderAvatar) {
      const pictureUrl = await S3.uploadFromUrlToS3({
        url: senderAvatar,
        companyId: detailChannel.company_id,
      });

      if (!thread.image_url) {
        thread.image_url = pictureUrl;
        await thread.save();
      }

      if (!customer.image_url) {
        customer.image_url = pictureUrl;
        await customer.save();
      }
    }

    const [newMessage] = await MessageService.getOrCreateMessage(
      {
        thread_id: thread.id,
        message_api_id: message_token,
      },
      {
        sender_type: SenderType.CUSTOMER,
        sender_id: customer.id,
        timestamp,
      }
    );

    switch (message.type) {
      case "text": {
        const { text } = message;
        newMessage.content = text;
        await newMessage.save();
        break;
      }
      case "picture": {
        const { media, text } = message;
        const url = await S3.uploadFromUrlToS3({
          url: media,
          companyId: detailChannel.company_id,
        });
        const newAttachment = await AttachmentService.createAttachment({
          messageId: newMessage.id,
          url,
          type: AttachmentType.IMAGE,
        });
        attachment.push(newAttachment);
        newMessage.content = text;
        await newMessage.save();
        break;
      }
      case "video": {
        const { media } = message;
        const url = await S3.uploadFromUrlToS3({
          url: media,
          companyId: detailChannel.company_id,
        });
        const newAttachment = await AttachmentService.createAttachment({
          messageId: newMessage.id,
          url,
          type: AttachmentType.VIDEO,
        });
        attachment.push(newAttachment);
        break;
      }
      case "file": {
        const { media, file_name } = message;
        const url = await S3.uploadFromUrlToS3({
          url: media,
          companyId: detailChannel.company_id,
        });
        const newAttachment = await AttachmentService.createAttachment({
          messageId: newMessage.id,
          url,
          type: AttachmentType.FILE,
          name: file_name,
        });
        attachment.push(newAttachment);
        break;
      }
      case "contact": {
        const { name: contactName, phone_number: phoneNumber } =
          message.contact;
        newMessage.content = `Tên: ${contactName}\nSố điện thoại: ${phoneNumber}`;
        await newMessage.save();
        break;
      }
      case "location": {
        const { lat, lon } = message.location;
        newMessage.content = `Vị trí: https://www.google.com/maps/search/?api=1&query=${
          lat ? lat.toString() : "0.0"
        },${lon ? lon.toString() : "0.0"}`;
        await newMessage.save();
        break;
      }
      default:
        break;
    }

    await threadNotifier.onNewMessage({
      created: true,
      channelType: ChannelType.VIBER,
      companyId: detailChannel.company_id,
      thread,
      customer,
      message: newMessage,
      sender: customer,
      attachment,
    });

    const company = await CompanyService.getCompanyById(
      detailChannel.company_id
    );

    if (
      company.chatbot_mode !== ChatbotMode.AUTO_REPLY ||
      thread.is_autoreply_disabled
    ) {
      thread.is_resolved = false;
      await thread.save();

      setTimeout(async () => {
        try {
          const lastMessage = await MessageService.getLastMessage({
            threadId: thread.id,
          });

          if (message.id !== lastMessage.id) return;

          await sendPushNotificationToCompany({
            companyId: this.companyId,
            data: {
              title: `Tin nhắn mới từ ${customer.alias}`,
              message: message.content,
              code: NotificationCode.MESSAGE_FROM_CUSTOMER,
              data: {
                thread_id: thread.id,
              },
            },
          });
        } catch (error) {
          logger.error(error.message);
        }
      }, 1000);

      return;
    }

    setTimeout(async () => {
      try {
        const lastMessage = await MessageService.getLastMessage({
          threadId: thread.id,
        });

        if (newMessage.id !== lastMessage.id) return;

        const suggestions = await SuggestionService.generateSuggestion({
          numberOfResponse: 1,
          companyId: detailChannel.company_id,
          threadId: thread.id,
        });

        await this.sendMessage({
          companyId: detailChannel.company_id,
          channelDetailId: detailChannel.id,
          threadId: thread.id,
          threadApiId: thread.thread_api_id,
          senderType: SenderType.BOT,
          content: suggestions[0],
        });
      } catch (error) {
        logger.error(error.message);
      }
    }, 5000);
  }

  static async messageSendSucceeded({ body }) {
    const { message_token, timestamp } = body;
    const {
      companyId,
      thread,
      customer,
      senderType,
      sender,
      attachment,
      content,
      callback,
      socket,
    } = pendingMessages.get(message_token);

    const [message] = await MessageService.getOrCreateMessage(
      {
        thread_id: thread.id,
        message_api_id: message_token,
      },
      {
        sender_type: senderType,
        sender_id: sender?.id,
        content,
        timestamp,
      }
    );

    if (attachment.length > 0) {
      await AttachmentService.createAttachment({
        messageId: message.id,
        url: attachment[0].url,
        type: attachment[0].type,
        name: attachment[0].name,
      });
    }

    if (senderType === SenderType.STAFF) {
      await threadNotifier.onMessageSendSucceeded({
        companyId,
        channelType: ChannelType.VIBER,
        thread,
        customer,
        message,
        sender,
        attachment,
        callback,
        socket,
      });
    } else if (senderType === SenderType.BOT) {
      await threadNotifier.onNewMessage({
        created: true,
        channelType: ChannelType.VIBER,
        companyId,
        thread,
        customer,
        message,
        attachment,
      });
    }

    pendingMessages.delete(message_token);
  }

  static async sendMessage({
    companyId,
    channelDetailId,
    threadId,
    threadApiId,
    senderType = SenderType.STAFF,
    senderId,
    content,
    attachment = [],
    socket,
    callback,
  }) {
    try {
      if (attachment.length > 1)
        throw new Error("Viber does not support multiple attachments");

      if (!content && attachment.length === 0)
        throw new Error("Content or attachment must not be empty");

      if (
        content &&
        attachment.length > 0 &&
        attachment[0].type !== AttachmentType.IMAGE
      )
        throw new Error(
          "Viber does not support text with this attachment type"
        );

      const viberChannel = await ViberChannelModel.findOne({
        where: {
          company_id: companyId,
          id: channelDetailId,
        },
      });
      const { token } = viberChannel;
      const sender =
        senderType === SenderType.STAFF
          ? await UserService.getUserById(senderId)
          : {
              first_name: "BOT",
              last_name: "",
              image_url: null,
            };
      const thread = await ThreadService.getThreadById(threadId);
      const customer = await CustomerService.getCustomer({
        threadId: thread.id,
      });

      let messageResponse;

      if (attachment.length === 0) {
        messageResponse = await axios.post(
          `${process.env.VIBER_API_URL}/pa/send_message`,
          {
            receiver: threadApiId,
            min_api_version: 1,
            sender: {
              name: `${sender.first_name} ${sender.last_name}`,
              avatar: sender.image_url,
            },
            tracking_data: "tracking data",
            type: "text",
            text: content,
          },
          {
            headers: {
              "X-Viber-Auth-Token": token,
            },
          }
        );
      } else {
        switch (attachment[0].type) {
          case AttachmentType.IMAGE:
            messageResponse = await axios.post(
              `${process.env.VIBER_API_URL}/pa/send_message`,
              {
                receiver: threadApiId,
                min_api_version: 1,
                sender: {
                  name: `${sender.first_name} ${sender.last_name}`,
                  avatar: sender.image_url,
                },
                tracking_data: "tracking data",
                type: "picture",
                text: content,
                media: attachment[0].url,
              },
              {
                headers: {
                  "X-Viber-Auth-Token": token,
                },
              }
            );
            break;
          case AttachmentType.VIDEO:
            messageResponse = await axios.post(
              `${process.env.VIBER_API_URL}/pa/send_message`,
              {
                receiver: threadApiId,
                min_api_version: 1,
                sender: {
                  name: `${sender.first_name} ${sender.last_name}`,
                  avatar: sender.image_url,
                },
                tracking_data: "tracking data",
                type: "video",
                media: attachment[0].url,
              },
              {
                headers: {
                  "X-Viber-Auth-Token": token,
                },
              }
            );
            break;
          case AttachmentType.FILE: {
            const file = await axios.get(attachment[0].url, {
              responseType: "arraybuffer",
              responseEncoding: "binary",
            });

            messageResponse = await axios.post(
              `${process.env.VIBER_API_URL}/pa/send_message`,
              {
                receiver: threadApiId,
                min_api_version: 1,
                sender: {
                  name: `${sender.first_name} ${sender.last_name}`,
                  avatar: sender.image_url,
                },
                tracking_data: "tracking data",
                type: "file",
                media: attachment[0].url,
                size: file.data.length,
                file_name: attachment[0].name,
              },
              {
                headers: {
                  "X-Viber-Auth-Token": token,
                },
              }
            );
            break;
          }
          default:
            break;
        }
      }

      if (messageResponse.data.status !== 0) {
        logger.error(messageResponse.data);
        throw new Error(messageResponse.data.status_message);
      }

      pendingMessages.set(messageResponse.data.message_token, {
        companyId,
        thread,
        customer,
        senderType,
        sender,
        attachment,
        content,
        callback,
        socket,
      });
    } catch (error) {
      if (error.response) throw new Error(error.response.data.error.message);
      else throw new Error(error.message);
    }
  }
}
