import GptModel from "./gptModel.js";

export default class GptService {
  static async GetModelByCompanyId(companyId) {
    const gptModel = await GptModel.findOne({
      where: { company_id: companyId },
    });
    return gptModel?.dataValues;
  }
}
