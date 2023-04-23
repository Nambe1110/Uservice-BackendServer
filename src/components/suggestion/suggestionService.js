import Lang from "../../enums/Lang.js";
import GPT3 from "../../modules/GPT3.js";
import Translate from "../../modules/Translate.js";
import AppError from "../../utils/AppError.js";
import GptService from "../chatbot/gpt/gptService.js";
import CompanyModel from "../company/companyModel.js";

export default class SuggestionService {
  static async generateSuggestion({ question, numberOfResponse, user }) {
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError(
        "Người dùng phải thuộc một công ty mới có thể sử dụng tính năng này",
        400
      );
    }
    const gptModel = GptService.GetModelById(company.gpt_id);
    const translatedQuestion = await Translate.translate({
      text: question,
      from: Lang.Vietnamese,
      to: Lang.English,
    });
    const answers = await GPT3.generateResponse({
      question: translatedQuestion,
      numberOfResponse,
      model: gptModel.name,
    });
    const newAnswer = await Translate.translate({
      text: answers,
      from: Lang.English,
      to: Lang.Vietnamese,
    });
    return newAnswer;
  }
}
