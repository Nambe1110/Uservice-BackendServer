import validator from "validator";
import StatusEnum from "../enums/Status.js";

export const signupValidator = (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Validate email.
    if (validator.isEmpty(email)) {
      throw new Error("Email cannot be empty.");
    }
    if (!validator.isEmail(email)) {
      throw new Error("Invalid email.");
    }

    // Validate password.
    if (validator.isEmpty(password)) {
      throw new Error("Password cannot be empty");
    }
    if (
      !validator.isLength(password, {
        min: 6,
        max: 20,
      })
    ) {
      throw new Error("Password must be between 6-20 characters");
    }
    if (!validator.isAlphanumeric(password)) {
      throw new Error("Password can only contain letters and numbers");
    }
    return next();
  } catch (error) {
    return res
      .status(400)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const loginValidator = (req, res, next) => {
  const { email, password } = req.body;
  try {
    // Validate email.
    if (validator.isEmpty(email)) {
      throw new Error("Email cannot be empty.");
    }
    if (!validator.isEmail(email)) {
      throw new Error("Invalid email.");
    }

    // Validate password.
    if (validator.isEmpty(password)) {
      throw new Error("Password cannot be empty");
    }
    return next();
  } catch (error) {
    return res
      .status(400)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
