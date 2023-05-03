import axios, { AxiosError } from "axios";
import GptModel from "./gptModel.js";
import Translate from "../../../modules/Translate.js";
import Lang from "../../../enums/Lang.js";
import AppError from "../../../utils/AppError.js";
import DataModel from "../data/dataModel.js";

export default class GptService {
  static async GetModelByCompanyId(companyId) {
    const gptModel = await GptModel.findOne({
      where: { company_id: companyId, is_training: false },
    });
    return gptModel?.dataValues;
  }

  static async createFineTune({ user, fileIds }) {
    const files = await DataModel.findAll({
      where: {
        cloud_id: fileIds ?? [],
      },
    });
    const data = {
      model: "davinci",
      training_files: files.map((file) => file.cloud_id),
    };
    console.log(data);
    try {
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
        console.log(error.response.data.error.message)
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
}
