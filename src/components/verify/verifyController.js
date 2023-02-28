import StatusEnum from "../../enums/Status.js";
import UserService from "../user/userService.js";
import VerifyService from "./verifyService.js";

export const verifyAccount = async (req, res) => {
  const { verifyToken } = req.body;
  try {
    const user = await VerifyService.verifyAccount(verifyToken);
    const verifiedUser = await UserService.verifyUser(user);
    return res.status(200).json({
      status: StatusEnum.Success,
      data: {
        user: verifiedUser,
      },
    });
  } catch (error) {
    return res.status(error.code ?? 500).json({
      status: StatusEnum.Error,
      message: error.message,
    });
  }
};
