import ChannelService from "./channelService.js";
import { StatusType } from "../../constants.js";

export const getChannels = async (req, res) => {
  const { user } = req;
  const { page = 1, limit = 20 } = req.query;

  try {
    const channels = await ChannelService.getChannels({
      companyId: user.company_id,
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
