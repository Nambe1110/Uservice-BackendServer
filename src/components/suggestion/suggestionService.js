import Lang from "../../enums/Lang.js";
import GPT3 from "../../modules/GPT3.js";
import Translate from "../../modules/Translate.js";

export default class SuggestionService {
  static async generateSuggestion({ question, numberOfResponse }) {
    const translatedQuestion = await Translate.translate({
      input: question,
      from: Lang.Vietnamese,
      to: Lang.English,
    });
    const answers = await GPT3.generateResponse({
      question: translatedQuestion,
      numberOfResponse,
    });
    return Promise.all(
      answers.map((answer) =>
        Translate.translate({
          input: answer,
          from: Lang.English,
          to: Lang.Vietnamese,
        })
      )
    );
  }
}
