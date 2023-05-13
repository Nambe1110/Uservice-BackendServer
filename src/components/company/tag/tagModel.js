import pkg from "sequelize";
import sequelize from "../../../config/database/index.js";
import Company from "../companyModel.js";

const { DataTypes } = pkg;

const TagModel = sequelize.define(
  "Tag",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Tag name is required",
        },
      },
    },
    content: {
      type: DataTypes.STRING,
    },
    company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: Company,
        key: "id",
      },
    },
  },
  {
    tableName: "tag",
    charset: "utf8",
    collate: "utf8_unicode_ci",
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Company.hasMany(TagModel, { foreignKey: "company_id" });
TagModel.belongsTo(Company, { foreignKey: "company_id" });
Company.beforeDestroy(async (company) => {
  await TagModel.destroy({
    where: {
      company_id: company.id,
    },
    individualHooks: true,
  });
});

TagModel.sync({ logging: false });

export default TagModel;
