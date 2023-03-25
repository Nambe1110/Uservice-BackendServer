import CustomerModel from "./customerModel.js";
import sequelize from "../../config/database/index.js";

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
        t2.timestamp AS 'last_message.timestamp'
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
      WHERE customer.is_archived = 0 AND customer.company_id = :companyId
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
}
