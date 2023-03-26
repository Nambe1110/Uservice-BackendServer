import MessageModel from "./messageModel.js";
import sequelize from "../../config/database/index.js";

export default class ThreadService {
  static async getOrCreateMessage(where, defaults) {
    const [newMessage, created] = await MessageModel.findOrCreate({
      where,
      defaults,
    });

    return [newMessage, created];
  }

  static async getMessages({ companyId, threadId, lastMessageId, limit }) {
    const messages = await sequelize.query(
      `SELECT message.*,
        message.id AS 'sender.id',
        IF (message.sender_type = 'customer', t3.first_name, t4.first_name) AS 'sender.first_name',
        IF (message.sender_type = 'customer', t3.last_name, t4.last_name) AS 'sender.last_name',
        IF (message.sender_type = 'customer', t3.image_url, t4.image_url) AS 'sender.avatar_url'
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
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    return messages;
  }
}
