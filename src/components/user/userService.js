import RoleEnum from "../../enums/Role.js";
import UserModel from "./userModel.js";
import CompanyModel from "../company/companyModel.js";
import AppError from "../../utils/AppError.js";

export default class UserService {
  static async joinCompany({ user, inviteCode, role = RoleEnum.Staff }) {
    if (user.company_id != null) {
      throw new AppError("Người dùng đã tồn tại trong một công ty khác", 403);
    }
    const company = await CompanyModel.findOne({
      where: { invite_code: inviteCode },
    });
    if (!inviteCode || !company) {
      throw new AppError("Mã mời không hợp lệ", 400);
    }

    // Update method of sequelize not return updated row so must find and save here.
    const currentUser = await UserModel.findOne({ where: { id: user.id } });
    currentUser.company_id = company.dataValues.id;
    currentUser.role = role;
    const updatedUser = await currentUser.save();

    delete updatedUser.dataValues.password;
    return updatedUser.dataValues;
  }

  static async verifyUser(user) {
    const currentUser = await UserModel.findOne({ where: { id: user.id } });
    if (!currentUser) {
      throw new AppError("Thông tin người dùng trong token không hợp lệ");
    }
    currentUser.is_verified = true;
    const verifiedUser = await currentUser.save();

    delete verifiedUser.dataValues.password;
    return verifiedUser.dataValues;
  }

  static async getUserByEmail(email) {
    const user = await UserModel.findOne({ where: { email } });
    if (!user) {
      throw new AppError("Email không tồn tại");
    }
    delete user.dataValues.password;
    return user.dataValues;
  }
}
