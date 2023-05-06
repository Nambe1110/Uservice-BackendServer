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
    train_id: {
      type: DataTypes.STRING,
    },
    is_training: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: CompanyModel,
        key: "id",
      },
    },
    is_using: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
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

CompanyModel.hasMany(GptModel, {
  hooks: true,
  onDelete: "CASCADE",
});
GptModel.belongsTo(CompanyModel);
GptModel.sync({ logging: false });

export default GptModel;
