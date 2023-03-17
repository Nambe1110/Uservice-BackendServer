import StatusEnum from "../../enums/Status.js";
import S3 from "../../utils/S3.js";

export const redirectToS3Url = async (req, res) => {
  try {
    const { name } = req.params;
    const imageURL = await S3.getImageUrl(name);

    return res.redirect(imageURL);
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
