import jwt from "jsonwebtoken";
import AppError from "../../utils/AppError.js";

export default class VerifyService {
  static async verifyAccount(token) {
    try {
      const user = jwt.decode(token);
      return user;
    } catch (error) {
      throw new AppError("Invalid or expired token", 400);
    }
  }
}
