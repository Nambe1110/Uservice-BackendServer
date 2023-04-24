import pkg from "sequelize";
import axios from "axios";
import sequelize from "../../../config/database/index.js";
import CompanyModel from "../../company/companyModel.js";
import logger from "../../../config/logger/index.js";

const { DataTypes } = pkg;

const MessengerChannelModel = sequelize.define(
  "MessengerChannel",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: CompanyModel,
        key: "id",
      },
    },
    page_id: {
      type: DataTypes.STRING,
    },
    page_access_token: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "messenger_channel",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
    paranoid: true,
  }
);

MessengerChannelModel.belongsTo(CompanyModel);
CompanyModel.hasMany(MessengerChannelModel, {
  onDelete: "CASCADE",
});

MessengerChannelModel.sync({ logging: false });

MessengerChannelModel.beforeDestroy(async (channel) => {
  const { page_id } = channel;
  try {
    await axios.delete(
      `${process.env.GRAPH_API_URL}/${page_id}/subscribed_apps`,
      {
        params: {
          access_token: `${process.env.FACEBOOK_APP_ID}|${process.env.FACEBOOK_APP_SECRET}`,
        },
      }
    );
  } catch (error) {
    logger.error(error.response.data);
  }
});

export default MessengerChannelModel;
