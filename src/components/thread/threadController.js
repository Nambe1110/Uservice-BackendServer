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
      status: StatusType.SUCCESS,
      data: threads,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const getThread = async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await ThreadService.getThreadById(threadId);

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: thread,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const updateThread = async (req, res) => {
  const { threadId } = req.params;
  const { title, imageUrl, isAutoreplyDisabled } = req.body;

  try {
    await ThreadService.updateThread({
      threadId,
      title,
      imageUrl,
      isAutoreplyDisabled,
    });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: null,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const tagUserToThread = async (req, res) => {
  const { user } = req;
  const { userId } = req.body;
  const { threadId } = req.params;

  try {
    await ThreadService.tagUserToThread({
      threadId,
      requester: user,
      userId,
    });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: null,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const markAsResolved = async (req, res) => {
  try {
    await ThreadService.updateResolvedStatus({
      threadId: req.params.threadId,
      isResolved: true,
    });
    return res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const markAsUnresolved = async (req, res) => {
  try {
    await ThreadService.updateResolvedStatus({
      threadId: req.params.threadId,
      isResolved: false,
    });
    return res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
