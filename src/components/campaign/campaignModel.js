import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import User from "../user/userModel.js";
import Company from "../company/companyModel.js";
import { ChannelType } from "../../constants.js";

const { DataTypes } = pkg;

const CampaignModel = sequelize.define(
  "Campaign",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Campaign name is required",
        },
      },
    },
    recent_customer: {
      type: DataTypes.STRING,
      get() {
        if (this.getDataValue("recent_customer")) {
          return this.getDataValue("recent_customer").split(";");
        }
        return this.getDataValue("recent_customer");
      },
      set(val) {
        this.setDataValue("recent_customer", val.join(","));
      },
    },
    channel_type: {
      type: DataTypes.ENUM({
        values: Object.values(ChannelType),
      }),
    },
    send_now: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    send_date: {
      type: DataTypes.DATE,
    },
    content: {
      type: DataTypes.STRING,
    },
    attachments: {
      type: DataTypes.STRING,
      get() {
        if (this.getDataValue("attachments")) {
          return this.getDataValue("attachments").split(";");
        }
        return this.getDataValue("attachments");
      },
      set(val) {
        this.setDataValue("attachments", val.join(";"));
      },
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Company,
        key: "id",
      },
    },
    created_by: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    tableName: "campaign",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

User.hasMany(CampaignModel, { foreignKey: "created_by" });
CampaignModel.belongsTo(User, { foreignKey: "created_by" });

Company.hasMany(CampaignModel, { foreignKey: "company_id" });
CampaignModel.belongsTo(Company, { foreignKey: "company_id" });

CampaignModel.sync({ logging: false });

export default CampaignModel;
