import axios, { AxiosError } from "axios";
import GptModel from "./gptModel.js";
import Translate from "../../../modules/Translate.js";
import Lang from "../../../enums/Lang.js";
import AppError from "../../../utils/AppError.js";
import { DataService } from "../data/dataService.js";
import RoleEnum from "../../../enums/Role.js";
import GptDataModel from "../gpt_data/gptDataModel.js";
import GptDataService from "../gpt_data/gptDataService.js";

export default class GptService {
  static async GetModelByCompanyId(companyId) {
    const gptModel = await GptModel.findOne({
      where: { company_id: companyId, is_training: false, is_using: true },
    });
    return gptModel?.dataValues;
  }

  static async createFineTune({ user, fileIds, name }) {
    if (user.role !== RoleEnum.Owner) {
      throw new AppError("Người dùng không phải chủ sở hữu", 401);
    }
    try {
      if (name === "" || name == null) {
        throw new AppError("Yêu cầu tên mô hình", 400);
      }
      if (!fileIds?.length) {
        throw new AppError(
          "Yêu cầu danh sách các id của mô hình huấn luyện",
          400
        );
      }
      const currentModels = await this.getCompanyModels({ user });
      if (
        currentModels &&
        currentModels.filter((model) => model.is_training).length > 0
      ) {
        throw new AppError(
          "Chỉ có thể huấn luyện 1 mô hình 1 lần. Vui lòng đợi mô hình hiện tại hoàn thành",
          400
        );
      }
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
        name,
      });
      const trainedModel = await newModel.save();
      const gptDataRelations = fileIds.map((fileId) => ({
        gpt_id: trainedModel.dataValues.id,
        data_id: fileId,
      }));
      await GptDataModel.bulkCreate(gptDataRelations);
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
    try {
      let gptModels = await GptModel.findAll({
        where: {
          company_id: user.company_id,
        },
      });
      const trainingModel = gptModels.find((model) => model.is_training);
      if (trainingModel) {
        const { data } = await axios.get(
          `https://api.openai.com/v1/fine-tunes/${trainingModel.train_id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.GPT_3_API_KEY}`,
            },
          }
        );
        if (
          data.events &&
          data.events.length > 0 &&
          data.events[data.events.length - 1].message === "Fine-tune succeeded"
        ) {
          await GptModel.update(
            { is_training: false, train_id: data.fine_tuned_model },
            { where: { id: trainingModel.id } }
          );
          gptModels = await GptModel.findAll({
            where: {
              company_id: user.company_id,
            },
          });
        }
      }

      const models = gptModels.map(async (gptModel) => ({
        ...gptModel.dataValues,
        dataset_ids: await GptDataService.getDatasetsOfModel(gptModel.id),
      }));

      return Promise.all(models);
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

  static async changeCompanyModel({ companyId, modelId }) {
    await GptModel.update(
      { is_using: false },
      { where: { company_id: companyId } }
    );
    if (!modelId) {
      return {};
    }
    const usedModel = await GptModel.update(
      { is_using: true },
      { where: { id: modelId } }
    );
    return usedModel[0];
  }
}
