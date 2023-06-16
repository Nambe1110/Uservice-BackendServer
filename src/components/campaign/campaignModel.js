import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import User from "../user/userModel.js";
import Company from "../company/companyModel.js";

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
    day_diff: {
      type: DataTypes.INTEGER.UNSIGNED,
      defaultValue: 0,
    },
    send_date: {
      type: DataTypes.BIGINT,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Campaign content is required",
        },
      },
    },
    and_filter: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attachments: {
      type: DataTypes.TEXT,
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Company id is required",
        },
      },
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
    is_sent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    skip_unresolved_thread: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

User.hasMany(CampaignModel, {
  foreignKey: "created_by",
});
CampaignModel.belongsTo(User, {
  foreignKey: "created_by",
});

Company.hasMany(CampaignModel, {
  onDelete: "CASCADE",
  hooks: true,
});
CampaignModel.belongsTo(Company);

CampaignModel.sync({ logging: false });

export default CampaignModel;
