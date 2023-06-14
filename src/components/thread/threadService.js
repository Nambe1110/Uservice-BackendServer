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
    customer,
  }) {
    // Convert string to boolean if isResolved is not null
    if (isResolved) {
      isResolved = isResolved.toLowerCase() === "true";
    }
    if (channel && Number.isInteger(parseInt(channel))) {
      channel = parseInt(channel);
    }
    let tagStr;
    if (tag) {
      tagStr = tag.map((t) => `tag_subscription.tag_id = ${t}`).join(" OR ");
    }

    const queryStr = `SELECT thread.*, 
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
      `;

    const channelStr = channel
      ? `
      JOIN  
      (
		    SELECT * FROM channel where channel.id = ${channel}
      )
      AS t1 ON t1.id = thread.channel_id
      `
      : `JOIN channel AS t1 ON t1.id = thread.channel_id 
      `;
    const customerStr = customer
      ? `AND t3.alias LIKE "%${customer}%"
      `
      : "";
    const isResolvedStr =
      isResolved != null
        ? ` AND thread.is_resolved = ${isResolved}
        `
        : "";
    const tagQuerryStr = tag
      ? `JOIN ( SELECT DISTINCT customer_id FROM tag_subscription where `.concat(
          tagStr,
          `) AS t5 ON t5.customer_id = t3.id
          `
        )
      : "";

    const filteredQuery = queryStr.concat(
      channelStr,
      tagQuerryStr,
      `
      WHERE t1.company_id = :companyId ${
        lastThreadId ? `AND t2.id < :lastThreadId` : ""
      } `,
      isResolvedStr,
      customerStr,
      `ORDER BY t2.id DESC
      LIMIT :limit;`
    );
    const threads = await sequelize.query(filteredQuery, {
      replacements: {
        companyId,
        lastThreadId,
        limit,
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
      `SELECT thread.id, thread.thread_api_id, 
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
