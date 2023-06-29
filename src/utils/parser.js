import axios from "axios";
import logger from "../config/logger.js";
import { AttachmentType } from "../constants.js";

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
    const response = await axios.get(url);
    const contentType = response.headers["content-type"].split("/")[0];
    let attachmentType;

    if (contentType === "image") attachmentType = AttachmentType.IMAGE;
    else if (contentType === "video") attachmentType = AttachmentType.VIDEO;
    else if (contentType === "audio") attachmentType = AttachmentType.AUDIO;
    else attachmentType = AttachmentType.FILE;

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
