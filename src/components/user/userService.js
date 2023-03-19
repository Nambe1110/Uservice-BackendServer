import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

  static async getUserById(id) {
    const user = await UserModel.findOne({ where: { id } });
    if (!user) {
      throw new AppError("Người dùng không tồn tại", 403);
    }
    delete user.dataValues.password;
    return user.dataValues;
  }

  static async verifyUser(user) {
    const currentUser = await UserModel.findOne({ where: { id: user.id } });
    if (!currentUser) {
      throw new AppError("Thông tin người dùng trong token không hợp lệ", 400);
    }
    if (currentUser.is_verified) {
      throw new AppError("Tài khoản  đã được kích hoạt", 403);
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

  static async getUser({ companyId, role }) {
    const user = await UserModel.findOne({
      where: { company_id: companyId, role },
    });

    return user;
  }

  static async resetPassword(token, newPassword) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.RESET_PASSWORD_TOKEN_SECRET
      );
      const user = await UserModel.findOne({ where: { id: decoded.id } });
      const newHashedPassword = await bcrypt.hash(newPassword, 12);
      user.password = newHashedPassword;
      const updatedUser = await user.save();

      delete updatedUser.dataValues.password;
      return updatedUser.dataValues;
    } catch (error) {
      throw new AppError("Token không hợp lệ hoặc đã hết hạn", 403);
    }
  }

  static async getCompanyMembers({ user, limit, page }) {
    if (!user.company_id) {
      throw new AppError("Người dùng không thuộc một công ty nào.", 403);
    }
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError("Công ty không tồn tại", 400);
    }

    const allCompanyMembers = await UserModel.findAndCountAll({
      where: { company_id: user.company_id },
    });
    const totalItems = allCompanyMembers.count;
    const totalPages = Math.ceil(totalItems / limit);

    const companyMembers = await UserModel.findAll({
      where: { company_id: user.company_id },
      attributes: {
        exclude: [
          "password",
          "google_token",
          "facebook_token",
          "createdAt",
          "updatedAt",
        ],
      },
      limit,
      offset: limit * (page - 1),
    });

    return {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: page,
      items: companyMembers,
    };
  }

  static async changeUserRole({ currentUser, userID, newRole }) {
    if (newRole !== RoleEnum.Manager && newRole !== RoleEnum.Staff) {
      throw new AppError("Quyền muốn cập nhật không hợp lệ", 406);
    }
    if (currentUser.id === userID) {
      throw new AppError("Không thể tự thay đổi quyền của bạn", 406);
    }

    const user = await UserModel.findByPk(userID);
    if (!user) {
      throw new AppError("User Id không tồn tại");
    }
    if (user.company_id !== currentUser.company_id) {
      throw new AppError(
        "Người dùng không thuộc cùng một công ty với đối tượng cần thay đổi quyền.",
        403
      );
    }
    if (user.role === newRole) {
      throw new AppError("Người dùng đã có quyền này", 406);
    }

    user.role = newRole;
    const updatedUser = await user.save();

    return updatedUser;
  }

  static async getUserCompanyById({ currentUser, userId }) {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new AppError("User Id không tồn tại");
    }
    if (user.company_id !== currentUser.company_id) {
      throw new AppError(
        "Bạn không có quyền lấy thông tin của người dùng này.",
        403
      );
    }
    delete user.password;
    return user;
  }
}
