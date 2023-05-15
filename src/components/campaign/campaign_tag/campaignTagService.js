import AppError from "../../../utils/AppError.js";
import CampaignTagModel from "./campaignTagModel.js";
import CampaignModel from "../campaignModel.js";
import TagModel from "../../company/tag/tagModel.js";

export default class CampaignTagService {
  static async createCampaignTagItem({ campaignId, tagId }) {
    const campaign = await CampaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 400);
    }

    const tag = await TagModel.findByPk(tagId);
    if (!tag) {
      throw new AppError("Kênh không tồn tại", 400);
    }

    const campaign_tag = await CampaignTagModel.create({
      campaign_id: campaignId,
      tag_id: tagId,
    });

    return campaign_tag.dataValues;
  }

  static async getSelectedTags({ campaignId }) {
    const allItems = await CampaignTagModel.findAll({
      where: { campaign_id: campaignId },
      include: { model: TagModel },
    });

    const selectedTags = [];
    for (const item of allItems) {
      selectedTags.push(item.Tag);
    }

    return selectedTags;
  }
}
