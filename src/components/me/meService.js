import UserModel from "../user/userModel.js";
import S3 from "../../utils/S3.js";

export default class UserService {
  static async changeAvatar({ currentUser, avatar }) {
    const user = await UserModel.findByPk(currentUser.id);
    const oldAvatar = user.image_name;

    // Updload image to S3 and save the image name to DB
    const avatarName = await S3.pushMemoryStorageFileToS3(avatar);
    user.image_name = avatarName;
    const updatedUser = await user.save();
    const imageURL = await S3.getImageUrl(avatarName);
    updatedUser.image_url = imageURL;
    delete updatedUser.dataValues.password;

    // Delete old image on S3
    if (oldAvatar !== "uservice-default-user-avatar.png") {
      await S3.removeFromS3(oldAvatar);
    }

    return updatedUser;
  }
}
