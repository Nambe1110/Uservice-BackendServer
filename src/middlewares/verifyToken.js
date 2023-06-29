import jwt from "jsonwebtoken";
import UserService from "../components/user/userService.js";
import { StatusType } from "../constants.js";

export const verifyToken =
  (requiredCompany = false, requiredUnlocked = true) =>
  async (req, res, next) => {
    const bearerHeader = req.headers.authorization;
    if (bearerHeader == null) {
      return res.status(401).json({
        status: StatusType.ERROR,
        message: "Access token không được cung cấp",
      });
    }
    const token = bearerHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
      const user = await UserService.getUserById(decoded.id);
      if (user.is_verified === false) {
        return res.status(403).json({
          status: StatusType.ERROR,
          message: "Tài khoản chưa xác thực",
        });
      }

      if (requiredUnlocked) {
        return res.status(403).json({
          status: StatusType.ERROR,
          message: "Tài khoản bị khóa",
        });
      }

      // if (user.company_id !== decoded.company_id) {
      //   return res.status(403).json({
      //     status: StatusType.ERROR,
      //     message: "Thông tin công ty không đúng",
      //   });
      // }

      if (requiredCompany && !user.company_id)
        return res.status(403).json({
          status: StatusType.ERROR,
          message: "Tài khoản chưa gia nhập công ty",
        });

      req.user = user;
      return next();
    } catch (error) {
      return res.status(403).json({
        status: StatusType.ERROR,
        message: "Token không hợp lệ hoặc đã hết hạn",
      });
    }
  };

export const verifyTokenSocket = async (socket, next) => {
  const { token } = socket.handshake.headers;

  if (!token) {
    return next(new Error("Access token không được cung cấp"));
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await UserService.getUserById(decoded.id);
    if (user.is_verified === false)
      return next(new Error("Tài khoản chưa xác thực"));

    if (!user.company_id)
      return next(new Error("Tài khoản chưa gia nhập công ty"));

    socket.user = user;
    next();
  } catch (error) {
    return next(new Error("Token không hợp lệ hoặc đã hết hạn"));
  }
};
