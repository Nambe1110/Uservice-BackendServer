import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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
    accessToken,
    refreshToken,
  };
};
export default class AuthService {
  static async login({ email, password }) {
    const user = await UserModel.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error("Unable to login with provided credentials.");
      error.code = "400";
      throw error;
    }

    delete user.dataValues.password;
    return generateTokens(user.dataValues);
  }

  static async signup({ email, firstName, lastName, password }) {
    const user = await UserModel.findOne({ where: { email } });
    if (user) {
      const error = new Error("Email already existed.");
      error.code = "403";
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await UserModel.create({
      email,
      first_name: firstName,
      last_name: lastName,
      password: hashedPassword,
    });
    delete newUser.dataValues.password;
    return generateTokens(newUser.dataValues);
  }

  static async refreshToken(token) {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return {
      accessToken: generateTokens(decoded).accessToken,
      refreshToken: token,
    };
  }
}
