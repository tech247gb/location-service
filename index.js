// // const serverless = require("serverless-http");
// // const express = require("express");
// import express from "express";
// import serverless from "serverless-http";

// const app = express();

// app.get("/", (req, res, next) => {
//   return res.status(200).json({
//     message: "Hello from root!",
//   });
// });

// app.get("/path", (req, res, next) => {
//   return res.status(200).json({
//     message: "Hello from path!",
//   });
// });

// app.use((req, res, next) => {
//   return res.status(404).json({
//     error: "Not Found",
//   });
// });
// export const handler = serverless(app);

import express from "express";
import { connectToDb } from "./config/dbConfig.js";
import Routes from "./routes/route.js";
import cors from "cors";
import { allowedIPs, apiKEYs } from "./models/models.js";
import serverless from "serverless-http";
import axios from "axios";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// app.listen(3001, async () => {
//   console.log("Server started at port 3001");
  await connectToDb();
// })



// const checkIP = async (req, res, next) => {
//   try{
//     const apiKeys = await apiKEYs.findAll({
//       attributes: ["id", "api_key"],
//     });
//     const apikey = req.headers.apikey
//     console.log("------------+++",apikey);
//     const userId = apiKeys.find((k) => k.api_key === apikey)?.id;
//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized: invalid API key" });
//     }
//     const allowedIP = await allowedIPs.findAll({
//       where: { user_id: userId },
//       attributes: ["ip"],
//     });
//     if (!allowedIP) {
//       return res
//       .status(401)
//       .json({ error: "Unauthorized: IP not found for the user" });
//     }
//     let Ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
//     console.log("iiiiiiiiiiiiiiiiii",Ip)
//     const ipAllowed = allowedIP.some(a => a.ip === Ip);
//     console.log("allowedIo",ipAllowed);
//     if (!ipAllowed) {
//       return res.status(401).json({ error: "Unauthorized: IP does not match" });
//     }
//     next();
//   }catch(err){
//     console.log("checkIpMiddlewareError",err)
//   }
// };

// app.use(checkIP);

app.use("/api", Routes);

// // module.exports.handler = serverless(app);
export const handler = serverless(app);

/**
 * 
 * Function  which is scheduled to hity every 1 minutes
 * 
 */

export const myScheduledTask = async (event, context) => {
  console.log('This is a scheduled task. for every 2 minutes');
   try{
     axios({
      method: 'post',
      url: `https://kxm7c82jik.execute-api.ap-south-1.amazonaws.com/api/insertdata`,
      // url:`http://localhost:3000/api/insertdata`,
      headers: { 'apikey': 'thisismyapikey' }
    }).then((res)=>{
      console.log("eeeeeeeeeeeeeeeeeeeeeeeeee",res.data);
      console.log('Ended the -------------------This is a scheduled task. for every 2 minutes');

    }).catch(err=>console.log("000000000000000000000000000000000000",err))
   }catch(err){
    console.log("My schedule task error",err)
   }

};