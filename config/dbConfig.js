import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("location_db", "root", "", {
  host: "localhost",
  port: 3306,
    dialect: "mysql",
    timezone: 'Asia/Kolkata',
});

export const connectToDb = async () => {
  try {
    await sequelize.authenticate();
    sequelize
      .sync()
      .then((result) => {
      })
      .catch((err) => {
        console.log(err);
      });
    console.log("Successfully connected to our db");
  } catch (error) {
    debugger;
    console.log(error);
  }
};