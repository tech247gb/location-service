import { locModels, limitModel } from "../models/models.js";
import { sequelize } from "../config/dbConfig.js";
import { QueryTypes } from "sequelize";
import axios from "axios";
import { rateLimit } from "express-rate-limit";
import moment from "moment/moment.js";

/* middleware for rate limiting */
const axiosRateLimiter = rateLimit({
  perMilliseconds: 24 * 60 * 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later",
});

export const getAllDatas = async (req, res) => {
  const addData = await locModels.sequelize.query("Select * from locations", {
    type: QueryTypes.SELECT,
  });
  try {
    let response = {
      data: "Raw Query",
      record: addData,
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const addDatas = async (req, res) => {
  const query =
    "6371 * acos(cos(radians(" +
    req.body.lat +
    ")) * cos(radians(Latitude)) * cos(radians(" +
    req.body.lng +
    ") - radians(Longitude)) + sin(radians(" +
    req.body.lat +
    ")) * sin(radians(Latitude)))";
  const viewDatas = await locModels.findAll({
    attributes: [[sequelize.literal(query), "Distance"], "Data"],
    where: sequelize.where(sequelize.literal(query), "<=", 25),
    order: sequelize.literal("Distance ASC"),
    limit: 1,
  });
  try {
    if (viewDatas.length != 0) {
      return res.json(viewDatas);
    } else {
      const { lat, lng } = req.body;
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      let limit = await limitModel.findOne();
      if (limit) {
        let currentDate = moment().format("YYYY-MM-DD");
        let limitExpiry = moment(limit.updatedAt).format("YYYY-MM-DD");
        if (currentDate !== limitExpiry) {
          limit.count = 0;
        } else if (limit.count >= 2) {
          return res
            .status(409)
            .json({ message: "API limit reached, try again tomorrow" });
        }
      }
      axiosRateLimiter(req, res, async () => {
        axios
          .get(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=AIzaSyDtal5kkek9odt5atw0tBpaYJOJat0Qjjo`
          )
          .then((response) => {
            const address = response.data.results[0].formatted_address;
            locModels.create({
              Longitude: req.body.lng,
              Latitude: req.body.lat,
              Data: address,
            });
            res.send(
              `The address for the given latitude and longitude is: ${address}`
            );
          })
          .catch((error) => {
            console.log(error);
          });
      });
      if (!limit) {
        limit = await limitModel.create({
          ip: ip,
          count: 1,
        });
      } else {
        limit.count += 1;
        limit.save();
      }
    }
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};