import AppError from "../../utils/AppError.js";
import CampaignModel from "./campaignModel.js";
import UserModel from "../user/userModel.js";
import { ChannelType } from "../../constants.js";

export default class CampaignService {
  static async createCampaign({
    user,
    name,
    channel,
    sendNow,
    sendDate,
    content,
    attachments,
  }) {
    if (!name) {
      throw new AppError("Tên chiến dịch không thể null", 400);
    }

    const values = Object.values(ChannelType);
    if (!channel || !values.includes(channel)) {
      throw new AppError("Kênh bằng null hoặc không tồn tại", 400);
    }

    sendNow = sendNow === "true";
    let sendDateValue = null;
    // Throw error when sendNow: true and sendDate string is not null
    if (sendDate && sendNow) {
      throw new AppError(
        "Không thể tùy chỉnh thời gian gửi(send_date) trong chế độ gửi ngay lập tức(sendNow: true)",
        400
      );
    }
    if (sendDate) {
      sendDateValue = new Date(sendDate);
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
      channel_type: channel,
      send_now: sendNow,
      send_date: sendDateValue,
      content,
      attachments,
      company_id: user.company_id,
      created_by: user.id,
    });

    const campaign = await CampaignModel.findOne({
      where: { id: newCampaign.id },
      include: { model: UserModel },
    });
    delete campaign.dataValues.User.password;
    return campaign.dataValues;
  }

  static async getCampaignById({ user, id }) {
    const campaign = await CampaignModel.findOne({
      where: { id },
      include: { model: UserModel },
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
    delete campaign.dataValues.User.password;
    return campaign.dataValues;
  }

  static async getAllCampaignsOfCompany({ user, limit, page }) {
    const allCampaigns = await CampaignModel.findAndCountAll({
      where: { company_id: user.company_id },
    });
    const totalItems = allCampaigns.count;
    const totalPages = Math.ceil(totalItems / limit);

    const campaigns = await CampaignModel.findAll({
      where: { company_id: user.company_id },
      include: { model: UserModel },
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

  static async updateCampaignDetails({
    user,
    id,
    name,
    channel,
    sendNow,
    sendDate,
    content,
    attachments,
  }) {
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

    if (!name) {
      throw new AppError("Tên chiến dịch không thể null", 400);
    }

    const values = Object.values(ChannelType);
    if (!channel || !values.includes(channel)) {
      throw new AppError("Kênh bằng null hoặc không tồn tại", 400);
    }

    sendNow = sendNow === "true";
    let sendDateValue = null;
    // Throw error when sendNow: true and sendDate string is not null
    if (sendDate && sendNow) {
      throw new AppError(
        "Không thể tùy chỉnh thời gian gửi(send_date) trong chế độ gửi ngay lập tức(sendNow: true)",
        400
      );
    }
    if (sendDate) {
      sendDateValue = new Date(sendDate);
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
    oldCampaign.channel_type = channel;
    oldCampaign.send_now = sendNow;
    oldCampaign.send_date = sendDateValue;
    oldCampaign.content = content;
    oldCampaign.attachments = attachments;

    const updatedCampaign = await oldCampaign.save();

    const campaign = await CampaignModel.findOne({
      where: { id: updatedCampaign.id },
      include: { model: UserModel },
    });
    delete campaign.dataValues.User.password;
    return campaign.dataValues;
  }
}
