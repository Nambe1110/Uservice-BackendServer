import CustomerModel from "./customerModel.js";
import sequelize from "../../config/database/index.js";
import AppError from "../../utils/AppError.js";
import ThreadModel from "../thread/threadModel.js";
import ChannelModel from "../channel/channelModel.js";
import { ChannelType } from "../../constants.js";
import TagSubscriptionService from "./tagSubscription/tagSubscriptionService.js";
import TagSubscriptionModel from "./tagSubscription/tagSubscriptionModel.js";
import TagModel from "../company/tag/tagModel.js";

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

  static async getCustomers({ companyId, page, limit }) {
    const customers = await sequelize.query(
      `SELECT customer.*,
        t2.id AS 'last_message.id',
        t2.content AS 'last_message.content',
        t2.timestamp AS 'last_message.timestamp',
        t4.type AS 'channel.type',
        t4.name AS 'channel.name',
        t4.image_url AS 'channel.image_url',
        t4.id AS 'channel.id',
        t4.is_connected AS 'channel.is_connected'
      FROM customer
      JOIN 
      (
        SELECT * FROM message
        WHERE id IN (
          SELECT MAX(id) FROM message
          WHERE sender_type = 'customer'
          GROUP BY sender_id
        )
      ) AS t2 ON t2.sender_id = customer.id
      JOIN thread AS t3 ON t3.id = customer.thread_id
      JOIN channel AS t4 ON t4.id = t3.channel_id
      WHERE customer.company_id = :companyId
      LIMIT :limit
      OFFSET :offset`,
      {
        replacements: {
          companyId,
          limit,
          offset: (page - 1) * limit,
        },
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    const totalItems = await CustomerModel.count({
      where: { company_id: companyId },
    });

    return {
      total_items: totalItems,
      total_pages: Math.ceil(totalItems / limit),
      current_page: page,
      items: customers,
    };
  }

  static async getCustomerById({ currentUser, customerId }) {
    const customer = await CustomerModel.findOne({
      where: { id: customerId },
      include: [
        {
          model: TagSubscriptionModel,
          include: [TagModel],
        },
      ],
    });
    if (!customer) {
      throw new AppError("Khách hàng không tồn tại", 403);
    }
    if (currentUser.company_id !== customer.company_id) {
      throw new AppError("Khách hàng thuộc công ty khác", 403);
    }

    delete customer.dataValues.ThreadId;
    delete customer.dataValues.CompanyId;

    return customer;
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
    customer.dataValues.alias = updatedField.alias;
    customer.dataValues.birthday = updatedField.birthday;
    customer.dataValues.address = updatedField.address;
    customer.dataValues.note = updatedField.note;
    customer.dataValues.email = updatedField.email;
    if (channel.type !== ChannelType.TELEGRAM_USER) {
      customer.dataValues.phone_number = updatedField.phone_number;
    }
    const updatedCustomer = await customer.save();
    return updatedCustomer.dataValues;
  }
}
