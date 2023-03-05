import CustomerModel from "./customerModel.js";
import CompanyModel from "../company/companyModel.js";
import AppError from "../../utils/AppError.js";

export default class CustomerService {
  static async getCustomerByEmail(email) {
    const customer = await CustomerModel.findOne({ where: { email } });
    if (!customer) {
      throw new AppError("Email không tồn tại");
    }
    delete customer.dataValues.password;
    return customer.dataValues;
  }

  static async getCompanyCustomers({ user, limit, page }) {
    if (!user.company_id) {
      throw new AppError("Người dùng không thuộc một công ty nào.", 403);
    }
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError("Công ty không tồn tại", 400);
    }

    const allCompanyCustomers = await CustomerModel.findAndCountAll({
      where: { company_id: user.company_id },
    });
    const totalItems = allCompanyCustomers.count;
    const totalPages = Math.ceil(totalItems / limit);

    const companyCustomers = await CustomerModel.findAll({
      where: { company_id: user.company_id },
      attributes: {
        exclude: [
          "password",
          "google_token",
          "facebook_token",
          "createdAt",
          "updatedAt",
        ],
      },
      limit,
      offset: limit * (page - 1),
    });

    return {
      total_items: totalItems,
      total_pages: totalPages,
      items: companyCustomers,
    };
  }
}
