import { Airgram } from "airgram";
import { getTdjson } from "prebuilt-tdlib";
import path from "path";
import AppError from "../../../../utils/AppError.js";
import {
  UserRole,
  ThreadType,
  SenderType,
  NumberOfChatsLimit,
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

export default class TelegramUserConnection {
  constructor({ phoneNumber, companyId }) {
    this.connection = null;
    this.phoneNumber = phoneNumber;
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
        String(this.phoneNumber)
      ),
      enableStorageOptimizer: true,
      logVerbosityLevel: 2,
    });
  }

  async sendAuthenticationCode() {
    if (this.connection) {
      if (this.isConnected) throw new AppError("Kênh đã tồn tại", 400);
      await this.connection.api.logOut();
    }
    await this.createConnection();

    const response = await this.connection.api.setAuthenticationPhoneNumber({
      phoneNumber: this.phoneNumber,
    });

    if (response.response._ === "error") {
      this.connection.api.logOut();
      throw new AppError("Số điện thoại không hợp lệ", 400);
    }

    const authInfo = await this.connection.api.getAuthorizationState();

    return {
      message:
        authInfo.response.codeInfo.type._ ===
        "authenticationCodeTypeTelegramMessage"
          ? "Mã xác thực đã được gửi đến ứng dụng Telegram của bạn"
          : "Mã xác thực đã được gửi đến số điện thoại của bạn",
    };
  }

  async checkAuthenticationCode({ code }) {
    if (!this.connection)
      throw new AppError("Vui lòng nhập số điện thoại", 401);

    if (this.isConnected) throw new AppError("Kênh đã tồn tại", 400);

    const checkCodeResponse = await this.connection.api.checkAuthenticationCode(
      {
        code,
      }
    );

    const authState = await this.connection.api.getAuthorizationState();

    if (checkCodeResponse.response._ === "error")
      throw new AppError("Mã xác thực không hợp lệ", 400);
    else if (authState.response._ === "authorizationStateWaitPassword")
      return {
        requiredPassword: true,
      };
    else if (authState.response._ === "authorizationStateReady") {
      this.isConnected = true;
      return {
        requiredPassword: false,
      };
    }

    throw new AppError(authState.response._, 400);
  }

  async checkAuthenticationPassword({ password }) {
    if (!this.connection)
      throw new AppError("Vui lòng nhập số điện thoại", 401);

    if (this.isConnected) throw new AppError("Kênh đã tồn tại", 400);

    const chekcPasswordResponse =
      await this.connection.api.checkAuthenticationPassword({
        password,
      });

    const authState = await this.connection.api.getAuthorizationState();

    if (chekcPasswordResponse.response._ === "error")
      throw new AppError("Mật khẩu không chính xác", 400);
    else if (authState.response._ === "authorizationStateReady") {
      this.isConnected = true;
      return;
    }

    logger.info(authState);
    throw new AppError(authState.response._, 400);
  }

  async setUpdateListener({ channelId }) {
    await this.connection.api.getChats({
      limit: NumberOfChatsLimit.TELEGRAM_USER,
    });

    this.connection.on("updateChatLastMessage", async ({ update }) => {
      if (update.lastMessage?.sendingState) return;
      const {
        chatId,
        id: messageId,
        content: messageContent,
        date,
        isOutgoing,
        replyToMessageId,
      } = update.lastMessage;
      const { userId } = update.lastMessage.senderId;

      const userInfo = await this.connection.api.getUser({
        userId,
      });

      /* eslint no-unused-vars: "off" */
      const {
        profilePhoto,
        username,
        phoneNumber,
        firstName,
        lastName,
        type: userType,
      } = userInfo.response;

      if (userType._ !== "userTypeRegular") return;

      const chatInfo = await this.connection.api.getChat({
        chatId,
      });
      const { title, type: chatType, photo: chatPhoto } = chatInfo.response;

      if (chatType._ !== "chatTypePrivate") return;

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

      let sender;
      let content;
      let attachment;
      let customer;
      let repliedMessage = null;

      if (isOutgoing) {
        [customer] = await CustomerService.getOrCreateCustomer({
          company_id: this.companyId,
          thread_id: thread.id,
        });

        sender = await UserService.getUser({
          companyId: this.companyId,
          role: UserRole.OWNER,
        });
      } else {
        [customer] = await CustomerService.getOrCreateCustomer({
          customer_api_id: userId,
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
        sender = customer;
      }

      const [message, created] = await MessageService.getOrCreateMessage(
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
        created,
        channelType: ChannelType.TELEGRAM_USER,
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
        channelType: ChannelType.TELEGRAM_USER,
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
      logger.info(message);
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
}
