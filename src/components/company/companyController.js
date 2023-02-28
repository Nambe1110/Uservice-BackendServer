import StatusEnum from "../../enums/Status.js";
import UserService from "../user/userService.js";
import CompanyService from "./companyService.js";

export const joinCompany = async (req, res) => {
  const { inviteCode } = req.body;
  try {
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
  const { name } = req.body;
  try {
    const insertedCompany = await CompanyService.createCompany({
      user: req.user,
      companyName: name,
    });
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: insertedCompany });
  } catch (error) {
    return res
      .status(500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
