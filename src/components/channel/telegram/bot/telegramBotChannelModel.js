import pkg from "sequelize";
import sequelize from "../../../../config/database/index.js";
import CompanyModel from "../../../company/companyModel.js";

const { DataTypes } = pkg;

const TelegramBotChannelModel = sequelize.define(
  "TelegramBotChannel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: CompanyModel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    token: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "telegram_bot_channel",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

TelegramBotChannelModel.sync({ logging: false });

export default TelegramBotChannelModel;
