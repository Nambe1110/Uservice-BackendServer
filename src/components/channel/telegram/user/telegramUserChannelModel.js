import pkg from "sequelize";
import sequelize from "../../../../config/database/index.js";
import CompanyModel from "../../../company/companyModel.js";

const { DataTypes } = pkg;

const TelegramUserChannelModel = sequelize.define(
  "TelegramUserChannel",
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
    },
    phone_number: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "telegram_user_channel",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

TelegramUserChannelModel.sync({ logging: false });

export default TelegramUserChannelModel;
