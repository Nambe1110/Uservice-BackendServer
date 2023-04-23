import { Configuration, OpenAIApi } from "openai";
import { DefaultGptModel } from "../constants.js";

const configuration = new Configuration({
  apiKey: process.env.GPT_3_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default class GPT3 {
  static async generateResponse({
    context,
    numberOfResponse = 3,
    model = DefaultGptModel.GPT_3_5,
  }) {
    console.log(context)
    const generatedResponse = await openai.createCompletion({
      model,
      prompt: `${context}Customer:`,
      temperature: 0.5,
      max_tokens: 70,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: numberOfResponse,
      stop: ["Customer:"],
    });

    console.log(generatedResponse.data.choices.map((response) => {
      const rs = response.text.replace(/^\n+/, "");
      return rs.substring(rs.indexOf(":") + 2);
    }))

    return generatedResponse.data.choices.map((response) => {
      const rs = response.text.replace(/^\n+/, "");
      return rs.substring(rs.indexOf(":") + 2);
    });
  }
}
