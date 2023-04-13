import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Company from "../company/companyModel.js";
import Thread from "../thread/threadModel.js";

const { DataTypes } = pkg;

const CustomerModel = sequelize.define(
  "Customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_api_id: {
      type: DataTypes.STRING,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Company,
        key: "id",
      },
    },
    thread_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Thread,
        key: "id",
      },
    },
    image_url: {
      type: DataTypes.STRING,
    },
    alias: {
      type: DataTypes.STRING,
    },
    first_name: {
      type: DataTypes.STRING,
    },
    last_name: {
      type: DataTypes.STRING,
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    birthday: {
      type: DataTypes.INTEGER,
    },
    address: {
      type: DataTypes.STRING,
    },
    note: {
      type: DataTypes.STRING,
    },
    is_archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    profile: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "customer",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
  }
);

CustomerModel.belongsTo(Company);
Company.hasMany(CustomerModel);

CustomerModel.belongsTo(Thread);
Thread.hasMany(CustomerModel, {
  onDelete: "CASCADE",
});

CustomerModel.sync({ logging: false });

export default CustomerModel;
