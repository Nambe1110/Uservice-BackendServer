import logger from "../config/logger.js";
import { AttachmentType } from "../constants.js";

const mappingType = new Map([
  ["jpg", AttachmentType.IMAGE],
  ["jpeg", AttachmentType.IMAGE],
  ["png", AttachmentType.IMAGE],
  ["gif", AttachmentType.IMAGE],
  ["svg", AttachmentType.IMAGE],
  ["webp", AttachmentType.IMAGE],
  ["bmp", AttachmentType.IMAGE],
  ["tiff", AttachmentType.IMAGE],
  ["tif", AttachmentType.IMAGE],
  ["jfif", AttachmentType.IMAGE],
  ["pjpeg", AttachmentType.IMAGE],
  ["pjp", AttachmentType.IMAGE],
  ["mp4", AttachmentType.VIDEO],
  ["webm", AttachmentType.VIDEO],
  ["ogg", AttachmentType.VIDEO],
  ["mp3", AttachmentType.AUDIO],
  ["wav", AttachmentType.AUDIO],
  ["flac", AttachmentType.AUDIO],
  ["aac", AttachmentType.AUDIO],
  ["opus", AttachmentType.AUDIO],
]);

const parseFullName = (fullName) => {
  const firstName = fullName.split(" ").slice(0, -1).join(" ");
  const lastName = fullName.split(" ").slice(-1).join(" ");

  return {
    firstName,
    lastName,
  };
};

const parseFileUrl = async (url) => {
  if (!url) return null;
  const filename = new URL(url).pathname.split("/").pop();

  try {
    const extension = filename.split(".").pop();
    let attachmentType;

    if (mappingType.has(extension)) attachmentType = mappingType.get(extension);
    else attachmentType = AttachmentType.FILE;

    logger.info(mappingType.has(extension));
    logger.info(mappingType[extension]);
    logger.info(`Attachment type: ${attachmentType}`);

    return {
      url,
      name: filename,
      type: attachmentType,
    };
  } catch (error) {
    logger.log(error);
  }
};

export { parseFullName, parseFileUrl };
