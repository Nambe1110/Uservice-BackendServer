import generator from "generate-password";
import RoleEnum from "../../enums/Role.js";
import AppError from "../../utils/AppError.js";
import UserService from "../user/userService.js";
import CompanyModel from "./companyModel.js";
import { listCompany } from "../../utils/singleton.js";
import { ChatbotMode } from "../../constants.js";

export default class CompanyService {
  static async createCompany({ user, companyName, imageUrl = null }) {
    if (user.company_id != null) {
      throw new AppError("User already existed in another company.", 400);
    }
    const company = await CompanyModel.findOne({
      where: { name: companyName },
    });
    if (company) {
      throw new AppError("Tên công ty đã tồn tại", 400);
    }
    const inviteCode = generator.generate({
      length: 10,
      numbers: true,
    });
    const newCompany = await CompanyModel.create({
      name: companyName,
      image_url: imageUrl,
      invite_code: inviteCode,
    });
    await UserService.joinCompany({
      user,
      inviteCode,
      role: RoleEnum.Owner,
    });

    listCompany.set(newCompany.id, {
      telegramUserChannel: new Map(),
      telegramBotChannel: new Map(),
      EmailChannel: new Map(),
    });

    return newCompany.dataValues;
  }

  static async getCompanyById({ id, user }) {
    if (Number.parseInt(id, 10) !== user.company_id) {
      throw new AppError(
        "Công ty không tồn tại hoặc người dùng không thuộc công ty",
        401
      );
    }
    return CompanyModel.findByPk(id);
  }

  static async deleteCompany(user) {
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError("Công ty không tồn tại", 400);
    }
    if (user.role !== RoleEnum.Owner) {
      throw new AppError("Chỉ chủ sở hữu mới có thể xóa công ty", 400);
    }
    await company.destroy();
  }

  static async setChatbotMode(user, newMode) {
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError("Công ty không tồn tại", 400);
    }
    if (user.role === RoleEnum.Staff) {
      throw new AppError("Nhân viên không thể cài đặt chatbot", 400);
    }
    if (Object.values(ChatbotMode).includes(newMode)) {
      company.chatbot_mode = newMode;
    } else {
      throw new AppError("Loại cài đặt không hợp lệ", 400);
    }
    const newCompany = await company.save();
    return newCompany;
  }
}
