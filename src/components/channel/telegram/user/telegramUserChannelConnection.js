import { Airgram } from "airgram";
import { getTdjson } from "prebuilt-tdlib";
import path from "path";
import AppError from "../../../../utils/AppError.js";
import {
  ThreadType,
  SenderType,
  NumberOfChatsLimit,
} from "../../../../constants.js";
import logger from "../../../../config/logger/index.js";
import { threadNotifier } from "../../../thread/threadNotifier.js";

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
        content,
        date,
        isOutgoing,
      } = update.lastMessage;
      const { userId } = update.lastMessage.senderId;

      const userInfo = await this.connection.api.getUser({
        userId,
      });

      /* eslint no-unused-vars: "off" */
      const {
        username,
        phoneNumber,
        firstName,
        lastName,
        type: userType,
      } = userInfo.response;
      // if (userType._ !== "userTypeRegular") return;

      const chatInfo = await this.connection.api.getChat({
        chatId,
      });
      const { title, type: chatType } = chatInfo.response;

      if (this.succeededMessages.has(messageId)) {
        this.succeededMessages.delete(messageId);
        return;
      }

      await threadNotifier.onNewMessage({
        companyId: this.companyId,
        channelId,
        threadType:
          chatType._ === "chatTypePrivate"
            ? ThreadType.PRIVATE
            : ThreadType.GROUP,
        threadApiId: chatId,
        threadTitle: title,
        senderType: isOutgoing ? SenderType.STAFF : SenderType.CUSTOMER,
        senderApiId: userId,
        senderFirstName: firstName,
        senderLastName: lastName,
        senderPhoneNumber: phoneNumber,
        senderProfile: `t.me/${username}`,
        messageApiId: messageId,
        messageContent: content._ === "messageText" ? content.text.text : "",
        messageTimestamp: date,
      });
    });

    this.connection.on("updateMessageSendSucceeded", async ({ update }) => {
      const { oldMessageId, message } = update;
      const { chatId, id: messageId, content, date } = message;
      this.succeededMessages.add(messageId);
      const { senderId, callback, socket } =
        this.pendingMessages.get(oldMessageId);
      const chatInfo = await this.connection.api.getChat({
        chatId,
      });
      const { title, type: chatType } = chatInfo.response;

      await threadNotifier.onMessageSendSucceeded({
        companyId: this.companyId,
        channelId,
        threadType:
          chatType._ === "chatTypePrivate"
            ? ThreadType.PRIVATE
            : ThreadType.GROUP,
        threadApiId: chatId,
        threadTitle: title,
        senderType: SenderType.STAFF,
        senderId,
        messageApiId: messageId,
        messageContent: content._ === "messageText" ? content.text.text : "",
        messageTimestamp: date,
        callback,
        socket,
      });

      this.pendingMessages.delete(oldMessageId);
    });
  }

  async sendMessage({ senderId, chatId, content, callback, socket }) {
    const message = await this.connection.api.sendMessage({
      chatId,
      inputMessageContent: {
        _: "inputMessageText",
        text: {
          _: "formattedText",
          text: content,
        },
      },
    });

    this.pendingMessages.set(message.response.id, {
      senderId,
      callback,
      socket,
    });
  }
}
