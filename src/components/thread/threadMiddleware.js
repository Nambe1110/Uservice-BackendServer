import ThreadService from "./threadService.js";
import { StatusType } from "../../constants.js";
import UserService from "../user/userService.js";
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

export const handleTagUserToThread = async (req, res, next) => {
  const { user } = req;
  const { userId } = req.body;

  try {
    /* eslint eqeqeq: "off" */
    if (user.id == userId)
      throw new AppError("Cannot tag yourself to the thread", 400);

    const taggedUser = await UserService.getUserById(userId);

    if (!taggedUser) throw new AppError("User not found", 404);

    if (taggedUser.company_id !== user.company_id)
      throw new AppError("User not in the same company", 400);

    return next();
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
