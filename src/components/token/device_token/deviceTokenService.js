import DeviceTokenModel from "./deviceTokenModel.js";
import AppError from "../../../utils/AppError.js";
import { deviceTokenValid } from "../../../modules/pushNotification.js";

export default class ChannelService {
  static async createToken({ userId, token }) {
    if (!(await deviceTokenValid(token))) {
      throw new AppError("Invalid device token", 400);
    }

    const [deviceToken] = await DeviceTokenModel.findOrCreate({
      where: {
        user_id: userId,
        token,
      },
    });

    return deviceToken;
  }
}
