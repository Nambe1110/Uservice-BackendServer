import pkg from "sequelize";
import sequelize from "../../../../config/database/index.js";
import CompanyModel from "../../../company/companyModel.js";
import { listCompany } from "../../../../utils/singleton.js";

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

CompanyModel.hasMany(TelegramBotChannelModel);
TelegramBotChannelModel.belongsTo(CompanyModel);

TelegramBotChannelModel.sync({ logging: false });

TelegramBotChannelModel.beforeDestroy(async (channel) => {
  const { company_id: companyId, token } = channel;
  const { connection } = listCompany
    .get(companyId)
    .listChannel.telegramBotChannel.get(token);
  await connection.disconnect();
  listCompany.get(companyId).listChannel.telegramBotChannel.delete(token);
});

export default TelegramBotChannelModel;
