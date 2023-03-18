import StatusEnum from "../../enums/Status.js";
import SuggestionService from "./suggestionService.js";

export const generateSuggestion = async (req, res) => {
  try {
    const { question, limit } = req.query;
    const numberOfResponse = Number.parseInt(limit, 10);
    const answers = await SuggestionService.generateSuggestion({
      question,
      numberOfResponse: Number.isNaN(numberOfResponse)
        ? undefined
        : numberOfResponse,
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
