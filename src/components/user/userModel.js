import pkg from "sequelize";
import sequelize from "../../config/database/index.js";

const { DataTypes } = pkg;

const UserModel = sequelize.define(
  "user",
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
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
    },
    google_token: {
      type: DataTypes.STRING,
    },
    facebook_token: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "user",
    charset: "utf8",
    collate: "utf8_unicode_ci",
  }
);

UserModel.sync({ logging: false });

export default UserModel;
