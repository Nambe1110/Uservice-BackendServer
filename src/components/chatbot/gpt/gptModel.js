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
  },
  {
    tableName: "gpt",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

GptModel.sync({ logging: false });

export default GptModel;
