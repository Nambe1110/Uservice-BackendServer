import GptModel from "./gptModel.js";

export default class GptService {
  static async GetModelById(gptId) {
    return GptModel.findByPk(gptId);
  }
}
