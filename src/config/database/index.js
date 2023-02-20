import { Sequelize } from "sequelize";
import dotenv from "dotenv";
import mysql2 from "mysql2";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    dialectModule: mysql2,
    logging: false,
    ssl: true,
    dialectOptions: {
      connectTimeout: 3000,
    },
  }
);

export default sequelize;
