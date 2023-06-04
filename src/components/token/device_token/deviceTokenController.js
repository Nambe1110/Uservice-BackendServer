import DeviceTokenService from "./deviceTokenService.js";
import { StatusType } from "../../../constants.js";

export const addDeviceToken = async (req, res) => {
  const { user } = req;
  const { token } = req.body;

  try {
    const deviceToken = await DeviceTokenService.createToken({
      userId: user.id,
      token,
    });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: deviceToken,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
