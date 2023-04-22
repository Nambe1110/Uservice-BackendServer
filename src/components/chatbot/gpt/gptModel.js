import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import CompanyModel from "../../company/companyModel.js";

const { DataTypes } = pkg;

const GptModel = sequelize.define(
  "Gpt",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: CompanyModel,
        key: "id",
      },
    },
  },
  {
    tableName: "gpt",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

CompanyModel.hasMany(GptModel);
GptModel.belongsTo(CompanyModel);

GptModel.sync({ logging: false });

export default GptModel;
