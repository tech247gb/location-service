import express from "express";
import { connectToDb } from "./config/dbConfig.js";
import Routes from "./routes/route.js";
import cors from "cors";
import { allowedIPs, apiKEYs } from "./models/models.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const apiKeys = await apiKEYs.findAll({
  attributes: ["id", "api_key"],
});

const checkIP = async (req, res, next) => {
  const apikey = req.header("AIzaSyDtal5kkek9odt5atw0tBpaYJOJat0Qjjo");
  const userId = apiKeys.find((k) => k.api_key === apikey)?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: invalid API key" });
  }
  const allowedIP = await allowedIPs.findAll({
    where: { user_id: userId },
    attributes: ["ip"],
  });
  if (!allowedIP) {
    return res
      .status(401)
      .json({ error: "Unauthorized: IP not found for the user" });
  }
  let Ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const ipAllowed = allowedIP.some(a => a.ip === Ip);
  if (!ipAllowed) {
    return res.status(401).json({ error: "Unauthorized: IP does not match" });
  }
  next();
};

app.use(checkIP);

app.use("/api", Routes);

app.listen(3001, async () => {
  console.log("Server started at port 3001");
  await connectToDb();
})