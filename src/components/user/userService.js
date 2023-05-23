import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import RoleEnum from "../../enums/Role.js";
import UserModel from "./userModel.js";
import CompanyModel from "../company/companyModel.js";
import AppError from "../../utils/AppError.js";
import { UserRole } from "../../constants.js";
import { listCompany } from "../../utils/singleton.js";
import sequelize from "../../config/database/index.js";

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

    delete updatedUser.dataValues.password;
    return updatedUser.dataValues;
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

  static async getCompanyMembers({ user, limit, page, searchKey }) {
    if (!user.company_id) {
      throw new AppError("Người dùng không thuộc một công ty nào.", 400);
    }
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError("Công ty không tồn tại", 400);
    }

    const selectQuery = `SELECT * FROM user WHERE company_id = :companyId `;

    const searchStr = searchKey
      ? ` AND ( 
            CONCAT(first_name, " ", last_name) LIKE "%${searchKey}%"
            OR
            email LIKE "%${searchKey}%" )
        `
      : ``;

    const sqlQuery = selectQuery.concat(
      searchStr,
      `
      LIMIT :limit
      OFFSET :offset;`
    );

    const companyMembers = await sequelize.query(sqlQuery, {
      replacements: {
        companyId: user.company_id,
        limit,
        offset: (page - 1) * limit,
      },
      type: sequelize.QueryTypes.SELECT,
      nest: true,
    });
    const totalItems = companyMembers.length;
    const totalPages = Math.ceil(totalItems / limit);

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
      throw new AppError("Mật khẩu không đúng", 401);
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
    delete updatedCurrentUser.dataValues.password;

    return updatedCurrentUser;
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
}
