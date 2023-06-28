import { Sequelize } from "sequelize";
import AppError from "../../utils/AppError.js";
import CampaignModel from "./campaignModel.js";
import UserModel from "../user/userModel.js";
import ChannelModel from "../channel/channelModel.js";
import CampaignChannelService from "./campaign_channel/campaignChannelService.js";
import CampaignChannelModel from "./campaign_channel/campaignChannelModel.js";
import CampaignTagService from "./campaign_tag/campaignTagService.js";
import CampaignTagModel from "./campaign_tag/campaignTagModel.js";
import TagModel from "../company/tag/tagModel.js";
import { addJobToCompaignQueue } from "../../modules/queue.js";
import { ChannelType } from "../../constants.js";
import TelegramUserChannelService from "../channel/telegram/user/telegramUserChannelService.js";
import TelegramBotChannelService from "../channel/telegram/bot/telegramBotChannelService.js";
import MessengerChannelService from "../channel/messenger/messengerChannelService.js";
import ViberChannelService from "../channel/viber/viberChannelService.js";
import InstagramChannelService from "../channel/instagram/instagramChannelService.js";
import { parseFileUrl } from "../../utils/parser.js";

const { Op } = Sequelize;

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
    dayDiff,
    skipUnresolvedThread,
  }) {
    if (!sendDate && !sendNow) {
      throw new AppError(
        "Send_date không thể null khi send_now null hoặc false",
        400
      );
    }

    if (!name || !content) {
      throw new AppError("Tên chiến dịch và nội dung không thể null", 400);
    }
    if (!channels) {
      throw new AppError("Kênh không thể null", 400);
    }

    await Promise.all(
      channels?.map(async (channelId) => {
        const existedChannel = await ChannelModel.findByPk(channelId);
        if (!existedChannel) {
          throw new AppError(`Id kênh: ${channelId} không tồn tại`, 400);
        }
      })
    );

    if (tags)
      await Promise.all(
        tags?.map(async (tagId) => {
          const existedTag = await TagModel.findByPk(tagId);
          if (!existedTag) {
            throw new AppError(`Id tag: ${tagId} không tồn tại`, 400);
          }
        })
      );

    const sendDateValue = sendNow ? Math.floor(Date.now() / 1000) : sendDate;

    // Regex to validate whether link is from S3
    const s3UrlRegex =
      /(https?:\/\/)(uservice-internal-s3-bucket\.)(s3\.)(ap-southeast-1)\.amazonaws\.com*/g;
    if (attachments) {
      if (!attachments.match(s3UrlRegex)) {
        throw new AppError("URL không xuất phát từ Uservice S3 bucket. ", 400);
      }
    }

    const newCampaign = await CampaignModel.create({
      name,
      send_date: sendDateValue,
      content,
      attachments,
      company_id: user.company_id,
      created_by: user.id,
      tags,
      and_filter: andFilter,
      day_diff: dayDiff,
      skip_unresolved_thread: skipUnresolvedThread,
    });

    await Promise.all(
      channels?.map(async (channelId) => {
        await CampaignChannelService.createCampaignChannelItem({
          campaignId: newCampaign.id,
          channelId,
        });
      })
    );

    if (tags)
      await Promise.all(
        tags?.map(async (tagId) => {
          await CampaignTagService.createCampaignTagItem({
            campaignId: newCampaign.id,
            tagId,
          });
        })
      );

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

    addJobToCompaignQueue({
      campaignId: campaign.id,
      delay: sendDateValue - Math.floor(Date.now() / 1000),
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
        400
      );
    }

    return campaign;
  }

  static async getAllCampaignsOfCompany({
    user,
    limit,
    page,
    name,
    sortBy,
    sortOrder,
    isSent,
  }) {
    const whereObject = {
      company_id: user.company_id,
    };

    if (name) {
      whereObject.name = {
        [Op.like]: `%${name}%`,
      };
    }

    if (isSent !== null && isSent !== undefined)
      whereObject.is_sent = isSent.toLowerCase() === "true";

    const order = [];
    if (sortOrder && sortOrder.toUpperCase() !== "ASC") {
      sortOrder = "DESC";
    }
    if (sortBy) {
      if (
        sortBy.toLowerCase() === "name" ||
        sortBy.toLowerCase() === "send_date"
      ) {
        order.push([`${sortBy.toLowerCase()}`, `${sortOrder.toUpperCase()}`]);
      }
    }
    const totalItems = await CampaignModel.count({
      where: whereObject,
    });
    const totalPages = Math.ceil(totalItems / limit);

    const campaigns = await CampaignModel.findAll({
      where: whereObject,
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
      order,
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
        400
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
    if (oldCampaign.company_id !== user.company_id) {
      throw new AppError(
        "Bạn phải có quyền 'Manager' hoặc 'Owner' của công ty sở hữu chiến dịch để cập nhật thông tin chiến dịch",
        400
      );
    }

    if (!name || !content) {
      throw new AppError("Tên chiến dịch và nội dung không thể null", 400);
    }

    // Regex to validate whether link is from S3
    const s3UrlRegex =
      /(https?:\/\/)(uservice-internal-s3-bucket\.)(s3\.)(ap-southeast-1)\.amazonaws\.com*/g;
    if (attachments) {
      if (!attachments.match(s3UrlRegex)) {
        throw new AppError("URL không xuất phát từ Uservice S3 bucket. ", 400);
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

  static async sendCampaign(campaignId) {
    const campaign = await CampaignModel.findByPk(campaignId);
    if (!campaign) return;
    const attachment = campaign.attachments
      ? [await parseFileUrl(campaign.attachments)]
      : [];

    const selectedChannels = await CampaignChannelService.getSelectedChannels({
      campaignId: campaign.id,
    });

    const tags = await CampaignTagService.getSelectedTags({
      campaignId: campaign.id,
    });

    await Promise.allSettled(
      selectedChannels.map(async (channel) => {
        const sendObject = {
          companyId: campaign.company_id,
          channelId: channel.id,
          channelDetailId: channel.channel_detail_id,
          content: campaign.content,
          attachment,
          dayDiff: campaign.day_diff,
          tags,
          andFilter: campaign.and_filter,
          skipUnresolvedThread: campaign.skip_unresolved_thread,
        };

        switch (channel.type) {
          case ChannelType.TELEGRAM_USER:
            await TelegramUserChannelService.sendCampaign(sendObject);
            break;
          case ChannelType.TELEGRAM_BOT:
            await TelegramBotChannelService.sendCampaign(sendObject);
            break;
          case ChannelType.MESSENGER:
            await MessengerChannelService.sendCampaign(sendObject);
            break;
          case ChannelType.INSTAGRAM:
            await InstagramChannelService.sendCampaign(sendObject);
            break;
          case ChannelType.VIBER:
            await ViberChannelService.sendCampaign(sendObject);
            break;
          default:
            break;
        }
      })
    );

    campaign.is_sent = true;
    await campaign.save();
  }
}
