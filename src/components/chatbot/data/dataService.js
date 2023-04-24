import axios from "axios";
import FormData from "form-data";
import DataModel from "./dataModel.js";

export class DataService {
  static async upload({ file, user, fileName }) {
    const formData = new FormData();
    formData.append("purpose", "fine-tune");
    formData.append("file", Buffer.from(file.buffer), fileName);
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
  }
}
