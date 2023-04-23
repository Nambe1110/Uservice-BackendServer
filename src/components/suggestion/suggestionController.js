import { StatusType } from "../../constants.js";
import StatusEnum from "../../enums/Status.js";
import SuggestionService from "./suggestionService.js";

export const generateSuggestion = async (req, res) => {
  try {
    const { thread_id: threadId, limit } = req.query;
    const numberOfResponse = Number.parseInt(limit, 10);
    if (Number.isNaN(Number(threadId))) {
      return res.status(400).json({
        status: StatusType.ERROR,
        message: "Id thread không tồn tại",
      });
    }
    const answers = await SuggestionService.generateSuggestion({
      threadId: Number(threadId),
      numberOfResponse: Number.isNaN(numberOfResponse)
        ? undefined
        : numberOfResponse,
      user: req.user,
    });
    return res.status(200).json({
      status: StatusEnum.Success,
      data: answers,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusEnum.Error, message: error.message });
  }
};
