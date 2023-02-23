import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import RoleEnum from "../../enums/Role.js";
import User from "./userModel.js";

const { QueryTypes } = pkg;

export default class UserService {
  static async getAllUsers() {
    const users = await sequelize.query("SELECT * FROM user", {
      type: QueryTypes.SELECT,
    });

    return users;
  }

  static async getUserById(id) {
    const user = await sequelize.query(
      "SELECT * FROM user WHERE user.id = $id",
      {
        type: QueryTypes.SELECT,
        bind: { id },
      }
    );

    return user[0] ?? null;
  }

  static async getUserByEmail(email) {
    const user = await sequelize.query(
      "SELECT * FROM user WHERE user.email = $email",
      {
        type: QueryTypes.SELECT,
        bind: { email },
      }
    );

    return user[0] ?? null;
  }

  static async insertUser({ email, firstName, lastName, password }) {
    const user = await User.create({
      email,
      first_name: firstName,
      last_name: lastName,
      password,
    });

    return user.dataValues;
  }

  static async joinCompany({ userId, companyId, role = RoleEnum.Staff }) {
    const updatedUser = await User.update(
      { company_id: companyId, role },
      {
        where: { id: userId },
      }
    );

    return updatedUser;
  }
}
