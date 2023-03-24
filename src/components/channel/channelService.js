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

    return newChannel.dataValues;
  }

  static async getChannels({ companyId }) {
    const channels = await ChannelModel.findAll({
      where: {
        company_id: companyId,
      },
    });

    return channels;
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
}
