import ThreadService from "./threadService.js";
import { StatusType } from "../../constants.js";

export const getThreads = async (req, res) => {
  const { lastThreadId, limit = 20 } = req.query;
  const { user } = req;

  try {
    const threads = await ThreadService.getThreads({
      companyId: user.company_id,
      lastThreadId: parseInt(lastThreadId),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      status: "success",
      data: threads,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
