import axios from "axios";
import GptModel from "./gptModel.js";

export default class GptService {
  static async GetModelByCompanyId(companyId) {
    const gptModel = await GptModel.findOne({
      where: { company_id: companyId, is_training: false },
    });
    return gptModel?.dataValues;
  }

  // static async createFineTune() {
  //   const data = {};
  //   const { data: response } = await axios.post(
  //     "https://api.openai.com/v1/fine-tunes",
  //     data,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${process.env.GPT_3_API_KEY}`,
  //       },
  //     }
  //   );
  //   const newModel = GptModel.create({

  //   })
  // }
}
