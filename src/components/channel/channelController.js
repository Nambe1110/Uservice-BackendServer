import ChannelService from "./channelService.js";
import { StatusType } from "../../constants.js";

export const getChannels = async (req, res) => {
  const { user } = req;
  const { type } = req.query;
  const { page = 1, limit = 20 } = req.query;

  try {
    const channels = await ChannelService.getChannels({
      companyId: user.company_id,
      type,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      data: channels,
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};

export const deleteChannel = async (req, res) => {
  const { channelId } = req.params;

  try {
    await ChannelService.deleteChannel({ channelId });

    return res.status(200).json({
      status: StatusType.SUCCESS,
      message: "Channel deleted successfully",
    });
  } catch (error) {
    return res
      .status(error.code ?? 500)
      .json({ status: StatusType.ERROR, message: error.message });
  }
};
