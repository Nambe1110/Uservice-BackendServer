import validator from "validator";
import StatusEnum from "../enums/Status.js";

export const signupValidator = (req, res, next) => {
  const { email, password } = req.body;
  const emailErrors = [];
  const passwordErrors = [];
  // Validate email.
  if (validator.isEmpty(email)) {
    emailErrors.push("Email không thể để trống");
  }
  if (!validator.isEmail(email)) {
    emailErrors.push("Email không hợp lệ");
  }

  // Validate password.
  if (validator.isEmpty(password)) {
    passwordErrors.push("Mật khẩu không thể để trống");
  }
  if (
    !validator.isLength(password, {
      min: 6,
      max: 20,
    })
  ) {
    passwordErrors.push("Mật khẩu phải từ 6-20 ký tự");
  }
  if (!validator.isAlphanumeric(password)) {
    passwordErrors.push("Mật khẩu chỉ có thể chứa chữ cái và số");
  }
  if (emailErrors.length > 0 || passwordErrors.length > 0) {
    return res.status(400).json({
      status: StatusEnum.Error,
      message: "Thông tin đăng ký không hợp lệ",
      errors: {
        email: emailErrors.length > 0 ? emailErrors : undefined,
        password: passwordErrors.length > 0 ? passwordErrors : undefined,
      },
    });
  }
  return next();
};

export const loginValidator = (req, res, next) => {
  const { email, password } = req.body;
  const emailErrors = [];
  const passwordErrors = [];
  // Validate email.
  if (validator.isEmpty(email)) {
    emailErrors.push("Email không thể để trống");
  }
  if (!validator.isEmail(email)) {
    emailErrors.push("Email không hợp lệ");
  }

  // Validate password.
  if (validator.isEmpty(password)) {
    passwordErrors.push("Mật khẩu không thể để trống");
  }
  if (emailErrors.length > 0 || passwordErrors.length > 0) {
    return res.status(400).json({
      status: StatusEnum.Error,
      message: "Thông tin đăng nhập không hợp lệ",
      errors: {
        email: emailErrors.length > 0 ? emailErrors : undefined,
        password: passwordErrors.length > 0 ? passwordErrors : undefined,
      },
    });
  }
  return next();
};
