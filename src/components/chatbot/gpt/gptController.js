import { StatusType } from "../../../constants.js";
import GptService from "./gptService.js";

export const createFineTune = async (req, res) => {
  const { user } = req;
  const { files } = req.body;
  try {
    const createdModel = await GptService.createFineTune({
      user,
      fileIds: files,
    });
    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: createdModel,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
