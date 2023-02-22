import pkg from "sequelize";
import sequelize from "../../config/database/index.js";

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
}
