import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Channel from "../channel/channelModel.js";
import { ThreadType } from "../../constants.js";

const { DataTypes } = pkg;

const ThreadModel = sequelize.define(
  "Thread",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    channel_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Channel,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    thread_api_id: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.ENUM({
        values: Object.values(ThreadType),
      }),
    },
    title: {
      type: DataTypes.STRING,
    },
    image_url: {
      type: DataTypes.STRING,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_replied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "thread",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
  }
);

ThreadModel.belongsTo(Channel);
Channel.hasMany(ThreadModel, {
  onDelete: "CASCADE",
});

ThreadModel.sync({ logging: false });

export default ThreadModel;
