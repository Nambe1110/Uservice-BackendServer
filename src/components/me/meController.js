import { StatusType } from "../../constants.js";
import StatusEnum from "../../enums/Status.js";
import CompanyService from "../company/companyService.js";
import MeService from "./meService.js";

export const getProfile = async (req, res) => {
  try {
    const { user } = req;
    delete user.password;
    if (user.company_id) {
      const company = await CompanyService.getCompanyById(user.company_id);
      user.chatbot_mode = company.chatbot_mode;
    }

    return res.status(200).json({
      status: StatusEnum.Success,
      data: user,
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
