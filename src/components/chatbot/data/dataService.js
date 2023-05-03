import axios, { AxiosError } from "axios";
import FormData from "form-data";
import DataModel from "./dataModel.js";
import AppError from "../../../utils/AppError.js";
import Translate from "../../../modules/Translate.js";
import Lang from "../../../enums/Lang.js";

export class DataService {
  static async upload({ file, user, fileName }) {
    const { data: s3File } = await axios.get(
      "https://uservice-internal-s3-bucket.s3.ap-southeast-1.amazonaws.com/mini_shoe_train.jsonl"
    );

    const formData = new FormData();
    formData.append("purpose", "fine-tune");
    formData.append("file", Buffer.from(s3File), fileName);

    try {
      const { data: uploadedFile } = await axios.post(
        "https://api.openai.com/v1/files",
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.GPT_3_API_KEY}`,
          },
        }
      );
      const newFile = await DataModel.create({
        cloud_id: uploadedFile.id,
        name: fileName,
        bytes: uploadedFile.bytes,
        company_id: user.company_id,
      });
      return newFile.dataValues;
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
