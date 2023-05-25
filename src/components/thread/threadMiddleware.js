import ThreadService from "./threadService.js";
import { StatusType } from "../../constants.js";
import AppError from "../../utils/AppError.js";

export const verifyThreadId = async (req, res, next) => {
  const { user } = req;
  const { threadId } = req.params;

  try {
    const thread = await ThreadService.getThreadById(threadId);

    if (!thread || thread.company_id !== user.company_id) {
      throw new AppError("Thread not found", 404);
    }

    return next();
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
