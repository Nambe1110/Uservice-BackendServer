import { StatusType } from "../../../constants.js";
import GptService from "./gptService.js";

export const createFineTune = async (req, res) => {
  const { user } = req;
  const { files } = req.body;
  try {
    const createdModel = await GptService.createFineTune({
      user,
      fileIds: files,
      name: req.body.name ?? "Default name",
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

export const changeModel = async (req, res) => {
  const { user } = req;
  const { model_id: modelId } = req.body;
  try {
    const usedModel = await GptService.changeCompanyModel({
      companyId: user.company_id,
      modelId,
    });
    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: usedModel,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
