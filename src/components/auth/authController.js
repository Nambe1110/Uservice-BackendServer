import UserService from "../user/userService.js";

export const login = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await UserService.getUserByEmail(email);
    if (!user) {
      return res
        .status(400)
        .json({ message: "Unable to log in with provided credentials." });
    }
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
