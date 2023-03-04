import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppError from "../../utils/AppError.js";
import UserModel from "../user/userModel.js";

const generateTokens = ({ id, email }) => {
  const accessToken = jwt.sign({ id, email }, process.env.TOKEN_SECRET, {
    expiresIn: "5h",
  });

  const refreshToken = jwt.sign(
    { id, email },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: "5 days",
    }
  );
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};
export default class AuthService {
  static async login({ email, password }) {
    const user = await UserModel.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new AppError("Email hoặc mật khẩu không đúng", 400);
    }

    if (!user.is_verified) {
      throw new AppError("Vui lòng mở email để xác thực tài khoản", 403);
    }

    delete user.dataValues.password;
    return generateTokens(user.dataValues);
  }

  static async signup({ email, firstName, lastName, password }) {
    const user = await UserModel.findOne({ where: { email } });
    if (user) {
      throw new AppError("Thông tin đăng ký không hợp lệ", 403, {
        email: "Email đã tồn tại",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await UserModel.create({
      email,
      first_name: firstName,
      last_name: lastName,
      password: hashedPassword,
      is_verified: false,
    });
    await newUser.reload();
    delete newUser.dataValues.password;
    return {
      user: newUser.dataValues,
    };
  }

  static async refreshToken(token) {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return {
      access_token: generateTokens(decoded).access_token,
      refresh_token: token,
    };
  }
}
