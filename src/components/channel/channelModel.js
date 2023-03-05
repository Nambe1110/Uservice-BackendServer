import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Company from "../company/companyModel.js";

const { DataTypes } = pkg;

const ChannelModel = sequelize.define(
  "channel",
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
    name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    source: {
      type: sequelize.ENUM("Email", "Telegram", "Facebook", "Zalo"),
      allowNull: true,
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

ChannelModel.sync({ logging: false });

export default ChannelModel;
