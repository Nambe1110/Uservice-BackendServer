import StatusEnum from "../../enums/Status.js";
import UserService from "./userService.js";

export const getCompanyMembers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) ?? 20;
    const page = parseInt(req.query.page, 10) ?? 1;
    const members = await UserService.getCompanyMembers({
      user: req.user,
      limit,
      page,
    });

    return res.status(200).json({ status: StatusEnum.Success, data: members });
  } catch (error) {
    return res
      .status(500)
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
      .status(500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
