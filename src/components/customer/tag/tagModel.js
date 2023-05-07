import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
// import User from "../../user/userModel.js";
// import Company from "../../company/companyModel.js";
import CompanyTag from "../../company/tag/tagModel.js";
import Customer from "../customerModel.js";

const { DataTypes } = pkg;

const TagModel = sequelize.define(
  "Customer_tag",
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
    company_tag: {
      type: DataTypes.INTEGER,
      references: {
        model: CompanyTag,
        key: "id",
      },
    },
  },
  {
    tableName: "customer_tag",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Customer.hasMany(TagModel, { foreignKey: "customer_id" });
TagModel.belongsTo(Customer, { foreignKey: "customer_id" });
Customer.beforeDestroy(async (customer) => {
  await TagModel.destroy({
    where: {
      customer_id: customer.id,
    },
    individualHooks: true,
  });
});

CompanyTag.hasMany(TagModel, { foreignKey: "company_tag" });
TagModel.belongsTo(CompanyTag, { foreignKey: "company_tag" });
CompanyTag.beforeDestroy(async (companyTag) => {
  await TagModel.destroy({
    where: {
      company_tag: companyTag.id,
    },
    individualHooks: true,
  });
});

TagModel.sync({ logging: false });

export default TagModel;
