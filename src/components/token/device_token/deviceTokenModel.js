import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import User from "../../user/userModel.js";

const { DataTypes } = pkg;

const DeviceTokenModel = sequelize.define(
  "DeviceToken",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      references: {
        model: User,
        key: "id",
      },
    },
    token: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "device_token",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

User.hasMany(DeviceTokenModel, {
  onDelete: "CASCADE",
  hooks: true,
});
DeviceTokenModel.belongsTo(User);

DeviceTokenModel.sync({ logging: false });

export default DeviceTokenModel;
