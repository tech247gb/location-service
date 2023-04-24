import {
  locModels,
  limitModel,
  queuedLocationModel,
} from "../models/models.js";
import { sequelize } from "../config/dbConfig.js";
import { Op } from "sequelize";
import { QueryTypes } from "sequelize";
import { rateLimit } from "express-rate-limit";
import moment from "moment/moment.js";
import axios from "axios";
import { locations } from "@google/maps/lib/internal/convert.js";

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
    console.log("data that are already in location table", viewDatas);
    if (viewDatas.length != 0) {
      return res.json(viewDatas);
    } else {
      const { lat, lng } = req.body;
      const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
      let limit = await limitModel.findOne();
      // if (limit) {
      //   let currentDate = moment().format("YYYY-MM-DD");
      //   let limitExpiry = moment(limit.updatedAt).format("YYYY-MM-DD");
      //   if (currentDate !== limitExpiry) {
      //     limit.count = 0;
      //   } else if (limit.count >= 100) {
      //     return res
      //       .status(409)
      //       .json({ message: "API limit reached, try again tomorrow" });
      //   }
      // }
      const isLocationAlreadyExistInQueuedTable =
        await checkLatAndLongIsAlreadyExistInQuedLocationTable(lat, lng);
      console.log(
        "isLocationAlreadyExistInQueuedTable",
        isLocationAlreadyExistInQueuedTable
      );
      if (!isLocationAlreadyExistInQueuedTable) {
        const checkLocationRadius = await checkLocationIsInsideRadius(lat, lng);
        if (!checkLocationRadius) {
          const insertDataIntoQueuedLocation = await queuedLocationModel.create(
            {
              latitude: lat,
              longitude: lng,
              backUrl: "Now this is temp Url",
              corresponding_location: "empty",
              isQueued: true,
            }
          );
          console.log(
            "insertDataIntoQueuedLocation",
            insertDataIntoQueuedLocation
          );
          res.status(201).json({ message: "Location is inserted into queue" });
        } else {
          res
            .status(201)
            .json({
              message:
                "This Location is less than 25km radius , near by location is already in queue",
            });
        }
      } else {
        res.status(201).json({ message: "Location is already in queue" });
      }
    }
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

/**
 * Function checking latitude and longitude is already exist in queued-locations table
 */
const checkLatAndLongIsAlreadyExistInQuedLocationTable = (lat, lng) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("lattttttttttttttttttt", lat, "33333333333333333333", lng);
      const locationAlreadyQueued = await queuedLocationModel.findAll({
        where: {
          [Op.and]: [{ latitude: lat }, { longitude: lng }],
        },
      });
      console.log("Locations where already queued", locationAlreadyQueued);
      // await checkLocationIsInsideRadius(lat,lng)

      if (locationAlreadyQueued.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (err) {
      console.log(
        "error occured checkLatAndLongIsAlreadyExistInQuedLocationTable",
        err
      );
      reject(err);
    }
  });
};

/**
 * Function checking latitude and longitude is  5 km radius with in existing data in queued-locations table
 */
const checkLocationIsInsideRadius = (lat, lng) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("&&&&&&&&&&&&&&&&&&&", lat, "!!!!!!!!!!!!!!!!!!!!!!", lng);
      const query =
        "6371 * acos(cos(radians(" +
        lat +
        ")) * cos(radians(latitude)) * cos(radians(" +
        lng +
        ") - radians(longitude)) + sin(radians(" +
        lat +
        ")) * sin(radians(latitude)))";
      const checkLocationRadius = await queuedLocationModel.findAll({
        attributes: [
          [sequelize.literal(query), "Distance"],
          "corresponding_location",
        ],
        where: sequelize.where(sequelize.literal(query), "<=", 25),
        order: sequelize.literal("Distance ASC"),
        limit: 1,
      });
      console.log("location found within radius", checkLocationRadius);
      if (checkLocationRadius.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.log("error occured checkLocationIsInsideRadius", error);
    }
  });
};

/* middleware for rate limiting */
const axiosRateLimiter = rateLimit({
  perMilliseconds: 24 * 60 * 60 * 1000,
  max: 2,
  message: "Too many requests, please try again later",
});

/**
 * Scheduler function for getting data from google api
 */

export const getLocationFromGoogleApi = async (req, res) => {
  // Checking the limit fo calling google api
  console.log("haiu tehn mkxhi");

  let limit = await limitModel.findOne();

  const todayCount = await locModels.count({
    where: sequelize.where(
      sequelize.fn("DATE", sequelize.col("createdAt")),
      sequelize.fn("CURDATE")
    ),
  });

  console.log("todaaaaaaaaaaaaaaaaaaaaaay count", todayCount);
  const today =  moment();
  const startDate = moment(today).startOf('day');
  const endDate = moment(today).endOf('day');

  const result = await locModels.findAndCountAll({
    where: {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    },
  });

  console.log(`Count: ${result.count}`);
  console.log(`Data: ${JSON.stringify(result.rows)}`);
  // return res.send({message:false})
  if (limit) {
    let currentDate = moment().format("YYYY-MM-DD");
    let limitExpiry = moment(limit.updatedAt).format("YYYY-MM-DD");
    if (currentDate !== limitExpiry) {
      limit.count = 0;
    } else if (limit.count >= 5) {
      console.log("Todays Limit exceeded", limit.count);
      return false;
    }
  }
    const getDataFromTheQueuedTable = await queuedLocationModel.findAll({
      where: {
        isQueued: true,
      },
    });
    console.log(
      "locations from queued table where locations still in queue : ",
      getDataFromTheQueuedTable
    );
    if (getDataFromTheQueuedTable.length > 0) {
      let addresses = [];
      const promises = []; // Array to hold promises
      for (let getSingleLocation of getDataFromTheQueuedTable) {
        // Wrap axios call in a Promise
        const promise = new Promise(async (resolve, reject) => {
          axiosRateLimiter(req, res, async () => {
            try {
              const response = await axios.get(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${getSingleLocation.latitude},${getSingleLocation.longitude}&key=AIzaSyDtal5kkek9odt5atw0tBpaYJOJat0Qjjo`
              );
              console.log("response from api response", response.data.results);
              const address = response.data.results[0].formatted_address;
              const add = await locModels.create({
                Longitude: getSingleLocation.longitude,
                Latitude: getSingleLocation.latitude,
                Data: address,
              });
              console.log("address", address);
              console.log("+++++++++++++)(((((((((((((((((", add);
              const deleted = await queuedLocationModel.destroy({
                where: { id: getSingleLocation.id },
              });
              console.log("number of deleted rows", deleted);
              addresses.push(address);

              if (!limit) {
                limit = await limitModel.create({
                  ip: ip,
                  count: 1,
                });
              } else {
                limit.count += 1;
                limit.save();
              }
              resolve(); // Resolve the promise when the async operations are completed
            } catch (error) {
              console.log(error);
              reject(error); // Reject the promise if there's an error
            }
          });
        });
        promises.push(promise); // Add the promise to the array
      }

      // Wait for all promises to resolve using Promise.all()
      Promise.all(promises)
        .then(() => {
          console.log("//////////////////////////////////", addresses);
          return res.send(
            `The addresses for the given latitudes and longitudes are: ${addresses.join(
              ", "
            )}`
          );
        })
        .catch((error) => {
          // Handle any errors
          console.log(error);
          // Send appropriate error response to the client or take other actions
        });
      // console.log("//////////////////////////////////",addresses)
      // return res.send(`The addresses for the given latitudes and longitudes are: ${addresses.join(", ")}`);
    } else {
      return res.send(`Sorry no data queued`);
    }
  // }else{
  //   return res.send({message:"sorry today google api limit exceeded"})
  // }
};
