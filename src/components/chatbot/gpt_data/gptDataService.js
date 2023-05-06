import GptDataModel from "./gptDataModel.js";

export default class GptDataService {
  static async getDatasetsOfModel(modelId) {
    const datasetIds = await GptDataModel.findAll({
      where: {
        gpt_id: modelId,
      },
    });
    return datasetIds.map((datasetId) => datasetId.dataValues.data_id);
  }
}
