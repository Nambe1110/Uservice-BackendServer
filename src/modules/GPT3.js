import { Configuration, OpenAIApi } from "openai";
import axios, { AxiosError } from "axios";
import { DefaultGptModel } from "../constants.js";
import Translate from "./Translate.js";
import Lang from "../enums/Lang.js";
import AppError from "../utils/AppError.js";

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
    const generatedResponse = await openai.createCompletion({
      model,
      prompt: `${context}Staff:`,
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
      return rs.substring(rs.indexOf(":") + 2);
    });
  }

  static async uploadFile({ file }) {
    return openai.createFile(file, "fine-tune", {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  static async removeTeenCode(text) {
    const data = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Câu sau có các từ viết tắt và teencode, hãy giúp tôi chuyển các từ viết tắt thành viết thường nhé: "${text}"`,
        },
      ],
    };
    try {
      const { data: response } = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        data,
        {
          headers: {
            Authorization: `Bearer ${process.env.GPT_3_API_KEY}`,
          },
        }
      );
      return response?.choices[0]?.message?.content?.replace(/"/g, "");
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = await Translate.translate({
          text: error.response.data.error.message,
          from: Lang.English,
          to: Lang.Vietnamese,
        });
        throw new AppError(errorMessage, 400);
      }
      throw error;
    }
  }
}
