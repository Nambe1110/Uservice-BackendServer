import AppError from "../../utils/AppError.js";
import CampaignModel from "./campaignModel.js";
import UserModel from "../user/userModel.js";
import ChannelModel from "../channel/channelModel.js";
import CampaignChannelService from "./campaign_channel/campaignChannelService.js";
import CampaignChannelModel from "./campaign_channel/campaignChannelModel.js";
import CampaignTagService from "./campaign_tag/campaignTagService.js";
import CampaignTagModel from "./campaign_tag/campaignTagModel.js";
import TagModel from "../company/tag/tagModel.js";

export default class CampaignService {
  static async createCampaign({
    user,
    name,
    sendNow,
    sendDate,
    content,
    channels,
    attachments,
    tags,
    andFilter,
  }) {
    if (!name || !content) {
      throw new AppError("Tên chiến dịch và nội dung không thể null", 400);
    }

    for (const channelId of channels) {
      const existedChannel = await ChannelModel.findByPk(channelId);
      if (!existedChannel) {
        throw new AppError(`Id kênh: ${channelId} không tồn tại`, 400);
      }
    }

    for (const tagId of tags) {
      const existedTag = await TagModel.findByPk(tagId);
      if (!existedTag) {
        throw new AppError(`Id tag: ${tagId} không tồn tại`, 400);
      }
    }

    // Convert sendNow, orFilter from string to boolean
    sendNow = sendNow === "true";
    andFilter = andFilter === "true";
    let sendDateValue = null;
    // Throw error when sendNow: true and sendDate string is not null
    if (sendDate && sendNow) {
      throw new AppError(
        "Không thể tùy chỉnh thời gian gửi(send_date) trong chế độ gửi ngay lập tức(sendNow: true)",
        400
      );
    }
    if (!sendDate && !sendNow) {
      throw new AppError(
        "Send_date không thể null khi send_now null hoặc false",
        400
      );
    }
    if (sendDate) {
      sendDateValue = BigInt(sendDate);
    }

    // Regex to validate whether link is image url or not
    const imageUrlRegex =
      /(http(s?):)([/|.|\w|\s|-])*\.(?:jpe?g|gif|png|svg|bmp)/g;
    if (attachments) {
      let isImageUrl;
      // eslint-disable-next-line no-unneeded-ternary
      const isAllImageUrl = attachments[0].match(imageUrlRegex) ? true : false;
      for (const element of attachments) {
        // eslint-disable-next-line no-unneeded-ternary
        isImageUrl = element.match(imageUrlRegex) ? true : false;
        if (isAllImageUrl !== isImageUrl) {
          throw new AppError(
            "Tất cả các tệp đính kèm phải là ảnh hoặc file(không thể chứa ảnh và file lẫn lộn)",
            400
          );
        }
      }
    }

    const newCampaign = await CampaignModel.create({
      name,
      send_now: sendNow,
      send_date: sendDateValue,
      content,
      attachments,
      company_id: user.company_id,
      created_by: user.id,
      tags,
      andFilter,
    });

    for (const channelId of channels) {
      await CampaignChannelService.createCampaignChannelItem({
        campaignId: newCampaign.id,
        channelId,
      });
    }

    for (const tagId of tags) {
      await CampaignTagService.createCampaignTagItem({
        campaignId: newCampaign.id,
        tagId,
      });
    }

    const campaign = await CampaignModel.findOne({
      where: { id: newCampaign.id },
      include: [
        { model: UserModel },
        {
          model: CampaignChannelModel,
          include: [ChannelModel],
          attributes: {
            exclude: ["campaign_id", "channel_id", "created_at", "updated_at"],
          },
        },
        {
          model: CampaignTagModel,
          include: [TagModel],
          attributes: {
            exclude: ["campaign_id", "tag_id", "created_at", "updated_at"],
          },
        },
      ],
      attributes: {
        exclude: ["password"],
      },
    });

    return campaign;
  }

  static async getCampaignById({ user, id }) {
    const campaign = await CampaignModel.findOne({
      where: { id },
      include: [
        { model: UserModel },
        {
          model: CampaignChannelModel,
          include: [ChannelModel],
          attributes: {
            exclude: ["campaign_id", "channel_id", "created_at", "updated_at"],
          },
        },
        {
          model: CampaignTagModel,
          include: [TagModel],
          attributes: {
            exclude: ["campaign_id", "tag_id", "created_at", "updated_at"],
          },
        },
      ],
      attributes: {
        exclude: ["password"],
      },
    });
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 400);
    }

    if (Number.parseInt(campaign.company_id, 10) !== user.company_id) {
      throw new AppError(
        "Bạn phải thuộc công ty sở hữu chiến dịch để xem được thông tin chi tiết",
        401
      );
    }

    return campaign;
  }

  static async getAllCampaignsOfCompany({ user, limit, page }) {
    const allCampaigns = await CampaignModel.findAndCountAll({
      where: { company_id: user.company_id },
    });
    const totalItems = allCampaigns.count;
    const totalPages = Math.ceil(totalItems / limit);

    const campaigns = await CampaignModel.findAll({
      where: { company_id: user.company_id },
      include: [
        { model: UserModel },
        {
          model: CampaignChannelModel,
          include: [ChannelModel],
          attributes: {
            exclude: ["campaign_id", "channel_id", "created_at", "updated_at"],
          },
        },
        {
          model: CampaignTagModel,
          include: [TagModel],
          attributes: {
            exclude: ["campaign_id", "tag_id", "created_at", "updated_at"],
          },
        },
      ],
      attributes: {
        exclude: ["password"],
      },
      limit,
      offset: limit * (page - 1),
    });

    return {
      total_items: totalItems,
      total_pages: totalPages,
      current_page: page,
      items: campaigns,
    };
  }

  static async deleteCampaign(user, campaignId) {
    const campaign = await CampaignModel.findByPk(campaignId);
    if (!campaign) {
      throw new AppError("Chiến dịch không tồn tại", 400);
    }
    if (Number.parseInt(campaign.company_id, 10) !== user.company_id) {
      throw new AppError(
        "Bạn phải có quyền 'Manager' hoặc 'Owner' của công ty sở hữu chiến dịch để xóa chiến dịch",
        401
      );
    }
    await campaign.destroy();
  }

  static async updateCampaignDetails({ user, id, name, content, attachments }) {
    const oldCampaign = await CampaignModel.findOne({
      where: { id },
    });
    if (!oldCampaign) {
      throw new AppError("Chiến dịch không tồn tại", 400);
    }
    if (Number.parseInt(oldCampaign.company_id, 10) !== user.company_id) {
      throw new AppError(
        "Bạn phải có quyền 'Manager' hoặc 'Owner' của công ty sở hữu chiến dịch để cập nhật thông tin chiến dịch",
        401
      );
    }

    if (!name || !content) {
      throw new AppError("Tên chiến dịch và nội dung không thể null", 400);
    }

    // Regex to validate whether link is image url or not
    const imageUrlRegex =
      /(http(s?):)([/|.|\w|\s|-])*\.(?:jpe?g|gif|png|svg|bmp)/g;
    if (attachments) {
      let isImageUrl;
      // eslint-disable-next-line no-unneeded-ternary
      const isAllImageUrl = attachments[0].match(imageUrlRegex) ? true : false;
      for (const element of attachments) {
        // eslint-disable-next-line no-unneeded-ternary
        isImageUrl = element.match(imageUrlRegex) ? true : false;
        if (isAllImageUrl !== isImageUrl) {
          throw new AppError(
            "Tất cả các tệp đính kèm phải là ảnh hoặc file(không thể chứa ảnh và file lẫn lộn)",
            400
          );
        }
      }
    }

    oldCampaign.name = name;
    oldCampaign.content = content;
    oldCampaign.attachments = attachments;

    const updatedCampaign = await oldCampaign.save();

    const campaign = await CampaignModel.findOne({
      where: { id: updatedCampaign.id },
      include: { model: UserModel },
    });
    const selectedChannels = await CampaignChannelService.getSelectedChannels({
      campaignId: campaign.id,
    });

    delete campaign.dataValues.User.password;
    return { campaign: campaign.dataValues, channels: selectedChannels };
  }
}
