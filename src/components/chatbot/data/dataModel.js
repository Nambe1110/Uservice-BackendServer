import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import CompanyModel from "../../company/companyModel.js";

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
    bytes: {
      type: DataTypes.INTEGER,
    },
    is_default: {
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
    description: {
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

CompanyModel.hasMany(DataModel, {
  hooks: true,
  onDelete: "CASCADE",
});
DataModel.belongsTo(CompanyModel);

DataModel.sync({ logging: false });

export default DataModel;
