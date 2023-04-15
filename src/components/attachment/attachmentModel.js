import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Message from "../message/messageModel.js";

const { DataTypes } = pkg;

const AttachmentModel = sequelize.define(
  "Attachment",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    message_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Message,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    url: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "attachment",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

AttachmentModel.sync({ logging: false });

export default AttachmentModel;
