import { StatusType } from "../../constants.js";
import StatusEnum from "../../enums/Status.js";
import GptService from "../chatbot/gpt/gptService.js";
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
    const { companyId } = req.params;
    const company = await CompanyService.getCompanyById(companyId);
    const owner = await UserService.getOwnerOfCompany({
      companyId: company.id,
    });
    return res.status(200).json({
      status: StatusEnum.Success,
      data: {
        ...company.dataValues,
        owner,
      },
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
    await CompanyService.deleteCompany(user, req.body.password);
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

export const changeAvatar = async (req, res) => {
  try {
    const avatar = req.file;
    const currentUser = req.user;
    const updatedCompany = await CompanyService.changeAvatar({
      currentUser,
      avatar,
    });

    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedCompany });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone_number: phoneNumber, website } = req.body;
    const currentUser = req.user;
    const updatedCompany = await CompanyService.updateProfile({
      currentUser,
      name,
      email,
      phoneNumber,
      website,
    });

    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedCompany });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const getModels = async (req, res) => {
  try {
    const models = await GptService.getCompanyModels({ user: req.user });
    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: models,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
