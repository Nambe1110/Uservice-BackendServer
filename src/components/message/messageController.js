import MessageService from "./messageService.js";
import { StatusType } from "../../constants.js";

export const getMessages = async (req, res) => {
  const { user } = req;
  const { threadId } = req.params;
  const { lastMessageId, limit = 20 } = req.query;

  try {
    const messages = await MessageService.getMessages({
      companyId: user.company_id,
      threadId,
      lastMessageId,
      limit,
    });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: messages,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
