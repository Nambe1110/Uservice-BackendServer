import { DefaultGptModel, SenderType } from "../../constants.js";
import Lang from "../../enums/Lang.js";
import GPT3 from "../../modules/GPT3.js";
import Translate from "../../modules/Translate.js";
import AppError from "../../utils/AppError.js";
import GptService from "../chatbot/gpt/gptService.js";
import CompanyModel from "../company/companyModel.js";
import MessageModel from "../message/messageModel.js";

export default class SuggestionService {
  static async generateSuggestion({ numberOfResponse, user, threadId }) {
    const company = await CompanyModel.findOne({
      where: { id: user.company_id },
    });
    if (!company) {
      throw new AppError(
        "Người dùng phải thuộc một công ty mới có thể sử dụng tính năng này",
        400
      );
    }
    const gptModel = await GptService.GetModelByCompanyId(company.id);
    const context = await this.generateContext(threadId);
    const translatedContext = await Translate.translate({
      text: context.replace(/\n/g, "~"),
      from: Lang.Vietnamese,
      to: Lang.English,
    });
    const answers = await GPT3.generateResponse({
      numberOfResponse,
      model: gptModel?.name ?? DefaultGptModel.GPT_3_5,
      context: translatedContext.replace(/~/g, "\n"),
    });
    const newAnswer = await Translate.translate({
      text: answers,
      from: Lang.English,
      to: Lang.Vietnamese,
    });
    return newAnswer;
  }

  static async generateContext(threadId) {
    const messages = await MessageModel.findAll({
      order: [["created_at", "ASC"]],
      limit: 10,
      where: { thread_id: threadId },
    });
    let context = "";
    for (const message of messages) {
      if (message.dataValues.sender_type === SenderType.STAFF) {
        context += `Shop: ${message.dataValues.content}\n`;
      }
      if (message.dataValues.sender_type === SenderType.CUSTOMER) {
        context += `Customer: ${message.dataValues.content}\n`;
      }
    }
    return context;
  }
}
