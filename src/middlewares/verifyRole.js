import StatusEnum from "../enums/Status.js";
import RoleEnum from "../enums/Role.js";

export const verifyRole =
  (roles = []) =>
  async (req, res, next) => {
    if (roles && roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: StatusEnum.Error,
        message: `Yêu cầu quyền '${roles.join(", ")}'`,
      });
    }

    return next();
  };

export const isOwner = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Tài khoản chưa xác thực",
    });
  }
  if (!req.user.company_id) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Tài khoản chưa gia nhập công ty",
    });
  }
  if (req.user.role !== RoleEnum.Owner) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Yêu cầu quyền 'Owner'",
    });
  }
  return next();
};

export const isManagerOrOwner = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Tài khoản chưa xác thực",
    });
  }
  if (!req.user.company_id) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Tài khoản chưa gia nhập công ty",
    });
  }
  if (req.user.role !== RoleEnum.Owner && req.user.role !== RoleEnum.Manager) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Yêu cầu quyền 'Manager' hoặc 'Owner'",
    });
  }
  return next();
};
