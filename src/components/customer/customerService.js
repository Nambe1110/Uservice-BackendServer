import CustomerModel from "./customerModel.js";
import sequelize from "../../config/database/index.js";
import TagSubscriptionService from "./tagSubscription/tagSubscriptionService.js";

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
      WHERE customer.company_id = :companyId`;

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

  static async getCustomerById({ customerId }) {
    const customers = await sequelize.query(
      `SELECT DISTINCT customer.*,
        t4.company_id as 'company_id',
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
      WHERE customer.id = :customerId`,
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

  static async updateCustomer({
    customerId,
    image_url,
    alias,
    first_name,
    last_name,
    phone_number,
    email,
    birthday,
    address,
    note,
    profile,
    gender,
    vocative,
  }) {
    await CustomerModel.update(
      {
        customerId,
        image_url,
        alias,
        first_name,
        last_name,
        phone_number,
        email,
        birthday,
        address,
        note,
        profile,
        gender,
        vocative,
      },
      {
        where: {
          id: customerId,
        },
      }
    );
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
