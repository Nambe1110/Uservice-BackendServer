import axios, { AxiosError } from "axios";
import FormData from "form-data";
import { Op } from "sequelize";
import DataModel from "./dataModel.js";
import AppError from "../../../utils/AppError.js";
import Translate from "../../../modules/Translate.js";
import Lang from "../../../enums/Lang.js";
import CompanyModel from "../../company/companyModel.js";

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
  static async uploadToGPTServer({ fileString }) {
    try {
      const formData = new FormData();
      formData.append("purpose", "fine-tune");
      formData.append("file", Buffer.from(fileString), "data_train.jsonl");
      const { data: uploadedFile } = await axios.post(
        "https://api.openai.com/v1/files",
        formData,
        {
          headers: {
            Authorization: `Bearer ${process.env.GPT_3_API_KEY}`,
          },
        }
      );
      return uploadedFile.id;
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

  static async getDataset(companyId) {
    const company = await CompanyModel.findByPk(companyId);
    if (!company) {
      throw new AppError("Công ty của người dùng không tồn tại", 400);
    }
    const datasets = await DataModel.findAll({
      where: {
        [Op.or]: [{ is_default: true }, { company_id: companyId }],
      },
    });

    return datasets;
  }

  static async collectFilesData(fileIds) {
    const files = await DataModel.findAll({
      where: {
        id: fileIds ?? [],
      },
    });
    const fetchStreams = files.map((file) => axios.get(file.cloud_id));
    const contents = await Promise.all(fetchStreams);
    return contents.map((content) => content.data).join("");
  }
}
