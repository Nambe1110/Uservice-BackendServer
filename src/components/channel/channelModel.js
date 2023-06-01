import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Company from "../company/companyModel.js";
import TelegramBotChannelModel from "./telegram/bot/telegramBotChannelModel.js";
import TelegramUserChannelModel from "./telegram/user/telegramUserChannelModel.js";
import MessengerChannelModel from "./messenger/messengerChannelModel.js";
import ViberChannelModel from "./viber/viberChannelModel.js";
import InstagramChannelModel from "./instagram/instagramChannelModel.js";
import { ChannelType } from "../../constants.js";

const { DataTypes } = pkg;

const ChannelModel = sequelize.define(
  "Channel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Company,
        key: "id",
      },
    },
    type: {
      type: DataTypes.ENUM({
        values: Object.values(ChannelType),
      }),
    },
    channel_detail_id: {
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Channel name is required",
        },
      },
    },
    image_url: {
      type: DataTypes.STRING,
    },
    is_connected: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    profile: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "channel",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Company.hasMany(ChannelModel, {
  onDelete: "CASCADE",
  hooks: true,
});
ChannelModel.belongsTo(Company);

ChannelModel.sync({ logging: false });

ChannelModel.beforeDestroy(async (channel) => {
  const { type, channel_detail_id: channelDetailId } = channel;
  switch (type) {
    case ChannelType.TELEGRAM_BOT:
      await TelegramBotChannelModel.destroy({
        where: {
          id: channelDetailId,
        },
        individualHooks: true,
      });
      break;
    case ChannelType.TELEGRAM_USER:
      await TelegramUserChannelModel.destroy({
        where: {
          id: channelDetailId,
        },
        individualHooks: true,
      });
      break;
    case ChannelType.MESSENGER:
      await MessengerChannelModel.destroy({
        where: {
          id: channelDetailId,
        },
        individualHooks: true,
      });
      break;
    case ChannelType.INSTAGRAM:
      await InstagramChannelModel.destroy({
        where: {
          id: channelDetailId,
        },
        individualHooks: true,
      });
      break;
    case ChannelType.VIBER:
      await ViberChannelModel.destroy({
        where: {
          id: channelDetailId,
        },
        individualHooks: true,
      });
      break;
    default:
      break;
  }
});

export default ChannelModel;
