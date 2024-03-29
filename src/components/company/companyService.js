import generator from "generate-password";
import bcrypt from "bcrypt";
import RoleEnum from "../../enums/Role.js";
import AppError from "../../utils/AppError.js";
import UserService from "../user/userService.js";
import CompanyModel from "./companyModel.js";
import { listCompany } from "../../utils/singleton.js";
import { ChatbotMode, UserRole } from "../../constants.js";
import S3 from "../../modules/S3.js";
import UserModel from "../user/userModel.js";

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
      length: 12,
      numbers: true,
      uppercase: true,
      lowercase: false,
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

    const currentUser = await UserModel.findByPk(user.id);
    currentUser.is_locked = false;
    await currentUser.save();

    listCompany.set(newCompany.id, {
      listChannel: {
        telegramUserChannel: new Map(),
        telegramBotChannel: new Map(),
      },
      employees: new Map(),
    });

    listCompany.get(newCompany.id)?.employees.set(user.id, {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: user.phone_number,
      role: user.role,
      imageUrl: user.image_url,
      socketCount: 0,
    });

    return newCompany.dataValues;
  }

  static async getCompanyById(companyId) {
    return CompanyModel.findByPk(companyId);
  }

  static async deleteCompany(user, password) {
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError("Công ty không tồn tại", 400);
    }
    if (user.role !== RoleEnum.Owner) {
      throw new AppError("Chỉ chủ sở hữu mới có thể xóa công ty", 400);
    }

    const currUser = await UserModel.findByPk(user.id);
    if (!password || !(await bcrypt.compare(password, currUser.password))) {
      throw new AppError("Mật khẩu không đúng", 400);
    }

    await company.destroy();
    listCompany.delete(company.id);
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

  static async changeAvatar({ currentUser, avatar }) {
    if (currentUser.role !== UserRole.OWNER) {
      throw new AppError(
        "Chỉ chủ sở hữu có thể thay đổi thông tin công ty",
        403
      );
    }

    const company = await CompanyModel.findByPk(currentUser.company_id);
    if (!company.image_url) {
      const avatarUrl = await S3.pushMemoryStorageFileToS3(avatar, "avatar");
      company.image_url = avatarUrl;
      const updatedCompany = await company.save();
      delete updatedCompany.dataValues.invite_code;
      return updatedCompany;
    }

    const strArr = company.image_url.split(
      "uservice-internal-s3-bucket.s3.ap-southeast-1.amazonaws.com/avatar/"
    );
    let oldAvatar;
    if (strArr) {
      oldAvatar = strArr[strArr.length - 1];
    }

    // Upload image to S3 and save the image url to DB
    const avatarUrl = await S3.pushMemoryStorageFileToS3(avatar, "avatar");
    company.image_url = avatarUrl;
    const updatedCompany = await company.save();
    delete updatedCompany.dataValues.invite_code;

    // Delete old image on S3
    if (oldAvatar && oldAvatar !== "uservice-default-company-avatar.png") {
      await S3.removeFromS3(`avatar/${oldAvatar}`);
    }

    return updatedCompany;
  }

  static async updateProfile({
    currentUser,
    name,
    email,
    phoneNumber,
    website,
  }) {
    if (currentUser.role !== UserRole.OWNER) {
      throw new AppError(
        "Chỉ chủ sở hữu có thể thay đổi thông tin công ty",
        403
      );
    }

    const company = await CompanyModel.findByPk(currentUser.company_id);
    const emailRegex = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/;
    const phoneNumberRegex =
      /^[+]?[(]?[0-9]{3}[)]?[-s.]?[0-9]{3}[-s.]?[0-9]{4,6}$/;
    const domainRegex =
      /^(?:[_a-z0-9](?:[_a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?)?$/;

    if (!name) {
      throw new AppError("Tên công ty không thể null");
    }
    if (email && !email.match(emailRegex)) {
      throw new AppError("Email không hợp lệ");
    }
    if (phoneNumber && !phoneNumber.match(phoneNumberRegex)) {
      throw new AppError("Số điện thoại không hợp lệ");
    }
    if (website && !website.match(domainRegex)) {
      throw new AppError("Địa chỉ website không hợp lệ");
    }

    company.name = name;
    company.email = email ?? "";
    company.phone_number = phoneNumber ?? "";
    company.website = website ?? "";
    const updatedCompany = await company.save();
    delete updatedCompany.dataValues.invite_code;

    return updatedCompany;
  }
}
