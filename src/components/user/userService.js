import RoleEnum from "../../enums/Role.js";
import UserModel from "./userModel.js";
import CompanyModel from "../company/companyModel.js";

export default class UserService {
  static async joinCompany({ user, inviteCode }) {
    if (inviteCode == null) {
      const error = new Error("Invalid invite code.");
      error.code = "400";
      throw error;
    }
    const updatedUser = await UserModel.update(
      { company_id: companyId, role },
      {
        where: { id: userId },
      }
    );

    return updatedUser;
  }
}
