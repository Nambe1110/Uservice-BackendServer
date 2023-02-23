import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Company from "./companyModel.js";

const { QueryTypes } = pkg;

export default class CompanyService {
  static async getCompanyByInviteCode(inviteCode) {
    const company = await sequelize.query(
      "SELECT * FROM company WHERE company.invite_code = $invite_code",
      {
        type: QueryTypes.SELECT,
        bind: { invite_code: inviteCode },
      }
    );

    return company[0] ?? null;
  }

  static async insertCompany({ name, imageUrl = null, inviteCode }) {
    const company = await Company.create({
      name,
      image_url: imageUrl,
      invite_code: inviteCode,
    });
    return company.dataValues;
  }

  static async getCompanyByName(name) {
    const company = await sequelize.query(
      "SELECT * FROM company WHERE company.name = $name",
      {
        type: QueryTypes.SELECT,
        bind: { name },
      }
    );

    return company[0] ?? null;
  }
}
