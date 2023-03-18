import pkg from "sequelize";
import sequelize from "../../config/database/index.js";

const { DataTypes } = pkg;

const CompanyModel = sequelize.define(
  "Company",
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
          msg: "Company name is required",
        },
      },
    },
    image_url: {
      type: DataTypes.STRING,
      default:
        "http://uservicebackendtestserver-env.eba-43rm8vge.ap-southeast-1.elasticbeanstalk.com/api/image/uservice-default-company-avatar.png",
      allowNull: false,
    },
    invite_code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Invite code is required",
        },
      },
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "company",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

CompanyModel.sync({ logging: false });

export default CompanyModel;
