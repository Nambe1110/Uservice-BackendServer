import pkg from "sequelize";
import sequelize from "../../../../config/database/index.js";
import CompanyModel from "../../../company/companyModel.js";
import { listCompany } from "../../../../utils/singleton.js";

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
      onDelete: "CASCADE",
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

CompanyModel.hasMany(TelegramUserChannelModel);
TelegramUserChannelModel.belongsTo(CompanyModel);

TelegramUserChannelModel.sync({ logging: false });

TelegramUserChannelModel.beforeDestroy(async (channel) => {
  const { company_id: companyId, phone_number: phoneNumber } = channel;
  const { connection } = listCompany
    .get(companyId)
    .listChannel.telegramUserChannel.get(phoneNumber);
  await connection.disconnect();
  listCompany
    .get(companyId)
    .listChannel.telegramUserChannel.delete(phoneNumber);
});

export default TelegramUserChannelModel;
