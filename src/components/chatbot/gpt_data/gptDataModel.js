import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";

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
    },
    data_id: {
      type: DataTypes.INTEGER,
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

GptDataModel.sync({ logging: false });

export default GptDataModel;
