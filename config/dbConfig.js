import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const database = process.env.MY_SQL_DATABASE;
const dbUserName = process.env.MY_SQL_USERNAME;
const dbPassword = process.env.MY_SQL_PASSWORD;
const host = process.env.MY_SQL_HOST;

export const sequelize = new Sequelize(database, dbUserName, dbPassword, {
  host,
  port: 3306,
    dialect: "mysql",
    dialectOptions: {
      connectTimeout: 60000 // 60 seconds
    },
    timezone: 'Asia/Kolkata',
});

// export const sequelize = new Sequelize("location_db", "root", "root", {
//   host: "localhost",
//   port: 3306,
//     dialect: "mysql",
//     timezone: 'Asia/Kolkata',
// });
export const connectToDb = async () => {
  try {
    console.log("---------++++++++++++++++++++++------------------");
    await sequelize.authenticate();
    sequelize
      .sync()
      .then((result) => {
        // console.log("syncResult",result);
      })
      .catch((err) => {
        console.log("sequelizeSyncError",err);
      });
    console.log("Successfully connected to our db");
  } catch (error) {
    console.log("connectionDatabaseError",error);
  }
};