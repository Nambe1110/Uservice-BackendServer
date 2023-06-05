import Pushy from "pushy";
import sequelize from "../config/database/index.js";
import logger from "../config/logger.js";

const pushyAPI = new Pushy(process.env.PUSHY_API_KEY);

const sendPushNotificationToCompany = async ({ companyId, data }) => {
  try {
    const deviceTokens = await sequelize.query(
      `SELECT token
      FROM device_token JOIN user ON device_token.user_id = user.id
      WHERE user.company_id = :companyId`,
      {
        replacements: { companyId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const to = deviceTokens.map((deviceToken) => deviceToken.token);
    await pushyAPI.sendPushNotification(data, to);
  } catch (error) {
    logger.error(error);
  }
};

const sendPushNotificationToUser = async ({ userId, data }) => {
  try {
    const deviceTokens = await sequelize.query(
      `SELECT token
      FROM device_token
      WHERE user_id = :userId`,
      {
        replacements: { userId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    const to = deviceTokens.map((deviceToken) => deviceToken.token);
    await pushyAPI.sendPushNotification(data, to);
  } catch (error) {
    logger.error(error);
  }
};

const deviceTokenValid = async (deviceToken) => {
  try {
    await pushyAPI.getDeviceInfo(deviceToken);
    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};

export {
  sendPushNotificationToCompany,
  sendPushNotificationToUser,
  deviceTokenValid,
};
