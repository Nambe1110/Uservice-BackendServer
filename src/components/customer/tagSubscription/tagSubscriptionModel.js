import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import Tag from "../../company/tag/tagModel.js";
import Customer from "../customerModel.js";

const { DataTypes } = pkg;

const TagSubscriptionModel = sequelize.define(
  "Tag_subscription",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Customer,
        key: "id",
      },
    },
    tag_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Tag,
        key: "id",
      },
    },
  },
  {
    tableName: "tag_subscription",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Customer.hasMany(TagSubscriptionModel, { foreignKey: "customer_id" });
TagSubscriptionModel.belongsTo(Customer, { foreignKey: "customer_id" });
Customer.beforeDestroy(async (customer) => {
  await TagSubscriptionModel.destroy({
    where: {
      customer_id: customer.id,
    },
    individualHooks: true,
  });
});

Tag.hasMany(TagSubscriptionModel, { foreignKey: "tag_id" });
TagSubscriptionModel.belongsTo(Tag, { foreignKey: "tag_id" });
Tag.beforeDestroy(async (tag) => {
  await TagSubscriptionModel.destroy({
    where: {
      tag_id: tag.id,
    },
    individualHooks: true,
  });
});

TagSubscriptionModel.sync({ logging: false });

export default TagSubscriptionModel;
