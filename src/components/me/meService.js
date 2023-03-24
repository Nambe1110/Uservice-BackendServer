import UserModel from "../user/userModel.js";
import S3 from "../../modules/S3.js";

export default class MeService {
  static async changeAvatar({ currentUser, avatar }) {
    const user = await UserModel.findByPk(currentUser.id);
    const oldAvatar = user.image_url.split(
      "uservice-internal-s3-bucket.s3.ap-southeast-1.amazonaws.com/avatar/"
    )[1];
    // Upload image to S3 and save the image url to DB
    const avatarUrl = await S3.pushMemoryStorageFileToS3(avatar, "avatar");
    user.image_url = avatarUrl;
    const updatedUser = await user.save();
    delete updatedUser.dataValues.password;

    // Delete old image on S3
    if (oldAvatar !== "uservice-default-user-avatar.png") {
      await S3.removeFromS3(`avatar/${oldAvatar}`);
    }

    return updatedUser;
  }
}
