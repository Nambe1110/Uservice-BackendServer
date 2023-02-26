import RoleEnum from "../../enums/Role.js";
import UserModel from "./userModel.js";
import CompanyModel from "../company/companyModel.js";
import AppError from "../../utils/AppError.js";

export default class UserService {
  static async joinCompany({ user, inviteCode, role = RoleEnum.Staff }) {
    if (user.company_id != null) {
      throw new AppError("User already existed in another company", 403);
    }
    const company = await CompanyModel.findOne({
      where: { invite_code: inviteCode },
    });
    if (!inviteCode || !company) {
      throw new AppError("Invalid invite code", 400);
    }

    // Update method of sequelize not return updated row so must find and save here.
    const currentUser = await UserModel.findOne({ where: { id: user.id } });
    currentUser.company_id = company.dataValues.id;
    currentUser.role = role;
    const updatedUser = await currentUser.save();

    delete updatedUser.dataValues.password;
    return updatedUser.dataValues;
  }
}
