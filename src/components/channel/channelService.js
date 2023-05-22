import { Op } from "sequelize";
import ChannelModel from "./channelModel.js";

export default class ChannelService {
  static async createChannel({
    companyId,
    type,
    channelDetailId,
    name,
    imageUrl = null,
  }) {
    const [newChannel] = await ChannelModel.findOrCreate({
      where: {
        company_id: companyId,
        type,
        channel_detail_id: channelDetailId,
      },
      defaults: {
        name,
        image_url: imageUrl,
      },
    });

    return newChannel;
  }

  static async getChannels({ companyId, page, limit, type }) {
    const { count, rows } = await ChannelModel.findAndCountAll({
      where: {
        company_id: companyId,
        type: type ?? {
          [Op.ne]: null,
        },
      },
      limit,
      offset: limit * (page - 1),
    });

    return {
      total_items: count,
      total_pages: Math.ceil(count / limit),
      current_page: page,
      items: rows,
    };
  }

  static async getChannelById(id) {
    const channel = await ChannelModel.findOne({
      where: {
        id,
      },
    });

    return channel;
  }

  static async getChannel({ companyId, type, channelDetailId }) {
    const channel = await ChannelModel.findOne({
      where: {
        company_id: companyId,
        type,
        channel_detail_id: channelDetailId,
      },
    });

    return channel;
  }

  static async deleteChannel({ channelId }) {
    await ChannelModel.destroy({
      where: {
        id: channelId,
      },
      individualHooks: true,
    });
  }
}
