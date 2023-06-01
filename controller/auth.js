import { allowedIPs, apiKEYs } from "../models/models.js";

export const checkIP = async (req, res, next) => {
    try{
      const apiKeys = await apiKEYs.findAll({
        attributes: ["id", "api_key"],
      });
      const apikey = req.headers.apikey
      console.log("------------+++",apikey);
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
      console.log("iiiiiiiiiiiiiiiiii",Ip)
      const ipAllowed = allowedIP.some(a => a.ip === Ip);
      console.log("allowedIo",ipAllowed);
      if (!ipAllowed) {
        return res.status(401).json({ error: "Unauthorized: IP does not match" });
      }
      next();
    }catch(err){
      console.log("checkIpMiddlewareError",err)
    }
  };
//   export const checkIP;