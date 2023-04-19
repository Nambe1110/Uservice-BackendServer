import StatusEnum from "../../enums/Status.js";
import UserService from "../user/userService.js";
import CompanyService from "./companyService.js";

export const joinCompany = async (req, res) => {
  try {
    const { invite_code: inviteCode } = req.body;
    const updatedUser = await UserService.joinCompany({
      user: req.user,
      inviteCode,
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

export const createCompany = async (req, res) => {
  try {
    const { name } = req.body;
    const insertedCompany = await CompanyService.createCompany({
      user: req.user,
      companyName: name,
    });
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: insertedCompany });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const getCompanyDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const company = await CompanyService.getCompanyById({ id, user });
    return res.status(200).json({
      status: StatusEnum.Success,
      data: company,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { user } = req;
    await CompanyService.deleteCompany(user);
    return res.status(200).json({
      status: StatusEnum.Success,
      data: { message: "Xóa công ty thành công" },
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const changeChatbotMode = async (req, res) => {
  try {
    const { user } = req;
    const { new_mode: newMode } = req.body;
    const company = await CompanyService.setChatbotMode(user, newMode);
    return res.status(200).json({
      status: StatusEnum.Success,
      data: company,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
