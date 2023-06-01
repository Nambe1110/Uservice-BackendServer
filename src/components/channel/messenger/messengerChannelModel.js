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
  }
);

CompanyModel.hasMany(MessengerChannelModel);
MessengerChannelModel.belongsTo(CompanyModel);

MessengerChannelModel.sync({ logging: false });

MessengerChannelModel.beforeDestroy(async (channel) => {
  const { page_id, company_id } = channel;
  try {
    const pages = await sequelize.query(
      `SELECT page_id 
      FROM messenger_channel 
      WHERE page_id = :page_id AND company_id != :company_id
      UNION
      SELECT page_id
      FROM instagram_channel
      WHERE page_id = :page_id`,
      {
        replacements: { page_id, company_id },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (pages.length === 0)
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
