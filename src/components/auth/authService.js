import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios, { AxiosError } from "axios";
import AppError from "../../utils/AppError.js";
import UserModel from "../user/userModel.js";
import Translate from "../../modules/Translate.js";
import Lang from "../../enums/Lang.js";

const generateTokens = ({ id, email, company_id: companyId }) => {
  const accessToken = jwt.sign(
    { id, email, company_id: companyId },
    process.env.TOKEN_SECRET,
    {
      expiresIn: "5h",
    }
  );

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
    const user = await UserModel.findOne({ where: { id: decoded.id } });
    if (!user) {
      throw new AppError("Thông tin người dùng không hợp lệ", 401);
    }
    return {
      access_token: generateTokens(user).access_token,
      refresh_token: token,
    };
  }

  static async googleAuth(token) {
    try {
      const { data: decoded } = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          params: {
            access_token: token,
          },
        }
      );
      const user = await UserModel.findOne({ where: { email: decoded.email } });

      if (!user) {
        const newUser = await UserModel.create({
          email: decoded.email,
          first_name: decoded.family_name,
          last_name: decoded.given_name,
          password: "",
          is_verified: false,
        });
        await newUser.reload();
        return generateTokens(newUser.dataValues);
      }

      if (!user.is_verified) {
        user.is_verified = true;
        await user.update();
        await user.reload();
      }

      delete user.dataValues.password;
      return generateTokens(user.dataValues);
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = await Translate.translate({
          text: error.response.data.error.message,
          from: Lang.English,
          to: Lang.Vietnamese,
        });
        throw new AppError(errorMessage, 400);
      }
      throw error;
    }
  }
}
