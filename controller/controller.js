import { locModels, limitModel,queuedLocationModel } from "../models/models.js";
import { sequelize} from "../config/dbConfig.js";
import { Op } from "sequelize";
import { QueryTypes } from "sequelize";
import { rateLimit } from "express-rate-limit";
import moment from "moment/moment.js";
import axios from "axios";



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
    where: sequelize.where(sequelize.literal(query), "<=", 2),
    order: sequelize.literal("Distance ASC"),
    limit: 1,
  });
  try {
    console.log("data that are already in location table",viewDatas);
    if (viewDatas.length != 0) {
      return res.json(viewDatas);
    } else {
      const { lat, lng ,url} = req.body;
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
     const isLocationAlreadyExistInQueuedTable = await checkLatAndLongIsAlreadyExistInQuedLocationTable(lat ,lng)
     console.log("isLocationAlreadyExistInQueuedTable" ,isLocationAlreadyExistInQueuedTable)
     if(isLocationAlreadyExistInQueuedTable.success ===false){
     const checkLocationRadius = await checkLocationIsInsideRadius(lat ,lng)
     console.log("check the location info" ,checkLocationRadius)
        //  if(!checkLocationRadius){
          // return res.send("rtrue")
      if(checkLocationRadius.success === false){
        const backUrlArray =[url]
        // console.log("array of back url new creating",backUrlArray)
        const insertDataIntoQueuedLocation = await queuedLocationModel.create({
            latitude:lat,
            longitude:lng,
            backUrl:backUrlArray,
            corresponding_location:'empty',
            isQueued:true
          });
          // console.log("insertDataIntoQueuedLocation" ,insertDataIntoQueuedLocation)
          res.status(201).json({data:"inserted",message:"Location is inserted into queue"})
      }else if(checkLocationRadius.success === true) {
        const similarLocationDetails = await queuedLocationModel.findOne({
          where:{id:checkLocationRadius.coords.id}})
        let backUrlArray = similarLocationDetails.backUrl
        // backUrlArray=[...backUrlArray,url]
        backUrlArray.push(url)
        similarLocationDetails.backUrl=backUrlArray
        similarLocationDetails.save()
        // console.log("similare results-------------",backUrlArray)

        res.status(201).json({data:"similar",coords:{latitude:checkLocationRadius.coords.latitude,longitude:checkLocationRadius.coords.longitude}, message:"This Location is less than 2km radius , near by location is already in queue"})
      }
     }else{
      const sameLocationDetails = await queuedLocationModel.findOne({
        where:{id:isLocationAlreadyExistInQueuedTable?.coords?.id}})
      let backUrlArray = sameLocationDetails.backUrl
      // backUrlArray=[...backUrlArray,url]
      backUrlArray.push(url)
      sameLocationDetails.backUrl=backUrlArray
      sameLocationDetails.save()
      res.status(201).json({message:"Location is already in queue"})
     }
    }
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

/**
 * Function checking latitude and longitude is already exist in queued-locations table
 */
const checkLatAndLongIsAlreadyExistInQuedLocationTable  = (lat , lng) =>{
  return new Promise( async (resolve ,reject)=>{
    try{
      // console.log("lattttttttttttttttttt",lat,"33333333333333333333",lng);
      const locationAlreadyQueued = await queuedLocationModel.findAll({
        where: {
          [Op.and]: [
            { latitude: lat },
            { longitude: lng }
          ]
        }
      })
    console.log("Locations where already queued",locationAlreadyQueued)
    // await checkLocationIsInsideRadius(lat,lng)

    if( locationAlreadyQueued.length > 0 ){
      const data={success:true ,coords:{latitude:locationAlreadyQueued[0].dataValues.latitude ,longitude:locationAlreadyQueued[0].dataValues.longitude ,id:locationAlreadyQueued[0].id}}
      resolve(data)
    }else{
      resolve({success:false})
    }
    }catch(err){
      console.log("error occured checkLatAndLongIsAlreadyExistInQuedLocationTable",err)
      reject(err)
    }
  })
}

/**
 * Function checking latitude and longitude is  5 km radius with in existing data in queued-locations table
 */
const checkLocationIsInsideRadius = (lat ,lng) =>{
  return new Promise(async(resolve,reject)=>{
    try {
      // console.log("&&&&&&&&&&&&&&&&&&&",lat,"!!!!!!!!!!!!!!!!!!!!!!",lng);
      const query =
      "6371 * acos(cos(radians(" +
      lat +
      ")) * cos(radians(latitude)) * cos(radians(" +
      lng +
      ") - radians(longitude)) + sin(radians(" +
      lat +
      ")) * sin(radians(latitude)))";
    const checkLocationRadius = await queuedLocationModel.findAll({
      attributes: [[sequelize.literal(query), "Distance"], "latitude" ,"longitude" ,"id"],
      where: sequelize.where(sequelize.literal(query), "<=", 2),
      order: sequelize.literal("Distance ASC"),
      limit: 1,
    });
    console.log("location found within radius 2",checkLocationRadius)
    if(checkLocationRadius.length>0){
      const data={success:true ,coords:{latitude:checkLocationRadius[0].dataValues.latitude ,longitude:checkLocationRadius[0].dataValues.longitude ,id:checkLocationRadius[0].id}}
      resolve(data)
    }else{
      resolve({success:false})
    }
      
    } catch (error) {
      console.log("error occured checkLocationIsInsideRadius",error)

    }
  })
}


/* middleware for rate limiting */
const axiosRateLimiter = rateLimit({
  perMilliseconds: 24 * 60 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});

/**
 * Scheduler function for getting data from google api
 */

export const getLocationFromGoogleApi =async (req , res) =>{
  // Checking the limit fo calling google api
console.log("the location function is called")
const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  let limit = await limitModel.findOne();
  let isLimitAlreadyCreated = limit == null ? true:false
  // console.log("lo))))))))",!limit)
  // return false
  if (limit) {
    let currentDate = moment().format("YYYY-MM-DD");
    let limitExpiry = moment(limit.updatedAt).format("YYYY-MM-DD");
    if (currentDate !== limitExpiry) {
      limit.count = 0;
    } else if (limit.count >= 100) {
      console.log("Todays Limit exceeded",limit.count)
      return res.send({message:"Sorry today limit is exceeded"});
    }
  }
    const getDataFromTheQueuedTable =await queuedLocationModel.findAll({
      where:{
        isQueued:true
      }
    })
    console.log('locations from queued table where locations still in queue : ',getDataFromTheQueuedTable);
    if(getDataFromTheQueuedTable.length > 0){
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
              console.log("response from api response",response.data.results)
              const address = response.data.results[0].formatted_address;
              const data ={
                lat:`${getSingleLocation.latitude}`,
                lng:`${getSingleLocation.longitude}`,
                locationName:address
              }
              // await sendLocationToResponseloop(getSingleLocation.backUrl ,data)
              await sendWebHook(getSingleLocation.backUrl ,data);
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
              console.log(
                "number of deleted rows",
                deleted
              );
              addresses.push(address);
              // await updateOrCreateLimit(ip);
              if (!limit) {
                limit = await limitModel.create({
                  ip: ip,
                  count: 1,
                });
                console.log("entry created" ,limit)
                // isLimitAlreadyCreated =false
              } else {
                limit.count += 1;
                await limit.save();
                
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
      .then(async() => {
        console.log("//////////////////////////////////", addresses);
        return res.send(
          `The addresses for the given latitudes and longitudes are: ${addresses.join(", ")}`
        );
      })
      .catch((error) => {
        // Handle any errors
        console.log(error);
        // Send appropriate error response to the client or take other actions
      });
      // console.log("//////////////////////////////////",addresses)
      // return res.send(`The addresses for the given latitudes and longitudes are: ${addresses.join(", ")}`);

    }else{
      return res.send(
        `Sorry no data queued`
      );
    }
      // }
}


//Sending Location information when location is fetched using google api
const sendLocationToResponseloop =async(urls ,data) =>{
  // let allUsersData = await usersDao.getAllusers();

  // await Promise.all(allUsersData.map((userData, index) => {
  //     let body = new URLSearchParams({ip: userData.ip});
  //     return axios.post("http://myAPI", body).then((res) => {
  //         allUsersData[index].countryCode = res.data.countryCode;
  //     });
  // }));
  // // return allUsersData;
  try{
let resultArray=[]
    await Promise.all(
      urls.map((async(url)=>{
        console.log("backurllllllllllllllllllll", url)
        return axios({
        method: 'post',
        data,
        url,
      }).then((result)=>{
        console.log("sendLocationSuccesFull",result);
        // resolve(true)
        resultArray.push(result)
      }).catch((err)=>{
        console.log("sendLocationError",err);
        // reject(false)
      })

      }))
    )
    return resultArray
  }catch(err){
    console.log("errinaxioscalltowebhook",err);
  }
  // return new Promise(async(resolve,reject)=>{
  //   try{
  //     // for(const url of urls){
  //     //   console.log("backurllllllllllllllllllll", url)
  //     // }
  //     urls.map((url=>console.log("backurllllllllllllllllllll", url)))
  //     resolve()
  //     await Promise.all(
  //       urls.map((url=>{
  //         console.log("backurllllllllllllllllllll", url)
  //       }))
    
       
  //     )// await axios({
  //     //   method: 'post',
  //     //   data,
  //     //   url,
  //     // }).then((result)=>{
  //     //   console.log("sendLocationSuccesFull",result);
  //     //   resolve(true)
  //     // }).catch((err)=>{
  //     //   console.log("sendLocationError",err);
  //     //   reject(false)
  //     // })
  //   }catch(err){
  //     console.log("SomeErrorOnSendLocation",err);
  //     reject(false)
  //   }
  // })

}

const updateOrCreateLimit = (ip) =>{
  return new Promise(async (resolve,reject)=>{
    try{
      // let limitExist = await limitModel.findAll({
      //   limit : 1,
      //   order:[['createdAt','DESC']]
      // });
      let limitExist = await limitModel.findOne()
      console.log("#############################limit-",limitExist)

      if (limitExist==null) {
        limitExist = await limitModel.create({
          ip: ip,
          count: 1,
        });
        console.log("entry created" ,limitExist)
        // isLimitAlreadyCreated =false
      } else {
        limitExist.count += 1;
        limitExist.save();
        
      }
      resolve(true)
    }catch(err){
      reject(err)
    }
  })
}


//Another method of sending webhook

const sendWebHook =async(urls,data)=>{
  try{
    const promises =[]
    for(const url of urls){
      const promise = new Promise(async(resolve,reject)=>{
        await  axios({
          method: 'post',
          data,
          url,
        }).then((result)=>{
          console.log("sendLocationSuccesFull",result);
          resolve(result)
        }).catch((err)=>{
          console.log("sendLocationError",err);
          reject(err)
        })

      })
      promises.push(promise)
    }
   return Promise.all(promises).then(()=>{
      return true
    }).catch(()=>{
      return false
    })

  }catch(err){
    console.log("backuperror",err);
  }

}