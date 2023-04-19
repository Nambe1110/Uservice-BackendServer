import { Airgram } from "airgram";
import { getTdjson } from "prebuilt-tdlib";
import path from "path";
import AppError from "../../../../utils/AppError.js";
import {
  UserRole,
  ThreadType,
  SenderType,
  ChannelType,
  AttachmentType,
} from "../../../../constants.js";
import logger from "../../../../config/logger/index.js";
import { threadNotifier } from "../../../thread/threadNotifier.js";
import ThreadService from "../../../thread/threadService.js";
import UserService from "../../../user/userService.js";
import CustomerService from "../../../customer/customerService.js";
import MessageService from "../../../message/messageService.js";
import AttachmentService from "../../../attachment/attachmentService.js";
import S3 from "../../../../modules/S3.js";

export default class TelegramBotConnection {
  constructor({ token, companyId }) {
    this.connection = null;
    this.token = token;
    this.companyId = companyId;
    this.isConnected = false;
    this.createdAt = null;
    this.pendingMessages = new Map();
    this.succeededMessages = new Set();
  }

  async createConnectionFromDb() {
    await this.createConnection();
    const authState = await this.connection.api.getAuthorizationState();
    if (authState.response._ === "authorizationStateReady") {
      this.isConnected = true;
    }
  }

  async createConnection() {
    const validDirName = this.token.replace(/[^a-zA-Z0-9]/g, "_");
    this.createdAt = new Date();
    this.isConnected = false;
    this.connection = new Airgram({
      apiId: process.env.APP_ID,
      apiHash: process.env.APP_HASH,
      command: getTdjson(),
      databaseDirectory: path.join(
        "db",
        "company",
        String(this.companyId),
        "connection",
        validDirName
      ),
      enableStorageOptimizer: true,
      logVerbosityLevel: 2,
    });
  }

  async checkAuthenticationToken() {
    if (this.isConnected) throw new AppError("Kênh đã tồn tại", 400);
    await this.createConnection();

    const checkTokenResponse =
      await this.connection.api.checkAuthenticationBotToken({
        token: this.token,
      });

    if (checkTokenResponse.response._ === "error") {
      await this.connection.api.logOut();
      logger.error(checkTokenResponse);
      throw new AppError("Token không hợp lệ", 400);
    }

    this.isConnected = true;
  }

  async setUpdateListener({ channelId }) {
    try {
      this.connection.on("updateMessageContent", async ({ update }) => {
        const { chatId, messageId, newContent: messageContent } = update;

        const thread = await ThreadService.getThread({
          channelId,
          threadApiId: chatId,
        });

        if (!thread) return;

        const message = await MessageService.getMessage({
          messageApiId: messageId,
          threadId: thread.id,
        });

        if (!message) return;

        const customer = await CustomerService.getCustomer({
          threadId: thread.id,
        });

        const attachment = await AttachmentService.getAttachments({
          messageId: message.id,
        });

        let content;
        let repliedMessage;
        let sender;

        if (message.senderType === SenderType.STAFF) {
          sender = await UserService.getUser({
            companyId: this.companyId,
            role: UserRole.OWNER,
          });
        } else {
          sender = customer;
        }

        if (message.replied_message_id) {
          repliedMessage = await MessageService.getMessageByApiId({
            apiId: message.replied_message_id,
            threadId: thread.id,
          });
        }

        switch (messageContent._) {
          case "messageText":
            content = messageContent.text.text;
            break;
          case "messageAudio":
          case "messageDocument":
          case "messagePhoto":
          case "messageVideo":
            content = messageContent.caption.text;
            break;
          default:
            return;
        }

        message.content = content;

        await message.save();

        await threadNotifier.onNewMessage({
          created: false,
          channelType: ChannelType.TELEGRAM_BOT,
          companyId: this.companyId,
          thread,
          customer,
          message,
          repliedMessage,
          sender,
          attachment: attachment ? [attachment] : [],
        });
      });

      this.connection.on("updateNewMessage", async ({ update }) => {
        if (update.message?.sendingState) return;
        const {
          chatId,
          id: messageId,
          content: messageContent,
          date,
          isOutgoing,
          replyToMessageId,
        } = update.message;

        const chatInfo = await this.connection.api.getChat({
          chatId,
        });
        const { title, type: chatType, photo: chatPhoto } = chatInfo.response;
        const { userId: customerId } = chatType;

        if (chatType._ !== "chatTypePrivate") return;

        const customerInfo = await this.connection.api.getUser({
          userId: customerId,
        });

        /* eslint no-unused-vars: "off" */
        const {
          profilePhoto,
          username,
          phoneNumber,
          firstName,
          lastName,
          type: userType,
        } = customerInfo.response;

        if (userType._ !== "userTypeRegular") return;

        if (this.succeededMessages.has(messageId)) {
          this.succeededMessages.delete(messageId);
          return;
        }

        const [thread] = await ThreadService.getOrCreateThread(
          {
            channel_id: channelId,
            thread_api_id: chatId,
          },
          {
            title,
            type: ThreadType.PRIVATE,
          }
        );

        if (!thread.image_url && chatPhoto) {
          const fileId = chatPhoto.big.id;
          const url = await this.#downloadFile(fileId);
          thread.image_url = url;
          await thread.save();
        }

        const [customer] = await CustomerService.getOrCreateCustomer({
          customer_api_id: customerId,
          company_id: this.companyId,
          thread_id: thread.id,
        });

        customer.first_name = firstName;
        customer.last_name = lastName;
        customer.phone_number = phoneNumber;
        customer.profile = username ? `t.me/${username}` : null;
        customer.alias = `${firstName} ${lastName}`;

        if (!customer.image_url && profilePhoto) {
          const fileId = profilePhoto.big.id;
          const url = await this.#downloadFile(fileId);
          customer.image_url = url;
        }

        await customer.save();

        let sender;
        let content;
        let attachment;
        let repliedMessage = null;

        if (isOutgoing) {
          sender = await UserService.getUser({
            companyId: this.companyId,
            role: UserRole.OWNER,
          });
        } else {
          sender = customer;
        }

        const [message] = await MessageService.getOrCreateMessage(
          {
            thread_id: thread.id,
            message_api_id: messageId,
          },
          {
            sender_type: isOutgoing ? SenderType.STAFF : SenderType.CUSTOMER,
            sender_id: sender.id,
            timestamp: date,
          }
        );

        switch (messageContent._) {
          case "messageText": {
            content = messageContent.text.text;
            break;
          }
          case "messageAudio": {
            content = messageContent.caption.text;
            const { fileName } = messageContent.audio;
            const fileId = messageContent.audio.audio.id;
            const url = await this.#downloadFile(fileId);

            attachment = await AttachmentService.createAttachment({
              messageId: message.id,
              url,
              type: AttachmentType.AUDIO,
              name: fileName,
            });

            break;
          }
          case "messageDocument": {
            content = messageContent.caption.text;
            const { fileName } = messageContent.document;
            const fileId = messageContent.document.document.id;
            const url = await this.#downloadFile(fileId);

            attachment = await AttachmentService.createAttachment({
              messageId: message.id,
              url,
              type: AttachmentType.FILE,
              name: fileName,
            });

            break;
          }
          case "messagePhoto": {
            content = messageContent.caption.text;
            const { sizes } = messageContent.photo;
            const fileId = sizes[sizes.length - 1].photo.id;
            const url = await this.#downloadFile(fileId);

            attachment = await AttachmentService.createAttachment({
              messageId: message.id,
              url,
              type: AttachmentType.IMAGE,
            });

            break;
          }
          case "messageVideo": {
            content = messageContent.caption.text;
            const { fileName } = messageContent.video;
            const fileId = messageContent.video.video.id;
            const url = await this.#downloadFile(fileId);

            attachment = await AttachmentService.createAttachment({
              messageId: message.id,
              url,
              type: AttachmentType.VIDEO,
              name: fileName,
            });

            break;
          }
          default:
            return;
        }

        message.content = content;

        if (replyToMessageId) {
          repliedMessage = await MessageService.getMessageByApiId({
            apiId: replyToMessageId,
            threadId: thread.id,
          });
        }

        message.replied_message_id = repliedMessage?.id;

        await message.save();

        await threadNotifier.onNewMessage({
          created: true,
          channelType: ChannelType.TELEGRAM_BOT,
          companyId: this.companyId,
          thread,
          customer,
          message,
          repliedMessage,
          sender,
          attachment: attachment ? [attachment] : [],
        });
      });

      this.connection.on("updateMessageSendSucceeded", async ({ update }) => {
        const { oldMessageId, message: newMessage } = update;
        const { chatId, id: messageId, date } = newMessage;
        this.succeededMessages.add(messageId);
        const {
          senderId,
          content,
          attachment,
          repliedMessage,
          callback,
          socket,
        } = this.pendingMessages.get(oldMessageId);
        const chatInfo = await this.connection.api.getChat({
          chatId,
        });
        const { title, type: chatType } = chatInfo.response;

        const [thread] = await ThreadService.getOrCreateThread(
          {
            channel_id: channelId,
            thread_api_id: chatId,
          },
          {
            title,
            type: ThreadType.PRIVATE,
          }
        );

        const [customer] = await CustomerService.getOrCreateCustomer({
          company_id: this.companyId,
          thread_id: thread.id,
        });

        const [message] = await MessageService.getOrCreateMessage(
          {
            thread_id: thread.id,
            message_api_id: messageId,
          },
          {
            sender_type: SenderType.STAFF,
            sender_id: senderId,
            content,
            timestamp: date,
            replied_message_id: repliedMessage?.id,
          }
        );

        const sender = UserService.getUserById(senderId);

        if (attachment.length > 0) {
          const { type, name, url } = attachment[0];
          attachment[0] = await AttachmentService.createAttachment({
            messageId: message.id,
            url,
            type,
            name,
          });
        }

        await threadNotifier.onMessageSendSucceeded({
          companyId: this.companyId,
          channelType: ChannelType.TELEGRAM_BOT,
          thread,
          customer,
          message,
          sender,
          attachment,
          callback,
          socket,
        });

        this.pendingMessages.delete(oldMessageId);
      });
    } catch (error) {
      logger.error(error.message);
    }
  }

  async sendMessage({
    senderId,
    chatId,
    repliedMessage,
    content,
    attachment,
    callback,
    socket,
  }) {
    await this.connection.api.getChat({ chatId });

    let message;

    if (attachment.length > 0) {
      const { type, url } = attachment[0];
      let inputMessageContent = {};

      switch (type) {
        case AttachmentType.IMAGE:
          inputMessageContent = {
            _: "inputMessagePhoto",
            photo: {
              _: "inputFileRemote",
              id: url,
            },
            caption: {
              _: "formattedText",
              text: content,
            },
          };
          break;
        case AttachmentType.VIDEO:
          inputMessageContent = {
            _: "inputMessageVideo",
            video: {
              _: "inputFileRemote",
              id: url,
            },
            caption: {
              _: "formattedText",
              text: content,
            },
          };
          break;
        case AttachmentType.FILE:
          inputMessageContent = {
            _: "inputMessageDocument",
            document: {
              _: "inputFileRemote",
              id: url,
            },
            caption: {
              _: "formattedText",
              text: content,
            },
          };
          break;
        case AttachmentType.AUDIO:
          inputMessageContent = {
            _: "inputMessageAudio",
            audio: {
              _: "inputFileRemote",
              id: url,
            },
            caption: {
              _: "formattedText",
              text: content,
            },
          };
          break;
        default:
          throw new Error("Invalid attachment type");
      }

      message = await this.connection.api.sendMessage({
        chatId,
        inputMessageContent,
        replyToMessageId: repliedMessage?.message_api_id,
      });
    } else {
      message = await this.connection.api.sendMessage({
        chatId,
        inputMessageContent: {
          _: "inputMessageText",
          text: {
            _: "formattedText",
            text: content,
          },
        },
        replyToMessageId: repliedMessage?.message_api_id,
      });
    }

    if (message.response._ === "error") {
      logger.error(message);
      throw new Error(message.response.message);
    }

    this.pendingMessages.set(message.response.id, {
      senderId,
      content,
      attachment,
      repliedMessage,
      callback,
      socket,
    });
  }

  async disconnect() {
    await this.connection.api.destroy();
  }

  async #downloadFile(fileId) {
    const fileResponse = await this.connection.api.downloadFile({
      fileId,
      priority: 32,
      offset: 0,
      limit: 0,
      synchronous: true,
    });
    const { path: filePath } = fileResponse.response.local;
    const url = await S3.pushDiskStorageFileToS3({
      filePath,
      companyId: this.companyId,
    });

    return url;
  }

  async getMe() {
    const me = await this.connection.api.getMe();
    return me.response;
  }
}
