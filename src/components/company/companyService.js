import generator from "generate-password";
import RoleEnum from "../../enums/Role.js";
import AppError from "../../utils/AppError.js";
import UserService from "../user/userService.js";
import CompanyModel from "./companyModel.js";
import { listCompany } from "../../utils/singleton.js";
import S3 from "../../modules/S3.js";
import { UserRole } from "../../constants.js";

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

  static async changeAvatar({ currentUser, avatar }) {
    if (currentUser.role !== UserRole.OWNER) {
      throw new AppError(
        "Chỉ chủ sở hữu có thể thay đổi thông tin công ty",
        403
      );
    }

    const company = await CompanyModel.findByPk(currentUser.company_id);
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
