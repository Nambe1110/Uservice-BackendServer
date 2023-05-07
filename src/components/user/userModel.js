import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Company from "../company/companyModel.js";

const { DataTypes } = pkg;

const UserModel = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
          msg: "User email is required",
        },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "User password is required",
        },
      },
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    google_token: {
      type: DataTypes.STRING,
    },
    facebook_token: {
      type: DataTypes.STRING,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Company,
        key: "id",
      },
    },
    role: {
      type: DataTypes.STRING,
    },
    phone_number: {
      type: DataTypes.STRING,
    },
    image_url: {
      type: DataTypes.STRING,
      defaultValue:
        "https://uservice-internal-s3-bucket.s3.ap-southeast-1.amazonaws.com/avatar/uservice-default-user-avatar.png",
    },
  },
  {
    tableName: "user",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Company.hasMany(UserModel, { foreignKey: "company_id" });
UserModel.belongsTo(Company, { foreignKey: "company_id" });

UserModel.sync({ logging: false });

export default UserModel;
