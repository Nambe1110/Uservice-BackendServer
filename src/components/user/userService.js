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
    const updatedUser = await UserModel.update(
      { company_id: company.id, role },
      {
        where: { id: user.id },
      }
    );

    return updatedUser;
  }
}
