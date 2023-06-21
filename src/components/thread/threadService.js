import ThreadModel from "./threadModel.js";
import AttachmentModel from "../attachment/attachmentModel.js";
import MessageService from "../message/messageService.js";
import sequelize from "../../config/database/index.js";
import CompanyService from "../company/companyService.js";
import { NotificationCode } from "../../constants.js";
import { sendPushNotificationToUser } from "../../modules/pushNotification.js";

export default class ThreadService {
  static async getOrCreateThread(where, defaults) {
    const [newThread, created] = await ThreadModel.findOrCreate({
      where,
      defaults,
    });

    return [newThread, created];
  }

  static async getThread({ channelId, threadApiId }) {
    const thread = ThreadModel.findOne({
      where: {
        channel_id: channelId,
        thread_api_id: threadApiId,
      },
    });

    return thread;
  }

  static async getThreadById(id) {
    const threads = await sequelize.query(
      `SELECT thread.*, 
        t3.id AS 'customer.id',
        t3.image_url AS 'customer.image_url',
        t3.alias AS 'customer.alias',
        t3.first_name AS 'customer.first_name',
        t3.last_name AS 'customer.last_name',
        t3.profile AS 'customer.profile',
        t1.type AS 'channel_type',
        t1.company_id AS 'company_id',
        t2.id AS 'last_message.id',
        t2.sender_type AS 'last_message.sender_type', 
        t2.timestamp AS 'last_message.timestamp', 
        t2.content AS 'last_message.content',
        t2.sender_id AS 'last_message.sender.id',
        t2.replied_message_id AS 'last_message.replied_message_id',
        IF (t2.sender_type = 'customer', t3.first_name, t4.first_name) AS 'last_message.sender.first_name',
        IF (t2.sender_type = 'customer', t3.last_name, t4.last_name) AS 'last_message.sender.last_name',
        IF (t2.sender_type = 'customer', t3.image_url, t4.image_url) AS 'last_message.sender.image_url'
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
      LEFT JOIN customer AS t3 ON t3.thread_id = thread.id
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

    const getAttachments = async (thread) => {
      thread.last_message.attachment = await AttachmentModel.findAll({
        where: {
          message_id: thread.last_message.id,
        },
      });
    };

    await Promise.all(threads.map((thread) => getAttachments(thread)));

    const getRepliedMessage = async (thread) => {
      thread.last_message.replied_message = await MessageService.getMessageById(
        {
          id: thread.last_message.replied_message_id,
          threadId: thread.id,
        }
      );
    };

    await Promise.all(threads.map((thread) => getRepliedMessage(thread)));

    return threads.length > 0 ? threads[0] : null;
  }

  static async getThreads({
    companyId,
    lastThreadId,
    limit,
    isResolved,
    channel,
    tag,
    search,
  }) {
    let query = `SELECT thread.*, 
      t3.id AS 'customer.id',
      t3.image_url AS 'customer.image_url',
      t3.alias AS 'customer.alias',
      t3.first_name AS 'customer.first_name',
      t3.last_name AS 'customer.last_name',
      t3.profile AS 'customer.profile',
      t1.type AS 'channel_type',
      t1.company_id AS 'company_id',
      t2.id AS 'last_message.id',
      t2.sender_type AS 'last_message.sender_type', 
      t2.timestamp AS 'last_message.timestamp', 
      t2.content AS 'last_message.content',
      t2.sender_id AS 'last_message.sender.id',
      t2.replied_message_id AS 'last_message.replied_message_id',
      IF (t2.sender_type = 'customer', t3.first_name, t4.first_name) AS 'last_message.sender.first_name',
      IF (t2.sender_type = 'customer', t3.last_name, t4.last_name) AS 'last_message.sender.last_name',
      IF (t2.sender_type = 'customer', t3.image_url, t4.image_url) AS 'last_message.sender.image_url'
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
      LEFT JOIN customer AS t3 ON t3.thread_id = thread.id
      LEFT JOIN user AS t4 ON t4.id = t2.sender_id
      WHERE t1.company_id = :companyId`;

    if (lastThreadId) query += ` AND t2.id < :lastThreadId`;
    if (isResolved) {
      isResolved = isResolved.toLowerCase() === "true";
      query += ` AND thread.is_resolved = :isResolved`;
    }
    if (channel) query += ` AND t1.id = :channel`;
    if (search) {
      query += ` AND (t3.alias LIKE :search OR CONCAT(t3.first_name, " ", t3.last_name) LIKE :search`;
      query += ` OR thread.id IN (SELECT thread_id FROM message WHERE content LIKE :search))`;
    }
    if (tag)
      query += ` AND t3.id IN (SELECT customer_id FROM tag_subscription WHERE tag_id IN (:tag))`;

    query += ` ORDER BY t2.id DESC LIMIT :limit`;

    const threads = await sequelize.query(query, {
      replacements: {
        companyId,
        lastThreadId,
        limit,
        isResolved,
        channel,
        tag,
        search: `%${search}%`,
      },
      type: sequelize.QueryTypes.SELECT,
      nest: true,
    });

    const getAttachments = async (thread) => {
      thread.last_message.attachment = await AttachmentModel.findAll({
        where: {
          message_id: thread.last_message.id,
        },
      });
    };

    await Promise.all(threads.map((thread) => getAttachments(thread)));

    const getRepliedMessage = async (thread) => {
      thread.last_message.replied_message = await MessageService.getMessageById(
        {
          id: thread.last_message.replied_message_id,
          threadId: thread.id,
        }
      );
    };

    await Promise.all(threads.map((thread) => getRepliedMessage(thread)));

    return threads;
  }

  static async updateThread({
    threadId,
    title,
    imageUrl,
    isAutoreplyDisabled,
  }) {
    await ThreadModel.update(
      {
        title,
        image_url: imageUrl,
        is_autoreply_disabled: isAutoreplyDisabled,
      },
      {
        where: {
          id: threadId,
        },
      }
    );
  }

  static async tagUserToThread({ threadId, requester, userId }) {
    const company = await CompanyService.getCompanyById(requester.company_id);
    const thread = await this.getThreadById(threadId);

    await sendPushNotificationToUser({
      userId,
      data: {
        title: `${requester.first_name} ${requester.last_name} từ ${company.name}`,
        message: `${requester.first_name} vừa tag bạn vào cuộc hội thoại với ${thread.customer.alias}`,
        code: NotificationCode.TAG_USER_TO_THREAD,
        data: {
          thread_id: thread.id,
        },
      },
    });
  }

  static async updateResolvedStatus({ threadId, isResolved }) {
    await ThreadModel.update(
      {
        is_resolved: isResolved,
      },
      {
        where: {
          id: threadId,
        },
      }
    );
  }

  static async getThreadsForCampaign({ channelId, dayDiff }) {
    const threads = await sequelize.query(
      `SELECT thread.id, thread.thread_api_id, thread.is_resolved,
      t1.id AS 'customer.id'
      FROM thread 
      JOIN customer AS t1 ON thread.id = t1.thread_id 
      JOIN 
      (
        SELECT * FROM message
        WHERE id IN (
          SELECT MAX(id) FROM message
          WHERE sender_type = 'Customer'
          GROUP BY thread_id
        )
      ) AS t2 ON t2.thread_id = thread.id
      WHERE thread.channel_id = :channelId 
      ${dayDiff ? `AND DATEDIFF(CURDATE(), t2.created_at) < :dayDiff` : ""}`,
      {
        replacements: {
          channelId,
          dayDiff,
        },
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    await Promise.all(
      threads.map(async (thread, index) => {
        threads[index].customer.tags = await sequelize.query(
          `SELECT tag_id AS id
          FROM tag_subscription
          WHERE customer_id = :customerId`,
          {
            replacements: {
              customerId: thread.customer.id,
            },
            type: sequelize.QueryTypes.SELECT,
            nest: true,
          }
        );
      })
    );

    return threads;
  }
}
