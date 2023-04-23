import DataModel from "./dataModel.js";

export class DataService {
  static async upload({ file, user }) {
    // TODO (Loc): upload to open ai server here

    const uploadedFile = file;
    const newFile = await DataModel.create({
      cloud_id: uploadedFile.id,
      name: uploadedFile.filename,
      bytes: uploadedFile.bytes,
      company_id: user.company_id,
    });
    return newFile.dataValues;
  }
}
