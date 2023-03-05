import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Company from "../company/companyModel.js";
import Channel from "../channel/channelModel.js";

const { DataTypes } = pkg;

const CustomerModel = sequelize.define(
  "customer",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Company,
        key: "id",
      },
    },
    channel_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Channel,
        key: "id",
      },
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "customer email is required",
        },
      },
    },
    phone_number: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    birthday: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    note: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      default:
        "https://shop.phuongdonghuyenbi.vn/wp-content/uploads/avatars/1510/default-avatar-bpthumb.png",
      allowNull: true,
    },
  },
  {
    tableName: "customer",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

CustomerModel.sync({ logging: false });

export default CustomerModel;
