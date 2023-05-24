import StatusEnum from "../../enums/Status.js";
import UserService from "./userService.js";

export const getCompanyMembers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit ?? 20, 10);
    const page = parseInt(req.query.page ?? 1, 10);
    const searchKey = req.query.searchKey ?? null;

    const members = await UserService.getCompanyMembers({
      user: req.user,
      limit,
      page,
      searchKey,
    });

    return res.status(200).json({ status: StatusEnum.Success, data: members });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { userID, newRole } = req.body;
    const currentUser = req.user;
    const updatedUser = await UserService.changeUserRole({
      currentUser,
      userID,
      newRole,
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

export const getUserCompanyById = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user;
    const user = await UserService.getUserCompanyById({
      currentUser,
      userId,
    });
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

export const transferCompany = async (req, res) => {
  try {
    const { userID, password } = req.body;
    const currentUser = req.user;
    const updatedUser = await UserService.transferCompany({
      currentUser,
      userID,
      password,
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

export const lockAccount = async (req, res) => {
  try {
    const { userID } = req.body;
    const currentUser = req.user;
    const updatedUser = await UserService.lockAccount({
      currentUser,
      userID,
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

export const unlockAccount = async (req, res) => {
  try {
    const { userID } = req.body;
    const currentUser = req.user;
    const updatedUser = await UserService.unlockAccount({
      currentUser,
      userID,
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
