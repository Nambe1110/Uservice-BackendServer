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
    is_resolved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_autoreply_disabled: {
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
  }
);

Channel.hasMany(ThreadModel, {
  onDelete: "CASCADE",
  hooks: true,
});
ThreadModel.belongsTo(Channel);

ThreadModel.sync({ logging: false });

export default ThreadModel;
