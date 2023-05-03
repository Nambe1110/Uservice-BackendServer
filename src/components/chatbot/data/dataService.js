import axios, { AxiosError } from "axios";
import FormData from "form-data";
import DataModel from "./dataModel.js";
import AppError from "../../../utils/AppError.js";
import Translate from "../../../modules/Translate.js";
import Lang from "../../../enums/Lang.js";

function getFileExtension(filename) {
  const dotIndex = filename.lastIndexOf(".");
  if (dotIndex === -1) {
    // No dot found in the filename
    return null;
  }
  const extension = filename.substring(dotIndex + 1);
  return extension.length > 0 ? extension : null;
}

export class DataService {
  static async uploadToGPTServer({ fileString, user, fileName }) {
    const formData = new FormData();
    formData.append("purpose", "fine-tune");
    formData.append("file", Buffer.from(fileString), fileName);

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

  static async createDataset({ user, file }) {
    if (getFileExtension(file.originalname) !== "jsonl") {
      throw new AppError("Tập dữ liệu phải có dạng jsonl.", 400);
    }
    const newFile = await DataModel.create({
      cloud_id: file.location,
      name: file.originalname,
      bytes: file.size,
      company_id: user.company_id,
    });
    return newFile.dataValues;
  }
}
