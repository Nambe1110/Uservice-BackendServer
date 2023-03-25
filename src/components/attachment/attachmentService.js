import AttachmentModel from "./attachmentModel.js";

export default class AttachmentService {
  static async createAttachment({ messageId, url, type, name }) {
    const newAttachment = await AttachmentModel.create({
      message_id: messageId,
      url,
      type,
      name,
    });

    return newAttachment;
  }
}
