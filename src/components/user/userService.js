import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RoleEnum from "../../enums/Role.js";
import UserModel from "./userModel.js";
import CompanyModel from "../company/companyModel.js";
import AppError from "../../utils/AppError.js";
import { UserRole } from "../../constants.js";
import { listCompany } from "../../utils/singleton.js";
import sequelize from "../../config/database/index.js";
import HasHigherRole from "../../utils/hasHigherRole.js";

export default class UserService {
  static async joinCompany({ user, inviteCode, role = RoleEnum.Staff }) {
    if (user.company_id != null) {
      throw new AppError("Người dùng đã tồn tại trong một công ty khác", 400);
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

    listCompany.get(company.id)?.employees.set(user.id, {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: user.phone_number,
      role: user.role,
      imageUrl: user.image_url,
      socketCount: 0,
    });

    const returnedUser = await UserModel.findOne({
      where: { id: updatedUser.id },
      include: { model: CompanyModel },
      attributes: { exclude: ["password"] },
    });

    return returnedUser;
  }

  static async getUserById(id) {
    const user = await UserModel.findOne({ where: { id } });
    if (!user) {
      throw new AppError("Người dùng không tồn tại", 400);
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
      throw new AppError("Tài khoản  đã được kích hoạt", 400);
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
      throw new AppError("Token không hợp lệ hoặc đã hết hạn", 400);
    }
  }

  static async getCompanyMembers({ companyId, limit, page, searchKey }) {
    let query = `FROM user WHERE company_id = :companyId`;
    if (searchKey)
      query += ` AND (CONCAT(first_name, " ", last_name) LIKE :searchKey OR email LIKE :searchKey)`;

    const users = await sequelize.query(
      `SELECT id, first_name, last_name, email, is_verified, is_locked, phone_number, role, image_url, created_at, disconnect_timestamp
      ${query}
      ORDER BY CASE role
          WHEN 'Owner' THEN 1
          WHEN 'Manager' THEN 2
          WHEN 'Staff' THEN 3
          ELSE 4
        END
      LIMIT :limit
      OFFSET :offset`,
      {
        replacements: {
          companyId,
          limit,
          offset: (page - 1) * limit,
          searchKey: `%${searchKey}%`,
        },
        type: sequelize.QueryTypes.SELECT,
        nest: true,
      }
    );

    const totalItems = await sequelize.query(
      `SELECT COUNT(DISTINCT user.id) AS 'total'
      ${query}`,
      {
        replacements: {
          companyId,
          searchKey: `%${searchKey}%`,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    return {
      total_items: totalItems[0].total,
      total_pages: Math.ceil(totalItems[0].total / limit),
      current_page: page,
      items: users,
    };
  }

  static async changeUserRole({ currentUser, userID, newRole }) {
    if (newRole !== RoleEnum.Manager && newRole !== RoleEnum.Staff) {
      throw new AppError("Quyền muốn cập nhật không hợp lệ", 406);
    }
    if (currentUser.id.toString() === userID) {
      throw new AppError("Không thể tự thay đổi quyền của bạn", 406);
    }

    const user = await UserModel.findByPk(userID);
    if (!user) {
      throw new AppError("User Id không tồn tại");
    }
    if (user.company_id !== currentUser.company_id) {
      throw new AppError(
        "Người dùng không thuộc cùng một công ty với đối tượng cần thay đổi quyền.",
        400
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
        400
      );
    }
    delete user.password;
    return user;
  }

  static async getOwnerOfCompany({ companyId }) {
    const user = await UserModel.findOne({
      where: { company_id: companyId, role: UserRole.OWNER },
    });
    if (!user) {
      throw new AppError("Không tồn tại chủ sở hữu của công ty", 400);
    }
    delete user.dataValues.password;
    return user.dataValues;
  }

  static async transferCompany({ currentUser, userID, password }) {
    if (currentUser.id.toString() === userID) {
      throw new AppError("Không thể chuyển nhượng công ty cho chính bạn", 406);
    }

    const currUser = await UserModel.findByPk(currentUser.id);
    if (!(await bcrypt.compare(password, currUser.password))) {
      throw new AppError("Mật khẩu không đúng", 400);
    }

    const user = await UserModel.findByPk(userID);
    if (!user || !user.is_verified) {
      throw new AppError(
        "User Id không tồn tại hoặc người dùng chưa kích hoạt tài khoản"
      );
    }
    if (user.company_id !== currUser.company_id) {
      throw new AppError(
        "Người được chuyển nhượng không thuộc cùng công ty với bạn.",
        400
      );
    }

    listCompany.get(user.company_id).employees.delete(user.id);

    user.company_id = currUser.company_id;
    user.role = UserRole.OWNER;
    await user.save();

    listCompany.get(user.company_id).employees.set(user.id, {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      phoneNumber: user.phone_number,
      role: user.role,
      imageUrl: user.image_url,
      socketCount: 0,
    });

    currUser.role = UserRole.MANAGER;
    const updatedCurrentUser = await currUser.save();

    const returnedUser = await UserModel.findOne({
      where: { id: updatedCurrentUser.id },
      include: { model: CompanyModel },
      attributes: { exclude: ["password"] },
    });

    return returnedUser;
  }

  static async updateDisconnectTimestamp(userId) {
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new AppError("User Id không tồn tại");
    }
    user.disconnect_timestamp = Date.now();
    await user.save();

    return user;
  }

  static async lockAccount({ currentUser, userID }) {
    if (currentUser.id.toString() === userID) {
      throw new AppError("Không thể tự thay đổi quyền của bạn", 406);
    }

    const user = await UserModel.findByPk(userID);
    if (!user) {
      throw new AppError("User Id không tồn tại");
    }
    if (user.company_id !== currentUser.company_id) {
      throw new AppError(
        "Người dùng không thuộc cùng một công ty với đối tượng cần thay đổi quyền.",
        400
      );
    }
    if (!HasHigherRole(currentUser.role, user.role)) {
      throw new AppError(
        "Bạn cần quyền cao hơn tài khoản muốn khóa để thực hiện khóa tài khoản.",
        400
      );
    }
    if (user.is_locked) {
      throw new AppError(
        "Tài khoản của người dùng đã bị khóa trước đây. ",
        400
      );
    }

    user.is_locked = true;
    const updatedUser = await user.save();

    return updatedUser;
  }

  static async unlockAccount({ currentUser, userID }) {
    if (currentUser.id.toString() === userID) {
      throw new AppError("Không thể tự thay đổi quyền của bạn", 406);
    }

    const user = await UserModel.findByPk(userID);
    if (!user) {
      throw new AppError("User Id không tồn tại");
    }
    if (user.company_id !== currentUser.company_id) {
      throw new AppError(
        "Người dùng không thuộc cùng một công ty với đối tượng cần thay đổi quyền.",
        400
      );
    }
    if (!HasHigherRole(currentUser.role, user.role)) {
      throw new AppError(
        "Bạn cần quyền cao hơn tài khoản muốn mở khóa để thực hiện mở khóa tài khoản.",
        400
      );
    }
    if (!user.is_locked) {
      throw new AppError(
        "Không thể mở khóa cho tài khoản ở trạng thái bình thường. ",
        400
      );
    }

    user.is_locked = false;
    const updatedUser = await user.save();

    return updatedUser;
  }
}
