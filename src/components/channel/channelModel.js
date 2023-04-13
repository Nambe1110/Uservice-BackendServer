import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Company from "../company/companyModel.js";
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
  },
  {
    tableName: "channel",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
  }
);

ChannelModel.belongsTo(Company);
Company.hasMany(ChannelModel);

ChannelModel.sync({ logging: false });

export default ChannelModel;
