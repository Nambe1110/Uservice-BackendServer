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
      defaultValue: 7,
    },
    send_now: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    send_date: {
      type: DataTypes.BIGINT,
    },
    content: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Campaign content is required",
        },
      },
    },
    attachments: {
      type: DataTypes.TEXT,
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
User.beforeDestroy(async (user) => {
  await CampaignModel.update(
    { created_by: null },
    { where: { created_by: user.id } }
  );
});

Company.hasMany(CampaignModel, { foreignKey: "company_id" });
CampaignModel.belongsTo(Company, { foreignKey: "company_id" });
Company.beforeDestroy(async (company) => {
  await CampaignModel.destroy({
    where: {
      company_id: company.id,
    },
    individualHooks: true,
  });
});
Company.beforeDestroy(async (company) => {
  await CampaignModel.destroy({ where: { company_id: company.id } });
});

CampaignModel.sync({ logging: false });

export default CampaignModel;
