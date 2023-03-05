import UserService from "../components/user/userService.js";
import StatusEnum from "../enums/Status.js";
import RoleEnum from "../enums/Role.js";

export const isOwner = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      status: StatusEnum.Error,
      message: "Tài khoản chưa xác thực",
    });
  }
  if (req.user.role != RoleEnum.Owner) {
    return res.status(403).json({
      status: StatusEnum.Error,
      message: "Yêu cầu quyền 'Owner'",
    });
  }
  return next();
};
