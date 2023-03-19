import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
  apiKey: process.env.GPT_3_API_KEY,
});

const openai = new OpenAIApi(configuration);

export default class GPT3 {
  static async generateResponse({
    context = "",
    question,
    numberOfResponse = 3,
  }) {
    const generatedResponse = await openai.createCompletion({
      model: "davinci",
      prompt: `${context}Customer: ${question}\n`,
      temperature: 0.5,
      max_tokens: 70,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      n: numberOfResponse,
      stop: ["Customer:"],
    });

    return generatedResponse.data.choices.map((response) => {
      const rs = response.text.replace(/^\n+/, "");
      return rs.substring(rs.indexOf(":") + 2, rs.indexOf("\n"));
    });
  }
}
