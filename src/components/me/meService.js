import bcrypt from "bcrypt";
import UserModel from "../user/userModel.js";
import S3 from "../../modules/S3.js";
import AppError from "../../utils/AppError.js";

export default class MeService {
  static async changeAvatar({ currentUser, avatar }) {
    const user = await UserModel.findByPk(currentUser.id);
    const strArr = user.image_url.split(
      "uservice-internal-s3-bucket.s3.ap-southeast-1.amazonaws.com/avatar/"
    );
    let oldAvatar;
    if (strArr) {
      oldAvatar = strArr[strArr.length - 1];
    }
    // Upload image to S3 and save the image url to DB
    const avatarUrl = await S3.pushMemoryStorageFileToS3(avatar, "avatar");
    user.image_url = avatarUrl;
    const updatedUser = await user.save();
    delete updatedUser.dataValues.password;

    // Delete old image on S3
    if (oldAvatar && oldAvatar !== "uservice-default-user-avatar.png") {
      await S3.removeFromS3(`avatar/${oldAvatar}`);
    }

    return updatedUser;
  }

  static async changePassword({ email, oldPassword, newPassword }) {
    if (oldPassword == null || newPassword == null) {
      throw new AppError("Thông tin cung cấp không hợp lệ");
    }
    const user = await UserModel.findOne({ where: { email } });
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      throw new AppError("Mật khẩu cũ không đúng", 400);
    }
    const newHashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = newHashedPassword;
    const newUser = await user.save();
    delete newUser.dataValues.password;
    return newUser.dataValues;
  }
}
