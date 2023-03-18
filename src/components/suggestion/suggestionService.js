import GPT3 from "../../modules/GPT3.js";

export default class SuggestionService {
  static async generateSuggestion({ question, numberOfResponse }) {
    const answers = await GPT3.generateResponse({
      question,
      numberOfResponse,
    });
    return answers;
  }
}
