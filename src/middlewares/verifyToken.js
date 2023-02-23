import jwt from "jsonwebtoken";
import UserService from "../components/user/userService.js";

const verifyToken = async (req, res, next) => {
  const bearerHeader = req.headers.authorization;
  if (bearerHeader == null) {
    return res.status(401).json({ message: "Access token was not provided" });
  }
  const token = bearerHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
  const user = await UserService.getUserById(decoded.id);

  if (!user) {
    return res.status(403).json({ message: "Invalid token" });
  }

  req.user = user;
  return next();
};

export default verifyToken;
