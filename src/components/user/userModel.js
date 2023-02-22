import pkg from "sequelize";
import sequelize from "../../config/database/index.js";

const { DataTypes } = pkg;

const User = sequelize.define(
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
      allowNull: false,
      validate: {
        notNull: {
          msg: "User is_verified is required",
        },
      },
    },
    is_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      validate: {
        notNull: {
          msg: "User is_locked is required",
        },
      },
    },
    google_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    facebook_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "user",
    charset: "utf8",
    collate: "utf8_unicode_ci",
  }
);

User.sync({ logging: false });

export default User;
