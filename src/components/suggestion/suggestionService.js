import Lang from "../../enums/Lang.js";
import GPT3 from "../../modules/GPT3.js";
import Translate from "../../modules/Translate.js";

export default class SuggestionService {
  static async generateSuggestion({ question, numberOfResponse }) {
    const translatedQuestion = await Translate.translate({
      text: question,
      from: Lang.Vietnamese,
      to: Lang.English,
    });
    const answers = await GPT3.generateResponse({
      question: translatedQuestion,
      numberOfResponse,
    });
    const newAnswer = await Translate.translate({
      text: answers,
      from: Lang.English,
      to: Lang.Vietnamese,
    });
    return newAnswer;
  }
}
