import jwt from "jsonwebtoken";
import UserService from "../components/user/userService.js";
import StatusEnum from "../enums/Status.js";

export const verifyToken = async (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  if (bearerHeader == null) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Access token was not provided",
    });
  }
  const token = bearerHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await UserService.getUserById(decoded.id);
    req.user = user;
    return next();
  } catch (error) {
    return res
      .status(403)
      .json({ status: StatusEnum.Error, message: "Invalid token" });
  }
};
