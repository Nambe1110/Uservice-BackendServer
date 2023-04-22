import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";

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
  },
  {
    tableName: "gpt",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

GptModel.sync({ logging: false, alter: true });

export default GptModel;
