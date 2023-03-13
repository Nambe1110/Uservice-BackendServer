import StatusEnum from "../../enums/Status.js";
import MeService from "./meService.js";
import S3 from "../../utils/S3.js";

export const getProfile = async (req, res) => {
  const { user } = req;
  user.image_url = await S3.getImageUrl(user.image_name);
  delete user.dataValues.password;

  return res.status(200).json({
    status: StatusEnum.Success,
    data: user,
  });
};

export const changeAvatar = async (req, res) => {
  try {
    const avatar = req.file;
    const currentUser = req.user;
    const updatedUser = await MeService.changeAvatar({
      currentUser,
      avatar,
    });

    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedUser });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};

export const pushDiskStorageFileToS3 = async (req, res) => {
  try {
    const avatar = req.file;
    const currentUser = req.user;
    const updatedUser = await MeService.changeAvatar({
      currentUser,
      avatar,
    });

    return res
      .status(200)
      .json({ status: StatusEnum.Success, data: updatedUser });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
