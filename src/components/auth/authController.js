import AuthService from "./authService.js";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AuthService.login({
      email,
      password,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(error.code ?? 500).json({ message: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const { email, firstName, lastName, password } = req.body;

    const user = await AuthService.signup({
      email,
      firstName,
      lastName,
      password,
    });

    return res.status(200).json(user);
  } catch (error) {
    return res.status(error.code ?? 500).json({ message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(401).json({ message: "Refresh token not provided" });
  }
  try {
    return res.status(200).json(await AuthService.refreshToken(token));
  } catch (error) {
    return res.status(400).json({
      message: "Token invalid or expired",
    });
  }
};
