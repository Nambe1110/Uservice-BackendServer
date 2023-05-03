import { StatusType } from "../../../constants.js";
import AppError from "../../../utils/AppError.js";
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

export const uploadDataset = async (req, res) => {
  try {
    const { files } = req;
    if (!files) {
      throw new AppError(
        "Có lỗi khi tải lên bộ dữ liệu. Vui lòng thử lại sau.",
        400
      );
    }
    const createdFile = await DataService.createDataset({
      file: files[0],
      user: req.user,
    });
    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: createdFile,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
