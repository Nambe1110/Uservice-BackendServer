import jwt from "jsonwebtoken";
import UserService from "../user/userService.js";
import UserModel from "../user/userModel.js";
import CompanyModel from "../company/companyModel.js";
import { StatusType } from "../../constants.js";
import StatusEnum from "../../enums/Status.js";
import CompanyService from "../company/companyService.js";
import MeService from "./meService.js";
import AppError from "../../utils/AppError.js";

const verifyToken = async (bearerHeader) => {
  try {
    if (bearerHeader == null) {
      throw new AppError("Access token không được cung cấp", 401);
    }
    const token = bearerHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await UserService.getUserById(decoded.id);
    if (user.is_verified === false) {
      throw new AppError("Access token không được cung cấp", 403);
    }
    if (user.company_id) {
      const company = await CompanyService.getCompanyById(user.company_id);
      user.chatbot_mode = company.chatbot_mode;
    }
    return user;
  } catch (error) {
    throw new AppError("Token không hợp lệ hoặc đã hết hạn", 403);
  }
};

export const getProfile = async (req, res) => {
  try {
    const bearerHeader = req.headers.authorization;

    const user = await verifyToken(bearerHeader);
    // Join modal Company and owner of company to user's profile
    const returnedUser = await UserModel.findAll({
      where: { id: user.id },
      include: { model: CompanyModel },
      attributes: { exclude: ["password"] },
    });
    const addCompanyOwner = async (cUser) => {
      if (!cUser.company_id) {
        return;
      }
      const owner = await UserService.getOwnerOfCompany({
        companyId: cUser.company_id,
      });
      const cCompany = cUser.Company;
      cCompany.dataValues.owner = owner;
      cUser.dataValues.Company = cCompany;
    };
    await Promise.all(returnedUser.map((e) => addCompanyOwner(e)));
    const result = returnedUser[0];

    return res.status(200).json({
      status: StatusEnum.Success,
      data: result,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const changeAvatar = async (req, res) => {
  try {
    const avatar = req.file;
    const currentUser = req.user;
    const updatedUser = await MeService.changeAvatar({
      currentUser,
      avatar,
    });

    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedUser });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { user } = req;
    const { old_password: oldPassword, new_password: newPassword } = req.body;
    const newUser = await MeService.changePassword({
      email: user.email,
      oldPassword,
      newPassword,
    });
    return res.status(200).json({ status: StatusType.SUCCESS, data: newUser });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const leaveCompany = async (req, res) => {
  try {
    const { user } = req;
    const updatedUser = await MeService.leaveCompany({ user });
    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: updatedUser,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
    } = req.body;
    const currentUser = req.user;
    const updatedUser = await MeService.updateProfile({
      currentUser,
      firstName,
      lastName,
      phoneNumber,
    });

    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedUser });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
