import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("location_db", "root", "root", {
  host: "localhost",
  port: 3306,
    dialect: "mysql",
    timezone: 'Asia/Kolkata',
});
// export const sequelize = new Sequelize("location_service_rl", "location_service", "D1SEgzctx9yB0sPY", {
//   host: "mysql.responseloop.com",
//   port: 3306,
//     dialect: "mysql",
//     dialectOptions: {
//       connectTimeout: 60000 // 60 seconds
//     },
//     timezone: 'Asia/Kolkata',
// });

export const connectToDb = async () => {
  try {
    console.log("----------++++++++++++++++++++=-----------------");
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
