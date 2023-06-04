import pkg from "sequelize";
import axios from "axios";
import sequelize from "../../../config/database/index.js";
import CompanyModel from "../../company/companyModel.js";
import logger from "../../../config/logger.js";

const { DataTypes } = pkg;

const ViberChannelModel = sequelize.define(
  "ViberChannel",
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
    token: {
      type: DataTypes.STRING,
    },
  },
  {
    tableName: "viber_channel",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

CompanyModel.hasMany(ViberChannelModel);
ViberChannelModel.belongsTo(CompanyModel);

ViberChannelModel.sync({ logging: false });

ViberChannelModel.beforeDestroy(async (channel) => {
  const { token } = channel;
  try {
    await axios.post(
      `${process.env.VIBER_API_URL}/pa/set_webhook`,
      {
        url: "",
      },
      {
        headers: {
          "X-Viber-Auth-Token": token,
        },
      }
    );
  } catch (error) {
    logger.error(error.response.data);
  }
});

export default ViberChannelModel;
