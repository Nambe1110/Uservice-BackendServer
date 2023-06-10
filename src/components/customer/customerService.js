import CustomerModel from "./customerModel.js";
import sequelize from "../../config/database/index.js";
import AppError from "../../utils/AppError.js";
import ThreadModel from "../thread/threadModel.js";
import ChannelModel from "../channel/channelModel.js";
import { ChannelType } from "../../constants.js";
import TagSubscriptionService from "./tagSubscription/tagSubscriptionService.js";
import logger from "../../config/logger.js";

export default class CustomerService {
  static async getOrCreateCustomer(where, defaults) {
    const [newCustomer, created] = await CustomerModel.findOrCreate({
      where,
      defaults,
    });

    return [newCustomer, created];
  }

  static async getCustomer({ threadId }) {
    const customer = await CustomerModel.findOne({
      where: {
        thread_id: threadId,
      },
    });

    return customer;
  }

  static async getCustomers({ companyId, page, limit, name, channel, order }) {
    const selectQuery = `SELECT DISTINCT customer.*,
        t2.id AS 'last_message.id',
        t2.content AS 'last_message.content',
        t2.timestamp AS 'last_message.timestamp',
        t4.type AS 'channel.type',
        t4.name AS 'channel.name',
        t4.image_url AS 'channel.image_url',
        t4.id AS 'channel.id',
        t4.is_connected AS 'channel.is_connected'
      FROM customer
      LEFT JOIN 
      (
        SELECT * FROM message
        WHERE id IN (
          SELECT MAX(id) FROM message
          WHERE sender_type = 'customer'
          GROUP BY sender_id
        )
      ) AS t2 ON t2.sender_id = customer.id
      LEFT JOIN thread AS t3 ON t3.id = customer.thread_id
      LEFT JOIN channel AS t4 ON t4.id = t3.channel_id
      WHERE customer.company_id = :companyId
      `;

    const nameQueryStr = name
      ? ` AND CONCAT(customer.first_name, " ", customer.last_name) LIKE "%${name}%"`
      : ``;
    const channelTypeQueryStr = channel ? ` AND t4.type = "${channel}"` : ``;
    let orderQueryStr = ``;
    if (order) {
      if (order.toUpperCase() === "DESC") {
        orderQueryStr = `
        ORDER BY CONCAT(customer.first_name, " ", customer.last_name) DESC`;
      } else if (order.toUpperCase() === "ASC") {
        orderQueryStr = `
        ORDER BY CONCAT(customer.first_name, " ", customer.last_name) ASC`;
      }
    }

    const getAllQuery = selectQuery.concat(
      nameQueryStr,
      channelTypeQueryStr,
      orderQueryStr,
      `;`
    );
    const filteredQuery = selectQuery.concat(
      nameQueryStr,
      channelTypeQueryStr,
      orderQueryStr,
      `
      LIMIT :limit
      OFFSET :offset;
      `
    );

    const allCustomers = await sequelize.query(getAllQuery, {
      replacements: {
        companyId,
        limit,
        offset: (page - 1) * limit,
      },
      type: sequelize.QueryTypes.SELECT,
      nest: true,
    });

    const customers = await sequelize.query(filteredQuery, {
      replacements: {
        companyId,
        limit,
        offset: (page - 1) * limit,
      },
      type: sequelize.QueryTypes.SELECT,
      nest: true,
    });

    const addTagSubscrition = async (customer) => {
      const tag_subscriptions =
        await TagSubscriptionService.getAllTagSubscriptionOfCustomer({
          customerId: customer.id,
        });
      customer.Tag_subscription = tag_subscriptions;
    };
    await Promise.all(customers.map((customer) => addTagSubscrition(customer)));

    const totalItems = allCustomers.length;

    return {
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / limit),
      current_page: page,
      items: customers,
    };
  }

  static async getCustomerById({ currentUser, customerId }) {
    const c = await CustomerModel.findByPk(customerId);
    if (!c) {
      throw new AppError("Khách hàng không tồn tại", 403);
    }
    if (currentUser.company_id !== c.company_id) {
      throw new AppError("Khách hàng thuộc công ty khác", 403);
    }

    const customers = await sequelize.query(
      `SELECT DISTINCT customer.*,
        t2.id AS 'last_message.id',
        t2.content AS 'last_message.content',
        t2.timestamp AS 'last_message.timestamp',
        t4.type AS 'channel.type',
        t4.name AS 'channel.name',
        t4.image_url AS 'channel.image_url',
        t4.id AS 'channel.id',
        t4.is_connected AS 'channel.is_connected'
      FROM customer
      LEFT JOIN 
      (
        SELECT * FROM message
        WHERE id IN (
          SELECT MAX(id) FROM message
          WHERE sender_type = 'customer'
          GROUP BY sender_id
        )
      ) AS t2 ON t2.sender_id = customer.id
      LEFT JOIN thread AS t3 ON t3.id = customer.thread_id
      LEFT JOIN channel AS t4 ON t4.id = t3.channel_id
      WHERE customer.id = :customerId
      `,
      {
        replacements: {
          customerId,
        },
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    const addTagSubscrition = async (customer) => {
      const tag_subscriptions =
        await TagSubscriptionService.getAllTagSubscriptionOfCustomer({
          customerId: customer.id,
        });
      customer.Tag_subscription = tag_subscriptions;
    };
    await Promise.all(customers.map((customer) => addTagSubscrition(customer)));

    return customers;
  }

  static async updateCustomer({ customerId, user, updatedField }) {
    const customer = await CustomerModel.findByPk(customerId);
    if (user.company_id !== customer.company_id) {
      throw new AppError("Khách hàng thuộc công ty khác", 403);
    }
    if (!customer) {
      throw new AppError("Khách hàng không tồn tại", 403);
    }
    const thread = await ThreadModel.findOne({
      where: { id: customer.dataValues.thread_id },
    });
    const channel = await ChannelModel.findOne({
      where: { id: thread.channel_id },
    });
    customer.alias = updatedField.alias;
    customer.birthday = updatedField.birthday;
    customer.address = updatedField.address;
    customer.note = updatedField.note;
    customer.email = updatedField.email;
    if (channel.type !== ChannelType.TELEGRAM_USER) {
      customer.phone_number = updatedField.phone_number;
    }
    const updatedCustomer = await customer.save();
    return updatedCustomer.dataValues;
  }

  static async replaceParams({ text, customerId }) {
    const customer = await CustomerModel.findByPk(customerId);
    const pattern =
      /(?:{full_name}|{last_name}|{alias}|{phone_number}|{birthday}|{address}|{email}|{profile}|{gender}|{vocative})/gi;
    const mapObject = {
      "{full_name}": `${customer.last_name} ${customer.first_name}`,
      "{last_name}": customer.first_name,
      "{alias}": customer.alias,
      "{phone_number}": customer.phone_number ?? "",
      "{birthday}": customer.birthday ?? "",
      "{address}": customer.address ?? "",
      "{email}": customer.email ?? "",
      "{profile}": customer.profile ?? "",
      "{gender}": customer.gender ?? "",
      "{vocative}": customer.vocative ?? "",
    };
    const replacedText = text.replace(pattern, (matched) => mapObject[matched]);
    return replacedText;
  }
}
