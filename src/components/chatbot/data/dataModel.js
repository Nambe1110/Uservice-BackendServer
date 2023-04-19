import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";

const { DataTypes } = pkg;

const DataModel = sequelize.define(
  "Data",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    cloud_id: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "data",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

DataModel.sync({ logging: false });

export default DataModel;
