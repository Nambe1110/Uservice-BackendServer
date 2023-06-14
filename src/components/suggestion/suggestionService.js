import { DefaultGptModel, SenderType } from "../../constants.js";
import Lang from "../../enums/Lang.js";
import GPT3 from "../../modules/GPT3.js";
import Translate from "../../modules/Translate.js";
import GptService from "../chatbot/gpt/gptService.js";
import MessageModel from "../message/messageModel.js";

export default class SuggestionService {
  static async generateSuggestion({ numberOfResponse, companyId, threadId }) {
    const gptModel = await GptService.GetModelByCompanyId(companyId);
    const context = await this.generateContext(threadId);
    const translatedContext = await Translate.translate({
      text: context.replace(/\n/g, "~"),
      from: Lang.Vietnamese,
      to: Lang.English,
    });
    const answers = await GPT3.generateResponse({
      numberOfResponse,
      model: gptModel?.train_id ?? DefaultGptModel.GPT_3_5,
      context: translatedContext.replace(/~/g, "\n"),
    });
    const newAnswer = await Translate.translate({
      text: answers.join("~~~"),
      from: Lang.English,
      to: Lang.Vietnamese,
    });
    return newAnswer?.split("~~~");
  }

  static async generateContext(threadId) {
    const messages = await MessageModel.findAll({
      order: [["created_at", "ASC"]],
      limit: 10,
      where: { thread_id: threadId },
    });
    let context = "";
    for (const [key, message] of Object.entries(messages)) {
      let messageContent = message.dataValues.content;
      if (key === messages.length - 1) {
        messageContent = await GPT3.removeTeenCode(messageContent);
      }
      if (message.sender_type === SenderType.STAFF) {
        context += `Staff: ${messageContent}\n`;
      }
      if (message.sender_type === SenderType.BOT) {
        context += `Staff: ${messageContent.slice(6)}\n`;
      }
      if (message.sender_type === SenderType.CUSTOMER) {
        context += `Customer: ${messageContent}\n`;
      }
    }
    return context;
  }
}
