import express from "express";
import { checkIP } from "../controller/auth.js";
// import checkIP from "../controller/auth.js";
import { addDatas, getAllDatas, getLocationFromGoogleApi } from "../controller/controller.js";

const router = express.Router();
router.post("/datas", addDatas);
router.get("/datas", getAllDatas);
router.post("/insertdata", getLocationFromGoogleApi);


export default router;
