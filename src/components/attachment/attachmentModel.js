import pkg from "sequelize";
import sequelize from "../../config/database/index.js";
import Message from "../message/messageModel.js";
import { AttachmentType } from "../../constants.js";

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
    },
    url: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.ENUM({
        values: Object.values(AttachmentType),
      }),
    },
  },
  {
    tableName: "attachment",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
  }
);

AttachmentModel.belongsTo(Message);
Message.hasMany(AttachmentModel, {
  onDelete: "CASCADE",
});

AttachmentModel.sync({ logging: false });

export default AttachmentModel;
