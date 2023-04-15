import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Thread from "../thread/threadModel.js";

const { DataTypes } = pkg;

const MessageModel = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    thread_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Thread,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    message_api_id: {
      type: DataTypes.STRING,
    },
    replied_message_id: {
      type: DataTypes.INTEGER,
    },
    sender_type: {
      type: DataTypes.STRING,
    },
    sender_id: {
      type: DataTypes.INTEGER,
    },
    content: {
      type: DataTypes.STRING,
    },
    timestamp: {
      type: DataTypes.INTEGER,
    },
  },
  {
    tableName: "message",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

MessageModel.sync({ logging: false });

export default MessageModel;
