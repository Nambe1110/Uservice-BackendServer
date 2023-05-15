import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import Campaign from "../campaignModel.js";
import Tag from "../../company/tag/tagModel.js";

const { DataTypes } = pkg;

const CampaignTagModel = sequelize.define(
  "Campaign_Tag",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    campaign_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "campaign_id is required",
        },
      },
      references: {
        model: Campaign,
        key: "id",
      },
    },
    tag_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Tag id is required",
        },
      },
      references: {
        model: Tag,
        key: "id",
      },
    },
  },
  {
    tableName: "campaign_tag",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Campaign.hasMany(CampaignTagModel, { foreignKey: "campaign_id" });
CampaignTagModel.belongsTo(Campaign, { foreignKey: "campaign_id" });
Campaign.beforeDestroy(async (campaign) => {
  await CampaignTagModel.destroy({
    where: { campaign_id: campaign.id },
    individualHooks: true,
  });
});

Tag.hasMany(CampaignTagModel, { foreignKey: "tag_id" });
CampaignTagModel.belongsTo(Tag, { foreignKey: "tag_id" });
Tag.beforeDestroy(async (tag) => {
  await CampaignTagModel.destroy({
    where: { tag_id: tag.id },
    individualHooks: true,
  });
});

// Campaign.belongsToMany(Channel, { through: "CampaignTagModel" });
// Channel.belongsToMany(Campaign, { through: "CampaignTagModel" });

CampaignTagModel.sync({ logging: false });

export default CampaignTagModel;
