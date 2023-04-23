import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import GptModel from "../gpt/gptModel.js";
import DataModel from "../data/dataModel.js";

const { DataTypes } = pkg;

const GptDataModel = sequelize.define(
  "GptData",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    gpt_id: {
      type: DataTypes.INTEGER,
      references: {
        model: GptModel,
        key: "id",
      },
    },
    data_id: {
      type: DataTypes.INTEGER,
      references: {
        model: DataModel,
        key: "id",
      },
    },
  },
  {
    tableName: "gpt_data",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

GptDataModel.hasMany(GptModel);
GptDataModel.hasMany(DataModel);

GptModel.belongsTo(GptDataModel);
DataModel.belongsTo(GptDataModel);

GptDataModel.sync({ logging: false });
export default GptDataModel;
