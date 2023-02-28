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
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
    },
  },
  {
    tableName: "company",
    charset: "utf8",
    collate: "utf8_unicode_ci",
  }
);

CompanyModel.sync({ logging: false });

export default CompanyModel;