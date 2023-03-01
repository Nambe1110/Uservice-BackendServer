import StatusEnum from "../../enums/Status.js";
import EmailService from "../email/emailService.js";
import UserService from "../user/userService.js";
import AuthService from "./authService.js";

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await AuthService.login({
      email,
      password,
    });

    return res.status(200).json({
      status: StatusEnum.Success,
      data: {
        token,
      },
    });
  } catch (error) {
    if (error.message === "Vui lòng mở email để xác thực tài khoản") {
      const user = await UserService.getUserByEmail(email);
      EmailService.SendVerifyEmail(user);
    }
    return res.status(error.code ?? 500).json({
      status: StatusEnum.Error,
      message: error.message,
      errors: error.errors,
    });
  }
};

export const signup = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    const { user } = await AuthService.signup({
      email,
      firstName,
      lastName,
      password,
    });

    await EmailService.SendVerifyEmail(user);

    return res.status(200).json({
      status: StatusEnum.Success,
      data: { user },
    });
  } catch (error) {
    return res.status(error.code ?? 500).json({
      status: StatusEnum.Error,
      message: error.message,
      errors: error.errors,
    });
  }
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Token không được cung cấp",
    });
  }
  try {
    const newTokens = await AuthService.refreshToken(token);
    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: { token: newTokens } });
  } catch (error) {
    return res.status(400).json({
      status: StatusEnum.Error,
      message: "Token invalid or expired",
    });
  }
};

export const forgetPassword = async (req, res) => {
  const { email } = req.body;
  const user = await UserService.getUserByEmail(email);
  if (!user) {
    return res.status(400).json({
      status: StatusEnum.Error,
      message: "Email không tồn tại",
    });
  }
  try {
    await EmailService.SendForgetPasswordEmail(user);
    return res.status(200).json({
      status: StatusEnum.Success,
      data: {
        message: "Hướng dẫn khôi phục mật khẩu đã được gửi đến email của bạn",
      },
    });
  } catch (error) {
    return res.status(error.code ?? 500).json({
      status: StatusEnum.Error,
      message: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token) {
    return res.status(401).json({
      status: StatusEnum.Error,
      message: "Token không được cung cấp",
    });
  }
  try {
    const updatedUser = await UserService.resetPassword(token, password);
    return res.status(200).json({
      status: StatusEnum.Success,
      data: { user: updatedUser },
    });
  } catch (error) {
    return res.status(error.code ?? 500).json({
      status: StatusEnum.Error,
      message: error.message,
    });
  }
};
