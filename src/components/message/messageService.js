import MessageModel from "./messageModel.js";
import AttachmentModel from "../attachment/attachmentModel.js";
import sequelize from "../../config/database/index.js";

export default class MessageService {
  static async getOrCreateMessage(where, defaults) {
    const [newMessage, created] = await MessageModel.findOrCreate({
      where,
      defaults,
    });

    return [newMessage, created];
  }

  static async getMessage({ messageApiId, threadId }) {
    const message = MessageModel.findOne({
      where: {
        message_api_id: messageApiId,
        thread_id: threadId,
      },
    });

    return message;
  }

  static async getMessageById({ id, threadId }) {
    const messages = await sequelize.query(
      `SELECT message.id, message.sender_type, message.timestamp, message.content, message.message_api_id,
        message.sender_id as 'sender.id',
        IF (message.sender_type = 'customer', t1.first_name, t2.first_name) AS 'sender.first_name',
        IF (message.sender_type = 'customer', t1.last_name, t2.last_name) AS 'sender.last_name',
        IF (message.sender_type = 'customer', t1.image_url, t2.image_url) AS 'sender.image_url'
      FROM message
      LEFT JOIN customer AS t1 ON t1.id = message.sender_id AND message.sender_type = 'customer'
      LEFT JOIN user AS t2 ON t2.id = message.sender_id AND message.sender_type = 'staff'
      WHERE message.id = :messageId AND message.thread_id = :threadId`,
      {
        replacements: {
          messageId: id,
          threadId,
        },
        mapToModel: true,
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    const getAttachments = async (message) => {
      const attachments = await AttachmentModel.findAll({
        where: {
          message_id: message.id,
        },
      });

      message.attachment = attachments;
    };

    await Promise.all(messages.map((message) => getAttachments(message)));

    return messages.length > 0 ? messages[0] : null;
  }

  static async getMessageByApiId({ apiId, threadId }) {
    const messages = await sequelize.query(
      `SELECT message.id, message.sender_type, message.timestamp, message.content, message.message_api_id,
        message.sender_id as 'sender.id',
        IF (message.sender_type = 'customer', t1.first_name, t2.first_name) AS 'sender.first_name',
        IF (message.sender_type = 'customer', t1.last_name, t2.last_name) AS 'sender.last_name',
        IF (message.sender_type = 'customer', t1.image_url, t2.image_url) AS 'sender.image_url'
      FROM message
      LEFT JOIN customer AS t1 ON t1.id = message.sender_id AND message.sender_type = 'customer'
      LEFT JOIN user AS t2 ON t2.id = message.sender_id AND message.sender_type = 'staff'
      WHERE message.message_api_id = :messageApiId AND message.thread_id = :threadId`,
      {
        replacements: {
          messageApiId: apiId,
          threadId,
        },
        mapToModel: true,
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    const getAttachments = async (message) => {
      const attachments = await AttachmentModel.findAll({
        where: {
          message_id: message.id,
        },
      });

      message.attachment = attachments;
    };

    await Promise.all(messages.map((message) => getAttachments(message)));

    return messages.length > 0 ? messages[0] : null;
  }

  static async getMessages({ companyId, threadId, lastMessageId, limit }) {
    const messages = await sequelize.query(
      `SELECT message.*,
        message.id AS 'sender.id',
        IF (message.sender_type = 'customer', t3.first_name, t4.first_name) AS 'sender.first_name',
        IF (message.sender_type = 'customer', t3.last_name, t4.last_name) AS 'sender.last_name',
        IF (message.sender_type = 'customer', t3.image_url, t4.image_url) AS 'sender.image_url'
      FROM message
      JOIN thread AS t1 ON t1.id = message.thread_id
      JOIN channel AS t2 ON t2.id = t1.channel_id
      LEFT JOIN customer AS t3 ON t3.id = message.sender_id AND message.sender_type = 'customer'
      LEFT JOIN user AS t4 ON t4.id = message.sender_id AND message.sender_type = 'staff'
      WHERE t2.company_id = :companyId AND message.thread_id = :threadId ${
        lastMessageId ? `AND message.id < :lastMessageId` : ""
      }
      ORDER BY message.id DESC
      LIMIT :limit`,
      {
        replacements: {
          companyId,
          threadId,
          lastMessageId,
          limit,
        },
        mapToModel: true,
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    const getAttachments = async (message) => {
      const attachments = await AttachmentModel.findAll({
        where: {
          message_id: message.id,
        },
      });

      message.attachment = attachments;
    };

    await Promise.all(messages.map((message) => getAttachments(message)));

    const getRepliedMessage = async (message) => {
      message.replied_message = await this.getMessageById({
        id: message.replied_message_id,
        threadId: message.thread_id,
      });
    };

    await Promise.all(messages.map((message) => getRepliedMessage(message)));

    return messages;
  }
}
