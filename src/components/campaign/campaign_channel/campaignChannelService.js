import AppError from "../../../utils/AppError.js";
import CampaignChannelModel from "./campaignChannelModel.js";
import CampaignModel from "../campaignModel.js";
import ChannelModel from "../../channel/channelModel.js";

export default class CampaignChannelService {
  static async createCampaignChannelItem({ campaignId, channelId }) {
    const campaign = await CampaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 400);
    }

    const channel = await ChannelModel.findByPk(channelId);
    if (!channel) {
      throw new AppError("Kênh không tồn tại", 400);
    }

    const campaign_channel = await CampaignChannelModel.create({
      campaign_id: campaignId,
      channel_id: channelId,
    });

    return campaign_channel.dataValues;
  }

  static async getSelectedChannels({ campaignId }) {
    const allItems = await CampaignChannelModel.findAll({
      where: { campaign_id: campaignId },
      include: { model: ChannelModel },
    });

    const selectedChannels = [];
    for (const item of allItems) {
      selectedChannels.push(item.Channel);
    }

    return selectedChannels;
  }
}
