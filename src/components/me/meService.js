import UserModel from "../user/userModel.js";
import S3 from "../../utils/S3.js";

export default class MeService {
  static async changeAvatar({ currentUser, avatar }) {
    const url =
      "http://uservicebackendtestserver-env.eba-43rm8vge.ap-southeast-1.elasticbeanstalk.com/api/image/";
    const user = await UserModel.findByPk(currentUser.id);
    const oldAvatar = user.image_url.split(
      "uservicebackendtestserver-env.eba-43rm8vge.ap-southeast-1.elasticbeanstalk.com/api/image/"
    )[1];

    // Updload image to S3 and save the image name to DB
    const avatarName = await S3.pushMemoryStorageFileToS3(avatar);
    user.image_url = `${url}${avatarName}`;
    const updatedUser = await user.save();
    delete updatedUser.dataValues.password;

    // Delete old image on S3
    if (oldAvatar !== "uservice-default-user-avatar.png") {
      await S3.removeFromS3(oldAvatar);
    }

    return updatedUser;
  }
}
