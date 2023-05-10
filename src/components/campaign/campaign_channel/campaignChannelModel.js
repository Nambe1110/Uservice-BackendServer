import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import User from "../../user/userModel.js";
import Campaign from "../campaignModel.js";
import Channel from "../../channel/channelModel.js";

const { DataTypes } = pkg;

const CampaignChannelModel = sequelize.define(
  "Campaign_Channel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      validate: {
        notNull: {
          msg: "campaign_id is required",
        },
      },
      references: {
        model: Campaign,
        key: "id",
      },
    },
    channel_id: {
      type: DataTypes.INTEGER,
      validate: {
        notNull: {
          msg: "channel_id is required",
        },
      },
      references: {
        model: Channel,
        key: "id",
      },
    },
  },
  {
    tableName: "campaign_channel",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Campaign.hasMany(CampaignChannelModel, { foreignKey: "campaign_id" });
CampaignChannelModel.belongsTo(Campaign, { foreignKey: "campaign_id" });

Channel.hasMany(CampaignChannelModel, { foreignKey: "channel_id" });
CampaignChannelModel.belongsTo(Channel, { foreignKey: "channel_id" });

Campaign.belongsToMany(Channel, { through: "CampaignChannelModel" });
Channel.belongsToMany(Campaign, { through: "CampaignChannelModel" });

CampaignChannelModel.sync({ logging: false });

export default CampaignChannelModel;
