import { StatusType } from "../../../constants.js";
import { DataService } from "./dataService.js";

export const upload = async (req, res) => {
  try {
    const { file } = req;
    const { fileName } = req.body;
    const uploadedFile = await DataService.upload({
      fileName,
      file,
      user: req.user,
    });
    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: uploadedFile,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
