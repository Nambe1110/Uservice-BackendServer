import AppError from "../../../utils/AppError.js";
import CampaignChannelModel from "./campaignChannelModel.js";
import CampaignModel from "../campaignModel.js";
import ChannelModel from "../../channel/channelModel.js";

export default class CampaignChannelService {
  static async createCampaign({ campaignId, channelId }) {
    const campaign = await CampaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 400);
    }

    const channel = await ChannelModel.findByPk(channelId);
    if (!channel) {
      throw new AppError("Kênh không tồn tại", 400);
    }

    const campaign_channel = await CampaignChannelModel.findOne({
      where: {
        campaign_id: campaignId,
        channel_id: channelId,
      },
    });
    if (campaign_channel) {
      throw new AppError("campaign_channel đã tồn tại", 400);
    }

    return campaign.dataValues;
  }
}
