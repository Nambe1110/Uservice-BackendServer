import generator from "generate-password";
import RoleEnum from "../../enums/Role.js";
import AppError from "../../utils/AppError.js";
import UserService from "../user/userService.js";
import CompanyModel from "./companyModel.js";

export default class CompanyService {
  static async createCompany(user, companyName, imageUrl = null) {
    if (user.company_id != null) {
      throw new AppError("User already existed in another company.", 403);
    }
    const inviteCode = generator.generate({
      length: 10,
      numbers: true,
    });
    const company = await CompanyModel.create({
      name: companyName,
      image_url: imageUrl,
      invite_code: inviteCode,
    });
    await UserService.joinCompany({
      user,
      inviteCode,
      role: RoleEnum.Owner,
    });
    return company.dataValues;
  }
}
