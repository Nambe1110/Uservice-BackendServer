import axios, { AxiosError } from "axios";
import GptModel from "./gptModel.js";
import Translate from "../../../modules/Translate.js";
import Lang from "../../../enums/Lang.js";
import AppError from "../../../utils/AppError.js";
import { DataService } from "../data/dataService.js";
import RoleEnum from "../../../enums/Role.js";

export default class GptService {
  static async GetModelByCompanyId(companyId) {
    const gptModel = await GptModel.findOne({
      where: { company_id: companyId, is_training: false, is_using: true },
    });
    return gptModel?.dataValues;
  }

  static async createFineTune({ user, fileIds }) {
    try {
      const fileContent = await DataService.collectFilesData(fileIds);
      const datasetId = await DataService.uploadToGPTServer({
        fileString: fileContent,
      });
      const data = {
        model: "davinci",
        training_file: datasetId,
      };

      const { data: response } = await axios.post(
        "https://api.openai.com/v1/fine-tunes",
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.GPT_3_API_KEY}`,
          },
        }
      );
      const newModel = await GptModel.create({
        train_id: response.id,
        is_training: true,
        company_id: user.company_id,
      });
      const trainedModel = await newModel.save();
      return trainedModel.dataValues;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = await Translate.translate({
          text: error.response.data.error.message,
          from: Lang.English,
          to: Lang.Vietnamese,
        });
        throw new AppError(errorMessage, 400);
      }
      throw error;
    }
  }

  static async getCompanyModels({ user }) {
    if (user.role !== RoleEnum.Owner) {
      throw new AppError("Người dùng không phải chủ sở hữu");
    }
    const gptModels = await GptModel.findAll({
      where: {
        company_id: user.company_id,
      },
    });

    return gptModels;
  }
}
