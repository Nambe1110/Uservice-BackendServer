import ThreadModel from "./threadModel.js";
import sequelize from "../../config/database/index.js";

export default class ThreadService {
  static async getOrCreateThread(where, defaults) {
    const [newThread, created] = await ThreadModel.findOrCreate({
      where,
      defaults,
    });

    return [newThread, created];
  }

  static async getThreadById(id) {
    const thread = await sequelize.query(
      `SELECT thread.*, 
        t3.id AS 'customer.id',
        t3.image_url AS 'customer.image_url',
        t3.alias AS 'customer.alias',
        t3.first_name AS 'customer.first_name',
        t3.last_name AS 'customer.last_name',
        t3.profile AS 'customer.profile',
        t1.type AS 'channel_type',
        t2.id AS 'last_message.id',
        t2.sender_type AS 'last_message.sender_type', 
        t2.timestamp AS 'last_message.timestamp', 
        t2.content AS 'last_message.content',
        t2.sender_id AS 'last_message.sender.id',
        IF (t2.sender_type = 'customer', t3.first_name, t4.first_name) AS 'last_message.sender.first_name',
        IF (t2.sender_type = 'customer', t3.last_name, t4.last_name) AS 'last_message.sender.last_name',
        IF (t2.sender_type = 'customer', t3.image_url, t4.image_url) AS 'last_message.sender.avatar_url'
      FROM thread
      JOIN channel AS t1 ON t1.id = thread.channel_id 
      JOIN 
      (
        SELECT * FROM message
        WHERE id IN (
          SELECT MAX(id) FROM message
          GROUP BY thread_id
        )
      ) AS t2 ON t2.thread_id = thread.id
      LEFT JOIN customer AS t3 ON t3.id = t2.sender_id AND t2.sender_type = 'customer'
      LEFT JOIN user AS t4 ON t4.id = t2.sender_id AND t2.sender_type = 'staff'
      WHERE thread.id = :threadId`,
      {
        replacements: {
          threadId: id,
        },
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    return thread[0];
  }

  static async getThreads({ companyId, lastThreadId, limit }) {
    const threads = await sequelize.query(
      `SELECT thread.*, 
        t3.id AS 'customer.id',
        t3.image_url AS 'customer.image_url',
        t3.alias AS 'customer.alias',
        t3.first_name AS 'customer.first_name',
        t3.last_name AS 'customer.last_name',
        t3.profile AS 'customer.profile',
        t1.type AS 'channel_type',
        t2.id AS 'last_message.id',
        t2.sender_type AS 'last_message.sender_type', 
        t2.timestamp AS 'last_message.timestamp', 
        t2.content AS 'last_message.content',
        t2.sender_id AS 'last_message.sender.id',
        IF (t2.sender_type = 'customer', t3.first_name, t4.first_name) AS 'last_message.sender.first_name',
        IF (t2.sender_type = 'customer', t3.last_name, t4.last_name) AS 'last_message.sender.last_name',
        IF (t2.sender_type = 'customer', t3.image_url, t4.image_url) AS 'last_message.sender.avatar_url'
      FROM thread
      JOIN channel AS t1 ON t1.id = thread.channel_id 
      JOIN 
      (
        SELECT * FROM message
        WHERE id IN (
          SELECT MAX(id) FROM message
          GROUP BY thread_id
        )
      ) AS t2 ON t2.thread_id = thread.id
      LEFT JOIN customer AS t3 ON t3.id = t2.sender_id
      LEFT JOIN user AS t4 ON t4.id = t2.sender_id
      WHERE t1.company_id = :companyId ${
        lastThreadId ? `AND t2.id < :lastThreadId` : ""
      }
      ORDER BY t2.id DESC
      LIMIT :limit`,
      {
        replacements: {
          companyId,
          lastThreadId,
          limit,
        },
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    return threads;
  }
}
