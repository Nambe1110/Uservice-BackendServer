import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import UserService from "../user/userService.js";

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

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await UserService.getUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res
        .status(400)
        .json({ message: "Unable to log in with provided credentials." });
    }

    return res.status(200).json(generateTokens(user));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    const user = await UserService.getUserByEmail(email);

    if (user) {
      return res.status(403).json({ message: "Email already existed." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await UserService.insertUser({
      email,
      firstName,
      lastName,
      password: hashedPassword,
    });

    return res.status(200).json(generateTokens(newUser));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }
  try {
    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    return res.status(200).json({
      accessToken: generateTokens(decoded).accessToken,
      refreshToken: token,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        "Unfortunately, there are some problems with the data you committed",
    });
  }
};
